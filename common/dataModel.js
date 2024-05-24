/**
 * 
 * Represents a **Model**.
 * 
 * The models are the central elements to structure the data of your applications.
 * The jargon can be slightly different depending on the frameworks, therefore, let's ensure we're talking the same language when it comes to **Model**, **Field**, **Record**, and **Collection**.
 * 
 * **Model**:
 * - a model is a representation of a real-world entity: a user, a car, an invoice, a task, a project, a dream, a quark
 * - a model defines the properties of the entity, but **is not** that entity: a model defines what is a car, but is not a car
 * - a model **must** define the properties of the entity. Ex: firstName, lastName, email
 * - a model **can** have custom methods. Ex: invite(), sendEmail(), ...
 * 
 * **Field**:
 * - a field is a single property of a model. Ex: firstName
 * - a field has an id. Ex: firstName, lastName, bwxJF4yz
 * - a field has a label. Ex: First name, Last name
 * - a field has a type. Ex: text, number, date, select
 * 
 * **Record**:
 * - a record is an entity created thanks to the model definition
 * - a record has data. Ex: firstName: **Bob**, lastName: **Wilson**, email: **bob@wilson.com**
 * - a record inherits the model's methods. Ex: myUser.invite(), myUser.sendMail()
 * 
 * **Collection**:
 * - a collection is an array of multiple records
 * - a collection acts as a proxy for model's data, with specific projection, filtering, sorting, grouping, paging...
 * - it means multiple collections can be bound to the same model
 * - a collection is useful to cache a specific set of records and represent them into the UI
 * - in KissJS, each record of a collection is not just a JSON object, but it's a Record's instance, so you can directly use its methods
 * 
 * <img src="../../resources/doc/KissJS - Data model.png">
 * 
 * In KissJS:
 * - a model needs basic properties like **id**, **name**, **items**
 * - a model needs to know its **singular** and its **plural** name: man / men, child / children, box / boxes, spy / spies 
 * - a model **can** have custom **methods**: sendEmail(), archive(), processTask()
 * - to be able to represent the model visually in KissJS applications, it has an **icon** and a **color** property
 * - to classify the models semantically, KissJS **can** have meta-data like **tags** and **domains**
 * 
 * You define a model passing its names (singular and plural) and its items:
 * ```
 * let spyModel = new kiss.data.Model({
 *  name: "spy",
 *  namePlural: "spies",
 *  items: [
 *      {label: "Spy code number"},
 *      {label: "Spy real name"}
 *  ]
 * })
 * ```
 * 
 * Important note about KissJS conventions:
 *  - we define model **items** instead of **fields**
 *  - fields have a **label** instead of a **name**
 * 
 * This is because KissJS shares a single convention for both the **model** and its direct UI representation: the **form**:
 * - forms have **items** (which can be fields, panels, buttons, images...)
 * - panels contain **fields** or other items (like **buttons**)
 * - fields have a **label**
 * - panels have a **title**
 * 
 * It means you can also define a model like this:
 * ```
 * let spyModel = new kiss.data.Model({
 *  name: "spy",
 *  namePlural: "spies",
 *  items: [
 *      {
 *          type: "panel",
 *          title: "General informations",
 *          items: [
 *              {label: "Spy code number"},
 *              {label: "Spy fake name"}
 *           ]
 *      },
 *      {
 *          type: "panel",
 *          title: "Secret informations",
 *          items: [
 *              {label: "Spy real name"},
 *              {label: "Last mission date"}
 *          ]
 *      }
 *  ]
 * })
 * ```
 * This model will be automatically represented by a form with 2 sections.
 * 
 * If you just give a label to a field, its **id** will be randomly generated.
 * To keep control over your field ids, just add them to the field definition:
 * ```
 * let newModel = new kiss.data.Model({
 *  name: "spy",
 *  namePlural: "spies",
 *  items: [
 *      {id: "code", label: "Spy code number"},
 *      {id: "name", label: "Spy real name"}
 *  ]
 * })
 * ```
 * The default type is "text", but you can of course define the field's type and **validation** rules:
 * - using **validation** property and a regex
 * - using **validationType** property for pre-defined rules (alpha, alphanumeric, email, url, ip)
 * ```
 * let newModel = new kiss.data.Model({
 *  name: "spy",
 *  namePlural: "spies",
 *  items: [
 *      {id: "code", label: "Spy code number", type: "text", validation: /^\d{3}$/}, // Force 3 digits, like "007"
 *      {id: "name", label: "Spy real name", type: "text"},
 *      {id: "missions", label: "Number of missions", type: "number"},
 *      {id: "lastMission", label: "Last mission date", type: "date"},
 *      {id: "secretEmail", label: "Spy secret mailbox", type: "text", validationType: "email"}, // Predefined validation type
 *      {id: "isActive", label: "Is this spy still active?", type: "checkbox"}
 *  ]
 * })
 * ```
 * The field **type** is used to define how the field is rendered into the UI, and its **data type** is implicit.
 * In the previous example, the **checkbox** type has implicitly a **boolean** data type.
 * 
 * Once a model has been defined, you can **create** model instances.
 * In KissJS, a model instance is called a **Record**:
 * 
 * ```
 * let userModel = kiss.app.models.user
 * let userRecord = userModel.create({firstName: "Bob", lastName: "Wilson"})
 * ```
 * 
 * **Fields**
 * 
 * To define a field, the minimum is to have a field **label**:
 * ```
 * {label: "First name"}
 * ```
 * 
 * If you just set a label, KissJS will automatically:
 * - generate an id, using [kiss.tools.shortUid()](kiss.tools.html#.shortUid)
 * - set the type to **text**
 * 
 * If you prefer having control over your field ids, do:
 * ```
 * {id: "firstName", label: "First name"}
 * ```
 * 
 * **Field types**
 * 
 * Because KissJS is primarily a **UI library**, it is designed to make it easier to display the model in the user interface.
 * It's a very opiniated architecture choice.
 * The point here is to keep the focus on the UI and not the underlying structure.
 * Doing that way allows us to just throw a model definition to KissJS and it will automagically generate the UI as a form.
 * 
 * **Basic field types:**
 * 
 * Field type | Data type | Displayed as
 * --- | --- | ---
 * text | text | input field
 * textarea | text | textarea field
 * number | number | number field
 * date | ISO 8601 extended. Example: 2021-04-01T23:20:15Z | date picker
 * checkbox | boolean | checkbox
 * select | string[] | single or multi-value dropdown list
 * rating | number | a rating field with stars (or other icons)
 * slider | number | a slider field
 * icon | string | a single icon field
 * iconPicker | string | an icon picker (using Font Awesome icons at the moment)
 * color | string | a single color field
 * colorPicker | string | a color picker
 * attachment | object | file upload control
 * 
 * **Special field types (non mandatory extensions):**
 * 
 * Field type | Data type | Displayed as
 * --- | --- | ---
 * aiTextarea | text | textarea field with AI suggestions
 * aiImage | object | file upload control with AI image generation
 * directory | string[] | dropdown list to select users and/or groups
 * link | * | list to show one or multiple records and create relationships between tables
 * lookup | * | computed field that lookup a value from a single foreign linked record
 * summary | * | computed field that makes a summary of multiple foreign linked records (a sum, a percentage, a concatenation...)
 * 
 * **Roadmap for news field types:**
 * - automatic number
 * - address (with search / completion and map)
 * - checkbox group (= just another UI for Select field with "multiple: true" option)
 * - radio group (= just another UI for Select field with "multiple: false" option)
 * - image (= just another UI for the attachment field)
 * 
 * **Methods:**
 * 
 * By default, every instanciated record will have default methods:
 * - save
 * - read
 * - update
 * - delete
 * 
 * But you can also define custom methods as well (just ensure their name doesn't conflict with default CRUD methods):
 * ```
 * let contactModel = new kiss.data.Model({
 *  name: "contact",
 *  namePlural: "contacts",
 *  items: [
 *      {id: "name", label: "Contact name", type: "text"},
 *      {id: "email", label: "Email", type: "text", validationType: "email"}
 *  ],
 *  methods: {
 *      sendEmail: function (subject, message) {
 *          yourSmtpService.sendMessage(this.email, subject, message)
 *      }
 *  }
 * })
 * 
 * // Instanciate a new record
 * let newContact = contactModel.create({name: "Bob", email: "bob@wilson.com"})
 * 
 * // Using its custom method
 * newContact.sendEmail("Urgent", "Do that")
 * ```
 * 
 * @param {object} config - model configuration
 * @param {string} [config.mode] - "memory" | "offline" | "online"
 * @param {string} [config.id]
 * @param {string} [config.templateId] - id of the original template model (used to keep track of the source model)
 * @param {string} [config.name] - Name of the model: Lead
 * @param {string} [config.namePlural] - Plural name: Leads
 * @param {object[]} config.items - Array for field definitions
 * @param {object} config.acl - model's acl (Access Control List)
 * @param {object} config.methods - model's methods
 * @param {object} [config.features] - model's features (workflow, comments, ...)
 * @param {string} [config.icon] - The Font Awesome icon class. Example: "fas fa-check"
 * @param {string} [config.color] - Hexa color. Ex: "#00aaee"
 * @param {string[]} [config.tags] - Ex: ["Leads", "Sales", "CRM", "HRM"]
 * @param {string[]} [config.domains] - Ex: ["banking", "insurance"]
 * 
 * @example
 * // Register a new model
 * let leadModel = new kiss.data.Model({
 *  name: "lead",
 *  namePlural: "leads",
 * 
 *  icon: "fas fa-user",
 *  color: "#00aaee",
 * 
 *  // Define model fiels
 *  items: [
 *      {
 *          label: "Name",
 *          id: "name",
 *          type: "text"
 *      },
 *      {
 *          primary: true, // Primary key field
 *          label: "Email",
 *          id: "email",
 *          type: "text",
 *          validationType: "email"
 *      },
 *      {
 *          label: "Category",
 *          id: "category",
 *          type: "select",
 *          options: [
 *              {
 *                  label: "National"
 *                  value: "NAT",
 *                  color: "#00aaee"
 *              },
 *              {
 *                  label: "International",
 *                  value: "INT",
 *                  color: "#aa00ee"
 *              }
 *          ]
 *      }
 *  ],
 * 
 *  // Define model methods
 *  methods: {
 *      // Get all the pending deals for this lead
 *      getPendingDeals: async function() {
 *          return await kiss.app.collections["deal"].find({
 *              filter: {
 *                  $and: [
 *                      {leadId: this.id},
 *                      {status: "pending"}
 *                  ]
 *              }
 *          })
 *      }
 *  }
 * })
 * 
 * // Your can create a new instance like this
 * let myLead = leadModel.create({name: "Bob Wilson", email: "bob@wilson.com", category: "INT"})
 * 
 * // Creating a new instance happens in memory. You have to save it manually with
 * await myLead.save()
 * 
 * // Updating an instance using default CRUD methods
 * await myLead.update({name: "Bob Wilson Junior"})
 * 
 * // Calling a custom method
 * let pendingDeals = await myLead.getPendingDeals()
 * 
 * // Deleting an instance
 * await myLead.delete()
 * 
 */
