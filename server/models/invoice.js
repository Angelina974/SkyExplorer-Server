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
            id: "flightId",
            type: "link",
            label: "Vol",
            canCreateRecord: true,
            canDeleteLinks: true,
            canLinkRecords: false,
            multiple: false,
            link: {
                modelId: "flight",
                fieldId: "invoice"
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
            computed: true,
            lookup: {
                linkId: "flight",
                fieldId: "totalPrice",
                type: "number"
            }
        },
    ]
});