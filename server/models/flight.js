kiss.app.defineModel({
    id: "flight",
    name: "Vol",
    namePlural: "Vols",
    icon: "fas fa-clipboard",
    color: "#9700ee",

    items: [
        {
            id: "date",
            type: "date",
            label: "Date du vol",
            value: "today"
        },
        {
            id: "time",
            type: "select",
            label: "Heure du vol",
            template: "time",
            min: 7,
            max: 19,
            interval: 60
        },
        {
            id: "client",
            type: "text",
            label: "Client"
        },
        {
            id: "type",
            type: "select",
            label: "Type de vol",
            options: [
                {
                    label: "Formation",
                    value: "formation",
                    color: "#00aaee"
                },
                {
                    label: "Loisir",
                    value: "loisir",
                    color: "#ee3333"
                }
            ]
        },
        {
            id: "duration",
            type: "number",
            unit: "mn",
            label: "Durée du vol"
        },
        {
            id: "description",
            type: "text",
            label: "Description du vol"
        },
        {
            id: "planeId",
            type: "link",
            label: "Avion",
            canCreateRecord: true,
            canDeleteLinks: true,
            canLinkRecords: false,
            multiple: false,
            link: {
                modelId: "plane",
                fieldId: "flights"
            }
        },
        {
            id: "planeBrand",
            type: "lookup",
            label: "Marque d'avion",
            computed: true,
            lookup: {
                linkId: "planeId",
                fieldId: "planeBrand"
            }
        },
        {
            id: "planeType",
            type: "lookup",
            label: "Type d'avion",
            computed: true,
            lookup: {
                linkId: "planeId",
                fieldId: "planeType"
            }
        },
        {
            id: "hourPrice",
            type: "lookup",
            label: "Tarif horaire",
            unit: "€HT/h",
            computed: true,
            lookup: {
                linkId: "planeId",
                fieldId: "hourPrice",
                type: "number"
            }
        },
        {
            id: "totalPrice",
            type: "number",
            unit: "€HT",
            label: "Prix total du vol",
            computed: true,
            formula: "ROUND ( {{Tarif horaire}} * {{Durée du vol}} / 60, 2 )"
        }
    ]
});