kiss.app.defineModel({
    id: "formation",
    name: "Nouveau",
    icon: "fas fa-fighter-jet",
    color: "#00aaee",

    items: [
        {
            id: "Phases",
            type: "text",
            label: "Phases"
        },
        {
            id: "Competences",
            type: "text",
            label: "Compétences"
        },
        {
            id: "subject",
            type: "text",
            label: "Sujets"
        }
        ,{
            id: "exercice",
            type: "link",
            label: "exercice",
            canCreateRecord: true,
            canDeleteLinks: true,
            canLinkRecords: false,
            multiple: false,
            link: {
                modelId: "exercices",
                fieldId: "formation"
            }
        }
     ]
     
});