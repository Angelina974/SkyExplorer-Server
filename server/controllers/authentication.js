/**
 *
 * Internal authentication controller
 *
 * Includes:
 * - the invitation process & email sent to the invited user
 * - the registration process & email sent to the user to activate his account
 * - tools to create and verify JWT tokens
 * - global method to login or register from an external service provider
 *
 * + Extra that should be moved out from this controller:
 * - deleting a user
 *
 */
const jwt = require("jsonwebtoken")
const config = require("../config")

const {
	API: {
		APIError,
		InvalidToken,
		Unauthorized,
		Forbidden,
		BadRequest,
		NotFound,
		MethodNotAllowed,
		InternalServerError
	}
} = require("../core/errors")

const {
	switchAccount: switchClientWebsocketAccount
} = require("../websocket/common")

const ACCOUNT_PLAN = {
	TRIAL: "trial",
	GUEST: "guest"
}

const ACCOUNT_PLAN_STATE = {
	ACTIVE: "active"
}

/**
 * Generate token and refreshToken with fresh infos
 * 
 * @private
 * @param {string} userId
 * @param {string} accountId
 * @param {string} currentAccountId
 * @param {string} firstName
 * @param {string} lastName
 * @return {{token: string, refreshToken: string}}
 */
function generateTokens({
	userId,
	accountId,
	currentAccountId,
	firstName,
	lastName
}) {
	// We need to regenerate new tokens
	const token = authentication.createToken("access", userId, accountId, currentAccountId, firstName, lastName)
	const refreshToken = authentication.createToken("refresh", userId, accountId, currentAccountId, firstName, lastName)

	// Update the user tokens globally
	kiss.global.tokens[userId] = token
	kiss.global.refreshTokens[userId] = refreshToken

	return {
		token,
		refreshToken
	}
}

/**
 * Switch a user to another currentAccountId, taking care of permissions to switch.
 * BEWARE: it doesn't switch sockets nor regenerate the JWT tokens, since it's not required all the time!
 * 
 * @private
 * @param {string} userEmail
 * @param {string} toAccountId
 * @return {Promise<void>}
 */
async function switchUserCurrentAccount(userEmail, toAccountId) {
	// Get the account in order to check if the user is a collaborator of this account
	// We get it from the DB because we want to ensure it is exact, updated, and in fresh state
	const account = await kiss.db.findOne("account", {
		_id: toAccountId
	})

	if (!account) throw new NotFound("#account not found")

	const user = await kiss.db.findOne("user", {
		email: userEmail
	})

	if (!user) throw new NotFound("User doesn't exists anymore!")

	// Check if user can switch to the account (will be able to if is the owner or is a collaborator)
	const accountActiveUsers = await getAccountActiveUsers(toAccountId)
	const accountActiveUserIds = accountActiveUsers.map(user => user.id)

	if (!accountActiveUserIds.includes(user.id) && user.accountId !== account.id) throw new Forbidden("You're not a collaborator of this account!")

	// Users are added chronologically into the collaborators array. If an account plan is downgraded,
	// then all plan+n users will be denied access and will not be able to switch.
	if (account.planUsers < accountActiveUserIds.indexOf(user.id)) {
		throw new Forbidden("Sorry, this account exceeded the max authorized users defined by his plan!")
	}

	user.currentAccountId = toAccountId
	await kiss.db.updateOne("user", {
		email: userEmail
	}, {
		currentAccountId: user.currentAccountId
	})
}

/**
 * Get all the active users of an account, sorted by creation date
 * 
 * @param {string} accountId 
 * @returns 
 */
async function getAccountActiveUsers(accountId) {
	return await kiss.db.findAndSort("user", {
		isCollaboratorOf: accountId,
		active: true
	}, {
		createdAt: 1
	})
}

/**
 * Create a new Account object
 * 
 * @param {string} accountId 
 * @param {string} email 
 * @param {object} config
 * @param {string} config.plan
 * @returns 
 */
function createAccountObject(
	accountId,
	email, {
		plan = ACCOUNT_PLAN.TRIAL
	} = {}
) {
	const account = {
		id: accountId,
		accountId, // Redundant on purpose => allows security middleware to filter on accountId field
		owner: email.toLowerCase(),
		stripeSubscriptionId: "",
		stripeCustomerId: "",
		createdAt: (new Date()).toISOString()
	}

	attachPlanToAccount(account, plan)

	return account
}

/**
 * Attach an plan to an account
 * 
 * @param {object} account 
 * @param {string} plan 
 */
function attachPlanToAccount(account, plan) {
	account.planId = plan
	account.planApps = config.plans[plan].apps
	account.planUsers = config.plans[plan].users
	account.status = ACCOUNT_PLAN_STATE.ACTIVE
	account.periodStart = (new Date()).toISOString()

	switch (plan) {
		case ACCOUNT_PLAN.TRIAL:
			account.periodEnd = (new Date()).addDays(config.plans[plan].period).toISOString()
			break
		case ACCOUNT_PLAN.GUEST:
			// Never ends
			account.periodEnd = 0
			break
		default:
			throw new Error(`Unsupported plan ${plan}`)
	}
}

