/**
 * 
 * KissJS stands for **K**eep **I**t **S**imple **S**tupid **J**ava**S**cript
 * 
 * It's a simple javascript library to build web applications.
 * It includes:
 * - out-of-the-box [UI components](../../index.html#ui=start&section=components&anchor=Introduction%20about%20KissJS%20components)
 * - [powerful datatable](../../index.html#ui=start&section=datatables&anchor=Introduction%20about%20KissJS%20datatables) with high performances when the number of records is heavy (> 10 000)
 * - bonus stuff that you can use (or not)
 * 
 * Bonus stuff includes:
 * - **view manager**, if you want to use KissJS not only for its UI Components, but also to build a complete application with multiple views
 * - **client router** which works 100% offline (even with file:/// paths)
 * - **pubsub** which is at the heart of the components reactivity
 * - **NoSQL database wrapper** which allows to work in memory, offline, or online
 * - **NoSQL data layer** to manage Models, Collections, Records, and automate the updates when records have relationships
 * 
 * A few recommandations:
 * - don't try to explore the API documentation directly: it's boring and uninteresting
 * - you'd rather [jump to the guide](../../index.html#ui=landing-page) which contains a few easy step by step tutorials
 * 
 * Here is an overview of what it provides:
 * 
 * <img src="../../resources/doc/KissJS - Overview.png">
 * 
 * KissJS library consist of **a single global object** that you can explore in the console at startup, or after, using **console.log(kiss)**:
 * 
 * <img src="../../resources/doc/KissJS - Global object.png">
 * 
 * @namespace
 */
