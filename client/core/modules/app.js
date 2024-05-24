/**
 * 
 * ## Kiss application manager
 * 
 * This module allows to:
 * - define and access **models**
 * - define and access **collections**
 * - define **views**
 * - define **controllers**
 * - **init** the application using kiss.app.init()
 * 
 * Once the models and collections are defined, they are stored in the **app** object.
 * ```
 * // Getting models and collections
 * const appModels = kiss.app.models
 * const appCollections = kiss.app.collections
 * 
 * // Getting a model definition or a collection
 * const userModel = appModels["user"]
 * const userCollection = appCollections["user"]
 * 
 * // Using the model
 * const Bob = userModel.create({firstName: "Bob", lastName: "Wilson"})
 * await Bob.save()
 * 
 * // Using the collection if you're not sure it's loaded in memory (async method)
 * const John = await userCollection.findOne("123")
 * 
 * // Using the collection if it's already loaded in memory (sync method)
 * const Will = userCollection.getRecord("456")
 * ```
 * 
 * @namespace
 */
kiss.app = {
    isLoaded: false,

    // Reserved namespace for form templates
    formTemplates: {},

    // Reserved namespace for view templates
    viewTemplates: {},

    /**
     * Store the application models.
     * [More about models here.](kiss.data.Model.html)
     * 
     * @example
     * const userModel = kiss.app.models["user"]
     * 
     * // Or...
     * const userModel = kiss.app.models.user
     */
    models: {},

    /**
     * Store the application collections.
     * [More about collections here.](kiss.data.Collection.html)
     * 
     * @example
     * const userCollection = kiss.app.collections["user"]
     * 
     * // Or...
     * const userCollection = kiss.app.collections.user
     */
    collections: {},

    /**
     * Define all the application texts that can be translated.
     * Each text will be used as an English text if it doesn't have any english translation.
     * 
     * @param {object} texts
     * 
     * @example
     * kiss.app.defineTexts({
     *  "hello": {
     *      fr: "bonjour"
     *  },
     *  "#thank": {
     *      en: "thank you",
     *      fr: "merci"
     *  }
     * })
     */
    defineTexts(texts) {
        if (texts) {
            Object.assign(kiss.language.texts, texts)
            log.info(`kiss.language - Loaded ${Object.keys(texts).length} translated texts`)
        }
    },

    /**
     * Define a new model in the application
     * 
     * This automatically:
     * - references the model in **kiss.app.models**
     * - references a new collection for the model in **kiss.app.collections**
     * - references a new record class to instanciate the model
     * - generates the basic api for the record class (create, save, update, delete)
     * - generates getters/setters for record's computed fields (= virtual fields)
     * 
     * Check the class [Model documentation](kiss.data.Model.html) for more informations about models.
     * 
     * @param {object} model - The model configuration object
     * @returns {Model} The newly defined model
     */
    defineModel(model) {
        if (kiss.app.models[model.id]) return kiss.app.models[model.id]
        return new kiss.data.Model(model)
    },

    /**
     * Define the model relationships
     * 
     * This methods explores all the application models and finds automatically the relationships between the models.
     * When exploring the models, specific field types are generating the relationships:
     * - **link**: field used to link one or many foreign records
     * - **lookup**: field that lookups a field in a foreign record
     * - **summary**: field that lookups and summarize data from multiple foreign records
     * 
     * @example
     * kiss.app.defineModelRelationships()
     */
    defineModelRelationships() {
        Object.values(kiss.app.models)
            .filter(model => kiss.tools.isUid(model.id))
            .forEach(model => model._defineRelationships())
    },

    /**
     * Get a Model by id or by name
     * 
     * Note: if the model is not found, the methods tries to find the model by its name
     * 
     * @param {string} modelId - id or name (case insensitive) of the model
     * @returns {object} Model
     */
    getModel(modelId) {
        const model = kiss.app.models[modelId]
        if (model) return model
        return kiss.app.getModelByName(modelId)
    },

    /**
     * Get a Model by name
     * 
     * Models are normally retrieved by id like this:
     * ```
     * const projectModel = kiss.app.models[modelId]
     * const projectRecord = projectModel.create({projectName: "foo"})
     * ```
     * 
     * In some situation, we just know the model name and have to use this method:
     * ```
     * const projectModel = kiss.app.getModelByName("Project")
     * const projectRecord = projectModel.create({projectName: "foo"})
     * ```
     * 
     * @param {string} modelName - The name of the model (case insensitive)
     * @returns {object} Model
     */
    getModelByName(modelName) {
        return Object.values(kiss.app.models).find(model => (model.name.toLowerCase() == modelName.toLowerCase()))
    },

    /**
     * Get a Collection by its model's name
     * 
     * Collections are normally retrieved by id like this:
     * ```
     * const projectCollection = kiss.app.collections[collectionId]
     * const projects = await projectCollection.find()
     * ```
     * 
     * In some situation, we just know the name of the collection's model, so we have to use this method:
     * ```
     * const projectCollection = kiss.app.getCollectionByModelName("Project")
     * const projects = await projectCollection.find()
     * ```
     * 
     * @param {string} modelName - The name of the collection's model (case insensitive)
     * @returns {object} Collection
     */
    getCollectionByModelName(modelName) {
        return Object.values(kiss.app.collections).find(collection => (collection.model.name.toLowerCase() == modelName.toLowerCase()))
    },

    /**
     * List all the application collections.
     * Give their name and number of records.
     */
    listCollections() {
        Object.values(kiss.app.collections).forEach(collection => {
            console.log(`id: ${collection.id}, name: ${collection.model.name}, records: ${collection.records.length}`)
        })
    },

    /**
     * Define a view by storing its renderer function into the list of view renderers.
     * It does NOT store a view, but instead stores a view 'renderer' function that will generate the view later, when needed.
     * 
     * @param {object} config
     * @param {string} config.id - The id of the view to add
     * @param {function} config.renderer - The function that will render the view when needed
     * @param {object} config.meta - Meta informations injected in the HTML header. Can be localized or not. See examples in kiss.views module.
     * 
     * @example
     * kiss.app.defineView({
     *  id: "home",
     *  renderer: function (id, target) {
     *      // ... build your view here
     *      return createPanel({
     * 
     *          id, // Very important. Can't work without it.
     *          target, // Optional insertion point in the DOM. You can omit if you don't need it.
     * 
     *          title: "My first panel",
     * 
     *          // A few panel properties
     *          draggable: true,
     *          closable: true,
     *          width: 300,
     *          height: 200,
     *          boxShadow: "5px 5px 10px #cccccc",
     *      
     *          // Panel content
     *          items: [
     *              {
     *                  type: "html",
     *                  html: "<center>Hello world?</center>",
     *              
     *                  // W3C events attached to the html element
     *                  // It works only if you've attached the "hello" viewController (see below)
     *                  events: {
     *                      onclick: function() {
     *                          $(id).hello()
     *                      }
     *                  }
     *              }
     *          ]
     *      })
     *  }
     * })
     */
    defineView({
        id,
        renderer,
        meta
    }) {
        kiss.views.addView({
            id,
            renderer,
            meta
        })
    },

    /**
     * Define a controller for a specific view
     * 
     * The view controller must have the same name as the controlled view.
     * They will be paired automatically.
     * 
     * @param {string} id 
     * @param {object} viewController - Object containing all the controller methods
     * 
     * @example
     * // This controller has 4 methods, hello(), world(), foo() and bar()
     * kiss.app.defineViewController("home", {
     *          
     *      hello: function() {
     *          createNotification({
     *              message: "Hello!",
     *              duration: 2000
     *          })
     *      },
     * 
     *      // ... or using an arrow function:
     *      world: () => console.log("World!"),
     * 
     *      // ... or class member notation:
     *      foo() {
     *          console.log("Foo!")
     *      },
     * 
     *      // Methods can be async, too:
     *      async bar() {
     *          return await 42
     *      }
     * })
     */
    defineViewController(id, viewController) {
        kiss.views.addViewController(id, viewController)
    },

    /**
     * Add a plugin definition to the application
     * 
     * @param {object} plugin 
     */
    definePlugin(plugin) {
        kiss.plugins.add(plugin)
    },

    /**
     * Init every kiss modules at startup:
     * - init the theme (color/geometry)
     * - init the language
     * - init the screen size observer
     * - restore the session (if any)
     * - init the client router
     * - navigate to the first application view (given by the hash parameter #ui=APP_FIRST_ROUTE)
     */
    async init() {

        // Init the CSS theme at startup
        kiss.theme.init()

        // Init screen size listener
        kiss.screen.init()

        // Init the application router
        kiss.router.init()

        // Get the requested route
        const newRoute = kiss.router.getRoute()

        // Restore the session (if any, and if it's not a public route)
        if (!kiss.router.isPublicRoute()) await kiss.session.restore()

        // Jump to the first route
        kiss.router.navigateTo(newRoute)

        // Welcome message
        console.log("😘 Powered with ❤ by KissJS, Keep It Simple Stupid Javascript")
    }
}


;