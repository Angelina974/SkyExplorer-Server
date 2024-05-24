kiss.app.defineModel({
    id: "user",
    name: "User",
    namePlural: "Users",
    icon: "fas fa-user",
    color: "#00aaee",

    items: [{
            id: "accountId",
            dataType: String
        },
        {
            id: "email",
            primary: true,
            dataType: String
        },
        {
            id: "firstName",
            dataType: String
        },
        {
            id: "lastName",
            dataType: String
        },
        {
            id: "name", // firstName + " " + lastName
            dataType: String
        },
        {
            id: "active",
            dataType: Boolean
        },
        {
            id: "loginType", // google, facebook...
            dataType: String
        },
        {
            id: "socialId", // internal id for social auth
            dataType: String
        },
        {
            id: "sessionToken", // token for external auth
            dataType: String
        },
        {
            id: "password",
            dataType: String
        },
        {
            id: "language",
            dataType: String
        },
        {
            id: "isCollaboratorOf",
            dataType: Array
        },
        {
            id: "invitedBy",
            dataType: Array
        },
        {
            id: "currentAccountId",
            dataType: String
        }
    ],

    acl: {
        permissions: {
            create: [{
                    isOwner: true,
                    quotaNotExceeded: true
                },
                {
                    isManager: true,
                    quotaNotExceeded: true
                }
            ],
            update: [{
                    isOwner: true
                },
                {
                    isManager: true
                },
                {
                    isConnectedUser: true
                }
            ],
            delete: [{
                    isOwner: true
                },
                {
                    isManager: true
                }
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

            async quotaNotExceeded() {
                if (kiss.isClient) {
                    const currentNumberOfUsers = kiss.app.collections.user.records.length
                    const allowedNumberOfUsers = Number(kiss.session.account.planUsers)
                    if (currentNumberOfUsers >= allowedNumberOfUsers) return false
                    return true
                }
            },

            async isConnectedUser({
                req,
                record
            }) {
                const userId = (kiss.isServer) ? req.token.userId : kiss.session.getUserId()
                if (userId == record.email) return true
                return false
            }
        }
    }
});