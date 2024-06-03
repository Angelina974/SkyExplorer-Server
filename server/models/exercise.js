kiss.app.defineModel({
    id: "exercise",
    name: "Exercice",
    icon: "fas fa-clipboard",
    color: "#000055",

    items: [{
            layout: "horizontal",
            items: [{
                    id: "client",
                    type: "directory",
                    label: "Client",
                },
                {
                    id: "instructor",
                    type: "directory",
                    label: "Instructeur",
                }
            ],
        },
        {
            id: "flightDate",
            type: "date",
            label: "Date du vol",

        },
        {
            id: "subject",
            type: "text",
            label: "Sujet"
        },
        {
            layout: "horizontal",
            items: [{
                    id: "category",
                    type: "text",
                    label: "Catégorie"
                },
                {
                    id: "subcategory",
                    type: "text",
                    label: "Catégorie"
                }
            ]
        },
        {
            id: "note",
            type: "rating",
            label: "Note",
            max: 5
        },
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
    ]
})