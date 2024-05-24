kiss.app.defineModel({
    id: "trash",
    splitBy: "account",
    
    name: "Trash",
    namePlural: "Trashes",
    icon: "fas fa-trash",
    color: "#8833ee",

    items: [
        {
            id: "sourceModelId",
            label: "model",
            dataType: String
        },
        {
            id: "name",
            label: "name",
            dataType: String
        },
        {
            id: "icon",
            label: "icon",
            type: "icon",
            dataType: String
        },
        {
            id: "color",
            label: "color",
            type: "color",
            dataType: String
        },
        {
            id: "deletedAt",
            label: "#deletedAt",
            type: "data",
            dataType: Date
        },
        {
            id: "deletedBy",
            label: "#deletedBy",
            type: "directory",
            dataType: [String]
        }        
    ],

    acl: {
        permissions: {
            update: [
                {isUpdater: true},
            ],
            delete: [
                {isOwner: true},
                {isManager: true},
                {isRestorer: true}
            ]
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

            // A deleted record can't be modified
            async isUpdater() {
                return false
            },

            // Anyone who deleted a record can restore it
            async isRestorer({userACL, req, model, record}) {
                const userId = (kiss.isClient) ? kiss.session.getUserId() : req.token.userId
                return record.deletedBy == userId
            }
        }
    }    
});