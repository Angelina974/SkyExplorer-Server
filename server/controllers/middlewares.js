/**
 *
 * Special Express middlewares
 * 
 */
const config = require("../config")
const jwt = require("jsonwebtoken")
const url = require("url")
const authentication = require("./authentication")

const {
	API: {
		APIError,
		BadRequest,
		Forbidden,
		Unauthorized,
		NotFound,
		InvalidToken,
		TokenExpired,
		InternalServerError,
		MethodNotAllowed
	}
} = require("../core/errors")

module.exports = {

	/**
	 * Remove the "X-Powered-By Express" header which can be used by hackers to target Express vulnerabilities
	 */
	removePoweredBy(req, res, next) {
		res.removeHeader("X-Powered-By")
		next()
	},

	/**
	 * Add useful informations to the default request object:
	 * - path_0
	 * - path_1
	 * - path_2
	 * - path_3
	 * - path_4
	 * - path_5
	 * - fullPath: string[]
	 * - search
	 * - queryStringObject (used by fileUpload, Stripe...)
	 */
	addRequestInfos(req, res, next) {
		const parsedUrl = url.parse(req.url, true)
		const search = parsedUrl.search
		const queryStringObject = parsedUrl.query

		const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, "").split("/")
		const [
			path_0,
			path_1,
			path_2,
			path_3,
			path_4,
			path_5
		] = path

		Object.assign(req, {
			fullPath: path,
			path_0,
			path_1,
			path_2,
			path_3,
			path_4,
			path_5,
			search,
			queryStringObject,
			method: req.method.toLowerCase()
		})
		next()
	},

	/**
	 * Try to find the sessid in request cookie. If present and JWT token is not in authorization header, will restore it.
	 * This middleware do not care about permissions or anything else.
	 * It only handles session cookie when needed.
	 */
	async manageSession(req, res, next) {
		try {
			// Since setting a session cookie open the door to CSRF attacks, we limit the session cookie
			// used to re-inject the JWT Token in the response when the later is missing to a very strict
			// subset of request.
			// The goal is to only permit the session to be renewed along with the JWT token it is attached
			// to and to use the session to be able to access a private file with the said cookie
			// as no Authorization header is attached when the browser itself forge the request (img tag, iframes etc).
			if (
				![
					"login",
					"refreshToken",
					"isValid",
					"file"
				].includes(req.path_0)
			) return next()

			const sessid = kiss.session.extractSessid(req)

			// If we have a SESSID cookie in request header
			if (sessid) {
				let shouldTouchSession = true

				// If no authorization header have been attached
				if (!req.headers.authorization) {
					const {
						id,
						token = null
					} = (await kiss.session.get(sessid)) || {}

					if (token) {
						// A token has been found. We inject the Authorization header for it to be checked later
						req.headers.authorization = `Bearer ${token}`
						kiss.session.setCookie(res, id)

					} else {
						// If token is null, session has already been cleaned up, so we clean up the cookie.
						kiss.session.deleteCookie(res)
						shouldTouchSession = false
					}
				}

				if (shouldTouchSession) {
					try {
						// We update the lifetime of the session
						await kiss.session.touch(sessid)
						req.sessid = sessid
					} catch (err) {
						// We silence the error. The token may have expired. Not our stuff.
						// The manageJsonWebTokens middleware will take care of it for us
					}
				}
			}

			next()

		} catch (err) {
			next(err)
		}
	},

	/**
	 * Manage JSON Web Tokens:
	 * - Skip token verification for public routes
	 * - Add token informations to the request object (req)
	 * - If Access Token is expired, returns 498 to give a chance to the client to refresh the token
	 * - If Access Token is expired AND the route is /refreshToken, authorize access to the controller to refresh the token
	 * - Returns 401 in any other error situation
	 */
	async manageJsonWebTokens(req, res, next) {
		try {
			req.token = false

			// Skip public routes
			let publicRoutes = [
				"/getEnvironment",
				"/register",
				"/activate",
				"/join",
				"/login",
				"/verifyToken",
				"/requestPasswordReset",
				"/resetPassword",
				"/boxConnect",
				"/subscribeSuccess",
				"/subscribeError",
				"/stripeWebhooks",
				"/www", // Work in progress for static pages generator
				...kiss.routes.public
			]

			if (publicRoutes.some(rootPath => req.path.startsWith(rootPath))) {
				return next()
			}

			try {
				if (!req.headers.authorization) throw new Unauthorized("No token provided")

				// Get the token from the authorization header & verify it
				const bearer = req.headers.authorization.split(" ")[1]

				let payload

				try {
					payload = jwt.verify(bearer, config.jsonWebToken.accessTokenSecret)
					
				} catch (err) {
					// Possible errors:
					// - invalid token
					// - jwt malformed
					// - invalid signature
					// - jwt expired
					if (err.message === "invalid token" || err.message === "jwt malformed" || err.message === "invalid signature") {
						throw new InvalidToken()
					} else if (err.message === "jwt expired") {
						throw new TokenExpired()
					}
				}

				// Check that token was generated by this server
				if (bearer == kiss.global.tokens[payload.userId]) {

					req.token = payload

					// Add isOwner to the token
					req.token.isOwner = payload.accountId === payload.currentAccountId

					// Add isManager to the token
					req.token.isManager = (kiss.directory.accounts[req.token.currentAccountId].managers || []).includes(payload.userId)

					// Add user ACL infos to the token
					req.token.userACL = kiss.directory.getUserACL(payload.currentAccountId, payload.userId)
					

					// We have a token but no session. It may happen with some race condition.
					// We must re-create it and refresh it with the next response :)
					if (!req.sessid) {
						req.sessid = kiss.tools.uid()
						await kiss.session.create(req.sessid, bearer)
						kiss.session.setCookie(res, req.sessid)
					}

					next()

				} else {
					// Unvalid token (not generated by the same server)
					// log("kiss.middlewares - manageJsonWebTokens - Unvalid token")
					throw new Unauthorized()
				}

			} catch (err) {
				// The token is expired but the client is actually trying to get a new access token through the /refreshToken route
				// Allow access to the controller
				if (err instanceof APIError) {
					if (err instanceof TokenExpired && req.path == "/refreshToken") {
						next()
					} else {
						next(err)
					}
				}
				else { 
					// Try to track originator
					if (req.token) {
						log("User id: " + req.token.userId)
						log("User account id: " + req.token.accountId)
						log("Current account id: " + req.token.currentAccountId)
					}
					throw new InternalServerError(err)
				}
			}

		} catch (err) {
			next(err)
		}
	},

	/**
	 * Verify a JWT token for external authentications
	 * (Google, MS365, Azure Active Directory, LinkedIn, Twitter, Facebook, Instagram)
	 */
	async verifyToken(req, res, next) {
		try {
			// Restrict to POST method
			if (req.method != "post") throw new MethodNotAllowed()

			try {
				const token = req.body.token

				// Verify Token After Social Redirection
				let payload
				try {
					payload = jwt.verify(token, config.jsonWebToken.accessTokenSecret)
				} catch (err) {
					throw new InvalidToken()
				}

				if (payload) {
					// Check the user data, finding him with email and token
					const record = await kiss.db.findOne("user", {
						email: payload.userId.toLowerCase()
					})

					const {
						email,
						accountId,
						currentAccountId,
						firstName,
						lastName,
						isCollaboratorOf,
						invitedBy
					} = record

					const ws = {
						port: config.isBehindProxy ? config.webSocketServer.proxyPort : config.wsPort,
						sslPort: config.isBehindProxy ? config.webSocketServer.proxyPort : config.wssPort
					}

					// Generate a refresh token
					const refreshToken = authentication.createToken("refresh", email, accountId, currentAccountId, firstName, lastName)

					// Update the user tokens globally
					kiss.global.tokens[email] = token
					kiss.global.refreshTokens[email] = refreshToken

					let sessid = await kiss.session.extractSessid(req)
					if (sessid) {
						await kiss.session.touch(kiss.session.extractSessid(req), token)
					} else {
						sessid = kiss.tools.uid()
						await kiss.session.create(sessid, token)
						kiss.session.setCookie(res, sessid)
					}

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
						ws,
						loginType: record.loginType,
						expiresIn: config.jsonWebToken.accessTokenLife
					})
				} else {
					throw new Unauthorized("Token was not issued by this server")
				}
			} catch (err) {
				if (err instanceof APIError) throw err
				else throw new Unauthorized(err)
			}
		} catch (err) {
			next(err)
		}
	},

	/**
	 * Check if a user can access a custom model.
	 * Dynamic models belong to a specific Account, and the connected user must belong to the same account to access them.
	 * Important: this middleware is skipped if the multiTenant option is disabled.
	 */
	async protectAccessToDynamicModels(req, res, next) {
		if (config.multiTenant === "false") return next()

		try {
			const modelId = req.path_0
			const token = req.token

			// Skip the middleware if it's not a custom model (= models with RFC4122 naming style)
			if (!kiss.tools.isUid(modelId)) return next()

			const model = kiss.app.models[modelId]

			if (model && model.accountId == token.currentAccountId) {
				return next()
			}

			// The user belongs to another account: reject
			log.err(`kiss.http - Access to the custom model ${modelId} - ${token.userId} not authorized`)
			throw new Forbidden()

		} catch (err) {
			next(err)
		}
	},

	/**
	 * Define a target collection depending on the requested model.
	 * 
	 * To isolate data between customers (= clients = tenants) and/or to limit the number of records per collection,
	 * the data of a single model can be stored in multiple collections.
	 * 
	 * This function looks at the "splitBy" property of the model to know if the data should be splitted or not.
	 * If yes, the target collection id is stored inside the request object (by adding a "targetCollectionSuffix" property to it)
	 * 
	 * Example:
	 * A user is performing a request on the model "comment" which property "splitBy" is "account".
	 * It means the data of the model is splitted by account.
	 * When a new record is created, it is stored in the collection "comment_{{accountId}}", where accountId is the id of the user account.
	 * When a user is searching for comments, KissJS automatically searches in the "comment_{{accountId}}" collection.
	 * 
	 * In the future, this architecture could be easily extended to split data by "user" (if we need a distinct collection per user), or split data by any possible criteria:
	 * - geographical criterias (ex: by country...)
	 * - time criteria (ex: by year...)
	 * - ...
	 */
	defineTargetCollection(req, res, next) {
		const modelId = req.path_0
		const model = kiss.app.models[modelId]
		if (!model) return next()

		if (model.splitBy && model.splitBy == "account") {
			req.targetCollectionSuffix = "_" + req.token.currentAccountId
		}

		next()
	},

	/**
	 * Route to the right controller
	 * 
	 * Route to a free json api dedicated to custom data structures if:
	 * - the route matches a dynamic model (= their id matches RFC4122 pattern)
	 * - the route starts with "plugin"
	 */
	async routeToController(req, res, next) {
		try {
			// log(req.method + ": /" + req.path_0)

			const route = req.path_0
			let controllerFunction = kiss.server.router[route]

			// The route does not exist in the configuration
			if (typeof controllerFunction === "undefined") {

				// Dynamic models (routes with RFC4122 format) and custom plugins
				if (kiss.tools.isUid(route) || route.startsWith("plugin")) {
					controllerFunction = kiss.server.router["data"]
				}
				// Not found: the route does not exist
				else throw new NotFound()
			}

			// We don't know in advance if it will be sync or async, so we await anyway for the error to
			// bubble automatically to the error handler, if any
			await controllerFunction(req, res, next)

		} catch (err) {
			next(err)
		}
	},

	/**
	 * Global error handling
	 *
	 * @param {object|null} error
	 * @param req
	 * @param res
	 * @param {function} next This useless parameter MUST BE KEPT there. If not, the errorHandler will
	 *                        never be called. This is stupid, since we obviously not need it. But it's how
	 *                        express is designed...
	 */
	async errorHandling(error, req, res, next) {
		let alreadySent = false
		if (error instanceof APIError) {
			//We can respond with JSON every time, since we do not serve HTML on error.
			res.status(error.statusCode).send(JSON.stringify({
				error: error.message,
				code: error.statusCode
			})).end()

			alreadySent = true

			// API errors in range 4xx are expected. They are normal answers to requests.
			// No log required for them
			if (error.statusCode >= 400 && error.statusCode < 500) return
		}

		log.err("kiss.http - An unexpected error occurred: ", error)
		if (!alreadySent) res.status(error.statusCode ?? 500).send(error.message).end()

		try {
			await kiss.errors.reporting.report(
				"Global express route handler returned an unexpected error",
				error
			)
		} catch (err) {
			log.err("Unable to report the error. Something goes badly wrong!", err)
		}
	}
}