const authentication = {
	/**
	 * Invite a new user
	 */
	async invite(req, res) {
		if (req.method != "post") throw new MethodNotAllowed()

		// const token = authentication.getToken(req, res)
		// if (!token) return
		const token = req.token
		const currentAccountId = token.currentAccountId

		const accountQuery = {
			_id: currentAccountId
		}

		const account = await kiss.db.findOne("account", accountQuery)
		if (!account) throw new NotFound("#account not found")

		// Accept only owner and managers
		if (!req.token.isOwner && !req.token.isManager) throw new Forbidden()

		const accountActiveUsers = await getAccountActiveUsers(currentAccountId)
		if (account.planUsers <= accountActiveUsers.length) throw new Forbidden("#max number of users")

		const {
			email,
			language
		} = req.body

		// Check if the user already exists
		const userQuery = {
			email: email.toLowerCase()
		}

		let user = await kiss.db.findOne("user", userQuery)

		if (user) {
			// The user exists, we send an invitation

			// User already active
			const accountActiveUserIds = accountActiveUsers.map(user => user.id)
			if (accountActiveUserIds.includes(user.id)) throw new Forbidden(
				"#user already invited"
			)

			// User is already invited
			if (user.invitedBy.includes(currentAccountId)) throw new Forbidden(
				"#user already invited"
			)

			// User invites himself...
			if (user.accountId === currentAccountId) throw new Forbidden(
				"#invite yourself"
			)

			user.invitedBy.push(currentAccountId)
			await kiss.db.updateOne("user", userQuery, {
				invitedBy: user.invitedBy
			})

			// Send an event to the user to allow him to update his invitedBy list.
			kiss.websocket.publish(user.accountId, user.email, {
				channel: "EVT_COLLABORATION:RECEIVED",
				accountId: token.accountId,
				userId: token.userId
			})

			// Send an event to the user who sent the invitation (= the host account), to update his directory
			kiss.websocket.publish(currentAccountId, "*+", {
				channel: "EVT_COLLABORATION:SENT"
			})

		} else {
			// The user doesn't exist, we create a guest account.
			const userId = kiss.tools.uid()
			const newAccount = createAccountObject(
				kiss.tools.uid(),
				email, {
					plan: ACCOUNT_PLAN.GUEST
				}
			)

			// If the user was not found, then we create a new one with the status "active=false"
			user = {
				id: userId,
				accountId: newAccount.accountId,
				currentAccountId: newAccount.accountId,
				email: email.toLowerCase(),
				isCollaboratorOf: [],
				invitedBy: [currentAccountId],
				preferredAccount: currentAccountId, // The user will be automatically switched to this account at login
				active: false,
				createdAt: new Date().toISOString()
			}

			await kiss.db.insertOne("user", user)
			await kiss.db.insertOne("account", newAccount)

			// Update the directory cache
			kiss.directory.addAccount(newAccount)

			// Broadcast the event to all users of the active account
			kiss.websocket.publish(currentAccountId, "*+", {
				channel: "EVT_DB_INSERT:USER",
				accountId: currentAccountId,
				userId: token.userId,
				modelId: "user",
				id: user.id,
				data: user
			})

			// Send an event to the user who sent the invitation, to update his directory
			kiss.websocket.publish(currentAccountId, "*+", {
				channel: "EVT_COLLABORATION:SENT"
			})
		}

		// Then we send an invitation
		const username = token.firstName.toTitleCase() + " " + token.lastName.toTitleCase()
		const emailSubject = kiss.language.txtTitleCase(language, "#invitation subject").replace("$user", `${username}`)
		const emailInvitationLink = kiss.language.txtTitleCase(language, "#invitation link")
		const emailBody = authentication.createEmail(emailInvitationLink)
		const message = emailBody.replaceAll("$host", config.host)
			.replaceAll("$pendingUserId", user.id)
			.replaceAll("$accountId", currentAccountId)
			.replaceAll("$user", `${username}`)

		await kiss.smtp.send({
			to: email,
			subject: emailSubject,
			body: message
		})

		res.status(200).send(user)

		log.info("authentication.invite - Sent an invitation email to " + email)
	},

	/**
	 * Resend an invitation to a user
	 */
	async resendInvite(req, res) {
		if (req.method != "post") throw new MethodNotAllowed()
		if (!req.token.isOwner && !req.token.isManager) throw new Forbidden()

		const token = req.token
		const currentAccountId = token.currentAccountId

		const {
			email,
			language,
		} = req.body

		// Check if the pending user exists
		const pendingUser = await kiss.db.findOne("user", {
			email: email.toLowerCase()
		})

		// There is no pending user with this email, abort
		if (!pendingUser) throw new Forbidden("User has not been invited yet!")

		// Then we send an invitation
		const username = token.firstName.toTitleCase() + " " + token.lastName.toTitleCase()
		const emailSubject = kiss.language.txtTitleCase(language, "#invitation subject").replace("$user", `${username}`)
		const emailInvitationLink = kiss.language.txtTitleCase(language, "#invitation link")
		const emailBody = authentication.createEmail(emailInvitationLink)
		const message = emailBody.replaceAll("$host", config.host)
			.replaceAll("$pendingUserId", pendingUser.id)
			.replaceAll("$accountId", currentAccountId)
			.replaceAll("$user", `${username}`)

		await kiss.smtp.send({
			to: email,
			subject: emailSubject,
			body: message
		})

		res.status(200).send(pendingUser)
	},

	/**
	 * Delete an invitation
	 */
	async deleteInvite(req, res) {
		if (req.method != "delete") throw new MethodNotAllowed()
		if (!req.token.isOwner && !req.token.isManager) throw new Forbidden()
		
		const userId = req.path_1
		if (!userId) throw new NotFound("Unknown user")

		const accountId = req.token.currentAccountId

		const query = {
			_id: userId
		}

		const pendingUser = await kiss.db.findOne("user", query)

		if (!pendingUser) {
			// There is no pending user with this email, abort
			throw new InternalServerError("Could not find the pending invitation")

		} else {
			// Otherwise update the user
			const account = await kiss.db.findOne("account", {
				_id: accountId
			})

			if (!account) throw new NotFound("#account not found")
			if (!pendingUser.invitedBy.includes(accountId)) throw new NotFound("Invitation not found!")

			if (pendingUser.active) {
				// If it's an active user, we update the user and the account on which he's invited...
				pendingUser.invitedBy.splice(pendingUser.invitedBy.indexOf(accountId), 1)

				await kiss.db.updateOne("user", query, {
					invitedBy: pendingUser.invitedBy
				})

				//TODO: send an event to the user for its UI to be updated

			} else {
				// ... Otherwise we delete the pending user, to not keep a useless account.
				await kiss.db.deleteOne("user", query)

				// Broadcast the event to all users of the active account
				kiss.websocket.publish(req.token.accountId, "*+", {
					channel: "EVT_DB_DELETE:USER",
					accountId: accountId,
					userId: req.token.userId,
					modelId: "user",
					id: pendingUser.id,
					data: pendingUser
				})
			}

			log.info("authentication.invitation - Pending invitation for " + pendingUser.email + " has been deleted")
		}
		res.status(200).send({
			success: true
		})
	},

	/**
	 * Delete a collaborator from an account
	 * - from workspaces ACL
	 * - from applications ACL
	 * - from views ACL
	 * - from models ACL
	 * - from groups
	 *
	 * IMPORTANT: this does not delete the user itself.
	 * It only cleans up the user from all current accounts, ACLs and groups.
	 *
	 * TODO: most operations here are custom business logic which should be moved to a dedicated layer
	 */
	async deleteUser(req, res) {
		if (req.method != "delete") throw new MethodNotAllowed()
		if (!req.token.isOwner && !req.token.isManager) throw new Forbidden()

		const userId = req.path_1
		const query = {
			_id: userId
		}

		const user = await kiss.db.findOne("user", query)
		if (!user) {
			throw new NotFound("Could not find the user")
		}

		// You can't delete your own user!
		if (user.accountId === req.token.accountId) {
			throw new Forbidden("You can't exclude yourself!")
		}

		// We start by checking that collaboration was well established between the current account
		// and the user we want to delete
		let {
			isCollaboratorOf,
			currentAccountId
		} = user
		
		if (!isCollaboratorOf.includes(req.token.currentAccountId)) {
			throw new NotFound("This user is not a collaborator of the current account")
		}

		// If the preferred account of the user is the current account, then we must reset this property
		if (user.preferredAccount === req.token.currentAccountId) user.preferredAccount = null

		// If the user is working on this host account, we change its current account to its own account.
		if (currentAccountId === req.token.currentAccountId) {
			user.currentAccountId = user.accountId

			if (kiss.global.tokens[user.email]) {
				// We immediately change his token to ensure that he instantly lose access to everything regarding the host account
				const newToken = authentication.createToken("access", user.email, user.accountId, user.currentAccountId, user.firstName, user.lastName)
				const newRefreshToken = authentication.createToken("refresh", user.email, user.accountId, user.currentAccountId, user.firstName, user.lastName)

				// Update the user tokens globally
				kiss.global.tokens[user.email] = newToken
				kiss.global.refreshTokens[user.email] = newRefreshToken

				// We send to the user a special event to provide him the new token.
				// He will then refresh the page and come back to his own account.
				kiss.websocket.publish(currentAccountId, user.email, {
					channel: "EVT_COLLABORATION:DELETED",
					reason: "Deleted by account owner",
					token: newToken,
					refreshToken: newRefreshToken
				})

				switchClientWebsocketAccount(currentAccountId, user.accountId, user.email)
			}
		}

		isCollaboratorOf.splice(isCollaboratorOf.indexOf(req.token.currentAccountId), 1)

		await kiss.db.updateOne("user", query, {
			isCollaboratorOf,
			currentAccountId: user.currentAccountId,
			preferredAccount: user.preferredAccount
		})

		// Broadcast the deletion event to all users of the active account
		kiss.websocket.publish(req.token.currentAccountId, "*+", {
			channel: "EVT_DB_DELETE:USER",
			accountId: req.token.currentAccountId,
			userId: req.token.userId,
			modelId: "user",
			id: userId
		})

		// Update directory cache
		kiss.directory.deleteUser(req.token.currentAccountId, userId)

		// Cleanup references to the user in ACL and groups
		const operations = await kiss.directory.cleanupAllUserReferences(req.token.currentAccountId, user.email)

		// Broadcast the event to all users of the active account
		kiss.websocket.publish(req.token.currentAccountId, "*+", {
			channel: "EVT_DB_UPDATE_BULK",
			accountId: req.token.currentAccountId,
			userId: req.token.userId,
			data: operations
		})

		res.status(200).send({
			success: true
		})
	},

	/**
	 * Join an account after an invitation was sent
	 */
	async join(req, res) {
		if (req.method != "get") throw new MethodNotAllowed()

		const pendingUserId = req.path_1
		const accountId = req.path_2

		const record = await kiss.db.findOne("user", {
			_id: pendingUserId
		})

		if (!record) {
			// Exit if the pending user document has been deleted
			return res.redirect(301, config.authentication.redirectTo.error + "&msgCode=invitationDeleted")
		}

		if (!record.invitedBy.includes(accountId)) {
			return res.redirect(301, config.authentication.redirectTo.error + "&msgCode=invitationDeleted")
		}

		if (record.active) {
			return res.redirect(301, config.authentication.redirectTo.login + `&acceptInvitationOf=${accountId}`)

		} else {
			// Redirects to the register window, prefilled with data
			res.redirect(301, config.authentication.redirectTo.register + "&email=" + record.email + "&userId=" + pendingUserId + "&accountId=" + accountId)
		}
	},

	/**
	 * Register a pending account
	 */
	async register(req, res) {
		if (req.method != "post") throw new MethodNotAllowed()

		const {
			firstName,
			lastName,
			language,
			email,
			password,
		} = req.body

		const record = await kiss.db.findOne("user", {
			email: email
		})

		// The user already exists, abort
		if (record && record.active !== false) {
			return res.redirect(301, config.authentication.redirectTo.userAlreadyExists)
		}

		let registrant = await kiss.db.findOne("registrant", {
			email: email
		})

		// Two cases:
		//
		// The user had already made an attempt to create his account, so we just send him a new mail
		// again, ignoring the last entries (to avoid an account steeling in registration phase!)
		//
		// - OR -
		//
		// The user never tried to register until now, so we create a new registration
		if (!registrant) {
			registrant = {
				id: kiss.tools.uid(),
				firstName,
				lastName,
				language,
				isCollaboratorOf: [],
				invitedBy: [],
				email: email.toLowerCase(),
				password: kiss.tools.hash(password),
				createdAt: new Date().toISOString()
			}

			await kiss.db.insertOne("registrant", registrant)
		}

		// Build the email message & send it
		const emailSubject = kiss.language.txtTitleCase(language, "#welcome")
		const emailWelcome = kiss.language.txtTitleCase(language, "#registration email")
		const emailBody = authentication.createEmail(emailWelcome)
		const message = emailBody.replaceAll("$host", config.host).replaceAll("$validationId", registrant.id)

		await kiss.smtp.send({
			to: email,
			subject: emailSubject,
			body: message
		})

		res.status(200).send(registrant)

		log.info("authentication.register - Sent a confirmation email to " + email)
	},

	/**
	 * Activate a pending account
	 */
	async activate(req, res) {
		try {
			if (req.method != "get") throw new MethodNotAllowed()

			const activationId = req.path_1

			const registrant = await kiss.db.findOne("registrant", {
				_id: activationId
			})

			if (!registrant) {
				log.err("authentication.activate - No registrant found for this activationId: " + activationId)
				log.info("Redirecting to login page: " + config.authentication.redirectTo.login)
				return res.redirect(301, config.authentication.redirectTo.login)
			}

			const {
				email,
				firstName,
				lastName,
				password
			} = registrant

			let query = {
				email
			}

			const user = await kiss.db.findOne("user", query)

			// Get the number of existing accounts
			const numberOfAccounts = kiss.directory.getAccounts().length

			// From here, there are 2 scenarios:
			//
			// A) The pending registration doesn't have a "user" attribute
			// It means it's a user who registered directly without any invitation: we need to create an independant account for him/her.
			// 
			// Important: if the server is not setup as a multi-tenant server, then:
			// . the 1st created account will be the main admin account
			// . new users will be automatically connected to the 1st created account
			// 
			// - OR -
			//
			// B) The pending registration has a "user" attribute: it means it was generated from an invitation.
			// As a result, it's a **GUEST** account, so we must create him a guest account AND make him/her join the host account.
			if (!user) {

				// Scenario A)
				// We have to create the account and the user
				const userObject = registrant
				userObject.id = kiss.tools.uid()
				userObject.active = true
				userObject.createdAt = new Date().toISOString()

				let accountId
				const SINGLE_TENANT_ID = config.singleTenantId

				if (config.multiTenant === "false" && numberOfAccounts == 0) {
					// Single-tenant mode: the first account created will be the main admin account, with a predefined ID
					// All subsequent users will be connected to this account
					accountId = SINGLE_TENANT_ID
				}
				else {
					accountId = kiss.tools.uid()
				}

				const accountObject = createAccountObject(accountId, registrant.email, {
					plan: ACCOUNT_PLAN.TRIAL
				})

				// If the server is not multi-tenant, then the first account created will be the main admin account
				// New users will be automatically connected to this account
				if (config.multiTenant === "false") {
					log.info("authentication.activate - Multi-tenant mode is OFF")
					
					if (numberOfAccounts === 0) {
						log.info("authentication.activate - First account created, it will be the main admin account of this server")
					}
					else {
						log.info("authentication.activate - New account created, it will be a guest account of the main admin account: " + userObject.email)
						
						userObject.isCollaboratorOf = [SINGLE_TENANT_ID]
						userObject.plan = ACCOUNT_PLAN.GUEST
						userObject.currentAccountId = SINGLE_TENANT_ID
						userObject.preferredAccount = SINGLE_TENANT_ID
					}
				}

				// Creates a new account
				await kiss.db.insertOne("account", accountObject)

				// Creates a new user
				userObject.accountId = accountId
				await kiss.db.insertOne("user", userObject)

				// Update the server kiss.directory cache
				kiss.directory.addAccount(accountObject)
				kiss.directory.addUser(userObject)

			} else {

				// Scenario B)  
				// We just have to find the pending user and update its information from the registration document
				let pendingUser = await kiss.db.findOne("user", query)

				// Update the pending user with registrant information
				Object.assign(pendingUser, {
					email,
					firstName,
					lastName,
					password,
					active: true
				})

				// Update the pending user from the registration information
				// + make him/her a collaborator of the host account
				const hostAccountId = pendingUser.invitedBy.shift()
				pendingUser.isCollaboratorOf.push(hostAccountId)
				await kiss.db.updateOne("user", query, pendingUser)

				// Broadcast the event to all users of the host account
				kiss.websocket.publish(hostAccountId, "*+", {
					channel: "EVT_DB_UPDATE:USER",
					accountId: hostAccountId,
					userId: email,
					modelId: "user",
					id: email,
					data: pendingUser
				})

				// Update the server directory cache
				kiss.directory.updateUser(pendingUser)
			}

			// Delete the pending registration
			await kiss.db.deleteOne("registrant", query)

			// Success: redirect to login page
			res.redirect(301, config.authentication.redirectTo.login)

			// Monitor user creation
			const accounts = await kiss.db.find("account", {})

			await kiss.smtp.send({
				to: config.superAdmin,
				subject: `New KissJS user ${email} created`,
				body: `Total users: ${accounts.length}`
			})

		} catch (err) {
			log.err("Error while trying to activate this user:", err)
			res.redirect(301, config.authentication.redirectTo.error)
		}
	},

	/**
	 * Login
	 */
	async login(req, res) {
		if (req.method != "post") throw new MethodNotAllowed()
		if (!req.body.username) throw new BadRequest()
		if (!req.body.password) throw new BadRequest()

		let email = req.body.username.toLowerCase()
		let hashedPassword = kiss.tools.hash(req.body.password)

		// Search for the user in the db and compare passwords
		let userData = await kiss.db.findOne("user", {
			email
		})

		if (userData && !userData.active) throw new Forbidden(
			"This account have not been activated yet. Please check your mails!"
		)

		if ((userData) && (userData.password == hashedPassword)) {

			// Ensure that a user always connects to his own account
			// - OR -
			// That the account first connects to the preferredAccount if defined AND not an invitation
			// (because user without accounts that have been invited may be in this situation)
			if (userData.preferredAccount && !userData.invitedBy.includes(userData.preferredAccount)) {
				try {
					await switchUserCurrentAccount(userData.email, userData.preferredAccount)
					userData.currentAccountId = userData.preferredAccount
				} catch (err) {
					// We want to fail silently in user point of view, but we also want to
					// log this error, since it's not something that should happen.
					log.err("kiss.authentication.login - Unable to connect to preferred account: ", err)

				}
			} else userData.currentAccountId = userData.accountId

			// Create a token for the user
			// We include metadata in the token:
			// - userId
			// - accountId
			// - currentAccountId
			// - firstName
			// - lastName
			// - isCollaboratorOf
			// - invitedBy
			let {
				accountId,
				currentAccountId,
				firstName,
				lastName,
				isCollaboratorOf,
				invitedBy
			} = userData

			const token = authentication.createToken("access", email, accountId, currentAccountId, firstName, lastName)
			const refreshToken = authentication.createToken("refresh", email, accountId, currentAccountId, firstName, lastName)

			// Store the tokens globally
			kiss.global.tokens[email] = token
			kiss.global.refreshTokens[email] = refreshToken

			// Create session
			const sessid = kiss.tools.uid()
			await kiss.session.create(sessid, token)
			kiss.session.setCookie(res, sessid)

			// Returns the token
			res.status(200).send({
				token,
				refreshToken,
				userId: email,
				firstName,
				lastName,
				accountId,
				currentAccountId,
				isCollaboratorOf,
				invitedBy,
				ws: {
					port: config.isBehindProxy ? config.webSocketServer.proxyPort : config.wsPort,
					sslPort: config.isBehindProxy ? config.webSocketServer.proxyPort : config.wssPort
				},
				expiresIn: config.jsonWebToken.accessTokenLife
			})
		} else {
			throw new Unauthorized()
		}
	},

	/**
	 * Request a password reset
	 */
	async requestPasswordReset(req, res) {
		if (req.method != "post") throw new MethodNotAllowed()

		const language = req.body.language
		const email = req.body.username.toLowerCase()

		// Search for the user in the db
		const userData = await kiss.db.findOne("user", {
			email
		})

		// Send an email with the reset token
		if (userData && !userData.loginType) {
			const resetToken = kiss.tools.uid()

			// Create a password reset request in the database
			const passwordRequest = {
				id: resetToken,
				user: email,
				createdAt: new Date().toISOString()
			}
			await kiss.db.insertOne("passwordReset", passwordRequest)

			// Send an email with a link to reset the password
			const emailSubject = kiss.language.txtTitleCase(language, "#password reset subject")
			const emailRequest = kiss.language.txtTitleCase(language, "#password reset body")
			const emailBody = authentication.createEmail(emailRequest)
			const message = emailBody.replaceAll("$host", config.host).replaceAll("$token", resetToken)

			await kiss.smtp.send({
				to: email,
				subject: emailSubject,
				body: message
			})
		}

		res.status(200).end()
	},

	/**
	 * Reset a password
	 */
	async resetPassword(req, res) {
		if (req.method != "post") throw new MethodNotAllowed()

		const language = req.body.language
		const query = {
			_id: req.body.token,
		}

		// Search for the password request in the db
		const requestData = await kiss.db.findOne("passwordReset", query)
		const newPassword = req.body.password

		if (requestData && newPassword) {

			// Delete the request
			await kiss.db.deleteOne("passwordReset", query)

			// Get the user
			const email = requestData.user
			const user = await kiss.db.findOne("user", {
				email
			})

			if (user) {
				// Update the user document
				await kiss.db.updateOne("user", {
					email
				}, {
					password: kiss.tools.hash(newPassword)
				})

				// Send an acknowledgement email
				const emailSubject = kiss.language.txtTitleCase(language, "#password changed subject")
				const emailRequest = kiss.language.txtTitleCase(language, "#password changed body")
				const emailBody = authentication.createEmail(emailRequest)

				await kiss.smtp.send({
					to: email,
					subject: emailSubject,
					body: emailBody
				})
			}
		}

		// Always return a success (to fool hackers)
		res.status(200).end()
	},

	/**
	 * Allow the UI to test token Validity. Especially useful for websocket token renewal before
	 * reconnection, since the WebSocket spec doesn't allow a failed upgrade to return any meaningful
	 * information in browser.
	 *
	 * @return {Promise<void>}
	 */
	async checkTokenValidity(req, res) {
		// The route is already behind the "manageJsonWebTokens" middleware: if the token is invalid,
		// the token error would have been sent before getting to this point if needed.
		res.status(200).send()
	},

	/**
	 * Refresh JSON Web Tokens (Access token and Refresh token)
	 */
	async refreshToken(req, res) {
		if (req.method != "post") throw new MethodNotAllowed()

		try {
			// Get the refresh token and verify it
			const bearer = req.body.refreshToken

			const {
				userId,
				accountId,
				currentAccountId,
				firstName,
				lastName
			} = jwt.verify(bearer, config.jsonWebToken.refreshTokenSecret)

			const user = await kiss.db.findOne("user", {
				email: userId
			})

			// If the refresh token is OK, generates new tokens
			const token = authentication.createToken("access", userId, accountId, currentAccountId, firstName, lastName)
			const refreshToken = authentication.createToken("refresh", userId, accountId, currentAccountId, firstName, lastName)

			// Update the user tokens globally
			kiss.global.tokens[userId] = token
			kiss.global.refreshTokens[userId] = refreshToken

			await kiss.session.touch(kiss.session.extractSessid(req), token)

			// Send new tokens
			res.status(200).send({
				token,
				refreshToken,
				userId,
				accountId,
				firstName,
				lastName,
				isCollaboratorOf: user.isCollaboratorOf,
				invitedBy: user.invitedBy,
				currentAccountId,
				expiresIn: config.jsonWebToken.accessTokenLife,
				ws: {
					port: config.isBehindProxy ? config.webSocketServer.proxyPort : config.wsPort,
					sslPort: config.isBehindProxy ? config.webSocketServer.proxyPort : config.wssPort
				}
			})

		} catch (err) {
			if (err instanceof APIError) throw err
			else throw new Unauthorized("The refresh token is not valid or expired")
		}
	},

	/**
	 * Allow a user to accept an invitation to join an account
	 */
	async acceptInvitationOf(req, res) {
		if (req.method !== "post") throw new MethodNotAllowed()

		const userId = req.token.userId
		const accountId = req.body.accountId

		const user = await kiss.db.findOne("user", {
			email: userId
		})

		if (!user.invitedBy || !user.invitedBy.includes(accountId)) throw new NotFound("Invitation not found!")

		// Update user lists
		user.isCollaboratorOf.push(accountId)
		user.invitedBy.splice(user.invitedBy.indexOf(accountId), 1)

		await kiss.db.updateOne("user", {
			email: userId
		}, {
			invitedBy: user.invitedBy,
			isCollaboratorOf: user.isCollaboratorOf
		})

		// We need owner information for the UI
		const {
			firstName,
			lastName,
			email
		} = await kiss.db.findOne("user", {
			accountId
		})

		// Update the server directory cache
		kiss.directory.updateUser(user)

		res.status(200).send(JSON.stringify({
			accountId,
			firstName,
			lastName,
			email
		}))

		// Broadcast the event
		kiss.websocket.publish(accountId, "*+", {
			channel: "EVT_COLLABORATION:ACCEPTED",
			accountId,
			userId: user.email
		})
	},

	/**
	 * Allows a user to reject an invitation
	 */
	async rejectInvitationOf(req, res) {
		if (req.method !== "post") throw new MethodNotAllowed()

		const userId = req.token.userId
		const accountId = req.body.accountId		
		const userQuery = {
			email: userId
		}

		const user = await kiss.db.findOne("user", userQuery)
		if (!user.invitedBy.includes(accountId)) throw new NotFound("Invitation not found!")

		user.invitedBy.splice(user.invitedBy.indexOf(accountId), 1)

		await kiss.db.updateOne("user", userQuery, {
			invitedBy: user.invitedBy
		})

		res.status(200).send()

		// Broadcast the event to update the directory's list of users
		kiss.websocket.publish(accountId, "*+", {
			channel: "EVT_COLLABORATION:REJECTED",
			accountId: accountId,
			userId
		})
	},

	/**
	 * Called when a user quit a collaboration.
	 */
	async quitAccount(req, res) {
		if (req.method !== "post") throw new MethodNotAllowed()

		const userId = req.token.userId
		const accountId = req.body.accountId			

		const user = await kiss.db.findOne("user", {
			email: userId
		})

		const account = await kiss.db.findOne("account", {
			_id: accountId
		})

		if (!user.isCollaboratorOf.includes(accountId)) {
			throw new NotFound(`You're not a collaborator of this account!`)
		}

		user.isCollaboratorOf.splice(user.isCollaboratorOf.indexOf(accountId), 1)

		// If the preferred account is the one the user is quitting, we must reset it.
		if (user.preferredAccount === accountId) user.preferredAccount = null

		// If the current user is working currently on the account he is quitting,
		// we switch him automatically to his own account
		let currentAccountChanged = false
		let token = undefined
		let refreshToken = undefined

		// If the user is currently working on the account he tries to quit
		if (user.currentAccountId === accountId) {

			user.currentAccountId = user.accountId
			currentAccountChanged = true
			switchClientWebsocketAccount(accountId, user.accountId, user.email)

			const tokens = generateTokens({
				userId,
				accountId: user.accountId,
				currentAccountId: user.accountId,
				firstName: user.firstName,
				lastName: user.lastName
			})

			token = tokens.token
			refreshToken = tokens.refreshToken
		}

		await kiss.db.updateOne("user", {
			email: userId
		}, {
			isCollaboratorOf: user.isCollaboratorOf,
			currentAccountId: user.currentAccountId,
			preferredAccount: user.preferredAccount
		})

		// Cleanup references to the user in ACL and groups
		const operations = await kiss.directory.cleanupAllUserReferences(account.accountId, user.email)

		// Broadcast the updates to all users of the active account
		kiss.websocket.publish(account.accountId, "*+", {
			channel: "EVT_DB_UPDATE_BULK",
			accountId: account.accountId,
			userId: user.email,
			data: operations
		})

		res.status(200).send(JSON.stringify({
			currentAccountChanged,
			currentAccountId: user.currentAccountId,
			token,
			refreshToken,
			expiresIn: config.jsonWebToken.accessTokenLife
		}))

		// Broadcast the event to update the directory's list of users
		kiss.websocket.publish(account.accountId, "*+", {
			channel: "EVT_COLLABORATION:STOPPED",
			accountId: account.accountId,
			userId: user.email
		})
	},

	/**
	 * Allow a user to switch to an account which he is a collaborator of
	 */
	async switchAccount(req, res) {
		if (req.method !== "post") throw new MethodNotAllowed()

		// We need to extract token's infos to re-issue new tokens
		let {
			userId,
			accountId,
			currentAccountId,
			firstName,
			lastName
		} = req.token

		// We get the account the user want to switch to
		const accountToSwitchTo = req.body.accountId

		await switchUserCurrentAccount(userId, accountToSwitchTo)

		// We must re-issue the JWT token with the new currentAccountId
		const {
			token,
			refreshToken
		} = generateTokens({
			userId,
			accountId,
			currentAccountId: accountToSwitchTo,
			firstName,
			lastName
		})

		switchClientWebsocketAccount(currentAccountId, accountToSwitchTo, userId)

		// We just provide new tokens, user's UI will be reloaded.
		res.status(200).send({
			token,
			refreshToken,
			expiresIn: config.jsonWebToken.accessTokenLife
		})
	},

	/**
	 * Returns all collaborators of the user.
	 */
	async getCollaborators(req, res) {
		if (req.method !== "get") throw new MethodNotAllowed()

		const {
			userId,
			accountId,
			currentAccountId
		} = req.token

		const currentUser = await kiss.db.findOne("user", {
			email: userId
		})

		currentUser.isCollaboratorOf = currentUser.isCollaboratorOf || []
		currentUser.invitedBy = currentUser.invitedBy || []

		const accounts = await kiss.db.find("account", {
			_id: {
				$in: [
					...currentUser.isCollaboratorOf,
					...currentUser.invitedBy
				]
			}
		})

		// We need to add the current user in the list of its own collaborators so that he can switch back to his own account
		let users = [currentUser]

		if (accounts && accounts.length > 0) {
			users.push(...await kiss.db.find("user", {
				accountId: {
					$in: accounts.map(account => account.id)
				}
			}))
		}

		// Format the output to compute "isInvite" and "isOwner"
		users.forEach(user => {
			user.isOwner = user.accountId === currentAccountId
			user.isInvite = (user.invitedBy && user.invitedBy.includes(accountId))
		})

		res.status(200).send(users)
	},

	/**
	 * Return the list of all users in the current account.
	 * Invitations are only added if the user is the account owner.
	 */
	async getUsers(req, res) {
		if (req.method !== "get") throw new MethodNotAllowed()

		const {
			accountId,
			currentAccountId
		} = req.token

		// 1. Insert the account owner first
		const currentAccountOwner = await kiss.db.findOne("user", {
			accountId: currentAccountId
		})
		let users = [currentAccountOwner]

		// 2. Then get all the users collaborating with this account
		const accountUsers = await kiss.db.find("user", {
			isCollaboratorOf: currentAccountId
		})
		users = users.concat(accountUsers)

		// 3. Then, if it's the account owner or an account manager, add all the invited users
		if (req.token.isOwner || req.token.isManager) {
			const invitedUsers = await kiss.db.find("user", {
				invitedBy: currentAccountId
			})
			users = users.concat(invitedUsers)
		}

		// 4. Format the output to compute "isInvite" and "isOwner" + remove the password
		users.forEach(user => {
			user.isOwner = user.accountId === currentAccountId
			user.isInvite = (user.invitedBy && user.invitedBy.includes(accountId))
			delete user.password
		})

		res.status(200).send(users)
	},

	/**
	 * Logout - Revoke user tokens
	 */
	async logout(req, res) {
		if (req.method != "get") throw new MethodNotAllowed()

		// Get token
		if (!req.headers.authorization) throw new Unauthorized()

		const bearer = req.headers.authorization.split(" ")[1]
		if (!bearer) throw new Unauthorized()

		const {
			accountId,
			currentAccountId,
			userId
		} = req.token

		// Always defaults to user own account when logout
		if (accountId !== currentAccountId) {
			await kiss.db.updateOne("user", {
				email: userId
			}, {
				currentAccountId: accountId
			})
		}

		// Revoke the tokens
		if (bearer == kiss.global.tokens[userId]) {
			delete kiss.global.tokens[userId]
			delete kiss.global.refreshTokens[userId]
		}

		await kiss.session.destroy(kiss.session.extractSessid(req))
		kiss.session.deleteCookie(res)

		// Close the websocket connection for this user
		kiss.websocket.closeConnection(currentAccountId, userId)

		// Logout successful (the client should Redirect to the login page)
		res.status(200).end()
	},

	/**
	 * Get a token from a request
	 * 
	 * @returns {object|undefined} The token if it's valid, or nothing
	 */
	getToken(req) {
		try {
			// Get the token from the authorization header & verify it
			let bearer = req.headers.authorization.split(" ")[1]

			let token
			try {
				token = jwt.verify(bearer, config.jsonWebToken.accessTokenSecret)
			} catch (err) {
				throw new InvalidToken()
			}

			// Check that token was generated by this server
			if (bearer == kiss.global.tokens[token.userId]) {
				return token
			}

			// Token does not exist on this server: returns a 401
			throw new Unauthorized()

		} catch (err) {
			if (err instanceof APIError) throw err
			else throw new Unauthorized()
		}
	},

	/**
	 * Create a JWT **Access** token or **Refresh** token for users.
	 * Can also create a permanent token for API clients.
	 * 
	 * @param {string} tokenType - "access" | "refresh" | "application"
	 * @param {string} userId - Can be an email (for users) or an API client id
	 * @param {string} accountId
	 * @param {string} currentAccountId
	 * @param {string} firstName
	 * @param {string} lastName
	 * @returns {object} The token
	 */
	createToken(tokenType, userId, accountId, currentAccountId, firstName, lastName) {
		const SECRET = (tokenType == "refresh") ? config.jsonWebToken.refreshTokenSecret : config.jsonWebToken.accessTokenSecret

		const expiration = {
			access: config.jsonWebToken.accessTokenLife,
			refresh: config.jsonWebToken.refreshTokenLife,

			// Basically no expiration for API keys because:
			// - there is a "revoke" mechanism in case of abuse
			// - apps using these tokens need to work for a long period without human intervention to renew the tokens
			api: "10y"
		}

		return jwt.sign({
			userId,
			accountId,
			currentAccountId,
			firstName,
			lastName,
			isOwner: accountId === currentAccountId
		}, SECRET, {
			algorithm: "HS256",
			expiresIn: expiration[tokenType]
		})
	},

	/**
	 * Init Passport serializer
	 * 
	 * @param {object} passport 
	 */
	initPassportSerializer(passport) {
		passport.serializeUser(function (user, done) {
			done(null, user)
		})

		passport.deserializeUser(function (obj, done) {
			done(null, obj)
		})
	},

	/**
	 * Login or Register a user from an external service:
	 * - check if the user already exists
	 * - create an account document
	 * - create a user document
	 * - delete the pending registration document, if any
	 * - set the user's "active" status to true if the user was invited from another account
	 *
	 * @param {object} userData
	 * @param {object} profile 
	 * @param {string} loginType - "google" | "azureAd" | "microsoft" | "linkedin" | "facebook"
	 */
	async loginOrRegisterFromExternalService(userData, profile, loginType, done) {
		try {
			let query = {
				email: userData.email.toLowerCase(),
			}

			let record = await kiss.db.findOne("user", query)

			// The user does not exist in the database:
			// it's a new user and new account
			if (!record) {
				// Creates a new account
				const accountId = kiss.tools.uid()
				let accountObject = createAccountObject(accountId, userData.email, {
					plan: ACCOUNT_PLAN.TRIAL
				})

				// Creates a new user
				Object.assign(userData, {
					id: kiss.tools.uid(),
					accountId,
					currentAccountId: accountId,
					invitedBy: [],
					isCollaboratorOf: [],
					createdAt: new Date().toISOString()
				})

				const token = authentication.createToken("access", userData.email, userData.accountId, userData.currentAccountId, userData.firstName, userData.lastName)
				const refreshToken = authentication.createToken("refresh", userData.email, userData.accountId, userData.currentAccountId, userData.firstName, userData.lastName)

				// Store the tokens globally
				kiss.global.tokens[userData.email] = token
				kiss.global.refreshTokens[userData.email] = refreshToken

				// TODO: in transaction
				await kiss.db.insertOne("account", accountObject)
				await kiss.db.insertOne("user", userData)

				// Update the server kiss.directory cache
				kiss.directory.addAccount(accountObject)
				kiss.directory.addUser(userData)

				// Delete the pending registration
				//await kiss.db.deleteOne("registrant", query)

				profile.jwtToken = token
				return done(null, profile)

			} else {
				const token = authentication.createToken("access", record.email, record.accountId, record.currentAccountId, record.firstName, record.lastName)
				const refreshToken = authentication.createToken("refresh", record.email, record.accountId, record.currentAccountId, record.firstName, record.lastName)

				// Store the tokens globally
				kiss.global.tokens[record.email] = token
				kiss.global.refreshTokens[record.email] = refreshToken

				// Check if a user exists with same details than the logged in user
				if (record.loginType === loginType && record.active) {

					// If yes, update the user session token + user infos (in case the user updated his profile inside the 3rd party directory)
					await kiss.db.updateOne("user", {
						_id: record.id
					}, {
						firstName: userData.firstName,
						lastName: userData.lastName,
						name: userData.name
					})

					profile.jwtToken = token
					return done(null, profile)

				} else if (!record.active) {

					const account = createAccountObject(kiss.tools.uid(), userData.email.toLowerCase(), {
						plan: ACCOUNT_PLAN.GUEST
					})

					// If the user is not active, it means the user was invited to join an existing account
					let userObject = {
						email: userData.email.toLowerCase(),
						firstName: userData.firstName,
						lastName: userData.lastName,
						name: userData.name,
						socialId: userData.socialId,
						loginType: loginType,
						sessionToken: token,
						isCollaboratorOf: [record.accountId],
						invitedBy: [],
						accountId: account.id,
						currentAccountId: account.id,
						active: true,
						createdAt: new Date().toISOString()
					}

					await kiss.db.insertOne("account", account)

					// Update the pending user from the registration information
					await kiss.db.updateOne("user", {
						_id: record.id
					}, userObject)

					// Update the server kiss.directory cache
					userObject.accountId = record.accountId
					kiss.directory.addUser(userObject)

					// Broadcast the event to all users of the active account
					kiss.websocket.publish(token.currentAccountId, "*+", {
						channel: "EVT_DB_UPDATE:USER",
						accountId: record.accountId,
						userId: userData.email.toLowerCase(),
						modelId: "user",
						id: record.id,
						data: userObject
					})

					// Delete the pending registration
					await kiss.db.deleteOne("registrant", query)

					profile.jwtToken = token
					return done(null, profile)

				} else {
					done(null, {})
				}
			}
		} catch (err) {
			done(err)
		}
	},

	/**
	 * Create an HTML email
	 */
	createEmail(txt) {
		return /*html*/ `
            <div>
                <table>
                    <tr>
                        <td style="padding: 16px 32px 16px 32px; text-align: center; font-family: arial; font-size: 20px; font-weight: bold; color: #ffffff; background: #00aaee; border-radius: 16px;">
                            pick<font color="#a1ed00">a</font>form
                        </td>
                        <td style="padding: 16px 32px 16px 32px; font-family: arial; font-size: 16px; color: #00aaee;">
                            ${txt}
                        </td>
                    </tr>
                </table>
            </div>`.removeExtraSpaces()
	},

	/**
	 * Create an API token
	 */
	async createApiToken(req, res) {
		if (req.method != "post") throw new MethodNotAllowed()
		if (!req.token.isOwner && !req.token.isManager) throw new Forbidden()

		const accountId = req.token.currentAccountId // This is the only account the token will be able to access
		const apiClientId = kiss.tools.uid()
		const apiClientName = req.body.name
		const apiClientToken = authentication.createToken("api", apiClientId, apiClientId, accountId, "API:", apiClientName)
		kiss.global.tokens[apiClientId] = apiClientToken

		const apiClientRecord = {
			id: apiClientId,
			accountId,
			name: apiClientName,
			token: apiClientToken,
			expiration: kiss.formula.ADJUST_DATE("", 1), // 1 year from now,
			createdAt: (new Date()).toISOString(),
			createdBy: req.token.userId
		}

		await kiss.db.insertOne("apiClient", apiClientRecord)
	
		res.status(200).send({
			token: apiClientToken
		})

		// Broadcast the event to all users of the active account
		kiss.websocket.publish(req.token.currentAccountId, "*+", {
			channel: "EVT_DB_INSERT:APICLIENT",
			accountId,
			userId: req.token.userId,
			modelId: "apiClient",
			id: apiClientId,
			data: apiClientRecord
		})
	},

	/**
	 * Get API clients
	 * 
	 * Sends the API clients infos without the secret token.
	 * Used to display API clients in the directory as standard users.
	 */
	async getApiClients(req, res) {
		if (req.method != "get") throw new MethodNotAllowed()

		const APIClients = await kiss.db.find("apiClient", {
			accountId: req.token.currentAccountId
		})

		APIClients.forEach(record => {
			delete record.token
		})

		res.status(200).send(APIClients)
	},

	/**
	 * Revoke an API token
	 */
	async revokeApiToken(req, res) {
		if (req.method != "delete") throw new MethodNotAllowed()
		if (!req.token.isOwner && !req.token.isManager) throw new Forbidden()

		const apiClientId = req.path_1
		delete kiss.global.tokens[apiClientId]

		await kiss.db.deleteOne("apiClient", {
			_id: apiClientId
		})
		
		res.status(200).end()

		// Broadcast the event to all users of the active account
		kiss.websocket.publish(req.token.currentAccountId, "*+", {
			channel: "EVT_DB_DELETE:APICLIENT",
			accountId: req.token.currentAccountId,
			userId: req.token.userId,
			modelId: "apiClient",
			id: apiClientId
		})		
	}
}

module.exports = authentication