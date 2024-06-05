kiss.app.defineModel({
    id: "plane",
    name: "Avion",
    namePlural: "Avions",
    icon: "fas fa-fighter-jet",
    color: "#00aaee",

    items: [
        // Section pour les infos de l'avion
        {
            type: "panel",
            title: "Informations sur l'avion'",
            icon: "fas fa-clipboard",
            collapsible: true,

            defaultConfig: {
                width: "100%",
                fieldWidth: "100%",
                labelWidth: "25%",
            },

            items: [{
                    id: "planeId",
                    type: "text",
                    label: "Immatriculation"
                },
                {
                    id: "planeBrand",
                    type: "text",
                    label: "Marque"
                },
                {
                    id: "planeType",
                    type: "text",
                    label: "Type"
                },
                {
                    id: "hourPrice",
                    type: "number",
                    unit: "€/h",
                    label: "Tarif horaire"
                },
                {
                    id: "notes",
                    type: "textarea",
                    label: "Notes complémentaires"
                }
            ]
        },
        // Section pour la liste des vols
        {
            type: "panel",
            title: "Informations sur les vols",
            icon: "fas fa-clipboard",
            collapsible: true,

            defaultConfig: {
                width: "100%",
                fieldWidth: "100%",
                labelWidth: "25%",
            },

            items: [{
                    id: "flightHours",
                    type: "summary",
                    label: "Total heures des vols",
                    unit: "h",
                    summary: {
                        linkId: "flights",
                        fieldId: "duration",
                        operation: "SUM"
                    }
                },
                {
                    id: "initialHours",
                    type: "number",
                    label: "Report des heures précédentes",
                    unit: "h"
                },
                {
                    id: "totalHours",
                    type: "number",
                    label: "Total général",
                    unit: "h",
                    computed: true,
                    formula: `{{Total heures des vols}} + {{Report des heures précédentes}}`
                },
                {
                    id: "flights",
                    type: "link",
                    label: "Liste des vols",
                    canCreateRecord: false,
                    canDeleteLinks: false,
                    canLinkRecord: false,
                    multiple: true,
                    link: {
                        modelId: "flight",
                        fieldId: "plane"
                    }
                }
            ]
        }
    ]
})

;