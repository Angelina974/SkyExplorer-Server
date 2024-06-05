/**
 * 
 * kiss.app
 * 
 */
const config = require("../config")

module.exports = {
    models: {},
    accounts: {},
    formTemplates: [],
    appTemplates: [],

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
            log.ack(`kiss.app - defineTexts - Loaded ${Object.keys(texts).length} translated texts`)
        }
    },

    /**
     * Define a model
     * 
     * @param {object} model
     * @returns {object} The new model instance
     */
    defineModel(model) {
        return new kiss.data.Model(model)
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
     * Get all the models of a specific account
     * 
     * @param {string} accountId 
     * @returns {object[]} The list of account models
     */
    getAccountModels(accountId) {
        return Object.values(kiss.app.models).filter(model => model.accountId == accountId)
    },

    /**
     * Get all the collections stats of an account
     * 
     * @param {string} accountId 
     * @returns {object[]} Array of stats
     */
    async getAccountStats(accountId) {
        const accountModels = this.getAccountModels(accountId)
        let stats = []
        for (model of accountModels) stats.push(await kiss.db.getCollectionStats(model.id))
        return stats
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
     * Get the fields of a model
     * 
     * @param {object} modelItems  - Raw model config
     * @returns {object[]} Array of field definitions
     */
    getFields(modelItems) {
        const fields = kiss.app.getModelFields(modelItems)
        return fields.map(field => {
            const fieldConfig = {
                id: field.id,
                label: field.label,
            }

            if (field.type) fieldConfig.type = field.type
            if (field.sourceFor) fieldConfig.sourceFor = field.sourceFor
            if (field.formulaSourceFieldIds) fieldConfig.formulaSourceFieldIds = field.formulaSourceFieldIds

            if (field.type == "link") fieldConfig.link = field.link
            if (field.type == "lookup") fieldConfig.lookup = field.lookup
            if (field.type == "summary") fieldConfig.summary = field.summary

            return fieldConfig
        })
    },

    /**
     * Get the field ids of a model
     * 
     * @param {object} modelItems - Raw model config
     * @returns {string[]} Array of ids
     */
    getFieldIds(modelItems) {
        const defaultAcceptedFields = ["id", "accessRead", "accessUpdate", "accessDelete", "accessManage", "createdAt", "createdBy", "updatedAt", "updatedBy", "deletedAt", "deletedBy"]
        const acceptedFields = kiss.app.getModelFields(modelItems).map(field => field.id)
        return defaultAcceptedFields.concat(acceptedFields)
    },

    /**
     * Update a model in server cache
     * 
     * @param {string} modelId 
     * @param {object} update 
     */
    updateModel(modelId, update) {
        if (!kiss.app.models[modelId]) {
            log("kiss.app - updateModel - Couldn't find the model to update: " + modelId)
        }

        Object.keys(update).forEach(property => {
            if (property == "items") {
                kiss.app.models[modelId]
                    ._initItems(update[property])
                    ._initFields()
                    ._initComputedFields()
                    ._initAcceptedFields()
                    ._defineRelationships()
            } else {
                kiss.app.models[modelId][property] = update[property]
            }
        })
    },

    /**
     * Parse the model items and extract the fields
     * (model items are not necessary fields as KissJS models also contain UI components)
     * 
     * @param {object[]} items 
     * @returns {string[]} Array of item ids
     */
    getModelFields(items) {
        const values = []
        items.forEach(item => {
            if (item.items) values.push(kiss.app.getModelFields(item.items))
            else values.push(item)
        })
        return [].concat.apply([], values)
    },

    /**
     * Load all accounts into server cache
     */
    async loadAccounts() {
        const accounts = await kiss.db.find("account", {})
        accounts.forEach(account => {
            kiss.directory.accounts[account.id] = account
        })

        log.ack(`kiss.app - loadAccounts - ${accounts.length} accounts loaded`)
    },

    /**
     * Load all API clients tokens into server cache
     */
    async loadApiClientTokens() {
        const apiTokens = await kiss.db.find("apiClient", {})
        apiTokens.forEach(apiToken => {
            kiss.global.tokens[apiToken.id] = apiToken.token
        })

        log.ack(`kiss.app - loadApiClientTokens - ${apiTokens.length} API client tokens loaded`)
    },    

    /**
     * Load dynamic models from the db
     */
    async loadDynamicModels() {
        const models = await kiss.db.find("model", {})
        const referenceModel = kiss.app.models["model"]

        if (referenceModel) {
            const dynamicACL = referenceModel.acl

            models.forEach(model => {
                model.acl = dynamicACL
                kiss.app.defineModel(model)
            })
    
            log.ack("kiss.app - loadDynamicModels - " + models.length + " models loaded")
        }
    },

    /**
     * Load dynamic links from the db
     */
    async loadDynamicLinks() {
        kiss.global.links = {}
        const accounts = await kiss.db.find("account", {})
        let count = 0

        for (let account of accounts) {
            const linkCollectionId = (config.multiTenant === "false") ? "link" : "link_" + account.id
            let links = await kiss.db.find(linkCollectionId)
            kiss.global.links[account.id] = links
            count += links.length
        }

        log.ack(`kiss.app - ${count} links loaded from ${accounts.length} accounts`)
    },

    /**
     * Add a dynamic link to the cache
     * 
     * @param {object} link 
     * @param {string} accountId 
     */
    addLink(link, accountId) {
        if (!kiss.global.links[accountId]) kiss.global.links[accountId] = []
        kiss.global.links[accountId].push(link)
    },

    /**
     * Delete a dynamic link from the cache
     * 
     * @param {string} linkId 
     * @param {string} accountId 
     * @returns 
     */
    deleteLink(linkId, accountId) {
        // Links are stored by creation date
        // Statistically, we have more chance to delete a link recently used
        let links = kiss.global.links[accountId]
        for (let i = links.length - 1; i >= 0; i--) {
            if (links[i].id == linkId) {
                kiss.global.links[accountId].splice(i, 1)
                return
            }
        }
    },

    /**
     * Define the model relationships
     * 
     * This methods explores all the dynmaic models and finds automatically the relationships between them.
     * When exploring the models, specific field types are generating the relationships:
     * - **link**: field used to link one or many foreign records
     * - **lookup**: field that lookups a field in a foreign record
     * - **summary**: field that lookups and summarize data from multiple foreign records
     * 
     * @example
     * kiss.app.defineModelRelationships()
     */
    defineModelRelationships() {
        Object.values(kiss.app.models).forEach(model => {

            // In single tenant mode, all models are linked to the same account
            if (config.multiTenant === "false") {
                model.accountId = config.singleTenantId
            }

            model._defineRelationships()
        })
    },

    /**
     * Define a new application template from a JSON config.
     * Application templates are used as blueprints to genereta new applications.
     * 
     * @param {object} config - JSON configuration
     */
    defineApplicationTemplate(config) {
        kiss.app.appTemplates.push(config)
    },

    /**
     * Initialize interactive mode to be able to enter javascript commands in the server console.
     * Only use while debugging the server.
     */
    initInteractiveMode() {
        const readline = require("readline")
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: ">> "
        })

        rl.prompt()

        rl.on("line", (input) => {
            try {
                const result = eval(input)
                log(result)

            } catch (error) {
                log.err("Error:", error.message)
            }

            rl.prompt()

        }).on("close", () => {
            process.exit(0)
        })
    },

    /**
     * Get main cache elements
     */
    getCache() {
        let linksCount = 0
        let accountsCount = 0

        Object.keys(kiss.directory.accounts).forEach(accountId => {
            // Accounts
            accountsCount++

            // Links
            let links = kiss.global.links[accountId]
            if (links) linksCount += links.length
        })

        // Users
        let users = []
        Object.keys(kiss.directory.users).forEach(accountId => {
            let accountUsers = kiss.directory.users[accountId]
            if (accountUsers) {
                let emails = Object.keys(accountUsers)
                users.push(...emails)
            }
        })

        // Groups
        let groups = []
        Object.keys(kiss.directory.groups).forEach(accountId => {
            let accountGroups = kiss.directory.groups[accountId]
            if (accountGroups) {
                let groupIds = Object.keys(accountGroups)
                groups.push(...groupIds)
            }
        })

        return {
            accounts: accountsCount,
            users: users.unique().length,
            groups: groups.length,
            models: Object.keys(kiss.app.models).length,
            links: linksCount
        }
    },

    /**
     * Reset main cache elements
     */
    async resetCache() {
        kiss.directory.accounts = {}
        kiss.directory.users = {}
        kiss.directory.groups = {}
        kiss.global.links = {}

        await kiss.app.loadDynamicModels()
        await kiss.app.defineModelRelationships()
        await kiss.app.loadDynamicLinks()
        await kiss.directory.init()
    }
}