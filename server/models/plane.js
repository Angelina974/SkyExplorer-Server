kiss.app.defineModel({
    id: "plane",
    name: "Avion",
    namePlural: "Avions",
    icon: "fas fa-fighter-jet",
    color: "var(--skyexplorer-color)",

    items: [
        // Section pour les infos de l'avion
        {
            type: "panel",
            title: "Informations sur l'avion",
            icon: "fas fa-clipboard",
            collapsible: true,

            defaultConfig: {
                labelPosition: "top",
                width: "100%",
                fieldWidth: "100%",
                labelWidth: "25%",
            },

            items: [
                // Immatriculation
                {
                    id: "planeId",
                    type: "text",
                    label: "Immatriculation"
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
                        // Marque
                        {
                            id: "planeBrand",
                            type: "text",
                            label: "Marque"
                        },
                        // type de l'avion
                        {
                            id: "planeType",
                            type: "text",
                            label: "Type"
                        },
                    ]
                },
                // Tarif horaire
                {
                    id: "hourPrice",
                    type: "number",
                    unit: "€/h",
                    label: "Tarif horaire"
                },
                // Notes
                {
                    id: "notes",
                    type: "textarea",
                    label: "Notes complémentaires",
                    rows: 5
                },
                // Image URL
                {
                    id: "planeImageUrl",
                    type: "text",
                    label: "URL image de l'avion"
                },
                // Image insertion point
                {
                    id: "planeImage",
                    type: "html"
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
                labelPosition: "top",
                width: "100%",
                fieldWidth: "100%",
                labelWidth: "25%",
            },

            items: [
                // Total heures des vols
                {
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
                // Report des heures précédentes
                {
                    id: "initialHours",
                    type: "number",
                    label: "Report des heures précédentes",
                    unit: "h"
                },
                // Total général du nombre d'heures de vol
                {
                    id: "totalHours",
                    type: "number",
                    label: "Total général",
                    unit: "h",
                    computed: true,
                    formula: `{{Total heures des vols}} + {{Report des heures précédentes}}`
                },
                // Liste des vols
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