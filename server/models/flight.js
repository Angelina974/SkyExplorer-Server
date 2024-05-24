kiss.app.defineModel({
    id: "flight",
    name: "Vol",
    namePlural: "Vols",
    icon: "fas fa-clipboard",
    color: "#00aaee",

    items: [
        {
            id: "date",
            dataType: Date
        },
        {
            id: "time",
            dataType: String
        },
        {
            id: "client",
            dataType: String
        },
        {
            id: "type",
            dataType: String
        },
        {
            id: "duration",
            dataType: Number
        },
        {
            id: "description",
            dataType: String
        },
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