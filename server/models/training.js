kiss.app.defineModel({
    id: "training",
    name: "Formation",
    icon: "fas fa-clipboard",
    color: "var(--skyexplorer-color)",

    items: [
        // Type de formation
        {
            id: "type",
            type: "select",
            label: "Type",
            labelPosition: "top",
            multiple: false,
            options: [{
                    value: "Cours théoriques",
                    color: "#000055"
                },
                {
                    value: "Briefings longs",
                    color: "#eeaa00"
                },
                {
                    value: "Formation pratique",
                    color: "#72951A"
                },
                {
                    value: "Exercice en vol",
                    color: "#00aaee"
                }
            ]
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
                // Catégorie de formation
                {
                    id: "category",
                    type: "select",
                    label: "Catégorie",
                    labelPosition: "top",
                    allowValuesNotInList: true,
                    options: [
                        {
                            value: "Apprentissage",
                            color: "#00A39E"
                        },
                        {
                            value: "Maniabilité",
                            color: "#6A00A3"
                        },
                        {
                            value: "Pilotage",
                            color: "#A30054"
                        },
                        {
                            value: "Procédures particulières",
                            color: "#AF3800"
                        }]
                },
                // Sous-catégorie de formation
                {
                    id: "subcategory",
                    type: "select",
                    label: "Sous-catégorie",
                    labelPosition: "top",
                    allowValuesNotInList: true,
                    options: [
                        {
                            value: "Croisière",
                            color: "#009295"
                        },
                        {
                            value: "Décollage",
                            color: "#005895"
                        },
                        {
                            value: "Mise en oeuvre / Roulage / Effet primaire des gouvernes",
                            color: "#628D00"
                        },
                        {
                            value: "Montée",
                            color: "#AB7400"
                        },
                        {
                            value: "Opérations au sol",
                            color: "#1A3581"
                        }]
                },
            ]
        },
        // Sujet
        {
            id: "subject",
            type: "text",
            primary: true,
            label: "Sujet",
            labelPosition: "top"
        },
        // Ordre
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

})

;