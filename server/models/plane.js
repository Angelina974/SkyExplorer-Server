kiss.app.defineModel({
    id: "plane",
    name: "Avion",
    namePlural: "Avions",
    icon: "fas fa-fighter-jet",
    color: "#00aaee",

    items: [
        {
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
            id: "flights",
            type: "link",
            label: "Vols",
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
});