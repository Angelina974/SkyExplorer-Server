kiss.app.defineModel({
    id: "question",
    name: "Question",
    namePlural: "Questions",
    icon: "fas fa-question",
    color: "#00aaee",

    items: [
        {
            id: "student",
            label: "Elève",
            type: "directory",
            value: "username"
        },
        {
            id: "instructor",
            label: "Instructeur",
            type: "directory"
        },
        {
            id: "question",
            type: "textarea",
            label: "Question",
            rows: 10
        },
        {
            id: "answer",
            type: "textarea",
            label: "Réponse",
            rows: 10
        }
    ]
});