kiss.data.Model = class {

    constructor(config) {
        // log(`kiss.data.Model - Defining model <${config.name}>`, 0, config)

        // Define collection's database (memory, offline, online)
        this.mode = config.mode || kiss.db.mode
        this.db = kiss.db[this.mode]

        // Basic model properties
        this.id = config.id || this.namePlural || this.name || uid()
        this.accountId = config.accountId
        this.name = (config.name || this.id).toTitleCase()
        this.namePlural = (config.namePlural || this.id).toTitleCase()
        this.icon = config.icon || "fas fa-th"
        this.color = config.color || "#00aaee"
        this.backgroundColor = config.backgroundColor || "#ffffff"
        this.fullscreen = !!config.fullscreen
        this.align = config.align || "center"
        this.tags = config.tags || []
        this.domains = config.domains || []
        this.methods = config.methods || {}
        this.features = config.features
        this.splitBy = config.splitBy

        // Dynamic models get their acl rules from the generic "dynamicModel" definition
        this.acl = (kiss.tools.isUid(this.id) && kiss.app.models.dynamicModel) ? kiss.app.models.dynamicModel.acl : config.acl
        this.acl = this.acl || {}

        // Model access fields
        this.authenticatedCanCreate = config.authenticatedCanCreate
        this.authenticatedCanRead = config.authenticatedCanRead
        this.authenticatedCanUpdate = config.authenticatedCanUpdate
        this.authenticatedCanDelete = config.authenticatedCanDelete
        this.ownerCanManage = config.ownerCanManage
        this.accessCreate = config.accessCreate
        this.accessRead = config.accessRead
        this.accessUpdate = config.accessUpdate
        this.accessDelete = config.accessDelete
        this.accessManage = config.accessManage

        // Public forms
        this.public = !!config.public
        this.publicFormWidth = config.publicFormWidth
        this.publicFormMargin = config.publicFormMargin
        this.publicFormHeader = config.publicFormHeader
        this.publicEmailTo = config.publicEmailTo
        this.publicFormActionId = config.publicFormActionId

        // Keep the id of the original application it was created in
        if (config.applicationId) this.applicationId = config.applicationId

        // Keep the id of the original template used to generate this model
        if (config.templateId) this.templateId = config.templateId

        // Self-register the Model into the kiss.app object
        kiss.app.models[this.id] = this

        // Init items, fields, computed fields, record factory
        this._initItems(config.items)
            ._initFields()
            ._initACLFields()
            ._initComputedFields()
            ._initRecordFactory()

        // Init client methods: master collection, subscriptions
        if (kiss.isClient) {
            this._initMasterCollection()
                ._initSubscriptions()
        }

        // Init server methods: set accepted fields
        if (kiss.isServer) {
            this._initAcceptedFields()
        }

        log.info("Loaded model " + this.id)
        return this
    }

    /**
     * Init the model's ACL fields
     * 
     * This is only used server-side to define the fields that holds ACL entries (users and/or groups).
     * When a user or group is deleted, the ACL entries in the model's fields are updated accordingly.
     * This is done by kiss.directory.cleanupAllUserReferences
     * 
     * @returns this
     */
    _initACLFields() {
        if (kiss.isClient) return this

        this.aclFields = this.fields.filter(field => field.isACL)
        if (this.aclFields.length > 0) kiss.acl.addFields(this, this.aclFields)
        return this
    }

    /**
     * Create a Record class specific to this Model
     * 
     * @private
     * @ignore
     * @returns this
     */
    _initRecordFactory() {
        this.recordFactory = kiss.data.RecordFactory(this.id)
        return this
    }

    /**
     * Create and register a default collection for the model
     * 
     * @private
     * @ignore
     * @returns this
     */
    _initMasterCollection() {
        this.collection = new kiss.data.Collection({
            id: this.id,
            mode: this.mode,
            model: this,
            isMaster: true, // The default model's collection is flagged as the "master" collection
            sort: [{
                [this.getPrimaryKeyField().id]: "asc" // Sort on the primary key field by default
            }]
        })
        return this
    }

    /**
     * Subscribe the model to react to changes
     * 
     * @private
     * @ignore
     * @returns this
     */
    _initSubscriptions() {
        const modelId = this.id.toUpperCase()

        this.subscriptions = [
            // React to model updates
            subscribe("EVT_DB_UPDATE:MODEL", (msgData) => {
                if (this.id == msgData.id) {
                    Object.assign(this, msgData.data)

                    if (msgData.data.hasOwnProperty("items")) {
                        this._initItems(this.items)
                        this._initFields()
                    }
                }
            }),

            subscribe("EVT_DB_UPDATE_BULK", (msgData) => {
                if (msgData.data && msgData.data[0] && msgData.data[0].modelId == "model" && msgData.data[0].recordId == this.id) {
                    Object.assign(this, msgData.data[0].updates)
                }
            }),

            // React to database mutations on records built from this model
            subscribe("EVT_DB_INSERT:" + modelId, this._notifyUser),
            subscribe("EVT_DB_UPDATE:" + modelId, this._notifyUser),
            subscribe("EVT_DB_DELETE:" + modelId, this._notifyUser),
            subscribe("EVT_DB_UPDATE_BULK", (msgData) => {
                let isUpdated = false
                for (let operation of msgData.data) {
                    if (operation.modelId == this.id) {
                        isUpdated = true
                        break
                    }
                }
                if (isUpdated) this._notifyUser(msgData)
            }),

            // Hardly ever happens, so we put this in standby at the moment to limit the number of subscriptions:
            // subscribe("EVT_DB_INSERT_MANY:" + modelId, this._notifyUser),
            // subscribe("EVT_DB_UPDATE_MANY:" + modelId, this._notifyUser),
            // subscribe("EVT_DB_DELETE_MANY:" + modelId, this._notifyUser)
        ]
        return this
    }

    /**
     * Create a new Record from this model
     * 
     * **This does not save the record automatically**: to save the record into the database, use the **save()** method of the created record.
     * 
     * @param {object} [recordData] - The new record's data
     * @param {boolean} [inherit] - If true, create a blank record then assign recordData to it
     * @returns {object} The new Record object
     * 
     * @example
     * userModel = kiss.app.models["user"]
     * let Bob = userModel.create({firstName: "Bob", lastName: "Wilson"})
     * await Bob.save()
     */
    create(recordData, inherit) {
        return new this.recordFactory(recordData, inherit)
    }

    /**
     * Create a record using field labels as keys
     * 
     * @param {object} record
     * @returns The record
     * 
     * @example
     * userModel = kiss.app.models["user"]
     * let Bob = userModel.createFromLabels({"First name": "Bob", "Last name": "Wilson"})
     * await Bob.save()
     */
    createFromLabels(record) {
        let newRecord = {}

        Object.keys(record).forEach(fieldLabel => {
            const field = this.getFieldByLabel(fieldLabel)
            const value = record[fieldLabel]
            newRecord[field.id] = value
        })
        return this.create(newRecord)
    }

    /**
     * Check the permission (client-side) to perform an action on the model.
     * 
     * @param {string} action - "update" | "delete"
     * @returns {boolean} true if the permission is granted
     */
    async checkPermission(action) {
        const record = kiss.app.collections.model.records.get(this.id)
        const hasPermission = await kiss.acl.check({
            action,
            record
        })

        if (!hasPermission) {
            createNotification(txtTitleCase("#not authorized"))
            return false
        }

        return true
    }

    /**
     * Initialize the model's fields
     * 
     * Fields is a subset of items, containing only the fields.
     * 
     * The model fields are deduced from:
     * - the model's items
     * - the model's plugins, which can add custom fields to the model
     * 
     * @private
     * @ignore
     * @returns this
     */
    _initFields() {
        const modelFields = this.getFields()
        const featureFields = this.getFeatureFields()
        const systemFields = this.getSystemFields()
        this.fields = modelFields.concat(featureFields).concat(systemFields)

        // Adjust field labels for the client UI
        if (kiss.isClient) {
            this.fields.forEach(field => {
                if (field.label && field.label.startsWith("#")) {
                    field.label = txtTitleCase(field.label)
                }
            })
        }

        return this
    }

    /**
     * Initialize the model's items
     * 
     * - set an id
     * - cast <select> field options to objects if they're given as string
     * 
     * Important:
     * Items contains all the UI components required to render a record as a form.
     * This includes "non-field" informations like panels, buttons, images, html...
     * 
     * @private
     * @ignore
     * @param {object[]} items
     * @returns this
     */
    _initItems(items) {
        if (kiss.isClient) {
            this._initClientItems(items)
        } else {
            this._initServerItems(items)
        }
        return this
    }

    /**
     * Initialize the model's items for the CLIENT
     * 
     * @private
     * @ignore
     * @param {object[]} items
     * @returns this
     */
    _initClientItems(items, read, update) {
        if (!items) return []

        const userACL = kiss.session.getACL()
        items = items.filter(item => item != null)

        items.forEach(item => {
            if (!item.id) item.id = kiss.tools.shortUid()

            if (item.items) {
                // Section
                const canRead = kiss.tools.intersects(item.accessRead, userACL) || !item.accessRead
                const canUpdate = kiss.tools.intersects(item.accessUpdate, userACL) || !item.accessUpdate

                item.acl = item.acl || {}

                // item.acl.read = item.acl.hasOwnProperty("read") ? item.acl.read : !!canRead
                // item.acl.update = item.acl.hasOwnProperty("update") ? item.acl.update : !!canUpdate

                item.acl.read = !!canRead
                item.acl.update = !!canUpdate

                this._initClientItems(item.items, canRead, canUpdate)
            } else {
                // Fields or widgets
                item.acl = item.acl || {}

                // item.acl.read = item.acl.hasOwnProperty("read") ? item.acl.read : read
                // item.acl.update = item.acl.hasOwnProperty("update") ? item.acl.update : update

                item.acl.read = read
                item.acl.update = update

                if (item.type == "select") {
                    if (!item.options) return
                    item.options = item.options.map(option => {
                        if (typeof option == "object") return option
                        return {
                            value: option
                        }
                    })
                }
            }
        })

        this.items = items
        return this
    }

    /**
     * Initialize the model's items for the SERVER
     * 
     * - set an id
     * - cast <select> field options to objects if they're given as string
     * 
     * Important:
     * Items contains all the UI components required to render a record as a form.
     * This includes "non-field" informations like panels, buttons, images, html...
     * 
     * @private
     * @ignore
     * @param {object[]} items
     * @returns this
     */
    _initServerItems(items) {
        if (!items) return []

        items = items.filter(item => item != null)
        items.forEach(item => {
            if (!item.id) item.id = kiss.tools.shortUid()

            if (item.items) {
                // Section
                this._initServerItems(item.items)
            } else {
                // Fields or widgets
                if (item.type == "select") {
                    if (!item.options) return
                    item.options = item.options.map(option => {
                        if (typeof option == "object") return option
                        return {
                            value: option
                        }
                    })
                }
            }
        })

        this.items = items
        return this
    }

    /**
     * Save the model's items
     */
    async saveItems() {
        const modelRecord = kiss.app.collections.model.getRecord(this.id)
        await modelRecord.update({
            items: this.items
        })
    }

    /**
     * Get a field by id
     * 
     * Note: if the field is not found, the method tries to find the field by its label
     * 
     * @param {string} fieldId
     * @returns {object} The field definition
     * 
     * @example
     * let myField = myModel.getField("xD12z4ml00z")
     * 
     * // Returns...
     * {
     *      id: "yearlyIncome",
     *      label: "Yearly income",
     *      type: "number",
     *      precision: 2,
     *      formula: "{{Monthly income}} * 12",
     * }
     */
    getField(fieldId) {
        const field = this.fields.find(field => field.id == fieldId)
        if (field) return field
        return this.getFieldByLabel(fieldId)
    }

    /**
     * Get the primary field of this model
     * 
     * @returns {object} The primary field, or the model's 1st field if it wasn't found
     */
    getPrimaryKeyField() {
        const fields = this.fields
        const primaryKeyField = fields.find(field => field.primary == true)
        if (primaryKeyField) return primaryKeyField
        return fields[0]
    }

    /**
     * Get the first field matching a label.
     * 
     * Note:
     * - if the field label is not found, it defaults to searching the field id
     * - deleted field are not taken into consideration
     * 
     * @param {string} fieldLabel
     * @returns {object} The field definition
     * 
     * @example
     * let myField = myModel.getFieldByLabel("Project name")
     */
    getFieldByLabel(fieldLabel) {
        const fields = this.fields.filter(field => !field.deleted)

        let field = fields.find(field => field.label && field.label.toLowerCase() == fieldLabel.toLowerCase())
        if (field) return field

        field = fields.find(field => field.id.toLowerCase() == fieldLabel.toLowerCase())
        return field
    }

    /**
     * Get the model's fields
     * 
     * In KissJS, the model can be directly defined by a complex form with multiple sections and sub items.
     * This method explores the tree and returns only the items which are fields.
     * 
     * Important: deleted fields are also returned, with a flag deleted = true
     * 
     * @returns {object[]} Array of field definitions
     */
    getFields(containerItems) {
        let fields = []
        let items = containerItems || this.items || []

        items = items.filter(item => item != null)
        items.forEach(item => {
            if ((kiss.global.fieldTypes.map(type => type.value).indexOf(item.type) != -1) || (item.dataType != null)) {
                fields.push(item)
            } else {
                if (item.items) {
                    fields.push(this.getFields(item.items))
                }
            }
        })

        return fields.flat()
    }

    /**
     * Get the model's sections
     * 
     * In KissJS, the model can be directly defined by a complex form with multiple sections and sub items.
     * This method explores the tree and returns only the items which are sections.
     * 
     * @returns {object[]} Array of sections definitions
     */
    getSections() {
        let sections = []
        let items = this.items || []

        items = items.filter(item => item != null)
        items.forEach(item => {
            if (item.items) sections.push(item)
        })

        return sections
    }

    /**
     * Get the accepted fields of the model.
     * This includes model's fields, plus default system fields:
     * - id
     * - createdAt
     * - createdBy
     * - updatedAt
     * - updatedBy
     * - deletedAt
     * - deletedBy
     * - accessRead
     * - accessUpdate
     * - accessDelete
     * 
     * @private
     * @ignore
     * @returns this
     */
    _initAcceptedFields() {
        const defaultAcceptedFields = ["id", "createdAt", "createdBy", "updatedAt", "updatedBy", "deletedAt", "deletedBy", "accessRead", "accessUpdate", "accessDelete", "accessManage"]
        const acceptedFields = this.fields.map(field => field.id)
        this.acceptedFields = defaultAcceptedFields.concat(acceptedFields)
        return this
    }

    /**
     * Initialize the system fields
     * 
     * @returns {object[]} Array of system fields
     */
    getSystemFields() {
        return [{
                id: "createdAt",
                label: "#createdAt",
                type: "date",
                dataType: Date,
                isSystem: true,
                readOnly: true,
                hidden: true,
                acl: {
                    update: false
                }
            },
            {
                id: "createdBy",
                label: "#createdBy",
                type: "directory",
                dataType: Date,
                isSystem: true,
                readOnly: true,
                hidden: true,
                acl: {
                    update: false
                }
            },
            {
                id: "updatedAt",
                label: "#updatedAt",
                type: "date",
                dataType: Date,
                isSystem: true,
                readOnly: true,
                hidden: true,
                acl: {
                    update: false
                }
            },
            {
                id: "updatedBy",
                label: "#updatedBy",
                type: "directory",
                dataType: Date,
                isSystem: true,
                readOnly: true,
                hidden: true,
                acl: {
                    update: false
                }
            },
            {
                id: "deletedAt",
                label: "#deletedAt",
                type: "date",
                dataType: Date,
                isSystem: true,
                readOnly: true,
                hidden: true,
                acl: {
                    update: false
                }
            },
            {
                id: "deletedBy",
                label: "#deletedBy",
                type: "directory",
                dataType: Date,
                isSystem: true,
                readOnly: true,
                hidden: true,
                acl: {
                    update: false
                }
            }
        ]
    }

    /**
     * Get the fields brought by the model's active plugins
     * 
     * @returns {object[]} Array of field definitions
     */
    getFeatureFields() {
        if (kiss.isServer) return []

        let featureFields = []
        if (this.features) {
            Object.keys(this.features)
                .filter(featureId => this.features[featureId].active)
                .forEach(featureId => {
                    const plugin = kiss.plugins.get(featureId)
                    if (!plugin) return

                    const texts = plugin.texts || {}

                    if (plugin && plugin.fields) {
                        plugin.fields.forEach(field => {
                            field.isFromPlugin = true
                            field.pluginId = featureId
                            field.label = txtTitleCase(field.label, texts)
                            featureFields.push(field)
                        })
                    }
                })
        }
        return featureFields
    }

    /**
     * Returns the model's fields using the datatable format
     * 
     * @ignore
     * @returns {object[]} Array of columns
     */
    getFieldsAsColumns() {
        let columns = this.fields
            .filter(field => field.label)
            .map(field => {
                if (field.deleted) return null

                let columnConfig = {
                    id: field.id,
                    type: this.getFieldType(field),
                    title: (!field.label) ? txtTitleCase(field.id) : ((field.label.startsWith("#")) ? txtTitleCase(field.label) : field.label.toTitleCase())
                }

                // Flag columns coming from plugins
                if (field.isFromPlugin) {
                    columnConfig.isFromPlugin = true
                    columnConfig.pluginId = field.pluginId
                    columnConfig.title = txtTitleCase(field.label)
                }

                // Flag system columns
                if (field.isSystem) {
                    columnConfig.isSystem = true
                    columnConfig.title = txtTitleCase(field.label)
                    columnConfig.hidden = (field.hidden !== false)
                }

                return columnConfig
            })
            .filter(column => column != null)

        return columns
    }

    /**
     * Get all the views that display this model and sync their fields
     * 
     * @ignore
     */
    async syncViewsWithModelFields() {
        const viewsToUpdate = this.getViews()
        for (let viewRecord of viewsToUpdate) {
            await viewRecord.syncWithModelFields()
        }
    }

    /**
     * Get visible fields (= non deleted)
     * 
     * @returns {object[]} Array of field definitions
     */
    getActiveFields() {
        return this.fields.filter(field => !field.deleted)
    }

    /**
     * Get only the fields of specific types
     * 
     * @param {string|string[]} types - Single type or array of types. Ex: "text", "textarea", "number", or ["date", "checkbox", "select"]
     * @returns {object[]} The fields of the required type, or []
     */
    getFieldsByType(types) {
        const fields = this.fields
        if (Array.isArray(types) && types.length > 0) {
            return fields.filter(field => types.includes(field.type))
        } else {
            return fields.filter(field => field.type == types)
        }
    }

    /**
     * Get the fields which can be used for sorting
     * 
     * @returns {object[]} The list of sortable fields
     */
    getSortableFields() {
        return this.fields.filter(field => field.type != "password" && field.type != "link" && field.type != "attachment" && field.label && field.deleted != true)
    }

    /**
     * Get the fields which can be used for grouping
     * 
     * @returns {object[]} The list of groupable fields
     */
    getGroupableFields() {
        // return this.fields.filter(field => field.multiple != true && field.type != "link" && field.type != "attachment" && field.label && field.deleted != true)
        return this.fields.filter(field => field.type != "password" && field.type != "link" && field.type != "attachment" && field.label && field.deleted != true)
    }

    /**
     * Get the fields which can be used for filtering
     * 
     * @returns {object[]} The list of filterable fields
     */
    getFilterableFields() {
        return this.fields.filter(field => field.type != "link" && field.label && field.deleted != true)
    }

    /**
     * Get the fields which can be used inside a formula
     * @returns {object[]} The list of formula fields
     */
    getFormulaFields() {
        return this.fields.filter(field => {
            return field.type != "link" &&
                field.type != "attachment" &&
                field.label &&
                field.deleted != true &&
                field.isSystem != true &&
                field.isFromPlugin != true
        })
    }

    /**
     * Search inside a model which field links to a foreign model
     * 
     * @param {string} foreignModelId - Foreign model id
     * @returns {object} The <link> field that links to the foreign model
     */
    getLinkField(foreignModelId) {
        const fields = this.fields
        for (let field of fields) {
            if (field.type == "link") {
                if (field.link.modelId == foreignModelId) return field
            }
        }
        return null
    }

    /**
     * Get the fields which can be used for batch operations.
     * 
     * @returns {object[]} The list of fields
     */
    getBatchableFields() {
        return this.fields.filter(field => {
            return field.deleted != true &&
                field.isSystem != true &&
                // field.isFromPlugin != true &&
                field.computed != true &&
                !field.sourceFor &&
                field.type != "lookup" &&
                field.type != "summary" &&
                field.type != "attachment" &&
                field.type != "password" &&
                field.type != "selectViewColumn" &&
                field.type != "selectViewColumns" &&
                field.type != "link" &&
                field.type != "aiImage"
        })
    }

    /**
     * Generate link records between 2 models when their 2 given fields are equal.
     * 
     * Note: it does **not** save the links into the database.
     * It's up to the caller function to decide what to do with the links (create them or cancel)
     * 
     * @param {object} config
     * @param {object} config.foreignModelId
     * @param {object} config.sourceLinkFieldId
     * @param {object} config.sourceFieldId
     * @param {object} config.foreignLinkFieldId
     * @param {object} config.foreignFieldId
     * @returns {object[]} link records
     */
    async generateLinksToModel({
        foreignModelId,
        sourceLinkFieldId,
        sourceFieldId,
        foreignLinkFieldId,
        foreignFieldId
    }) {
        const localCollection = this.collection
        const foreignCollection = kiss.app.collections[foreignModelId]
        const localRecords = await localCollection.find({}, true)
        const foreignRecords = await foreignCollection.find({}, true)
        let links = []

        localRecords.forEach(localRecord => {
            foreignRecords.forEach(foreignRecord => {
                let localValue = localRecord[sourceFieldId]
                if (localValue == foreignRecord[foreignFieldId] && localValue !== "" && localValue !== undefined) {
                    links.push({
                        id: kiss.tools.uid(),
                        mX: this.id,
                        rX: localRecord.id,
                        fX: sourceLinkFieldId,
                        mY: foreignModelId,
                        rY: foreignRecord.id,
                        fY: foreignLinkFieldId,
                        auto: true // Tell it was created automatically. Can be used to rollback the process.
                    })
                }
            })
        })

        return links
    }

    /**
     * Delete all the links that were auto-generated for a given model.
     * 
     * @param {string} foreignModelId
     * @returns {integer} The number of deleted links
     */
    async deleteLinksToModel(foreignModelId) {
        const query = {
            $or: [{
                    mX: this.id,
                    mY: foreignModelId,
                    auto: true
                },
                {
                    mY: this.id,
                    mX: foreignModelId,
                    auto: true
                },
            ]
        }
        await kiss.app.collections.link.deleteMany(query)
    }

    /**
     * Connect the model to a foreign model using a <link> field.
     * 
     * To connect the 2 models, a symmetric <link> field is created in the foreign model.
     * 
     * @param {string} foreignModelId  - id of the foreign model to connect
     * @param {object} fieldSetup - Field setup
     * @returns {object} The generated foreign <link> field
     */
    async connectToModel(foreignModelId, fieldSetup) {
        const foreignModel = kiss.app.models[foreignModelId]
        const foreignLinkFields = foreignModel.getFieldsByType("link")

        log("kiss.data.Model - Connecting model " + this.name + " to model " + foreignModel.name)

        let foreignLinkFieldId = null
        let existingLinkField = null
        let foreignLinkFieldConfig = {}

        // First, check if a deleted link field already points to the same model.
        // If yes, just restore the field instead of creating a new one.
        foreignLinkFields.forEach(linkField => {
            if (linkField.link.modelId == this.id) existingLinkField = linkField
        })

        if (existingLinkField != null) {
            // A link field already exists: we update it
            log("kiss.data.Model - connectToModel: updating existing link in the foreign model " + foreignModel.name, 2)

            delete existingLinkField.deleted
            existingLinkField.link.field = fieldSetup.label
            existingLinkField.link.fieldId = fieldSetup.id

            // Restore the field in case it was deleted
            existingLinkField.deleted = false
            existingLinkField.hidden = false

            await foreignModel.updateField(existingLinkField.id, existingLinkField)
            foreignLinkFieldId = existingLinkField.id

        } else {
            // There is no link field: we create it
            log("kiss.data.Model - connectToModel: adding a new link field in the foreign model " + foreignModel.name, 2)

            foreignLinkFieldConfig = {
                id: kiss.tools.shortUid(),
                label: this.namePlural,
                type: "link",

                // Layout parameters
                display: "inline-flex",
                width: "100%",
                fieldWidth: "100%",
                labelWidth: "100%",
                labelPosition: "top",
                labelAlign: "left",

                link: {
                    model: this.name,
                    modelId: this.id,
                    field: fieldSetup.label,
                    fieldId: fieldSetup.id
                }
            }

            await foreignModel.addField(foreignLinkFieldConfig)
            foreignLinkFieldId = foreignLinkFieldConfig.id

            log("kiss.data.Model - Foreign link field config:", 2, foreignLinkFieldConfig)
        }

        // Update the local link field
        fieldSetup.deleted = fieldSetup.hidden = false
        fieldSetup.link.fieldId = foreignLinkFieldId
        await this.updateField(fieldSetup.id, fieldSetup)

        // Update model relationships
        this._defineRelationships()
        foreignModel._defineRelationships()

        return foreignLinkFieldConfig
    }

    /**
     * Create a new field configuration.
     * This method also updates the views that are connected to the model.
     * 
     * @async
     * @param {object} config - New field config
     * @param {string} [sectionId] - Optional section id. If provided, adds the field at the end this section
     * @returns {boolean} true in case of success
     */
    async addField(config, sectionId) {

        // const hasPermission = await this.checkPermission("update")
        // if (!hasPermission) return false

        // Enforce field id
        if (!config.id) config.id = kiss.tools.shortUid()

        // If the model doesn't have any section, adds the field at the end
        if (!this.hasSections()) {
            this.items.push(config)
        } else {
            if (!sectionId) {
                // No specific section is given to add the field: it is added at the end of the last section
                const lastSection = this.items[this.items.length - 1]
                lastSection.items.push(config)
            } else {
                // A specific section is given: we append the field to it
                this.items
                    .find(section => section.id == sectionId)
                    .items
                    .push(config)
            }
        }

        // Recompute formulas
        this._initComputedFields()

        // Update the model's record which is stored in db
        await this.saveItems()

        // Update the fields
        this._initFields()

        // Computed fields need to be computed on every record
        if (config.computed) await this.updateFieldFormula(config.id)

        // Get all the views that display this model and update them
        await this.syncViewsWithModelFields()

        // For offline apps, re-compute relationships locally
        if (kiss.session.isOffline()) {
            this._defineRelationships()
        }

        // Reset the context
        kiss.context.addFieldToSectionId = null

        return true
    }

    /**
     * Check if the model has sections.
     * 
     * @returns {boolean}
     */
    hasSections() {
        const modelSections = this.items.filter(item => item.type == "panel")
        return (modelSections.length > 0)
    }

    /**
     * Update a field configuration.
     * This method also updates the views that are connected to the model.
     * 
     * @async
     * @param {string} fieldId 
     * @param {object} config - New field config
     * @param {boolean} shouldUpdateFormula - If true, re-compute the field value on every record of the collection
     * @returns {boolean} true in case of success
     */
    async updateField(fieldId, config, shouldUpdateFormula) {

        // const hasPermission = await this.checkPermission("update")
        // if (!hasPermission) return false

        // Update the model's field
        this._updateItemInTree(this, fieldId, config)

        // Recompute formulas
        this._initComputedFields()

        // Update the model's record which is stored in db
        await this.saveItems()

        // Update the fields
        this._initFields()

        // Computed field need to update their values (100% server-side process)
        if (shouldUpdateFormula) await this.updateFieldFormula(fieldId)

        // Get all the views that display this model and update them
        await this.syncViewsWithModelFields()

        // For offline apps, re-compute relationships locally
        if (kiss.session.isOffline()) {
            this._defineRelationships()
        }

        return true
    }

    /**
     * Recompute the computed field value on every record of the collection.
     * 
     * @async
     */
    async updateFieldFormula() {
        if (kiss.session.isOffline()) {
            await kiss.data.relations.updateAllDeep(this.id)
        } else {
            await kiss.ajax.request({
                showLoading: true,
                url: "/command/computedFields/updateAllDeep",
                method: "post",
                body: JSON.stringify({
                    modelId: this.id
                })
            })
        }
    }

    /**
     * Delete a field configuration and update all the views that are connected to this model.
     * A primary field can't (and must not) be deleted.
     * 
     * @async
     * @param {string} fieldId
     * @returns {boolean} false if the field couldn't be deleted (primary field)
     */
    async deleteField(fieldId) {
        const field = this.getField(fieldId)

        log(`kiss.data.Model - deleteField: ${fieldId} / ${field.label}`)

        if (field.primary == true) {
            log("kiss.data.Model - deleteField: could not delete primary field", 3)
            return false
        }

        field.deleted = true
        await this.updateField(fieldId, field)

        // Update the fields property
        this._initFields()

        return true
    }

    /**
     * Creates the first form section, at the top of the form
     * 
     * @ignore
     * @param {object} config - Section configuration
     * @returns {string} The new section id
     */
    async createFirstSection(config) {
        const newSectionId = kiss.tools.shortUid()
        const newSection = {
            id: newSectionId,
            type: "panel",
            icon: config.icon || "far fa-file-alt",
            title: config.title || "Section",
            collapsible: true,
            collapsed: config.collapsed,
            colored: config.colored,
            acl: config.acl,
            items: this.items
        }
        this.items = [newSection]
        await this.saveItems()

        // Update items & fields
        this._initItems(this.items)
        this._initFields()

        return newSectionId
    }

    /**
     * Creates a new section just before the item passed as a parameter 
     * 
     * @ignore
     * @param {object} config - Section configuration
     * @param {string} breakItemId - Item id where to break the form
     * @returns {string|boolean} The new section id, or false if it did not succeed
     */
    async createSection(config, breakItemId) {
        const sections = this.items

        // Explore the model to find the section and break index
        let breakIndex
        let sectionIndex

        sections.forEach((section, index) => {
            const itemIndex = section.items.findIndex(item => item.id == breakItemId)
            if (itemIndex != -1) {
                breakIndex = itemIndex
                sectionIndex = index
            }
        })

        // Can't insert a section immediately after an existing section!
        if (breakIndex == 0) return false

        // Rebuild a new section after the break index
        const fieldsInPreviousSection = sections[sectionIndex].items.slice(0, breakIndex)
        const fieldsInNewSection = sections[sectionIndex].items.slice(breakIndex)
        sections[sectionIndex].items = fieldsInPreviousSection

        const newSectionId = kiss.tools.shortUid()
        const newSection = {
            id: newSectionId,
            type: "panel",
            icon: config.icon || "far fa-file-alt",
            title: config.title || "Section",
            collapsible: true,
            collapsed: config.collapsed,
            colored: config.colored,
            accessRead: config.accessRead,
            accessUpdate: config.accessUpdate,
            acl: config.acl,
            items: fieldsInNewSection
        }

        sections.splice(sectionIndex + 1, 0, newSection)

        this.items = sections
        await this.saveItems()

        // Update items & fields
        this._initItems(this.items)
        this._initFields()

        return newSectionId
    }

    /**
     * Check if an item is the first in its section.
     * (used to perform checks in the form builder)
     * 
     * @param {string} itemId
     * @returns {boolean}
     */
    isFirstItemInSection(itemId) {
        if (!this.hasSections()) return false

        let breakIndex
        const sections = this.items

        sections.forEach((section, index) => {
            const itemIndex = section.items.findIndex(item => item.id == itemId)
            if (itemIndex != -1) {
                breakIndex = itemIndex
            }
        })

        // Can't insert a section immediately after an existing section!
        if (breakIndex === 0) return true
        return false
    }

    /**
     * Update a section configuration
     * 
     * @async
     * @param {string} sectionId
     * @param {object} newSectionConfig 
     */
    async updateSection(sectionId, newSectionConfig) {
        // Update the model's field
        this._updateItemInTree(this, sectionId, newSectionConfig)

        // Update the model's record which is stored in db
        await this.saveItems()

        // Update items & fields
        this._initItems(this.items)
        this._initFields()
    }

    /**
     * Delete a section, and move its items into the previous section.
     * The method doesn't allow to delete the 1st section.
     * 
     * @ignore
     * @param {string} sectionId 
     * @returns {boolean} false if the section id could not be found
     */
    async deleteSection(sectionId) {
        for (let i = 0; i < this.items.length; i++) {
            const section = this.items[i]

            if (section.id == sectionId) {
                const fieldsToMove = section.items
                let previousSection = this.items[i - 1]
                let nextSection = this.items[i + 1]

                if (i == 0) {
                    if (nextSection) {
                        // Move items to next section, if there is one
                        nextSection.items.splice(0, 0, ...fieldsToMove)
                        this.items.splice(i, 1)
                    } else {
                        // Otherwise, there are no sections anymore
                        this.items = fieldsToMove
                    }
                } else {
                    // Move items to previous section
                    previousSection.items.splice(previousSection.items.length, 0, ...fieldsToMove)
                    this.items.splice(i, 1)
                }

                await this.saveItems()

                // Update items & fields
                this._initItems(this.items)
                this._initFields()

                return true
            }
        }
    }

    /**
     * Move a section from a position to another (move "up" or "down")
     * 
     * @ignore
     * @param {string} sectionId 
     * @param {string} direction - "up" | "down"
     * @returns {boolean} false if the section id could not be found
     */
    async moveSection(sectionId, direction) {
        const fromIndex = this.items.findIndex(section => section.id == sectionId)
        if (fromIndex == -1) return false

        const toIndex = (direction == "down") ? fromIndex + 1 : fromIndex - 1

        // Switch section positions
        const tempSection = this.items[fromIndex]
        this.items[fromIndex] = this.items[toIndex]
        this.items[toIndex] = tempSection

        await this.saveItems()
        return true
    }

    /**
     * Get a section by id
     * 
     * Note: if the section is not found, the method tries to find the section by its title
     * 
     * @param {string} fieldId
     * @returns {object} The section definition
     * 
     * @example
     * let mySection = myModel.getSection("General informations")
     * 
     * // Returns...
     * {
     *      id: "aE7x450",
     *      title: "General informations",
     *      items: [
     *          // ... Section items
     *      ]
     * }
     */
    getSection(sectionId) {
        let section = this.items.find(section => section.id == sectionId)
        if (section) return section
        return this.getSectionByTitle(sectionId)
    }

    /**
     * Get the first section matching a title.
     * 
     * Note: if the section title is not found, it defaults to searching the section id
     * 
     * @param {string} sectionTitle
     * @returns {object} The section definition
     * 
     * @example
     * let mySection = myModel.getSectionByTitle("General informations")
     */
    getSectionByTitle(sectionTitle) {
        let section = this.items.find(section => section.title && section.title.toLowerCase() == sectionTitle.toLowerCase())
        if (section) return section

        section = this.items.find(section => section.id.toLowerCase() == sectionTitle.toLowerCase())
        return section
    }

    /**
     * Get all the views that are connected to this model
     * 
     * @returns {Record[]} Array of records containing the view configurations
     */
    getViews() {
        const viewCollection = kiss.app.collections.view
        if (!viewCollection) return

        const viewRecords = viewCollection.records
        const modelViews = viewRecords.filter(view => view.modelId == this.id)
        return modelViews
    }

    /**
     * Get the views a user is allowed to access.
     * 
     * A user can see a view if:
     * - he is the account owner
     * - he is the view creator
     * - the view read access is allowed to all authenticated users
     * - he is mentionned in the field "accessRead"
     * 
     * @param {string} userId 
     * @returns {object[]} The list of authorized views
     */
    getViewsByUser(userId) {
        const views = this.getViews()
        const userACL = kiss.directory.getUserACL(userId)

        // Account owner always sees all the views
        if (kiss.session.isOwner) return views

        return views.filter(view => {
            return !!view.authenticatedCanRead == true || kiss.tools.intersects(view.accessRead, userACL) || view.createdBy == userId
        })
    }

    /**
     * Discover dynamically the relationships with foreign models.
     * 
     * Call this method once your models are loaded and available into kiss.app.models.
     * 
     * @private
     * @ignore
     * @returns {object} - Relationships with linked foreign models
     */
    _defineRelationships() {
        const modelProblems = []
        this.sourceFor = this.sourceFor || []
        const fields = this.fields.filter(field => !field.deleted)

        // Parse connections established by "link" fields
        fields.filter(field => field.type == "link").forEach(field => {
            try {
                let targetLinkModel = kiss.app.getModel(field.link.modelId || field.link.model)

                // Show the relationships in the console
                let hasMany = field.multiple
                let toModel = (hasMany) ? targetLinkModel.namePlural : targetLinkModel.name
                // log(`kiss.data.Model - ${this.name.padEnd(40, " ")} -> ${(hasMany) ? "N" : "1"} ${toModel.padEnd(40, " ")}` + " (link field: " + field.label + ")")

            } catch (err) {
                // Problem, the foreign model does not exist
                field.type = "text"
                // modelProblems.push(`kiss.data.Model - The link field <${this.name + " / " + field.label}> points to a foreign model that can't be found`)
            }
        })

        // Parse connections established by "lookup" fields
        fields.filter(field => field.type == "lookup").forEach(field => {
            try {
                // Get the field to lookup in the foreign model
                let lookupLinkField = this.getField(field.lookup.linkId || field.lookup.link)
                let lookupLinkedModel = kiss.app.models[lookupLinkField.link.modelId]
                let lookupSourceField = lookupLinkedModel.getField(field.lookup.fieldId || field.lookup.field)

                // The foreign model is a source for this one
                lookupLinkedModel.sourceFor = (lookupLinkedModel.sourceFor || []).concat(this.id).unique()

                // Link model => foreign model
                field.lookup.linkId = lookupLinkField.id
                field.lookup.fieldId = lookupSourceField.id
                field.lookup.type = lookupSourceField.type
                if (field.lookup.type == "number") field.precision = lookupSourceField.precision

                // Link foreign model => model
                lookupSourceField.sourceFor = lookupSourceField.sourceFor || []
                let newSource = {
                    modelId: this.id,
                    modelName: this.name,
                    fieldId: field.id,
                    fieldName: field.label,
                    type: "lookup"
                }

                if (!lookupSourceField.sourceFor.includesObject(newSource)) lookupSourceField.sourceFor.push(newSource)
                lookupSourceField.sourceFor = lookupSourceField.sourceFor.uniqueObject("fieldId")

            } catch (err) {
                // Problem, the foreign model does not exist
                field.type = "text"
                // modelProblems.push(`kiss.data.Model - The lookup field <${this.name + " / " + field.label}> points to a model that can't be found`)
            }
        })

        // Parse connections established by "summary" fields
        fields.filter(field => field.type == "summary").forEach(field => {
            try {
                // Get the field to summarize in the foreign model
                let summaryLinkField = this.getField(field.summary.linkId || field.summary.link)
                let summaryLinkModel = kiss.app.models[summaryLinkField.link.modelId]
                let summaryField = summaryLinkModel.getField(field.summary.field || field.summary.fieldId)

                // The foreign model is a source for this one
                summaryLinkModel.sourceFor = (summaryLinkModel.sourceFor || []).concat(this.id).unique()

                // Link model => foreign model
                field.summary.linkId = summaryLinkField.id
                field.summary.fieldId = summaryField.id
                field.summary.type = summaryField.type
                if (field.summary.type == "number") field.precision = summaryField.precision

                // Link foreign model => model
                summaryField.sourceFor = summaryField.sourceFor || []
                let newSource = {
                    modelId: this.id,
                    modelName: this.name,
                    fieldId: field.id,
                    fieldName: field.label,
                    type: "summary"
                }

                if (!summaryField.sourceFor.includesObject(newSource)) summaryField.sourceFor.push(newSource)
                summaryField.sourceFor = summaryField.sourceFor.uniqueObject("fieldId")

            } catch (err) {
                // Problem, the foreign model does not exist
                field.type = "text"
                // modelProblems.push(`kiss.data.Model - The summary field <${this.name + " / " + field.label}> points to a model that can't be found`)
            }
        })

        // Clean the list of foreign models that depends on this one for computed fields
        this.sourceFor = this.sourceFor.unique()

        modelProblems.forEach(warning => log(warning))
    }

    /**
     * Export the model definition as JSON.
     * 
     * This is useful to be able to import/export pre-built application templates.
     */
    exportAsJSON() {
        return {
            id: this.id,
            name: this.name,
            namePlural: this.namePlural,
            language: kiss.language.current,
            icon: this.icon,
            color: this.color,
            fullscreen: !!this.fullscreen,
            items: this.items.map(section => {
                section.items = section.items.filter(item => !item.deleted).map(this._sanitizeFieldProperties)

                // Neutralize ACL
                section.accessRead = ["*"]
                section.accessUpdate = ["*"]
                return section
            }),
            features: this.features,

            // Neutralize ACL
            authenticatedCanCreate: true,
            authenticatedCanRead: true,
            authenticatedCanUpdate: true,
            authenticatedCanDelete: true,
            ownerCanManage: true,
            accessCreate: [],
            accessRead: [],
            accessUpdate: [],
            accessDelete: [],
            accessManage: []
        }
    }

    /**
     * Notify the user about a change that has been made by someone else
     * 
     * @private
     * @ignore
     * @param {object} msgData - The original pubsub message
     */
    _notifyUser(msgData) {
        if (msgData.userId == kiss.session.getUserId()) return

        let msgEvent
        let object

        if (msgData.channel == "EVT_DB_UPDATE_BULK") {
            msgEvent = txtTitleCase("#msg update")
            object = "#some data"
        } else {
            const event = msgData.channel.split(":")[0]
            const modelId = msgData.channel.split(":")[1]

            if (event.includes("INSERT")) msgEvent = txtTitleCase("#msg insert")
            else if (event.includes("UPDATE")) msgEvent = txtTitleCase("#msg update")
            else if (event.includes("DELETE")) msgEvent = txtTitleCase("#msg delete")

            if (kiss.tools.isUid(modelId.toLowerCase())) object = "#a record"
            else if (modelId == "VIEW") object = "#a view"
            else if (modelId == "MODEL") object = "#a model"
            else object = "#some data"
        }

        createNotification({
            message: txtTitleCase(
                msgEvent, null, {
                    user: kiss.directory.getEntryName(msgData.userId),
                    object: txt(object)
                }
            ),
            top: () => kiss.screen.current.height - 50,
            left: 10,
            height: "40px",
            padding: "0px",
            animation: "slideInUp",
            duration: 4000
        })
    }

    /**
     * Update an item in the nested model's config
     * 
     * @private
     * @ignore
     * @param {object} node - Root node to explore
     * @param {string} itemId - Id of the field to update
     * @param {object} config - New field config
     */
    _updateItemInTree(node, itemId, config) {
        if (node.id == itemId) {
            Object.assign(node, config)
        } else if (node.items) {
            for (let i = 0; i < node.items.length; i++) {
                this._updateItemInTree(node.items[i], itemId, config)
            }
        }
    }

    /**
     * Sanitize field properties before exporting Model (as JSON)
     * 
     * @private
     * @ignore
     * @param {object} field - Field JSON definition
     * @returns {object} The sanitized field definition
     */
    _sanitizeFieldProperties(field) {
        delete field.acl

        // Reset field formulas
        delete field.formulaSourceFields
        delete field.formulaSourceFieldIds

        if ((field.type == "lookup") || (field.type == "summary")) delete field.formula

        // Reset relations
        delete field.sourceFor
        if (field.type == "link") delete field.link.model

        // Reset DOM specific properties
        delete field.target

        // Sort props alphabetically
        let exportedField = {}
        Object.keys(field)
            .sortAlpha()
            .forEach(property => exportedField[property] = field[property])

        return exportedField
    }

    /**
     * Get a field type
     * 
     * Specific field types like "lookup" and "summary" have to be converted to the type of the fields they point to.
     * For example, if a "lookup" field is getting the value of a "number" field, the "real" field type is "number"
     * 
     * Warning:
     * - this method doesn't return the field data type.
     * - field type and field data type are 2 different things: a field which type is "checkbox" has a "boolean" data type.
     * 
     * @private
     * @ignore
     * @param {object} field
     * @returns {string} The field type: "text", "number", "date", "checkbox", "select"...
     */
    getFieldType(field) {
        if (field.type == "lookup") {
            return field.lookup.type
        } else if (field.type == "summary") {
            return field.summary.type
        } else {
            return field.type || "text"
        }
    }

    /**
     * Transform the fields "semantic" formulae into some formulae ready to be evaluated.
     * 
     * @private
     * @ignore
     * @returns this
     * 
     * @example
     * formula: {{income}} * 12
     */
    _initComputedFields() {
        this.computedFields = []
        const fields = this.getActiveFields()

        for (let i = 0; i < fields.length; i++) {
            let field = fields[i]

            if (field.computed) {
                // Add this field to the list of computed fields
                this.computedFields.push(field.id)

                // Keep in cache the field dependencies of the formula:
                // - field names
                field.formulaSourceFields = kiss.tools.findTags(field.formula)

                // - field ids
                field.formulaSourceFieldIds = (field.formulaSourceFieldIds || [])
                    .concat(
                        field.formulaSourceFields.map(sourceFieldName => {
                            let sourceField
                            const fieldIndex = Number(sourceFieldName)
                            const isFieldIndex = Number.isInteger(fieldIndex)

                            if (isFieldIndex) {
                                sourceField = fields[fieldIndex]
                            } else {
                                sourceField = this.getFieldByLabel(sourceFieldName)
                            }

                            if (sourceField) return sourceField.id
                            return sourceFieldName
                        })
                    )
                    .unique()
            }
        }
        return this
    }

    /**
     * Check if the field labels used in the formula are still valid.
     * If not, returns the list of invalid field labels.
     * 
     * @param {string} fieldId 
     * @returns {string[]} Array with the wrong field labels (empty if OK)
     */
    checkFormula(formula) {
        const tags = kiss.tools.findTags(formula)
        let errorFields = []

        tags.forEach(fieldLabel => {
            const field = this.getFieldByLabel(fieldLabel)
            if (!field) errorFields.push(fieldLabel)
        })

        return errorFields
    }
}

;