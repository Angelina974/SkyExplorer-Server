/**
 * 
 * KissJS server
 * 
 * KissJS is a fullstack framework for Node.js, with a focus on simplicity and performances.
 * 
 * WEB:
 * - http/s server
 * - websocket server for realtime communication
 * 
 * AUTHENTICATION & AUTHORIZATION:
 * - unified authentication for http and websocket
 * - accounts & users & groups management
 * - ready for SaaS applications with multi-tenancy
 * - local authentication with email & password
 * - external authentication (Google, Facebook, Twitter, LinkedIn)
 * - JWT tokens & refresh management
 * - API client tokens
 * - Model-based ACL (Access Control List) working with users and groups
 * - Fully customizable ACL based on permissions (create, read, doThis, doThat) and validators
 * 
 * DATABASE:
 * - database connection, using native driver for MongoDb
 * - free JSON REST API for schemaless data (called "dynamic models" in KissJS)
 * - NxN relationship management between tables
 * - NxN relations stored in "link" records
 * - cache for links records, which are heavily accessed to simulate joints
 * 
 * FILES:
 * - local upload
 * - AWS S3 upload:
 * 	- private files served through the server
 * 	- public files served directly from S3
 * 
 * EXTRA FEATURES:
 * - smtp server
 * - texts & translations
 * - workers for heavy tasks
 * - logger with levels and categories
 * - error handling & reporting
 * - clean server stop
 */

global.KISSJS =
`

░███    ███   ███                       ░░███   ████████
░███   ███░   ░░░                       ░░███  ███░░░░░██
░███  ███░    ███   █████   █████        ░███ ░███    ░░░
░███████░    ░███  ███░░   ███░░         ░███ ░░█████████
░███░░███    ░███ ░░█████ ░░█████        ░███  ░░░░░░░░███
░███ ░░███   ░███  ░░░░███ ░░░░███ ███   ░███  ███    ░███
░████ ░░████ ░███  ██████  ██████ ░░████████  ░░█████████
░░░░   ░░░░ ░░░░░ ░░░░░░  ░░░░░░   ░░░░░░░░    ░░░░░░░░░        

`

const config = require("./config")

kiss = {
    // Flag to tell isomorphic code we're on the server side
    isServer: true,

    // kiss modules
    data: {},
    cache: {},
    global: {
        tokens: {}
    },
    formula: {},
    templates: {},
    app: require("./core/app"),
    acl: require("./core/acl"),
    smtp: require("./core/smtp"),
    tools: require("./core/tools"),
    server: require("./core/server"),
	loader: require("./core/loader"),
    logger: require("./core/logger"),
	workers: require("./core/workers"),
	session: require("./core/session"),
    txtFiles: require("./core/txtfiles"),
    language: require("./core/language"),
    websocket: require(`./websocket/${config.webSocketServer.server}`),
    directory: require("./core/directory"),
    fileStorage: require("./core/fileStorage"),

    // Routes customizations
    routes: {
        public: [], // Routes that don't require authentication
        custom: {}, // Custom routes
        commands: {}, // Custom command routes
    },

    // Resource directories to load dynamically at startup
    resourceDirectories: [],

    // Utility classes/functions for formulas
    lib: {
        formula: {},
    },

	// Database
	db: require(`./database/${config.db.type}`),
    databaseConnection: require(`./database/${config.db.type}Connection`),
	databaseFilters: require(`./database/${config.db.type}Filters`),
	databaseSanitizer: require(`./database/${config.db.type}Sanitizer`),

	// Errors manager
	errors: {
		reporting: require(`./errors/reporting`)
	},

    /**
     * Add client/server shared methods to a specific kissJS module
     * 
     * @param {string} moduleName
     * @param {object} methods
     * 
     * @example
     * kiss.addToModule("tools", {
     *  sayHello: function() {
     *      console.log("Hello")
     *  },
     *  sayGoodbye: () => console.log("Goodbye!")
     * })
     * 
     * kiss.tools.sayHello() // "Hello"
     * kiss.tools.sayGoodbye() // "Goodbye"
     *  
     */
    addToModule: function(moduleName, methods) {
        log.ack("kiss - Loading module into kiss: " + moduleName)
        Object.assign(kiss[moduleName], methods)
    }
}