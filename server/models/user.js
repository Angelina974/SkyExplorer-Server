kiss.app.defineModel({
    id: "user",
    name: "User",
    namePlural: "Users",
    icon: "fas fa-user",
    color: "#00aaee",

    items: [{
            id: "accountId"
        },
        // Email de l'utilisateur
        {
            id: "email",
            type: "text",
            label: "Email",
            primary: true
        },
        {
            layout: "horizontal",
            defaultConfig: {
                width: "50%",
                fieldWidth: "100%",
                labelWidth: "100%",
                labelPosition: "top"
            },
            
            items: [
                // Prénom
                {
                    id: "firstName",
                    type: "text",
                    label: "Prénom"
                },
                // Nom
                {
                    id: "lastName",
                    type: "text",
                    label: "Nom"
                },
            ]
        },
        {
            id: "type",
            type: "select",
            label: "Type",
            options: [
                "Administrateur",
                "Instructeur",
                "Elève pilote",
                "Pilote"
            ]
        },
        {
            id: "active"
        },
        {
            id: "password"
        },
        {
            id: "isCollaboratorOf"
        },
        {
            id: "invitedBy"
        },
        {
            id: "currentAccountId"
        }
    ],

    acl: {
        permissions: {
            update: [{
                    isOwner: true
                }
            ],
            delete: [{
                    isOwner: true
                }
            ]
        },

        validators: {
            async isOwner({
                req
            }) {
                return (kiss.isServer) ? req.token.isOwner : kiss.session.isAccountOwner()
            }
        }
    }
})

;