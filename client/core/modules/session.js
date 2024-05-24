/**
 * 
 * ## A simple session manager
 * 
 * **This module is 100% specific and only works in combination with KissJS server.**
 * 
 * Dependencies:
 * - kiss.ajax, to send credentials to the server
 * - kiss.views, to popup the login window
 * - kiss.router, to route to the right application view if session is valid
 * - kiss.websocket, to check that the websocket connection is alive (and reconnect if not)
 * 
 * @namespace
 * 
 */
kiss.session = {

    // Observe img tags to detect failed load due to outdated token to try to refresh them
    // and reload the said resource
    resourcesObserver: null,

    /**
     * Max idle time (30 minutes by default)
     * After that delay, the user is logged out and its tokens are deleted from localStorage
     */
    maxIdleTime: 1000 * 60 * 30,

    // By default, before authenticating, a user is anonymous
    userId: "anonymous",

    // Flag to track if the active user is the account owner
    isOwner: false,

    invitedBy: [],
    isCollaboratorOf: [],

    // Defaults views
    defaultViews: {
        login: "authentication-login",
        home: "home-start"
    },

    // Default login methods:
    loginMethods: ["internal", "google", "microsoftAD"],

    /**
     * Define the default views:
     * - login: view to login
     * - home: view to display after login
     * 
     * @param {object} config
     * @param {string} config.login - Default = "authentication-login"
     * @param {string} config.home - Default = "home-start"
     * 
     * @example
     * kiss.session.setDefaultViews({
     *  login: "your-login-view",
     *  home: "your-home-view"
     * })
     */
    setDefaultViews(views) {
        Object.assign(this.defaultViews, views)
    },

    /**
     * Define the default websocket view
     * (view used to display websocket messages)
     * 
     * @ignore
     * @param {string} viewId
     */
    setWebSocketMessageView(viewId) {
        this.webSocketMessageView = viewId
    },

    /**
     * Define all login methods
     * 
     * @ignore
     * @returns {object[]} Array of login methods and their properties (text, icon...)
     */
    getLoginMethodTypes: () => [{
            type: "internal",
            alias: "i"
        },
        {
            type: "google",
            alias: "g",
            text: txtTitleCase("login with") + " Google",
            icon: "fab fa-google",
            callback: "/auth/google"
        },
        {
            type: "microsoftAD",
            alias: "a",
            text: txtTitleCase("login with") + " Microsoft",
            icon: "fab fa-microsoft",
            callback: "/auth/azureAd"
        },
        {
            type: "microsoft365",
            alias: "m",
            text: txtTitleCase("login with") + " Microsoft 365",
            icon: "fab fa-microsoft",
            callback: "/auth/microsoft"
        },
        {
            type: "linkedin",
            alias: "l",
            text: txtTitleCase("login with") + " LinkedIn",
            icon: "fab fa-linkedin",
            callback: "/auth/linkedin"
        },
        {
            type: "facebook",
            alias: "f",
            text: txtTitleCase("login with") + " Facebook",
            icon: "fab fa-facebook",
            callback: "/auth/facebook"
        },
        {
            //TODO
            type: "instagram",
            alias: "s",
            text: txtTitleCase("login with") + " Twitter",
            icon: "fab fa-twitter",
            callback: "/auth/instagram"
        },
        {
            //TODO
            type: "twitter",
            alias: "t",
            text: txtTitleCase("login with") + " Twitter",
            icon: "fab fa-twitter",
            callback: "/auth/twitter"
        }
    ],

    /**
     * Set the possible login methods.
     * 
     * Possible login methods are currently:
     * - internal
     * - google
     * - microsoftAD
     * - microsoft365
     * - linkedin
     * - facebook
     * 
     * @param {string[]} methods
     * 
     * @example
     * kiss.session.setLoginMethods(["internal", "google"])
     */
    setLoginMethods(methods) {
        kiss.session.loginMethods = methods
    },

    /**
     * Encode the active login methods into a short string.
     * Used internally to adapt the login prompt depending on the lm (login method) parameter
     * 
     * @ignore
     * @returns {string} For example "igf" means internal + google + facebook
     */
    getLoginMethods() {
        if (!kiss.session.loginMethods) {
            return kiss.session.getLoginMethodTypes().map(method => method.alias).join("")
        } else {
            return kiss.session.loginMethods.map(loginMethodType => kiss.session.getLoginMethodTypes().find(loginMethod => loginMethod.type == loginMethodType))
                .filter(loginMethod => loginMethod !== undefined)
                .map(loginMethod => loginMethod.alias)
                .join("")
        }
    },

    /**
     * Check if the environment is online/offline
     */
    isOffline: () => ["memory", "offline"].includes(kiss.db.mode),
    isOnline: () => !kiss.session.isOffline(),

    /**
     * Set the maximum idle time before automatically logging out the user
     * 
     * @param {number} newIdleTime - Max idle time in minutes
     */
    setMaxIdleTime(newIdleTime) {
        this.maxIdleTime = newIdleTime * 1000 * 60
    },

    /**
     * Get the application's server runtinme environment
     * 
     * @async
     * @returns {string} "dev" | "production" | ... | "unknown"
     */
    getServerEnvironment: async () => {
        const response = await kiss.ajax.request({
            url: "/getEnvironment"
        })
        return response.environment || "unknown"
    },

    /**
     * Get access token
     */
    getToken: () => localStorage.getItem("session-token"),

    /**
     * Get refresh token
     */
    getRefreshToken: () => localStorage.getItem("session-refresh-token"),

    /**
     * Get token's expiration
     */
    getExpiration: () => localStorage.getItem("session-expiration"),

    /**
     * Get websocket non-secure port
     */
    getWebsocketPort: () => localStorage.getItem("session-ws.port"),

    /**
     * Get websocket secure port
     */
    getWebsocketSSLPort: () => localStorage.getItem("session-ws.sslPort"),

    /**
     * Get the date/time of the last user activity which was tracked
     */
    getLastActivity: () => {
        const lastActivity = localStorage.getItem("session-lastActivity")
        if (lastActivity) return new Date(lastActivity)
        else return new Date()
    },

    /**
     * Get authenticated user's id
     */
    getUserId: () => (kiss.session.isOffline()) ? "anonymous" : localStorage.getItem("session-userId") || "anonymous",

    /**
     * Check if the user is authenticated
     */
    isAuthenticated: () => (kiss.session.isOffline()) ? true : kiss.session.getUserId() != "anonymous",

    /**
     * Get authenticated user's first name
     */
    getFirstName: () => (kiss.session.isOffline()) ? "anonymous" : localStorage.getItem("session-firstName"),

    /**
     * Get authenticated user's last name
     */
    getLastName: () => (kiss.session.isOffline()) ? "anonymous" : localStorage.getItem("session-lastName"),

    /**
     * Get authenticated user's full name
     * Offline and in-memory environments are anonymous
     */
    getUserName: () => (kiss.session.isOffline()) ? "anonymous" : kiss.session.getFirstName() + " " + kiss.session.getLastName(),

    /**
     * Get authenticated user's account id
     * Offline and in-memory environments are anonymous
     */
    getAccountId: () => (kiss.session.isOffline()) ? "anonymous" : localStorage.getItem("session-accountId"),

    /**
     * Get authenticated user's current account id
     * Offline and in-memory environments are anonymous
     */
    getCurrentAccountId: () => (kiss.session.isOffline()) ? "anonymous" : localStorage.getItem("session-currentAccountId"),

    /**
     * Get all current user's accounts he collaborates with
     */
    getCollaborators: () => {
        if (!kiss.session.isOffline()) {
            try {
                return JSON.parse(localStorage.getItem("session-isCollaboratorOf"))
            } catch (err) {}
        }
        return []
    },

    /**
     * Get all users pending invitations to collaborate
     */
    getInvitations: () => {
        if (!kiss.session.isOffline()) {
            try {
                return JSON.parse(localStorage.getItem("session-invitedBy"))
            } catch (err) {}
        }
        return []
    },

    /**
     * Tell if the authenticated user is the owner of the account
     */
    isAccountOwner: () => {
        if (kiss.session.isOffline()) return true
        return (localStorage.getItem("session-accountId") == localStorage.getItem("session-currentAccountId"))
    },

    /**
     * Tell if the authenticated user is one of the account managers
     */
    isAccountManager() {
        if (kiss.session.isOffline()) return true
        if (!kiss.session.account) return false
        return (kiss.session.account.managers || []).includes(this.getUserId())
    },

    /**
     * Initialize the account owner
     * Note: a user is always the account owner for in-memory and offline mode
     */
    initAccountOwner() {
        if (kiss.db.mode == "memory" || kiss.db.mode == "offline") {
            kiss.session.isOwner = true
        }
        else {
            kiss.session.isOwner = this.isAccountOwner()
        }
    },

    /**
     * Initialize the account managers
     * Note: a user is always an account manager for in-memory and offline mode
     */
    initAccountManagers() {
        if (kiss.db.mode == "memory" || kiss.db.mode == "offline") {
            kiss.session.isManager = true
        }
        else {
            kiss.session.isManager = this.isAccountManager()
        }
    },    

    /**
     * Hooks
     */
    hooks: {
        beforeInit: [],
        afterInit: [],
        beforeRestore: [],
        afterRestore: []
    },

    /**
     * Add a hook to perform an action before or after the session initialization
     * 
     * @param {string} event - "beforeInit" | "afterInit" | "beforeRestore" | "afterRestore"
     * @param {function} callback - Function to execute. It receives the following parameters: *beforeInit(sessionData), *afterInit(sessionData), *beforeRestore(), *afterRestore()
     * @returns this
     * 
     * @example
     * kiss.session.addHook("afterInit", function(sessionData) {
     *  console.log("The session data is...", sessionData)
     * })
     */
    addHook(event, callback) {
        if (["beforeInit", "afterInit", "beforeRestore", "afterRestore"].includes(event)) this.hooks[event].push(callback)
        return this
    },

    /**
     * Process hook
     * 
     * @private
     * @ignore
     * @param {string} event - "beforeInit" | "afterInit" | "beforeRestore" | "afterRestore"
     * @param {*} sessionData
     */
    _processHook(event, sessionData) {
        if (this.hooks[event].length != 0) {
            this.hooks[event].forEach(hook => {
                hook(sessionData)
            })
        }
    },

    /**
     * Switch the user from one account to another
     * 
     * @async
     * @param accountId
     * @returns {object} The /switchAccount response
     */
    async switchAccount(accountId) {
        // Go to home to prevent switching from an application
        kiss.router.navigateTo({
            ui: this.defaultViews.home
        })

        const data = await kiss.ajax.request({
            url: "/switchAccount",
            method: "post",
            showLoading: true,
            body: JSON.stringify({
                accountId
            })
        })

        if (!data) return
        if (data.error) return data

        if (typeof data === "object") {
            this._updateCurrentAccount(Object.assign(data, {
                accountId
            }))
        }
    },

    /**
     * Accepts an invitation from another account to collaborate
     * 
     * @ignore
     * @param {string} accountId
     * @returns {object} The /acceptInvitation response
     */
    async acceptInvitationOf(accountId) {
        const response = await kiss.ajax.request({
            url: "/acceptInvitationOf",
            method: "post",
            showLoading: true,
            body: JSON.stringify({
                accountId
            })
        })

        if (response.error) return response

        kiss.session.invitedBy.splice(kiss.session.invitedBy.indexOf(accountId), 1)
        kiss.session.isCollaboratorOf.push(accountId)

        localStorage.setItem("session-invitedBy", JSON.stringify(kiss.session.invitedBy))
        localStorage.setItem("session-isCollaboratorOf", JSON.stringify(kiss.session.isCollaboratorOf))

        createNotification({
            message: txtTitleCase("invitation accepted")
        })

        return response
    },

    /**
     * Rejects an invitation from another account to collaborate
     * 
     * @ignore
     * @param {string} accountId
     * @returns {object} The /rejectInvitation response
     */
    async rejectInvitationOf(accountId) {
        const response = await kiss.ajax.request({
            url: "/rejectInvitationOf",
            method: "post",
            showLoading: true,
            body: JSON.stringify({
                accountId
            })
        })

        if (response && response.error) return response

        kiss.session.invitedBy.splice(kiss.session.invitedBy.indexOf(kiss.session.accountId), 1)
        localStorage.setItem("session-invitedBy", JSON.stringify(kiss.session.invitedBy))

        return response
    },

    /**
     * Allow the current user to end a collaboration
     * 
     * @ignore
     * @param accountId
     * @returns {object} The /quiAccount response
     */
    async quitAccount(accountId) {
        const response = await kiss.ajax.request({
            url: "/quitAccount",
            method: "post",
            showLoading: true,
            body: JSON.stringify({
                accountId
            })
        })

        if (response.error) return response

        const {
            currentAccountChanged,
            currentAccountId,
            token,
            refreshToken,
            expiresIn
        } = response

        if (!currentAccountChanged) return response

        this.isCollaboratorOf.splice(kiss.session.isCollaboratorOf.indexOf(accountId), 1)
        localStorage.setItem("session.isCollaboratorOf", JSON.stringify(this.isCollaboratorOf))

        this._updateCurrentAccount({
            accountId: currentAccountId,
            refreshToken,
            token,
            expiresIn
        })

        kiss.router.navigateTo({
            ui: this.defaultViews.home
        })
    },

    /**
     * Update current account after a switch
     * 
     * @private
     * @ignore
     * @param {string} accountId
     * @param {string} refreshToken
     * @param {string} token
     * @param {int} expiresIn
     */
    _updateCurrentAccount({
        accountId,
        refreshToken,
        token,
        expiresIn
    }) {
        // Since token needed to be re-generated, we must update them into the session
        const expirationDate = new Date()
        expirationDate.setSeconds(expirationDate.getSeconds() + expiresIn)
        localStorage.setItem("session-refresh-token", refreshToken)
        localStorage.setItem("session-token", token)
        localStorage.setItem("session-expiration", expirationDate)
        localStorage.setItem("session-currentAccountId", accountId)

        // We want to reload for the user to get his entire UI setup for the account he switched to
        window.location.reload()
    },    

    /**
     * Attach an event to each provided download link to handle a session expiry.
     * Excludes public files from the process.
     * 
     * @ignore
     * @param {...HTMLLinkElement} links
     */
    setupDownloadLink(...links) {
        links.filter(link => !!link).forEach(link => {
            
            // Excludes public links from the process
            if (link.getAttribute("public")) return

            link.addEventListener("click", async e => {
                // According to the spec, e.currentTarget is null outside the context of the event
                // handler. Since the event handler logic don't await async handlers, thus after
                // the first await, e.currentTarget can't be accessed anymore.
                const currentTarget = e.currentTarget

                e.stopImmediatePropagation()

                if (e.isTrusted) {
                    e.preventDefault()
                    const response = await fetch(currentTarget.href, {
                        method: "head"
                    })

                    if (response.status === 498) {
                        if (!await kiss.session.getNewToken()) {
                            log("kiss.session - setupDownloadLink - Unable to get a new token", 1)
                            return
                        }
                    } else if (response.status === 401) {
                        log("kiss.session - setupDownloadLink - Unauthorized", 1)
                        return
                    }
                    // else if (response.status == 204){
	                //     createNotification({
		            //         message: txtTitleCase("Unable to download this file.")
	                //     })
					// 	return
                    // }

                    link.dispatchEvent(new MouseEvent("click"))
                }
            })
        })
    },

    /**
     * Attach an event to each provided image to handle a session expiry.
     * Excludes public files from the process.
     * 
     * @ignore
     * @param {...HTMLImageElement} imgs
     */
    setupImg(...imgs) {
        imgs.filter(img => !!img).forEach(img => {

            // Exclude public images from the process
            if (img.getAttribute("public")) return

            img.addEventListener("error", async e => {
                // According to the spec, e.currentTarget is null outside the context of the event
                // handler. Since the event handler logic don't await async handlers, thus after
                // the first await, e.currentTarget can't be accessed anymore.
                const currentTarget = e.currentTarget

                let src = currentTarget.src
                const response = await fetch(src, {
                    method: "head"
                })

                // Refresh token expired
                if (response.status === 401) {
                    kiss.session.showLogin()
                    return
                }

                if (response.status !== 498) return

                if (await kiss.session.checkTokenValidity(true)) {
                    currentTarget.src = ""
                    currentTarget.src = src
                } else {
                    kiss.session.showLogin()
                }
            })
        })
    },

    /**
     * Set the session params:
     * - token
     * - expiration date
     * - accountId
     * - user's id
     * - user's first name
     * - user's last name
     * - user's account ownership
     * 
     * @async
     * @param {object} sessionData
     */
    async init(sessionData) {
        this.observeResources()

        // Abort if there is no token
        if (!sessionData.token) return

        // Hook before the session is initialized
        await this._processHook("beforeInit", sessionData)

        sessionData.expirationDate = new Date()
        sessionData.expirationDate.setSeconds(sessionData.expirationDate.getSeconds() + sessionData.expiresIn)
        Object.assign(this, sessionData)

        // Store session params locally
        localStorage.setItem("session-token", sessionData.token)
        localStorage.setItem("session-refresh-token", sessionData.refreshToken)
        localStorage.setItem("session-expiration", sessionData.expirationDate)
        localStorage.setItem("session-userId", sessionData.userId)
        localStorage.setItem("session-firstName", sessionData.firstName)
        localStorage.setItem("session-lastName", sessionData.lastName)
        localStorage.setItem("session-accountId", sessionData.accountId)
        localStorage.setItem("session-currentAccountId", sessionData.currentAccountId)
        localStorage.setItem("session-isCollaboratorOf", JSON.stringify(sessionData.isCollaboratorOf))
        localStorage.setItem("session-invitedBy", JSON.stringify(sessionData.invitedBy))
        localStorage.setItem("session-isOwner", this.isAccountOwner())
        localStorage.setItem("session-ws.port", sessionData.ws.port)
        localStorage.setItem("session-ws.sslPort", sessionData.ws.sslPort)

        // Init the account owner & managers
        this.initAccountOwner()
        this.initAccountManagers()

        // Init or re-init websocket
        await kiss.websocket.init({
                port: this.getWebsocketPort(),
                sslPort: this.getWebsocketSSLPort()
            })
            .then(() => {
                log("kiss.session - restore - Websocket connected")
            })
            .catch(err => {
                log("kiss.session - restore - Websocket error: ", 4, err)
            })

        // Observe websocket errors
        this.observeWebsocket()

        // Observe user collaborations
        this.observeCollaborations()

        // Init activity tracker
        this.initIdleTracker()

        // Hook after the session is initialized
        await this._processHook("afterInit", sessionData)
    },

    /**
     * Restore session variables after a browser refresh
     * 
     * @async
     */
    async restore() {
        // Offline sessions don't manage any user info
        if (kiss.session.isOffline()) {
            await this._processHook("afterRestore")
            return true
        }

        // Abort if there is no token to restore
        this.token = this.getToken()
        if (!this.token) return

        // Hook before the session is restored
        await this._processHook("beforeRestore")

        // Restore session infos
        this.refreshToken = this.getRefreshToken()
        this.expirationDate = this.getExpiration()
        this.userId = this.getUserId()
        this.firstName = this.getFirstName()
        this.lastName = this.getLastName()
        this.accountId = this.getAccountId()
        this.currentAccountId = this.getCurrentAccountId()
        this.isCollaboratorOf = this.getCollaborators()
        this.invitedBy = this.getInvitations()
        this.isOwner = this.isAccountOwner()
        this.ws = {
            port: this.getWebsocketPort(),
            sslPort: this.getWebsocketSSLPort()
        }

        // Restore websocket connection
        await kiss.websocket.init({
                port: this.ws.port,
                sslPort: this.ws.sslPort
            })
            .then(() => {
                log("kiss.session - restore - Websocket connected")
            })
            .catch(err => {
                log("kiss.session - restore - Websocket error:", 4, err)
            })

        // Restore activity tracker
        this.lastActivity = this.getLastActivity()
        kiss.session.initIdleTracker()

        // Hook after the session is restored
        await this._processHook("afterRestore")
    },

    /**
     * Reset all kiss.session variables
     */
    reset() {
        const propertiesToReset = ["token", "refreshToken", "accountId", "currentAccountId", "userId", "isOwner", "firstName", "lastName", "lastActivity", "expirationDate"]
        propertiesToReset.forEach(prop => delete this[prop])

        localStorage.removeItem("session-token")
        localStorage.removeItem("session-refresh-token")
        localStorage.removeItem("session-expiration")
        localStorage.removeItem("session-userId")
        localStorage.removeItem("session-firstName")
        localStorage.removeItem("session-lastName")
        localStorage.removeItem("session-lastActivity")
        localStorage.removeItem("session-accountId")
        localStorage.removeItem("session-currentAccountId")
        localStorage.removeItem("session-isCollaboratorOf")
        localStorage.removeItem("session-invitedBy")
        localStorage.removeItem("session-isOwner")
        localStorage.removeItem("session-ws.port")
        localStorage.removeItem("session-ws.sslPort")

        // Close the websocket connection
        if (kiss.websocket.connection.readyState !== WebSocket.CLOSED) {
            kiss.websocket.close()
        }
    },

    /**
     * Initialize user idleness tracker.
     * By default, the user is considered idle if his mouse doesn't move for 30mn.
     * After that delay, the system automatically logout and clear sensitive tokens.
     * 
     * @ignore
     */
    initIdleTracker() {
        const reportActivity = () => {
            this.lastActivity = new Date()
            localStorage.setItem("session-lastActivity", new Date())
        }

        // Track mouse moves
        if (!this.idleObserver) {
            this.idleObserver = document.body.addEventListener("mousemove", kiss.tools.throttle(5 * 1000, reportActivity))
        }

        // Logout if user is idle
        setInterval(() => {
            if (kiss.session.isIddle()) {
                log("kiss.session - activity tracker - You were logged out because considered iddled", 1)
                kiss.session.logout()
            }
        }, 5000)
    },

    /**
     * Check if the user is idle (= no mouse activity for n minutes)
     */
    isIddle() {
        if ((new Date() - this.getLastActivity()) > this.maxIdleTime) return true
        return false
    },

    /**
     * Get the user's ACL.
     * 
     * @returns {string[]} Array containing all the user names and groups (32 hex id)
     * 
     * @example:
     * ["*", "bob.wilson@gmail.com", "ED7E7E4CA6F9B6D544257F54003B8F80", "3E4971CB41048BD844257FF70074D40F"]
     */
    getACL() {
        return kiss.directory.getUserACL(this.userId)
    },

    /**
     * Show the login prompt
     * 
     * @param {object} [redirecto] - Route to execute after login, following kiss.router convention. Route to the home page by default.
     * @example
     * kiss.session.showLogin({
     *  ui: "form-view",
     *  modelId: "0183b2a8-cfb4-70ec-9c14-75d215c5e635",
     *  recordId: "0183b2a8-d08a-7067-b400-c110194da391"
     * })
     */
    showLogin(redirectTo) {
        if (redirectTo) {
            kiss.context.redirectTo = redirectTo
        } else {
            kiss.context.redirectTo = {
                ui: this.defaultViews.home
            }
        }

        kiss.router.navigateTo({
            ui: this.defaultViews.login
        })
    },

    /**
     * Login the user
     * 
     * The method takes either a username/password OR a token from 3rd party services
     * 
     * @ignore
     * @param {object} login - login informations: username/password, or token
     * @param {string} login.username
     * @param {string} login.password
     * @param {string} login.token
     * @returns {boolean} false if the login failed
     */
    async login(login) {
        let data

        if (!login.token) {
            // Authentication with username / password
            data = await kiss.ajax.request({
                url: "/login",
                method: "post",
                showLoading: true,
                body: JSON.stringify({
                    username: login.username,
                    password: login.password
                })
            })
        } else {
            // Authentication with 3rd party token
            data = await kiss.ajax.request({
                url: "/verifyToken",
                method: "post",
                body: JSON.stringify({
                    token: login.token
                })
            })
        }

        // Wrong username / password
        if (!data || !data.token) return false

        // Reset the session locally with the new token issued by the server
        await kiss.session.init(data)

        // If the login was prompted because of:
        // - a session timeout (498)
        // - a forbidden route (401)
        // ... we have to resume where we aimed to go, otherwise, return true
        const currentRoute = kiss.router.getRoute()

        // If acceptInvitationOf is defined, the user clicked on a mail to accept an invitation from an account.
        if (kiss.context.acceptInvitationOf) {
            await kiss.session.acceptInvitationOf(kiss.context.acceptInvitationOf)
        }

        if (currentRoute && currentRoute.ui != this.defaultViews.login) {
            location.reload()
        } else {
            return true
        }
    },

    /**
     * Renew the current access token if needed. If token is not valid and can"t be renewed, return false
     * 
     * @async
     * @param {boolean} [autoRenew=true] If true, will try to renew the token if invalid token code (498) is received.
     * @return {Promise<boolean>}
     */
    async checkTokenValidity(autoRenew = true) {
        const resp = await fetch("/checkTokenValidity", {
            headers: {
                authorization: "Bearer " + this.getToken()
            }
        })

        if (autoRenew && resp.status === 498) return await this.getNewToken()

        return resp.status === 200
    },

    /**
     * Logout the user and redirect to the login page
     */
    logout() {
        // Reset the tokens on the server
        kiss.ajax.request({
            url: "/logout",
            method: "get"
        })

        // Close the websocket connection
        if (kiss.websocket.connection.readyState !== WebSocket.CLOSED) {
            kiss.websocket.close()
        }

        // Reset the tokens locally
        kiss.session.reset()
        document.location.reload()
    },

    /**
     * Gets a new token from the Refresh Token
     * 
     * @async
     * @returns The token, or false if it failed
     */
    async getNewToken() {
        const newToken = await kiss.ajax.request({
            url: "/refreshToken",
            method: "post",
            body: JSON.stringify({
                refreshToken: kiss.session.getRefreshToken()
            })
        })

        if (newToken) {
            await kiss.session.init(newToken)
            return newToken
        } else {
            // If the refresh token is not valid anymore, we don't want to maintain the socket connection.
            kiss.websocket.close()

            // Close all active windows except login window
            kiss.tools.closeAllWindows(["login"])
            return false
        }
    },

    /**
     * Init resource observer
     * 
     * @ignore
     */
    observeResources() {
        if (this.resourcesObserver) return

        this.resourcesObserver = new MutationObserver(mutations => {
            for (let mutation of mutations) {
                for (let addedNode of mutation.addedNodes) {
                    if (addedNode.tagName === "IMG") {
                        kiss.session.setupImg(addedNode)
                    } else if (addedNode.tagName === "A" && addedNode.hasAttribute("download")) {
                        kiss.session.setupDownloadLink(addedNode)
                    } else if (addedNode.querySelectorAll) {
                        kiss.session.setupImg(...addedNode.querySelectorAll('img'))
                        kiss.session.setupDownloadLink(...addedNode.querySelectorAll('a[download]'))
                    }
                }
            }
        })

        this.resourcesObserver.observe(document.body, {
            childList: true,
            subtree: true
        })
    },

    /**
     * Init websocket observer
     * 
     * @ignore
     */
    observeWebsocket() {
        if (this.websocketObserver) return

        // Disconnection
        kiss.pubsub.subscribe("EVT_DISCONNECTED", () => this.showWebsocketMessage("websocket disconnected"))

        // Reconnection
        kiss.pubsub.subscribe("EVT_RECONNECTED", () => {
            log("kiss.session - observeWebsocket - Socket reconnected")
            this.hideWebsocketMessage()
        })

        // Connection lost
        kiss.pubsub.subscribe("EVT_CONNECTION_LOST", () => this.showWebsocketMessage("websocket connection lost"))

        // Unusable token
        kiss.pubsub.subscribe("EVT_UNUSABLE_TOKEN", () => {
            kiss.session.reset()
            window.location.reload()
        })

        this.websocketObserver = true
    },

    /**
     * Observe collaborations
     * 
     * @ignore
     */
    observeCollaborations() {
        if (this.collaborationObserver) return

        // New collaboration
        kiss.pubsub.subscribe("EVT_COLLABORATION:RECEIVED", data => {
            this.invitedBy.push(data.accountId)
            window.localStorage.setItem("session-invitedBy", JSON.stringify(this.invitedBy))
        })

        // Collaboration deleted
        kiss.pubsub.subscribe("EVT_COLLABORATION:DELETED", (data) => {
            this._updateCurrentAccount({
                accountId: this.getAccountId(),
                token: data.token,
                refreshToken: data.refreshToken,
                expiresIn: data.expiresIn
            })

            kiss.router.navigateTo({
                ui: this.defaultViews.home
            })
        })

        this.collaborationObserver = true
    },

    /**
     * Show the websocket message
     * 
     * @ignore
     * @param {string} message
     */
    showWebsocketMessage(message) {
        if ($("websocket-message")) $("websocket-message").remove()

        createBlock({
            id: "websocket-message",
            fullscreen: true,
            background: "transparent",
            items: [{
                type: "panel",
                maxWidth: () => Math.min(kiss.screen.current.width / 2, 1000),
                header: false,
                layout: "vertical",
                align: "center",
                verticalAlign: "center",
                alignItems: "center",
                justifyContent: "center",
                items: [{
                    type: "html",
                    padding: 32,
                    html: `<div style="font-size: 18px; text-align: center;">${txtTitleCase(message)}</div>`
                }]
            }]
        }).render()
    },    

    /**
     * Hide the websocket message
     * 
     * @ignore
     */
    hideWebsocketMessage() {
        if ($("websocket-message")) $("websocket-message").remove()
    }    
}

;