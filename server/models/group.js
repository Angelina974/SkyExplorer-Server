kiss.app.defineModel({
    id: "group",
    name: "Group",
    namePlural: "Groups",
    icon: "fas fa-users",
    color: "#00aaee",

    items: [{
            id: "name",
            dataType: String
        },
        {
            id: "description",
            dataType: String
        },
        {
            id: "icon",
            dataType: String
        },
        {
            id: "color",
            dataType: String
        },
        {
            id: "users",
            dataType: [String],
            isACL: true
        }
    ],

    acl: {
        permissions: {
            create: [{
                    isOwner: true
                },
                {
                    isManager: true
                }
            ],
            update: [{
                    isOwner: true
                },
                {
                    isManager: true
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
            }
        }
    }
});