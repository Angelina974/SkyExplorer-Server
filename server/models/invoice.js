kiss.app.defineModel({
    id: "invoice",
    name: "Facture",
    namePlural: "Factures",
    icon: "fas fa-check-circle",
    color: "#9700ee",

    items: [
        {
            id: "invoiceId",
            type: "text",
            label: "Référence",
            value: "unid"
        },
        {
            id: "date",
            type: "date",
            label: "Date de la facture",
            value: "today"
        },
        // Liaison avec le modèle flight avec un champ "link"
        {
            id: "flight",
            type: "link",
            label: "ID du vol",
            canCreateRecord: false,
            canDeleteLinks: true,
            canLinkRecord: false,
            multiple: false,
            link: {
                modelId: "flight",
                fieldId: "invoice"
            }
        },
        // Récupération des informations du vol avec des champs "lookup"
        // - ID du vol
        {
            id: "flightId",
            type: "lookup",
            label: "ID du vol",
            computed: true,
            lookup: {
                linkId: "flight",
                fieldId: "flightId",
                type: "text"
            }
        },
        // - ID de l'avion
        {
            id: "flightPlaneId",
            type: "lookup",
            label: "Avion",
            computed: true,
            lookup: {
                linkId: "flight",
                fieldId: "planeId",
                type: "text"
            }
        },
        // - Date du vol
        {
            id: "flightDate",
            type: "lookup",
            label: "Date du vol",
            computed: true,
            lookup: {
                linkId: "flight",
                fieldId: "date",
                type: "date"
            }
        },
        // - Type du vol
        {
            id: "flightDate",
            type: "lookup",
            label: "Type du vol",
            computed: true,
            lookup: {
                linkId: "flight",
                fieldId: "type",
                type: "text"
            }
        },
        // - Durée du vol
        {
            id: "flightDuration",
            type: "lookup",
            label: "Durée du vol",
            computed: true,
            lookup: {
                linkId: "flight",
                fieldId: "duration",
                type: "number"
            }
        },                    
        // - Client
        {
            id: "client",
            type: "lookup",
            label: "Client",
            computed: true,
            lookup: {
                linkId: "flight",
                fieldId: "client",
                type: "text"
            }
        },
        // - Prix du vol
        {
            id: "totalPrice",
            type: "lookup",
            label: "Montant de la facture",
            unit: "€HT/h",
            computed: true,
            lookup: {
                linkId: "flight",
                fieldId: "totalPrice",
                type: "number"
            }
        }
    ]
});