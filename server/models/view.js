kiss.app.defineModel({
    id: "view",
    name: "View",
    namePlural: "Views",
    icon: "fas fa-table",
    color: "#ed3757",

    items: [
        {
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
            type: "text",
            dataType: String
        },
        {
            id: "description",
            dataType: String
        },
        {
            id: "applicationIds",
            dataType: [String]
        },
        {
            id: "modelId",
            label: "#form",
            dataType: String,
            acl: {
                update: false
            }
        },
        {
            id: "fieldId",
            dataType: String,
            acl: {
                update: false
            }
        },        
        {
            id: "type",
            dataType: String
        },
        {
            id: "filter",
            dataType: Object,
            value: {}
        },
        {
            id: "sort",
            dataType: [Object],
            value: []
        },
        {
            id: "projection",
            dataType: Object,
            value: {}
        },
        {
            id: "group",
            dataType: [String]
        },
        {
            id: "config",
            dataType: Object
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
            label: "#accessRead",
            type: "directory",
            multiple: true,
            dataType: [String],
            isACL: true
        },
        {
            id: "ownerCanUpdate",
            label: "#ownerCanUpdate",
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
            dataType: [String],
            isACL: true
        },
        {
            id: "canCreateRecord",
            label: "#show create button",
            type: "checkbox",
            shape: "switch",
            iconColorOn: "#20c933",
            dataType: Boolean
        }
    ],

    acl: {
        permissions: {
            create: [
                { isOwner: true },
                { isManager: true },
                { isModelDesigner: true },
                { isPrivateView: true }
            ],
            read: [
                { isViewOwner: true },
                { authenticatedCanRead: true },
                { isViewReader: true },
            ],
            update: [
                { isOwner: true },
                { isManager: true },
                { isViewOwner: true },
                { isViewDesigner: true },
                { isModelDesigner: true }
            ],
            delete: [
                { isOwner: true },
                { isManager: true },
                { isViewOwner: true },
                { isViewDesigner: true },
                { isModelDesigner: true }
            ]
        },
    
        validators: {
            /**
             * ACL validator that checks if the active user is the account owner
             */
             async isOwner({
                req
            }) {
                return (kiss.isServer) ? req.token.isOwner : kiss.session.isAccountOwner()
            },

            /**
             * ACL validator that checks if the active user is an account manager
             */
            async isManager({
                req
            }) {
                return (kiss.isServer) ? req.token.isManager : kiss.session.isAccountManager()
            },            

            /**
             * Check if it's a private view that's being created
             */
            async isPrivateView({req, record}) {
                const userId = (kiss.isServer) ? req.token.userId : kiss.session.getUserId()
                if (record.accessUpdate.includes(userId)) return true
                return false
            },

            /**
             * ACL validator that checks if the active user is the view owner
             */
            async isViewOwner({req, record}) {
                const userId = (kiss.isServer) ? req.token.userId : kiss.session.getUserId()
                if (record.createdBy == userId) return true
                return false
            },

            /**
             * ACL validator that checks if the active user can update the view
             */
            async isViewDesigner({userACL, record}) {
                // Only the owner can update
                if (record.ownerCanUpdate == true) return false
    
                // Access is not defined
                if (record.accessUpdate == undefined) return false
    
                // Other people can update
                if (kiss.tools.intersects(userACL, record.accessUpdate)) return true
    
                return false
            },            

            /**
             * Check if the active user can manage the view's model
             */
            async isModelDesigner({userACL, req, record}) {
                let model
                const modelId = record.modelId

                if (kiss.isServer) {
                    model = await kiss.db.findOne("model", {_id: modelId})
                }
                else {
                    model = await kiss.app.collections.model.findOne(modelId)
                }
                if (!model) return false

                // Only the owner can manage the model
                if (model.ownerCanManage == true) return false

                // Access is not defined
                if (model.accessManage == undefined) return false

                // Other people can manage the model
                if (kiss.tools.intersects(userACL, model.accessManage)) return true

                return false
            },

            /**
             * ACL validator that checks if all authenticated users can read the record
             */
            async authenticatedCanRead({record}) {
                return !!record.authenticatedCanRead
            },
    
            /**
             * ACL validator that checks if the active user can read the view
             */
            async isViewReader({userACL, record}) {
                if (record.accessRead && kiss.tools.intersects(userACL, record.accessRead)) return true
            }            
        }
    } 
});