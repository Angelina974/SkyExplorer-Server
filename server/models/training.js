kiss.app.defineModel({
    id: "training",
    name: "Formation",
    icon: "fas fa-clipboard",
    color: "#000055",

    items: [{
            id: "type",
            type: "select",
            label: "Type",
            labelPosition: "top",
            multiple: false,
            options: [{
                    value: "Cours théoriques",
                    color: "#0075FF"
                },
                {
                    value: "Briefings longs",
                    color: "#ED3757"
                },
                {
                    value: "Formation pratique",
                    color: "#55CC00"
                },
                {
                    value: "Exercice en vol",
                    color: "#F77D05"
                }
            ]
        },
        {
            id: "category",
            type: "select",
            label: "Catégorie",
            labelPosition: "top",
            allowValuesNotInList: true,
            options: ["Apprentissage", "Maniabilité", "Pilotage", "Procédures particulières"]
        },
        {
            id: "subcategory",
            type: "select",
            label: "Sous-catégorie",
            labelPosition: "top",
            allowValuesNotInList: true,
            options: ["Croisière", "Décollage", "Mise en oeuvre / Roulage / Effet primaire des gouvernes", "Montée", "Opérations au sol"]
        },
        {
            id: "subject",
            type: "text",
            primary: true,
            label: "Sujet",
            labelPosition: "top"
        },
        {
            id: "order",
            type: "number",
            label: "Ordre",
            labelPosition: "top",
            precision: 0,
            min: 0,
            value: 0
        }
    ]

});