kiss.app.defineModel({
    id: "exercise",
    name: "Exercice",
    icon: "fas fa-clipboard",
    color: "#000055",

    items: [
        // Flight date
        {
            id: "flightDate",
            type: "lookup",
            label: "Date du vol",
            computed: true,
            lookup: {
                linkId: "flight",
                fieldId: "date",
                type: "date"
            }
        },
        // Block client & instructeur
        {
            title: "test",
            layout: "horizontal",

            defaultConfig: {
                width: "50%",
                labelWidth: "100%",
                fieldWidth: "100%",
                labelPosition: "top"
            },

            items: [
                // Client
                {
                    id: "client",
                    type: "lookup",
                    label: "Elève pilote",
                    computed: true,
                    lookup: {
                        linkId: "flight",
                        fieldId: "client"
                    }
                },
                // Instructor
                {
                    id: "instructor",
                    type: "lookup",
                    label: "Instructeur",
                    computed: true,
                    lookup: {
                        linkId: "flight",
                        fieldId: "instructor"
                    }
                }
            ],
        },
        // Field to pick a training subject and get other fields
        {
            id: "subject",
            type: "selectViewColumns",
            label: "Sujet",
            collectionId: "training",
            fieldId: ["subject", "category", "subcategory"]
        },
        // Block category & subcategory
        {
            title: "test",
            layout: "horizontal",

            defaultConfig: {
                width: "50%",
                labelWidth: "100%",
                fieldWidth: "100%",
                labelPosition: "top"
            },

            items: [
                // Category
                {
                    id: "category",
                    type: "text",
                    label: "Catégorie"
                },
                // Subcategory
                {
                    id: "subcategory",
                    type: "text",
                    label: "Sous-catégorie"
                }
            ]
        },
        // Rate
        {
            id: "note",
            type: "rating",
            label: "Note",
            max: 5
        },
        // Link the flight
        {
            id: "flight",
            type: "link",
            label: "Vol",
            multiple: false,
            link: {
                modelId: "flight",
                fieldId: "exercises"
            }
        }
    ],

    acl: {
        permissions: {
            read: [{
                isMyFlight: true
            }]
        },

        validators: {
            async isMyFlight({
                record,
                req
            }) {
                const userId = (kiss.isServer) ? req.token.userId : kiss.session.getUserId()
                return record.client == userId
            }
        }
    }
})

;