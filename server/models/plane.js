kiss.app.defineModel({
    id: "plane",
    name: "Avion",
    namePlural: "Avions",
    icon: "fas fa-fighter-jet",
    color: "#00aaee",

    items: [
        {
            id: "planeId",
            dataType: String
        },
        {
            id: "planeBrand",
            dataType: String
        },
        {
            id: "planeType",
            dataType: String
        },
        {
            id: "hourPrice",
            dataType: Number
        }
    ]
});