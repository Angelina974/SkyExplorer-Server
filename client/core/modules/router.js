/**
 * 
 * ## A simple client router
 * 
 * It also works with local files paths (file:///)
 * 
 * - Initialize the router at application startup using: router.init(setup)
 * - Trigger a new route using: kiss.router.navigateTo(newRoute)
 * - The router also observes url hash changes and automatically triggers new routes accordingly
 * 
 * When initializing the router, you can optionally define what to do:
 * - before a routing event occurs, using "beforeRouting" callback
 * - after the routing event occurred, using "afterRouting" callback
 * 
 * ```
 * // 1) Init your app router:
 * kiss.router.init({
 *  beforeRouting: async () => { await doStuff() },
 *  afterRouting: async () => { await doOtherStuff() }
 * })
 * 
 * // 2) Use it to change your application route:
 * const newApplicationRoute = {ui: "homepage", applicationId: "123", viewId: "456"}
 * kiss.router.navigateTo(newApplicationRoute)
 * 
 * // 3) Get the current application route by reading the url hash:
 * const currentApplicationRoute = kiss.router.getRoute()
 * ```
 * 
 * @namespace
 * 
 */
kiss.router = {
    /**
     * Default list of public routes which doesn't require authentication.
     * 
     * Add custom public routes using addPublicRoutes([...]) method.
     * 
     * By default, the following routes are public:
     * - authentication-login
     * - authentication-register
     * - authentication-reset-password
     * - authentication-error
     */
    publicRoutes: [
        "authentication-login",
        "authentication-register",
        "authentication-reset-password",
        "authentication-error"
    ],

    /**
     * Init the router
     * 
     * It will observe any url hash change, which will:
     * - perform a custom action before triggering the new route
     * - perform a custom action after the routing
     * 
     * @param {object} setup - The router setup, containing the 2 methods:
     * @param {string[]} [setup.publicRoutes] - Define public routes (skip login)
     * @param {function} [setup.beforeRouting] - Method to execute before routing
     * @param {function} [setup.afterRouting] - Method to execute after routing
     */
    init(setup = {}) {
        // Setup the router
        if (setup.beforeRouting) Object.assign(kiss.router.hooks, {
            beforeRouting: setup.beforeRouting
        })
        
        if (setup.afterRouting) Object.assign(kiss.router.hooks, {
            afterRouting: setup.afterRouting
        })

        if (setup.publicRoutes) kiss.router.publicRoutes = setup.publicRoutes

        // Observe hash changes
        window.onhashchange = async function () {

            // Update the application context
            const newRoute = kiss.router.getRoute()
            kiss.context.update(newRoute)

            // Do something after the hash has changed
            if (kiss.router.hooks.afterRouting) await kiss.router.hooks.afterRouting()
        }
    },

    /**
     * Set the public routes
     *  
     * @param {string[]} publicRoutes
     */
    setPublicRoutes(publicRoutes) {
        kiss.router.publicRoutes = publicRoutes
    },

    /**
     * Add some public routes
     *  
     * @param {string[]} publicRoutes
     */
    addPublicRoutes(publicRoutes) {
        kiss.router.publicRoutes = kiss.router.publicRoutes.concat(publicRoutes)
    },    

    /**
     * Check if the current route (given by the ui parameter) is public
     * 
     * @returns {boolean}
     */
    isPublicRoute() {
        const currentRoute = kiss.router.getRoute().ui
        if (!currentRoute) return false
        return kiss.router.publicRoutes.includes(currentRoute)
    },

    /**
     * Navigate to a new hash
     * It indirectly triggers the new route by dispatching the window's *hashchange* event.
     * 
     * @param {object|string} newRoute
     * @param {boolean} [reset] - Set to true to reset the previous route before routing to a new one
     * 
     * @example
     * // Using an object
     * const newRoute = {ui: "homepage", applicationId: "123", viewId: "456"}
     * kiss.router.navigateTo(newRoute)
     * 
     * // Using a string
     * kiss.router.navigateTo("home-start") // Is equivalent to: kiss.router.navigateTo({ui: "home-start"})
     */
    async navigateTo(newRoute, reset) {
        if (typeof newRoute === "string") newRoute = {
            ui: newRoute
        }
        kiss.router.updateUrlHash(newRoute, reset)

        // Perform action before routing
        // The routing can be interrupted if the method beforeRouting returns false
        // For example: checking the session...
        if (kiss.router.hooks.beforeRouting) {
            const doRoute = await kiss.router.hooks.beforeRouting(newRoute)
            if (!doRoute) return
        }

        // Propagate the hash change
        window.dispatchEvent(new HashChangeEvent("hashchange"))
    },

    /**
     * Get the current application route from the url hash.
     * 
     * For example:
     * - if current url is: http://.../...#ui=homepage&applicationId=123&viewId=456
     * - the output is: {ui: "homepage", applicationId: "123", viewId: "456"}
     * 
     * @returns {object}
     */
    getRoute() {
        return kiss.router._toRoute(window.location.hash.slice(1))
    },

    /**
     * Update URL hash according to new route params.
     * 
     * @param {object} newRoute 
     * @param {boolean} [reset] - True to reset the current hash
     * 
     * @example
     * kiss.router.updateUrlHash({chapter: 10, section: 2}, true)
     */
    updateUrlHash(newRoute, reset) {
        const currentRoute = kiss.router.getRoute()
        const toRoute = (reset) ? newRoute : Object.assign(currentRoute, newRoute)
        const newHash = "#" + kiss.router._toHash(toRoute)
        window.history.pushState(toRoute, toRoute.ui, newHash)
    },

    /**
     * Convert a url hash into an application route object.
     * 
     * For example:
     * input: http://.../...#ui=homepage&applicationId=123&viewId=456
     * output: {ui: "homepage", applicationId: "123", viewId: "456"}
     * 
     * @private
     * @ignore
     * @param {string} hash 
     * @returns {object} Object containing the application route
     */
    _toRoute(hash) {
        const route = {}
        hash.split("&").forEach(param => {
            const paramName = param.split("=")[0]
            if (paramName) route[paramName] = param.split("=")[1]
        })
        return route
    },

    /**
     * Convert an application route into an url hash
     * 
     * @private
     * @ignore
     * @param {object} newRoute - The application route
     * @returns {string} An url hash
     * 
     * @example
     * kiss.router._toHash({ui: "homepage", applicationId: "123", viewId: "456"})
     * // URL hash will be: ui=homepage&applicationId=123&viewId=456
     */
    _toHash(newRoute) {
        const hash = []
        Object.keys(newRoute).forEach(key => (newRoute[key]) ? hash.push(key + "=" + newRoute[key]) : "")
        return hash.join("&")
    },

    /**
     * Hooks to modify the router behavior before and after routing
     */
    hooks: {
        /**
         * Default action performed *before* routing.
         * By default, it checks if the application required elements are properly loaded.
         * 
         * @ignore
         * @param {object} newRoute - Intended application route
         * @returns {promise} Resolve to false if the routing must be interrupted for any reason
         */
        beforeRouting: async (newRoute) => {
            // Always authorize public routes / views, if any
            if (kiss.router.publicRoutes && newRoute.ui) {
                if (kiss.router.publicRoutes.indexOf(newRoute.ui) != -1) return true
            }

            // Block routing if the app is not properly loaded
            if (kiss.app.load && !kiss.app.isLoaded) {
                const isLoaded = await kiss.app.load()
                if (!isLoaded) return false
            }

            return true
        },

        /**
         * Default action performed *after* routing.
         * By default, it checks the new application route and displays a new view according to the *ui* parameter.
         * It can display multiple views simultaneously, using multiple parameters starting with "ui".
         * 
         * @ignore
         */
        afterRouting: async () => {
            const newRoute = kiss.router.getRoute()

            // Display a new main view if there is a *ui* parameter
            // (the main view is exclusive to other views in the same container)
            if (newRoute.ui) await kiss.views.show(newRoute.ui, null, true)

            // Display other views using all parameters starting with "ui" (ui1, ui2, uiMap, uiAccount, etc...)
            // This allows, for example, to open secondary windows / popup / information messages...
            for (let route of Object.keys(newRoute)) {
                if (route.startsWith("ui") && route != "ui") await kiss.views.show(newRoute[route])
            }

            // Publish the new route
            kiss.pubsub.publish("EVT_ROUTE_UPDATED", newRoute)
        }
    }    
}

;