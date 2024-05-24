/**
 *
 * kiss.server
 *
 */

// NPM
const http = require("http")
const https = require("https")
const cors = require("cors")
const serveStatic = require("serve-static")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const express = require("express")
const session = require("express-session")
const passport = require("passport")
const fs = require("fs")

// Custom dependencies
const config = require("../config")
const middlewares = require("../controllers/middlewares")
const filesController = require("../controllers/files")

// Routes
const authRoute = require("../routes/authentication")
const defaultRoutes = require("../routes/default")

/**
 * 
 * Create the server object
 * 
 */
const server = {

    // HTTP server
    httpServer: {},

    // HTTPS server
    httpsServer: {},

    // Express application,
    expressApp: {},

    /**
     * Promisify the default listen method
     * 
     * @async
     * @param {object} httpServer 
     * @param {number} port 
     * @param {boolean} https 
     * @returns 
     */
    async listen(httpServer, port, https = false) {
        return new Promise((resolve, reject) => {
            httpServer.listen(
                port,
                config.isBehindProxy ? '127.0.0.1' : '0.0.0.0',
                () => {
                    log.ack(`kiss.server - The ${https ? "HTTPS" : "HTTP"} server is listening on port ${port} in ${config.envName} environment`)
                    resolve()
                }
            )

            httpServer.on("error", reject)
        })
    },

    /**
     * Initialize the Express application
     * 
     * @returns {object} Express application
     */
    initExpressApplication() {
        const expressApp = server.expressApp = express()

        expressApp.use(cookieParser("107bf2d1-ee60-4f2a-9f58-8ed7edf38d62"))
        expressApp.use(bodyParser.urlencoded({
            extended: true
        }))

        // Parse json body
        expressApp.use(bodyParser.json({
            // Add rawBody to request for future use (for example, Stripe API needs rawBody)
            verify: function (req, res, buf) {
                req.rawBody = buf.toString()
            },
            // Extend limit to 50MB for DEV purpose when generating mockup data
            limit: 1024 * 1024 * 50
        }))

        // Session management
        expressApp.use(session({
            secret: config.hashingSecret,
            resave: false,
            saveUninitialized: true,
            cookie: {
                secure: true,
                maxAge: 1000 * 3600 * 24 * 7 // 1 week
            }
        }))

        // Passport initialization with our application
        expressApp.use(passport.initialize())
        expressApp.use(passport.session())

        // Enable CORS
        expressApp.use(cors())

        // Serve static files hosted in the /client, /uploads and /doc folder
        const oneMonth = 1000 * 3600 * 24 * 30
        const tenYears = oneMonth * 12 * 10

        // Access to client project files
        expressApp.use("/client", serveStatic("client", {
            maxAge: oneMonth,
            fallthrough: false
        }))

        // Access to client library modules
        expressApp.use("/kissjs", serveStatic("kissjs", {
            maxAge: oneMonth
        }))

        // Access to shared client library modules
        expressApp.use("/common", serveStatic("common", {
            maxAge: oneMonth,
            fallthrough: false
        }))

        // Access to local file uploads (if the upload strategy is "local")
        // FIXME: public files vulnerability. The chosen policy for file serving induce a false sense
        // of privacy for local file storage. Since we must be able to serve direct path or
        // by providing the path to the serveFile middleware, we need this route to be enabled.
        // But if we enable it, the serveFile restriction can be bypassed totally for local uploaded files.
        // What it means is that files locally stored in the folder "uploads" are accessible without any authentication.
        // This problem does not exist for files stored on Amazon S3.
        expressApp.use("/uploads", serveStatic("uploads", {
            immutable: true,
            maxAge: tenYears
        }))

        // Access to the API documentation
        expressApp.use("/doc", serveStatic("doc", {
            maxAge: 0
        }))

        // Allow to download a file with a given token
        // expressApp.use("/download", middlewares.downloadFile)

        // Use authentication routes
        expressApp.use("/", authRoute)

        // Remove XPoweredBy header
        expressApp.use(middlewares.removePoweredBy)

        // Enrich request infos
        expressApp.use(middlewares.addRequestInfos)

        // Verify token provided by the client (used with 3rd party auth)
        expressApp.use('/verifyToken', middlewares.verifyToken)

        // Read session cookie if any
        expressApp.use(middlewares.manageSession)

        // Read jwt token
        expressApp.use(middlewares.manageJsonWebTokens)

        // Access to files. This route is protected by manageJsonWebTokens,
        // so only logged-in users can access it.
        expressApp.use("/file", filesController.serveFile)

        // Protect access to dynamic models (models created by users)
        expressApp.use(middlewares.protectAccessToDynamicModels)

        // Define a target collection depending on the requested model
        expressApp.use(middlewares.defineTargetCollection)

        // Manage uploads
        expressApp.use("/upload", filesController.upload)

        // Choose the right controller according to the requested route
        expressApp.use(middlewares.routeToController)

        // Capture all errors that went up the middlewares chain
        expressApp.use(middlewares.errorHandling)

        return expressApp
    },

    /**
     * Import external Passport strategies
     */
    initExternalAuthStrategies() {
        if (config.authentication.google.clientID) {
            log.ack("kiss.server - Enabling Google authentication")
            require("../controllers/externalAuthentication/google")
        }
        
        if (config.authentication.AzureAd.clientID) {
            log.ack("kiss.server - Enabling Azure authentication")
            require("../controllers/externalAuthentication/azureAd")
        }

        if (config.authentication.facebook.clientID) {
            log.ack("kiss.server - Enabling Facebook authentication")
            require("../controllers/externalAuthentication/facebook")
        }

        if (config.authentication.linkedin.clientID) {
            log.ack("kiss.server - Enabling LinkedIn authentication")
            require("../controllers/externalAuthentication/linkedin")
        }
    },

    /**
     * Initializes both HTTP and HTTPS servers
     */
    async init() {
        kiss.tools.showLogo()
        kiss.tools.showSystemInfos()
        kiss.tools.showDatabaseInfos()
        kiss.tools.showStorageServiceInfos()
        kiss.tools.showHTTPServerInfos()
        kiss.tools.showWebsocketInfos()

        // Init Express app
        const expressApp = server.initExpressApplication()

        if (["insecure", "both"].includes(config.serverMode)) {
            // Creates HTTP server
            server.httpServer = http.createServer(expressApp)

            if (config.webSocketServer.server !== "uWebSocket" || !config.webSocketServer.expressCompatibility) {
                await kiss.server.listen(server.httpServer, config.httpPort, false)
            }
        }

        if (["secure", "both"].includes(config.serverMode)) {
            if (
                config.webSocketServer.server === "uWebSocket" &&
                config.webSocketServer.expressCompatibility
            ) {
                // If insecure is not initialised, we need an HTTP server for the compatibility mode.
                // It will run behind a secure proxy, so nothing to worry about.
                server.httpsServer = http.createServer(expressApp)
            } else {
                // Creates HTTPS server
                server.httpsServer = https.createServer({
                    key: fs.readFileSync(config.ssl.key),
                    cert: fs.readFileSync(config.ssl.cert)
                }, expressApp)
            }

            if (config.webSocketServer.server !== "uWebSocket" || !config.webSocketServer.expressCompatibility) {
                await kiss.server.listen(server.httpsServer, config.httpsPort, true)
            }
        }
    },

    /**
     * When the server is not yet configured, use http://localhost/init to open the setup interface
     */
    setup() {
        const ENV_FILE_PATH = "./config/.env." + config.envName
        console.log("ENV_FILE_PATH: ", ENV_FILE_PATH)

        const expressApp = express()
        expressApp.use(bodyParser.json())
        expressApp.use(cors())
        expressApp.use("/init", serveStatic("./init"))
        expressApp.use("/client", serveStatic("../client"))
        expressApp.use("/common", serveStatic("../common"))

        // Init the setup
        expressApp.get("/", (req, res) => res.redirect("/init/index.html"))

        // Get the original setup
        expressApp.get("/setup", (req, res) => {
            const config = kiss.tools.getEnvironment(ENV_FILE_PATH)
            res.send(config)
        })

        // Update the setup
        expressApp.post("/setup", (req, res) => {
            const newValues = req.body

            fs.readFile(ENV_FILE_PATH, "utf8", (err, data) => {
                if (err) return res.status(400).send({success: false, error: "Couldn't read the .env file"})

                const updatedConfig = kiss.tools.updateEnvironmentContent(data, newValues)

                fs.writeFile(ENV_FILE_PATH, updatedConfig, (err) => {
                    if (err) return res.status(400).send({success: false, error: "Couldn't update the .env file"})
                    res.status(200).send({success: true})
                })
            })
        })

        // Start http server
        server.httpServer = http.createServer(expressApp)
        kiss.server.listen(server.httpServer, 80, true)

        // Start https server
        server.httpsServer = https.createServer({
            key: fs.readFileSync(config.ssl.key),
            cert: fs.readFileSync(config.ssl.cert)
        }, expressApp)
        kiss.server.listen(server.httpsServer, 443, true)
    },

    /**
     * Stops the server gracefully
     */
    async stop() {
        if (server.httpServer instanceof http.Server) {
            server.httpServer.close()
            log.ack("kiss.server - HTTP server closed.")
        }

        // Seems weird, but perfectly right. In some modes, the httpsServer is an httpServer
        // ex: WS8SERVER=uWebSocket + WS_EXPRESS_COMPATIBILITY=1
        if (server.httpsServer instanceof https.Server || server.httpsServer instanceof http.Server) {
            server.httpsServer.close()
            log.ack("kiss.server - HTTPS server closed.")
        }
    },

    // Server router
    // - use default routes for general purpose
    // - use custom application routes if defined in kiss.routes.custom before initializing the server
    initRouter() {
        server.router = Object.assign(defaultRoutes, kiss.routes.custom || {})
    }
}

module.exports = server