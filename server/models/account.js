kiss.app.defineModel({
    id: "account",
    name: "Account",
    namePlural: "Accounts",
    icon: "fas fa-home",
    color: "#00aaee",

    items: [{
            primary: true,
            id: "owner",
            dataType: String
        },
        {
            isACL: true,
            id: "managers",
            dataType: Array
        },
        {
            id: "planId",
            dataType: String
        },
        {
            id: "planUsers",
            dataType: String
        },
        {
            id: "planApps",
            dataType: String
        },
        {
            id: "stripeCustomerId",
            dataType: String
        },
        {
            id: "stripeSubscriptionId",
            dataType: String
        },
        {
            id: "periodStart",
            dataType: String
        },
        {
            id: "periodEnd",
            dataType: String
        },
        {
            id: "status",
            dataType: String
        },
        {
            id: "createdAt",
            dataType: String
        },
        {
            id: "collaborators",
            dataType: Array
        },
        {
            id: "invited",
            dataType: Array
        },
        {
            id: "smtp",
            dataType: Object
        }
    ],

    acl: {
        permissions: {
            create: [{
                isCreator: true
            }],
            update: [{
                isSupportTeam: true
            }],
            delete: [{
                isDeleter: true
            }]
        },

        validators: {
            async isCreator() {
                return false
            },
            
            async isSupportTeam({req, record}) {
                const userId = (kiss.isServer) ? req.token.userId : kiss.session.getUserId()
                if (userId.split("@")[1] === "pickaform.com") return true
                return false
            },

            async isDeleter() {
                return false
            }
        }
    }
});