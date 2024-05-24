/**
 * 
 * ## Ajax operations
 * 
 * Just syntax sugar over the standard **fetch** API.
 * 
 * @namespace
 * 
 */
kiss.ajax = {
    timeout: 60000,

    // Default headers
    headers: {
        "Accept": "application/json",
        "Content-Type": "application/json; charset=UTF-8"
    },

    // If the host is set, it will be prepended to each request URL
    host: "",

    /**
     * Set the host for the requests.
     * You can use this method to set the base URL for the requests.
     * 
     * @param {string} host
     * 
     * @example
     * kiss.ajax.setHost("https://api.example.com")
     */
    setHost(host = "") {
        kiss.ajax.host = host
    },

    /**
     * Set the request headers
     * 
     * @param {object} headers
     * 
     * @example
     * kiss.ajax.setHeaders({
     *  "Accept": "application/json",
     *  "Content-Type": "application/json; charset=UTF-8"
     * })
     */
    setHeaders(headers) {
        kiss.ajax.headers = headers
    },

    /**
     * Encapsulate the Fetch API to automate:
     * - Content-Type header
     * - Authorization header (Bearer) using the Json Web Token provided by kiss.session
     * - Body parsing
     * - Timeout management (default to 60000 ms)
     * - Automatically sets the "boundary" parameter for multipart/form-data content
     * - Process HTTP error codes:
     *      . 401 redirects to login page
     *      . 403 (forbidden) sends a notification
     *      . 498 (token expired) tries to get a new token using the refresh token, and redirects to login if failed
     * 
     * @async
     * @param {object} params - A single object containing the following:
     * @param {string} params.url
     * @param {string} params.method - get, post, put, patch, delete, options - Default to get
     * @param {object} params.accept - Accept header
     * @param {object} params.contentType - Content Type header - Default to application/json; charset=UTF-8
     * @param {object} params.authorization - Authorization header
     * @param {object} params.accessControlAllowOrigin - Access Control Allow Origin
     * @param {object} params.accessControlAllowHeaders - Access Control Allow Headers
     * @param {object|string} params.body - body for post, put and patch requests
     * @param {number} params.timeout - in milliseconds. Throw an error in timeout exceeded.
     * @param {boolean} params.showLoading - If true, show the loading spinner while loading - Default to false
     * @returns Request's result, or false if it failed
     * 
     * @example
     * // Posting with simple JSON:
     * kiss.ajax.request({
     *      url: YOUR_URL,
     *      method: "post",
     *      accept: "application/json",
     *      contentType: "application/json; charset=UTF-8",
     *      body: JSON.stringify({
     *          foo: "bar",
     *          hello: "world"
     *      }),
     *      timeout: 500
     * })
     * .then(data => {
     *      console.log(data)
     * })
     * .catch(err => {
     *      console.log(err)
     * })
     * 
     * // Posting with basic authentication and application/x-www-form-urlencoded:
     * kiss.ajax.request({
     *      url: YOUR_URL,
     *      method: "post",
     *      contentType: "application/x-www-form-urlencoded; charset=UTF-8",
     *      authorization: "Basic " + btoa(YOUR_LOGIN + ":" + YOUR_PASSWORD),
     *      body: "foo=bar&hello=world"
     * })
     */
    async request(params) {
        log(`kiss.ajax - request - ${params.method || "GET"}: ${params.url}`)

        let options = {
            method: params?.method?.toUpperCase() || "GET",
            headers: kiss.ajax.headers
        }

        // Restore websocket if it's not alive anymore
        //kiss.websocket.init()

        // Inject authorization header with the active token
        // kissjs keeps the token in the localStorage until a logout is triggered
        const token = kiss.session.getToken()
        if (token) options.headers["Authorization"] = "Bearer " + token

        if (params.accept) options.headers["Accept"] = params.accept
        if (params.authorization) options.headers["Authorization"] = params.authorization
        if (params.accessControlAllowOrigin) options.headers["Access-Control-Allow-Origin"] = params.accessControlAllowOrigin
        if (params.accessControlAllowHeaders) options.headers["Access-Control-Allow-Headers"] = params.accessControlAllowHeaders
        if (params.body) options.body = params.body

        // Adjust content type
        if (params.contentType) {
            if (params.contentType == "multipart/form-data") {
                // For multipart/form-data, we delete the content type to force the browser
                // to infer the content type and set the "boundary" paramater automatically
                delete options.headers["Content-Type"]
            } else {
                options.headers["Content-Type"] = params.contentType
            }
        } else {
            // Default to application/json and UTF-8 encoding
            options.headers["Content-Type"] = "application/json; charset=UTF-8"
        }

        // Manage timeout
        const timeout = params.timeout || kiss.ajax.timeout
        const abortController = new AbortController()
        options.signal = abortController.signal
        setTimeout(() => abortController.abort(), timeout)

        let loadingId
        if (params.showLoading) {
            loadingId = kiss.loadingSpinner.show()
        }

        return fetch(kiss.ajax.host + params.url, options)
            .then(async response => {

                if (params.showLoading) {
                    loadingId = kiss.loadingSpinner.hide(loadingId)
                }
        
                switch (response.status) {
                    case 401:
                        // Unauthorized requests are redirected to the login page
                        kiss.session.showLogin()
                        return false

                    case 498:
                        // Prevent loops for invalid tokens
                        if (kiss.global.ajaxRetries >= kiss.global.ajaxMaxRetries) {
                            kiss.global.ajaxRetries = 0
                            return false
                        }
                        kiss.global.ajaxRetries++

                        // Means the token to request the server is expired.
                        // Sends a request to refresh the token
                        const newToken = await kiss.session.getNewToken()

                        if (newToken) {
                            // Retry the original request
                            return await kiss.ajax.request(params)
                        }
                        break

                    case 403:
                        // Means the access to the resource is forbidden
                        createNotification(txtTitleCase("#not authorized"))

                    default:
                        return response.json().then(data => {
                            return data
                        }).catch(err => {
                            // The response is not JSON
                            return response
                        })
                }
            })
            .catch(err => {
                if (err.name == "AbortError") {
                    log("kiss.ajax - request - Timeout!", 4, err)
                    createNotification(txtTitleCase("#error slow connection"))
                } else {
                    log("kiss.ajax - request - Error:", 4, err)
                    log("kiss.ajax - The original request was:", 4, params)
                }

                if (params.showLoading) {
                    loadingId = kiss.loadingSpinner.hide(loadingId)
                }
                                
                return false
            })
    },

    /**
     * Adjust the request timeout
     * 
     * @param {number} timeout - in milliseconds
     */
    setTimeout(timeout) {
        if (typeof timeout === "number") kiss.ajax.timeout = timeout
    }
}

;