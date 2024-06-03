/**
 * KissJS bootstrap
 * 
 * Use this file for your custom application settings of KissJS server:
 * - public routes
 * - custom routes and their corresponding controllers
 * - custom command routes and their corresponding controllers
 * - directories to load dynamically (all the files stored in them will be loaded)
 */
const defaultController = require("./controllers/default")

// Defines custom application routes which doesn't require authentication
// The middleware will allow access to these routes without checking the user's token
kiss.routes.public = [
    // Examples:
    // "/REST_route_1",
    // "/REST_route_2",
    // "/REST_route_3",
    // "/command/FEATURE_1",
    // "/command/FEATURE_2",
    // "/command/FEATURE_3"
]

// Define custom application REST routes and their controllers
// They will be added to general purpose routes handled by KissJS by default.
// You can also redirect your custom routes to the default REST controller using "defaultController.process".
kiss.routes.custom = {
    // Examples using default REST controller:
    plane: defaultController.process,
    flight: defaultController.process,
    invoice: defaultController.process,
    formation: defaultController.process,
    training: defaultController.process,
    exercice: defaultController.process,

    // Examples using custom controllers:
    // workspace: require("./controllers/workspace"),
    // application: require("./controllers/application")
}

// Define custom command controllers, to process your custom non-REST API operations
// You can use these commands to perform any server-side operation, like sending emails, generating PDFs, etc.
// - to add a command to the list of commands, declare the command route like this:
//      Example: /commands/yourCommandName
//      (/commands, plural form, is mandatory)
// - to call those custom routes, the client must use the "/command" prefix, then the name of the command, then the method name:
//      Example: /command/environment/get will call the "get" method of the "environment" command
//      (/command, singular form, is mandatory)
kiss.routes.commands = {
    // Examples:
    // blog: require("./commands/blog"),
    // openai: require("./commands/openai"),
    // midjourney: require("./commands/midjourney"),
    // discord: require("./commands/discord")
}

// Define directories to load dynamically
// All the files stored in these directories will be loaded by the server using "require" function
// You can customize the console message displayed when the files are loaded
kiss.resourceDirectories = [
    {
        path: "../models",
        msg: "kiss.app.models - Loaded %n static models"
    }
]

// You can also directly require any file you need in your application
// Load multi languages texts into kiss.language.texts
require("../client/core/modules/language.texts")