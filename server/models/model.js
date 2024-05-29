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
    }
});