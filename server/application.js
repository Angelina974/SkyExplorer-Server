/**
 * 
 * KissJS application
 * 
 * Used to start and stop all the server services:
 * - HTTP and/or HTTPS servers
 * - WebSocket ws and wss servers
 * - Database connection
 * - SMTP
 * - Workers
 * - Models
 * - Relationships between models
 * - Dynamic links
 * - Directory (accounts, users, groups)
 * - API client tokens
 * - Session cleaner
 * - Errors reporting
 * - External auth strategies
 * - Interactive console
 * 
 */
const {
    EXIT_CODES
} = require("./errors/constants")

const config = require("./config")

// Used to avoid calling several times the stop process
let stopping = false 

const application = {

	init: async ({interactive}) => {

		// Check if the .env file requires a setup
		if (config.setup == "true") {
			console.log("kiss.server - Initializing setup...")
			kiss.server.setup()
			console.log("kiss.server - Please open http://localhost in your browser to complete the setup process.")
			return 
		}

		let timer = performance.now()

		//
		// ERRORS
		//
		await kiss.errors.reporting.init()
		await kiss.errors.reporting.start()

		//
		// DATABASE
		//
		try {
			await kiss.databaseConnection.init()
			log.ack("kiss.server - Database connection initialised")

		} catch (err) {
			log.err("kiss.server - Database connection initialisation failure: ", err)
			process.exit(EXIT_CODES.DB_CONNECTION_FAILURE)
		}

		//
		// HTTP and/or HTTPS
		//
		try {
			kiss.server.initRouter()
			await kiss.server.init()

		} catch (err) {
			log.err("kiss.server - HTTP initialisation failure: ", err)
			process.exit(EXIT_CODES.HTTP_INIT_FAILURE)
		}

		//
		// WEBSOCKET
		//
		try {
			await kiss.websocket.init()

		} catch (err) {
			log.err("kiss.server - WebSocket initialisation failure: ", err)
			process.exit(EXIT_CODES.WEBSOCKET_INIT_FAILURE)
		}

		//
		// SMTP
		//
		kiss.smtp.init()

		//
		// WORKERS
		//
		kiss.workers.init(3600)

		//
		// DYNAMIC MODELS
		//
		try {
			await kiss.app.loadDynamicModels()

		} catch (err) {
			log.err("kiss.server - An error occurred while loading dynamics models", err)
			process.exit(EXIT_CODES.DYNAMIC_RESSOURCE_LOADING_FAILURE)
		}

		//
		// RELATIONSHIPS BETWEEN MODELS
		//
		try {
			await kiss.app.defineModelRelationships()

		} catch (err) {
			log.err("kiss.server - Could not establish relationships between models", err)
			process.exit(EXIT_CODES.CACHE_BUILDING_FAILURE)
		}

		//
		// DIRECTORY (ACCOUNTS & USERS & GROUPS)
		//
		try {
			await kiss.directory.init()

		} catch (err) {
			log.err("kiss.server - An error occurred while loading users and groups in cache", err)
			process.exit(EXIT_CODES.CACHE_BUILDING_FAILURE)
		}		

		//
		// API CLIENT TOKENS
		//
		try {
			await kiss.app.loadApiClientTokens()

		} catch (err) {
			log.err("kiss.server - An error occurred while loading API client tokens in cache", err)
			process.exit(EXIT_CODES.CACHE_BUILDING_FAILURE)
		}

		//
		// DYNAMIC LINKS
		//
		try {
			await kiss.app.loadDynamicLinks()

		} catch (err) {
			log.err("kiss.server - An error occurred while loading dynamics links", err)
			process.exit(EXIT_CODES.DYNAMIC_RESSOURCE_LOADING_FAILURE)
		}

		//
		// SESSION CLEANER
		//
		try {
			await kiss.session.init()

		} catch (err) {
			log.err("kiss.server - Unable to start session cleaner:", err)
		}

		log.info(`kiss.server - Started in ${Math.round(performance.now() - timer)}ms`)

		//
		// EXTERNAL AUTH STRATEGIES
		//
		try {
			kiss.server.initExternalAuthStrategies()
		}
		catch(err) {
			log.err("kiss.server - Unable to initialize external authentication strategies:", err)
		}

		//
		// INIT INTERACTIVE CONSOLE (not suitable for production environments)
		//
		if (interactive) {
			try {
				kiss.app.initInteractiveMode()
			}
			catch(err) {
				log.err("kiss.server - Unable to initialize interactive console:", err)
			}
		}
	},

	/**
	 * Try to gracefully stop the current server
	 * 
	 * @return {Promise<void>}
	 */
	async stop() {

		if (stopping) {
			log("kiss.server - Already stopping, please wait...")
			return;
		}

		log("kiss.server - Server entering stopping state...")

		stopping = true

		// We stop receiving messages to be able to clean up nodejs event loop
		try {
			await kiss.websocket.stop()
			log.ack("kiss.server - WebSocket ports unbound")

		} catch (err) {
			log.err("kiss.server - Unable to unbind WebSocket ports", err)
		}

		try {
			await kiss.server.stop()
			log.ack(`kiss.server - HTTP ports unbound`)

		} catch (err) {
			log.err(`kiss.server - Unable to unbind HTTP ports`, err)
		}

		kiss.workers.stop()
		log.ack("kiss.server - Workers stopped")

		try {
			kiss.session.stop()
			log.ack(`kiss.server - Session cleaner stopped`)
			
		} catch (err) {
			log.err(`kiss.server - Unable to close session cleaner properly:`, err)
		}

		// Closing DB connection when terminated
		try {
			await kiss.db.stop()
			log.ack("kiss.server - Database connection closed")

		} catch (err) {
			log.err("kiss.server - Unable to close database connection properly: ", err)
		}

		await kiss.errors.reporting.stop()
		log.ack("kiss.server - Errors reporting stopped")

		// Closing smtp transport, only after the reporting service since it may need the smtp transport to be open.
		try {
			await kiss.smtp.stop()
			log.ack("kiss.server - SMTP transport properly closed")

		} catch (err) {
			log.err("kiss.server - Unable to close SMTP transport properly: ", err)
		}

		log.ack("kiss.server - Gracefully stopped")

		// Force buffer flush into console before terminating.
		// Otherwise, some lines may be printed AFTER the main process took over control
		process.stdout.write("Done.")
	}
}

module.exports = application