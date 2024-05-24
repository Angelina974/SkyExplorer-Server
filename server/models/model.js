kiss.app.defineModel({
    id: "model",
    name: "Model",
    namePlural: "Models",
    icon: "fas fa-clipboard-list",
    color: "#00aaee",

    items: [{
            id: "createdAt",
            label: "#createdAt",
            type: "date",
            dataType: Date,
            acl: {
                update: false
            }
        },
        {
            primary: true,
            id: "name",
            label: "#name",
            dataType: String,
            required: true
        },
        {
            id: "namePlural",
            dataType: String,
            required: true
        },
        {
            id: "fullscreen",
            label: "#fullscreen",
            type: "checkbox",
            shape: "switch",
            dataType: Boolean
        },
        {
            id: "align",
            type: "select",
            options: ["center", "right"],
            dataType: String,
            value: "center"
        },        
        {
            id: "icon",
            label: "#icon",
            type: "icon",
            dataType: String,
            value: "fas fa-th"
        },
        {
            id: "color",
            label: "#color",
            type: "color",
            dataType: String,
            value: "#00aaee"
        },
        {
            id: "backgroundColor",
            type: "color",
            dataType: String,
            value: "#ffffff"
        },
        {
            id: "items",
            dataType: [Object],
            required: true
        },
        {
            id: "features",
            dataType: Object
        },
        {
            id: "form",
            dataType: [Object]
        },
        {
            id: "applicationId", // The model was originally created inside this application
            dataType: String
        },
        {
            id: "public",
            label: "#public",
            type: "checkbox",
            shape: "switch",
            iconColorOn: "#20c933",
            dataType: Boolean
        },
        {
            id: "publicEmailTo",
            type: "directory",
            multiple: true,
            dataType: [String]
        },
        {
            id: "publicFormActionId",
            type: "text",
            dataType: String
        },
        {
            id: "publicFormHeader",
            type: "checkbox",
            dataType: Boolean
        },
        {
            id: "publicFormWidth",
            type: "text",
            dataType: String
        },
        {
            id: "publicFormMargin",
            type: "text",
            dataType: String
        },
        {
            id: "authenticatedCanCreate",
            label: "#authenticatedCanCreate",
            type: "checkbox",
            shape: "switch",
            iconColorOn: "#20c933",
            dataType: Boolean
        },
        {
            id: "accessCreate",
            label: "#accessCreate",
            type: "directory",
            multiple: true,
            roles: ["everyone"],
            dataType: [String],
            isACL: true
        },
        {
            id: "authenticatedCanRead",
            label: "#authenticatedCanRead",
            type: "checkbox",
            shape: "switch",
            iconColorOn: "#20c933",
            dataType: Boolean
        },
        {
            id: "accessRead",
            // label: "#accessRead",
            type: "directory",
            multiple: true,
            dataType: [String],
            isACL: true
        },
        {
            id: "authenticatedCanUpdate",
            label: "#authenticatedCanUpdate",
            type: "checkbox",
            shape: "switch",
            iconColorOn: "#20c933",
            dataType: Boolean
        },
        {
            id: "accessUpdate",
            label: "#accessUpdate",
            type: "directory",
            multiple: true,
            roles: ["creator", "nobody"],
            dataType: [String],
            isACL: true
        },
        {
            id: "authenticatedCanDelete",
            label: "#authenticatedCanDelete",
            type: "checkbox",
            shape: "switch",
            iconColorOn: "#20c933",
            dataType: Boolean
        },
        {
            id: "accessDelete",
            label: "#accessDelete",
            type: "directory",
            multiple: true,
            roles: ["creator", "nobody"],
            dataType: [String],
            isACL: true
        },
        {
            id: "ownerCanManage",
            label: "#ownerCanManage",
            type: "checkbox",
            shape: "switch",
            iconColorOn: "#20c933",
            dataType: Boolean
        },
        {
            id: "accessManage",
            label: "#accessManage",
            type: "directory",
            multiple: true,
            dataType: [String],
            isACL: true
        },
        {
            id: "templateId",
            dataType: "string"
        }
    ],

    acl: {
        permissions: {
            create: [{
                    isOwner: true
                },
                {
                    isManager: true
                },
                {
                    isApplicationDesigner: true
                }
            ],
            update: [{
                    isOwner: true
                },
                {
                    isManager: true
                },
                {
                    isModelManager: true
                }
            ],
            // TODO
            // delete: [{
            //     isDeleter: true
            // }]
        },

        validators: {
            async isOwner({
                req
            }) {
                return (kiss.isServer) ? req.token.isOwner : kiss.session.isAccountOwner()
            },

            async isManager({
                req
            }) {
                return (kiss.isServer) ? req.token.isManager : kiss.session.isAccountManager()
            },

            // Role to CREATE new models in the application
            // Only possible if the user is a designer of the host application
            async isApplicationDesigner({
                userACL,
                model,
                record,
                req
            }) {
                // Get the host application
                const applicationId = record.applicationId
                let applicationRecord

                if (kiss.isServer) {
                    applicationRecord = await kiss.db.findOne("application", {
                        _id: applicationId
                    })
                } else {
                    applicationRecord = await kiss.app.collections.application.findOne(applicationId)
                }

                if (!applicationRecord) return false

                // Only the owner can update the target application
                if (applicationRecord.ownerCanUpdate == true) return false

                // Access is not defined
                if (applicationRecord.accessUpdate == undefined) return false

                // Other people can update the target application
                return kiss.tools.intersects(userACL, applicationRecord.accessUpdate)
            },

            // Role to MANAGE existing models in the application
            async isModelManager({
                userACL,
                model,
                record,
                req
            }) {
                // Only the owner can manage the model
                if (record.ownerCanManage == true) return false

                // Access is not defined
                if (record.accessManage == undefined) return false

                // Other people can manage the model
                if (kiss.tools.intersects(userACL, record.accessManage)) return true

                return false
            }
        }
    },

    methods: {
        /**
         * Get all the views that are connected to this model
         * 
         * @returns {Record[]} Array of records containing the view configurations
         */
        getViews() {
            const viewCollection = kiss.app.collections.view
            if (!viewCollection) return

            const viewRecords = viewCollection.records
            return viewRecords.filter(view => view.modelId == this.id)
        },

        /**
         * Get the views a user is allowed to access.
         * 
         * A user can see a view if:
         * - he is the account owner
         * - he is the view creator
         * - the view allows all authenticated users
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
        },

        /**
         * Update a feature configuration
         * 
         * @param {string} featureId 
         * @param {object} config 
         */
        async updateFeature(featureId, config) {
            if (!this.features) this.features = {}
            this.features[featureId] = config
            await this.update({
                features: this.features
            })
        },

        /**
         * Toggle a feature (like Workflow, Comments, ...)
         * 
         * @param {string} featureId 
         */
        async toggleFeature(featureId) {
            if (!this.features) this.features = {}

            let feature = this.features[featureId]
            if (!feature) this.features[featureId] = {}

            const featureStatus = this.features[featureId].active
            if (featureStatus) {
                this.features[featureId].active = false
            } else {
                this.features[featureId].active = true
            }

            // Sync models cache (kiss.app.models) with model's record
            // Note that toggling a feature can also impact the model's fields
            kiss.app.models[this.id].features = this.features

            const featurePlugin = kiss.plugins.get(featureId)
            if (featurePlugin.fields) {
                kiss.app.models[this.id]._initFields()
            }

            await this.update()

            // Dispatch changes on relative views
            if (featurePlugin.fields) {
                await kiss.app.models[this.id].syncViewsWithModelFields()
            }
        },

        /**
         * Get the list of model's active features
         * 
         * @returns {string[]} Array of feature ids
         */
        getActiveFeatures() {
            return Object.keys(this.features).filter(featureId => {
                return this.features[featureId].active == true
            })
        },

        /**
         * Create a Microsoft Word Template attached to this model
         */
        async createWordTemplate() {
            let template = kiss.app.models.pluginWordTemplate.create({
                id: uid(),
                modelId: this.id,
                name: txtTitleCase("document"),
                output: ["pdf"],
                icon: "far fa-file-word",
                active: true
            })

            await template.save()

            kiss.context.wordTemplateId = template.id
            kiss.views.show("setup-word-template")
        },

        /**
         * Open the window to import XLS or CSV data into an existing table
         */
        async importData() {
            // This feature is not available offline
            if (kiss.session.isOffline()) {
                return kiss.tools.featureNotAvailable()
            }

            const importConfig = kiss.app.models.import.create({
                id: uid(),
                name: (new Date()).toISOString(),
                modelId: this.id,
                file: []
            })
            await importConfig.save()

            kiss.context.importId = importConfig.id
            kiss.context.importModelId = this.id
            kiss.views.show("import-properties")
        }
    }
});