const kiss = {

    $KissJS: "KissJS - Keep It Simple Stupid Javascript",

    // Build number
    version: 3750,

    // Tell isomorphic code we're on the client side
    isClient: true,

    /**
     * Reserved namespaces for kiss modules
     * 
     * @ignore
     */
    db: {},
    ux: {},
    doc: {},
    app: {},
    acl: {},
    ajax: {},
    cache: {},
    tools: {},
    views: {},
    theme: {},
    global: {},
    screen: {},
    router: {},
    loader: {},
    pubsub: {},
    plugins: {},
    context: {},
    session: {},
    formula: {},
    undoRedo: {},
    webfonts: {},
    language: {},
    directory: {},
    selection: {},
    templates: {},
    websocket: {},
    loadingSpinner: {},

    // Utility classes/functions that are defined in their own files
    lib: {
        formula: {},
    },

    /**
     * Add client/server shared methods to a specific kiss module
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
     */
    addToModule(moduleName, methods) {
        // console.log("kiss - Loading module into kiss: " + moduleName)
        Object.assign(kiss[moduleName], methods)
    },

    /**
     * KissJS ui layer is the heart and the initial purpose of the library.
     * It provides built-in UI components, which consists of:
     * 
     * ### Containers
     * - [kiss.ui.Block](kiss.ui.Block.html): basic container
     * - [kiss.ui.Panel](kiss.ui.Panel.html): container with a header and other properties that allow to create standard draggable windows and modal windows
     * - [kiss.ui.WizardPanel](kiss.ui.WizardPanel.html): panel where items are displayed one at a time (each wizard page) with helper buttons (next, previous) to navigate through the pages
     * 
     * ### Elements
     * - [kiss.ui.Button](kiss.ui.Button.html): standard clickable button with an icon
     * - [kiss.ui.Dialog](kiss.ui.Dialog.html): modal dialog box
     * - [kiss.ui.Html](kiss.ui.Html.html): component to insert html
     * - [kiss.ui.Image](kiss.ui.Image.html): component to insert an image
     * - [kiss.ui.Menu](kiss.ui.Menu.html): menu of clickable items with icons
     * - [kiss.ui.Notification](kiss.ui.Notification.html): notification which disappears automatically (toast message)
     * - [kiss.ui.Spacer](kiss.ui.Spacer.html): simple empty element used as a spacer in the layout
     * - [kiss.ui.Tip](kiss.ui.Tip.html): tip that follows the mouse cursor
     * 
     * ### Data components
     * - [kiss.ui.Datatable](kiss.ui.Datatable.html): powerful datatable
     * - [kiss.ui.Calendar](kiss.ui.Calendar.html): simple calendar
     * - [kiss.ui.Kanban](kiss.ui.Kanban.html): nice kanban with standard view setup (sort, filter, group, fields)
     * - [kiss.ui.Timeline](kiss.ui.Timeline.html): powerful timeline with standard view setup (sort, filter, group, fields) + options like color, period, and more
     * 
     * ### Fields
     * - [kiss.ui.Field](kiss.ui.Field.html): text, textarea, number, date or time fields
     * - [kiss.ui.Checkbox](kiss.ui.Checkbox.html): checkbox with multiple design options
     * - [kiss.ui.Select](kiss.ui.Select.html): highly flexible field to select one or more options into a dropdown list
     * - [kiss.ui.Attachment](kiss.ui.Attachment.html): widget to manage file attachments
     * - [kiss.ui.Color](kiss.ui.Color.html): field to select a color
     * - [kiss.ui.ColorPicker](kiss.ui.ColorPicker.html): widget to pick a color
     * - [kiss.ui.Icon](kiss.ui.Icon.html): field to select an icon
     * - [kiss.ui.IconPicker](kiss.ui.IconPicker.html): widget to pick an icon
     * - [kiss.ui.Slider](kiss.ui.Slider.html): slider widget to select a number value
     * - [kiss.ui.Rating](kiss.ui.Rating.html): widget used for ranking and notation
     * 
     * 
     * **The ui layer is a work in progress and might change rapidly according to new project requirements.**
     * 
     * @namespace
     */
    ui: {},

    /**
     * KissJS ux is a set of user extensions that are too "project specific" to be in the core ui library.
     * It constantly evolves with new projects and requirements, and currently consists of:
     * 
     * ### Fields
     * - [kiss.ux.AiTextarea](kiss.ux.AiTextarea.html): a paragraph field connected to OpenAI to generate content | Used in pickaform project
     * - [kiss.ux.AiImage](kiss.ux.AiImage.html): an attachment field connected to OpenAI to generate Dall-E images | Used in pickaform project
     * - [kiss.ux.CodeEditor](kiss.ux.CodeEditor.html): a field to write code, embedding the famous Ace Editor | Used in pickaform project
     * - [kiss.ux.Directory](kiss.ux.Directory.html): a field to select people from the address book | Used in pickaform project
     * - [kiss.ux.Link](kiss.ux.Link.html): a link to connect records together and build relations in a NoSQL context | Used in pickaform project
     * - [kiss.ux.SelectViewColumn](kiss.ux.SelectViewColumn.html): dropdown list that allows to select values extracted from a datatable column | Used in pickaform project
     * - [kiss.ux.SelectViewColumns](kiss.ux.SelectViewColumns.html): field the allows to select a record in a view, and assign values to multiple fields at once | Used in pickaform project
     * 
     * ### Elements
     * - [kiss.ux.QrCode](kiss.ux.QrCode.html): a widget to display a QRCode | Used in pickaform project
     * - [kiss.ux.Booking](kiss.ux.Booking.html): an experimental widget to shows a timeline from a start date to an end date.
     * 
     * @namespace
     */
    ux: {},

    /**
     * KissJS data layer provides a way to manage data locally and to proxy data from a KissJS server (or a REST server). It consists of:
     * - [kiss.data.Model](kiss.data.Model.html): to define your models
     * - [kiss.data.Collection](kiss.data.Collection.html): to store data according to your models
     * - [kiss.data.Record](kiss.data.RecordFactory-Record.html): to manipulate instances
     * - [kiss.data.Transaction](kiss.data.Transaction.html): to perform batch updates over multiple collections and multiple records
     * 
     * **The data layer is a work in progress and might change rapidly according to new project requirements.**
     * 
     * @namespace
     */
    data: {
        /**
         * See [Model documentation](kiss.data.Model.html).
         * 
         * @ignore
         */
        Model: {},

        /**
         * See [Collection documentation](kiss.data.Collection.html).
         * 
         * @ignore
         */
        Collection: {},

        /**
         * See [Record documentation](kiss.data.RecordFactory-Record.html).
         * 
         * @ignore
         */
        Record: {},

        /**
         * See [Transaction documentation](kiss.data.Transaction.html).
         * 
         * @ignore
         */
        Transaction: {},

        /**
         * See [trash documentation](kiss.data.trash.html).
         * 
         * @ignore
         */
        trash: {},

        /**
         * Add a method to all models
         * 
         * This method is useful to plug a method to all records after they are already instanciated.
         * 
         * A typical use case is when a plugin needs to add a global feature to all records.
         * We can call this method in the plugin initialization.
         * 
         * @param {string} methodName 
         * @param {function} method
         * 
         * @example
         * kiss.data.addMethodToAllModels("getFields", function() {
         *  return Object.keys(this).join(", ")
         * })
         * 
         * console.log(myRecord.getFields()) // "firstName, lastName, birthDate"
         * 
         */
        addMethodToAllModels(methodName, method) {
            Object.values(kiss.data.Record).forEach(recordClass => {
                recordClass.prototype[methodName] = method
            })
        },

        /**
         * Add a property to all models
         * 
         * This method is useful to plug a property to all records after they are already instanciated.
         * 
         * A typical use case is when a plugin needs to add a global feature to all records.
         * We can call this method in the plugin initialization.
         * 
         * @param {string} propertyName 
         * @param {function} getter - The getter function, which receives the instanciated record as input parameter
         * 
         * @example
         * // To add a property
         * kiss.data.addPropertyToAllModels("WORKFLOW_STEP", function(record) {
         *  return kiss.global.workflowSteps[record["workflow-stepId"]]
         * })
         * 
         * console.log(myRecord.WORKFLOW_STEP) // "Analysis"
         * 
         * // To add a property which has methods
         * kiss.data.addPropertyToAllModels("workflow", function(record) {
         *  return {
         *      start: function() {
         *          console.log("STARTING WORKFLOW...")
         *      },
         *      vote: function(recordId, stepId, decisionId, comment, actors) {
         *          console.log("VOTE FOR..." + recordId)
         *      }
         *  }
         * })
         * 
         * // Usage
         * myRecord.workflow.start()
         */
        addPropertyToAllModels(propertyName, getter) {
            Object.values(kiss.data.Record).forEach(recordClass => {
                Object.defineProperty(recordClass.prototype, propertyName, {
                    get: function () {
                        try {
                            return getter(this)
                        } catch (err) {
                            log("kiss.data.Model - addPropertyToAllModels", 4, err)
                            return "Formula error"
                        }
                    },
                    set: function (value) {
                        try {
                            this.value = value
                            //this[propertyName] = value
                        } catch (err) {
                            log("kiss.data.Model - addPropertyToAllModels", 4, err)
                        }
                    },
                    configurable: true
                })
            })
        }
    },

    /**
     * Load some .js and .css into the page header.
     * This is mainly used in development mode, when the library is not yet bundled and minified
     * 
     * @namespace
     */
    loader: {

        // List of KissJS core modules
        core: {
            scripts: [
                // "modules/global",
                "modules/dataTrash",
                "modules/ajax",
                "modules/context",
                "modules/session",
                "modules/acl",
                "modules/undoRedo",
                "modules/directory",
                "modules/pubsub",
                "modules/websocket",
                "modules/router",
                "modules/views",
                "modules/theme",
                "modules/language",
                "modules/language.texts",
                "modules/plugins",
                "modules/selection",
                "modules/screen",
                "modules/webfonts"
            ]
        },

        // List of KissJS db modules
        db: {
            scripts: [
                "db/offline",
                "db/memory",
                "db/online",
                "db/faker"
            ]
        },

        // List of KissJS ui components
        ui: {
            scripts: [
                // Containers
                "containers/block",
                "containers/panel",

                // Data
                "data/datatable",
                "data/calendar",
                "data/kanban",
                "data/timeline",

                // Elements
                "elements/spacer",
                "elements/html",
                "elements/image",
                "elements/button",
                "elements/menu",
                "elements/tip",
                "elements/notification",
                "elements/dialog",

                // Fields
                "fields/field",
                "fields/checkbox",
                "fields/rating",
                "fields/slider",
                "fields/select",
                "fields/icon",
                "fields/iconPicker",
                "fields/color",
                "fields/colorPicker",
                "fields/attachment",

                // Form
                "form/form",
                "form/formTabBar",
                "form/formActions",
                "form/formSideBar",
                "form/formContent",
                "form/formFeatureDescription",

                // Helpers
                "helpers/dataFilter",
                "helpers/dataFilterGroup",
                "helpers/dataFilterWindow",
                "helpers/dataSort",
                "helpers/dataSortWindow",
                "helpers/dataFieldsWindow",
                "helpers/languageWindow",
                "helpers/themeWindow",
                "helpers/themeBuilderWindow",
                "helpers/fileUploadLocal",
                "helpers/fileUploadLink",
                "helpers/fileUploadDropbox",
                "helpers/fileUploadBox",
                "helpers/fileUploadGoogleDrive",
                "helpers/fileUploadOneDrive",
                "helpers/fileUploadInstagram",
                "helpers/fileUploadTakePhoto",
                "helpers/fileUploadinstagramSession",
                "helpers/fileUploadBoxSession",
                "helpers/fileUploadWebSearch",
                "helpers/fileUploadWindow",
                "helpers/previewWindow",
                "helpers/recordSelectorWindow",

                // Views
                "views/common/matrix",
                "views/authentication/error",
                "views/authentication/invite",
                "views/authentication/login",
                "views/authentication/register",
                "views/authentication/resetPassword",
                "views/authentication/templates"
            ],
            styles: [
                "abstract/component",
                "containers/block",
                "containers/panel",
                "data/datatable",
                "data/calendar",
                "data/kanban",
                "data/timeline",
                "elements/button",
                "elements/html",
                "elements/image",
                "elements/menu",
                "elements/tip",
                "elements/notification",
                "elements/dialog",
                "fields/field",
                "fields/checkbox",
                "fields/rating",
                "fields/slider",
                "fields/select",
                "fields/icon",
                "fields/iconPicker",
                "fields/color",
                "fields/colorPicker",
                "fields/attachment",
                "form/form",
                "helpers/dataSort",
                "helpers/dataFilter",
                "helpers/dataFilterGroup",
                "helpers/dataFieldsWindow",
                "helpers/fileUpload",
                "helpers/previewWindow",
                "helpers/themeWindow",
                "views/authentication/styles"
            ]
        },

        /**
         * Load a script file asynchronously into the page.
         * 
         * @param {string} path - Provide the path to the javascript file, without the extension .js
         * @param {object} [options] - Optional object to pass any custom attributes
         * @param {object} [params] - Optional object to change loader behavior
         * @param {string} [params.autoAddExtension='.js'] - The extension to auto append to the path url.
         * 
         * @example
         * kiss.loader
         *  .loadScript("views/common/topbar")
         *  .then(() => {
         *      console.log("Javascript file loaded!")
         *  })
         * 
         * // With options. This is equivalent to:
         * // <script async type="text/javascript" src="https://www.dropbox.com/static/api/2/dropins.js" id="dropboxjs" data-app-key="2tkajpbphy1m8dj"></script>
         * kiss.loader.loadScript("https://www.dropbox.com/static/api/2/dropins.js", {
         *  id: "dropboxjs",
         *  "data-app-key": "2tkajpbphy1m8dj"
         * })
         * 
         */
        loadScript(path, options, {
            autoAddExtension = '.js'
        } = {}) {
            return new Promise(function (resolve, reject) {
                const script = document.createElement("script")
                script.type = "text/javascript"
                script.async = true
                script.src = path + autoAddExtension + "?build=" + kiss.version
                if (options) {
                    Object.keys(options).forEach(key => {
                        script.setAttribute(key, options[key])
                    })
                }
                const head = document.getElementsByTagName("head")[0]
                head.appendChild(script)
                script.onload = resolve
                script.onerror = reject
            })
        },

        /**
         * Load a CSS file asynchronously into the page
         * 
         * @param {string} path - Provide the path to the CSS files, without the extension .css
         * 
         * @example
         * kiss.loader
         *  .loadStyle("views/common/topbar")
         *  .then(() => {
         *      console.log("CSS file loaded!")
         *  })
         */
        loadStyle(path) {
            return new Promise(function (resolve, reject) {
                const style = document.createElement("link")
                style.rel = "stylesheet"
                style.type = "text/css"
                style.async = true
                style.href = path + ".css?build=" + kiss.version
                const head = document.getElementsByTagName("head")[0]
                head.appendChild(style)
                style.onload = resolve
                style.onerror = reject
            })
        },

        /**
         * Load many scripts asynchronously and resolve Promise when all scripts are loaded
         * 
         * @param {string[]} paths - Array of javascript file paths to load, without .js extension
         * 
         * @example
         * kiss.loader
         *  .loadScripts([
         *      "views/common/topbar",
         *      "views/common/logo",
         *      "views/common/buy"
         *  ]).then(() => {
         *      console.log("All javascript files are loaded!")
         *  })
         */
        async loadScripts(paths) {
            await Promise.allSettled(paths.map(kiss.loader.loadScript))
        },

        /**
         * Load many styles asynchronously and resolve Promise when all styles are loaded
         * 
         * @param {string[]} paths - Array of CSS file paths to load, without .cess extension
         * 
         * @example
         * kiss.loader
         *  .loadStyles([
         *      "views/common/topbar",
         *      "views/common/logo",
         *      "views/common/buy"
         *  ]).then(() => {
         *      console.log("All CSS files are loaded!")
         *  })
         */
        async loadStyles(paths) {
            await Promise.allSettled(paths.map(kiss.loader.loadStyle))
        },

        /**
         * Load KissJS library dynamically from all its source files.
         * 
         * - In development, KissJS is a collection of javascript and css files that must loaded separately
         * - User extensions (UX) always need to be loaded manually and separately
         * - In production, KissJS is bundled and doesn't require to load modules dynamically
         * 
         * Please note that dynamic loading of libraries is a bit tricky and hacky:
         * - Because a librariy can depend on another one, they must be loaded in the right order
         * - KissJS uses this technic because the native browser module system doesn't support file:// path (and KissJS does)
         * - We couldn't use external dependencies (like requirejs, systemjs...) which don't work with file path (file://)
         * 
         * @param {object} config
         * @param {object} config.libraryPath - The path to the library root folder
         * @param {object} config.useDb - If false, load the library without the db/data related scripts
         * @async
         */
        async loadLibrary(config) {
            const useDb = (config.useDb === false) ? false : true
            const libraryPath = config.libraryPath || ""

            // Load the main app module
            await kiss.loader.loadScript(libraryPath + "/client/core/modules/app")

            // Load the base classes first, because some classes inherit from them
            await kiss.loader.loadScript(libraryPath + "/client/ui/abstract/component")
            await kiss.loader.loadScript(libraryPath + "/client/ui/abstract/container")
            await kiss.loader.loadScript(libraryPath + "/client/ui/abstract/dataComponent")

            // Load the database wrapper
            if (useDb) {
                await kiss.loader.loadScript(libraryPath + "/client/core/db/nedb")
                await kiss.loader.loadScript(libraryPath + "/client/core/db/api")
            }

            // Load global tools
            await kiss.loader.loadScript(libraryPath + "/client/core/modules/logger")
            await kiss.loader.loadScript(libraryPath + "/client/core/modules/tools")
            await kiss.loader.loadScript(libraryPath + "/client/core/modules/loadingSpinner")

            // Shared modules
            await kiss.loader.loadScript(libraryPath + "/common/global")
            await kiss.loader.loadScript(libraryPath + "/common/prototypes")
            await kiss.loader.loadScript(libraryPath + "/common/formula")
            await kiss.loader.loadScript(libraryPath + "/common/Parser")
            await kiss.loader.loadScript(libraryPath + "/common/ParserOperators")
            await kiss.loader.loadScript(libraryPath + "/common/formula")
            await kiss.loader.loadScript(libraryPath + "/common/tools")

            if (useDb) {
                await kiss.loader.loadScript(libraryPath + "/common/dataModel")
                await kiss.loader.loadScript(libraryPath + "/common/dataRecord")
                await kiss.loader.loadScript(libraryPath + "/common/dataCollection")
                await kiss.loader.loadScript(libraryPath + "/common/dataRelations")
                await kiss.loader.loadScript(libraryPath + "/common/dataTransaction")
            }

            // Load everything else
            const dbScripts = (useDb) ? kiss.loader.db.scripts.map(path => libraryPath + "/client/core/" + path) : []
            const coreScripts = kiss.loader.core.scripts.map(path => libraryPath + "/client/core/" + path)
            const uiScripts = kiss.loader.ui.scripts.map(path => libraryPath + "/client/ui/" + path)
            const styles = kiss.loader.ui.styles.map(path => libraryPath + "/client/ui/" + path)

            await Promise.allSettled([
                kiss.loader.loadScripts(dbScripts),
                kiss.loader.loadScripts(coreScripts),
                kiss.loader.loadScripts(uiScripts),
                kiss.loader.loadStyles(styles)
            ])

            // Immediately init language because every translations depends on it
            kiss.language.init()
        }
    },

    /**
     * KissJS service worker.
     * Mainly used for PWA at the moment.
     * 
     * @namespace
     */
    serviceWorker: {
        /**
         * Default service worker file
         * 
         * @ignore
         */
        serviceWorkerFile: "./serviceWorker.js",

        /**
         * Set the location of the service worker file.
         * Returns the service worker so that this method is chainable with the init method.
         * 
         * @param {string} path 
         * @returns {object} kiss.serviceWorker
         * 
         * @example
         * await kiss.serviceWorker.setFile("./myServiceWorkerFile.js").init()
         */
        setFile(path) {
            if (!path) return
            kiss.serviceWorker.serviceWorkerFile = path
            return kiss.serviceWorker
        },

        /**
         * Init the service worker
         * 
         * @async
         */
        async init() {
            if ("serviceWorker" in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register(kiss.serviceWorker.serviceWorkerFile)
                    log("kiss.serviceWorker - Registered with scope", 1, registration.scope)
                }
                catch(err) {
                    log("kiss.serviceWorker - Registration failed", 3, err)
                }
            }
        }
    }
}

;