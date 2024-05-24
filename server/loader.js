/**
 * Load directories dynamically
 * 
 * The directories to load at startup are defined by the global variable:
 * kiss.resourceDirectories
 * 
 * For each directory to load, use: Object<path: string, loadMessage: string>
 * To add the number of loaded files in the log message, just use %n as placeholder.
 * 
 * @example
 * kiss.resourceDirectories = [{
 *      path: "../common",
 *      msg: "kiss.modules.shared - Client/server shared code - loaded %n modules"
 *  },
 *  {
 *      path: "../../client/pickaform/models",
 *      msg: "kiss.application.models - Loaded %n static models"
 *  },
 *  {
 *      path: "../../client/pickaform/resources/templates/applications/",
 *      msg: "kiss.application.templates - Loaded %n blueprints"
 * }]
 */
const {
    EXIT_CODES
} = require("./errors/constants")

// Load custom application parameters that are defined in the bootstrap file
const config = require("./config")
if (config.bootstrapFile) {
	require(config.bootstrapFile)
}

// Call require on each directory to load
kiss.resourceDirectories.forEach(directory => {
    const path = directory.path
    const msg = directory.msg
    if (!path) return

    try {
        const numberOfLoadedFiles = kiss.loader.loadDirectory(path)
        if (msg) log.ack(msg.replaceAll("%n", numberOfLoadedFiles))

    } catch (err) {
        log.err(`Error while loading required modules under ${path}:`, err)
        process.exit(EXIT_CODES.STATIC_RESSOURCE_LOADING_FAILURE)
    }
})