kiss.app.defineModel({
    id: "flight",
    name: "Vol",
    namePlural: "Vols",
    icon: "fas fa-clipboard",
    color: "#ee3500",

    items: [
        {
            id: "flightId",
            type: "text",
            label: "Identifiant du vol",
            value: "unid"
        },
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
            id: "plane",
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
            id: "planeId",
            type: "lookup",
            label: "Immatriculation",
            computed: true,
            lookup: {
                linkId: "plane",
                fieldId: "planeId"
            }
        },        
        {
            id: "planeBrand",
            type: "lookup",
            label: "Marque d'avion",
            computed: true,
            lookup: {
                linkId: "plane",
                fieldId: "planeBrand"
            }
        },
        {
            id: "planeType",
            type: "lookup",
            label: "Type d'avion",
            computed: true,
            lookup: {
                linkId: "plane",
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
                linkId: "plane",
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
        },
        {
            id: "invoice",
            type: "link",
            label: "Facture",
            canCreateRecord: true,
            canDeleteLinks: true,
            canLinkRecords: false,
            multiple: false,
            link: {
                modelId: "invoice",
                fieldId: "flight"
            }
        }
    ]
});