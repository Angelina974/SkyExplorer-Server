/**
 * Start KissJS server
 * 
 * use "npm run <environment-name>"
 * 
 * @example:
 * npm run local
 * npm run production
 */

// KissJS main library modules
require("./kiss")

// KissJS configuration
const config = require("./config")

// KissJS isomorphic modules (client/server)
kiss.loader.loadDirectory("../../common")

// KissJS main application
const application = require("./application")

// Load custom application parameters that are defined in the bootstrap file
require("./loader")

// High level error management
const processGlobalHandlers = require("./errors/globalErrorsHandler")
for (let event in processGlobalHandlers.handlers) {
	process.on(event, processGlobalHandlers.handlers[event])
}

// Init the application inside the global error handler.
// Errors will be caught and logged by the global error handler
processGlobalHandlers.init(application);

// Observe server close signals
["SIGINT", "SIGUSR2", "SIGTERM"].forEach(signal => {
	process.on(signal, async (sig) => {
		log(`kiss.server - Close signal ${sig} received.`)
		await application.stop()
	})
})

// Launch application
application.init({
	interactive: false
})