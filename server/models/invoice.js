kiss.app.defineModel({
    id: "invoice",
    name: "Facture",
    namePlural: "Factures",
    icon: "fas fa-clipboard",
    color: "#9700ee",

    items: [
        {
            id: "client",
            type: "text",
            label: "Client",
            lookup: {
                modelId: "user",
                fieldId: "fisrtName"
            }
        },
        {
            id: "flights",
            type: "link",
            label: "Vols",
            canCreateRecord: true,
            canDeleteLinks: true,
            canLinkRecords: false,
            multiple: true,
            link: {
                modelId: "flight",
                fieldId: "plane"
            }
        },
        {
            id: "flightId",
            type: "lookup",
            label: "Identifiant du vol",
            computed: true,
            lookup: {
                linkId: "flight",
                fieldId: "flightId"
            }
        },
        {
            id: "date",
            type: "date",
            label: "Date de la facture",
            value: "today"
        },
        {
            id: "invoiceId",
            type: "text",
            label: "Référence",
            
        },
        {
            id: "totalPrice",
            type: "lookup",
            label: "Montant de la facture",
            unit: "€HT/h",
            computed: true,
            lookup: {
                linkId: "flight",
                fieldId: "totalPrice",
            }
        },
    ]
});