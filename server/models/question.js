kiss.app.defineModel({
    id: "question",
    name: "Question",
    namePlural: "Questions",
    icon: "fas fa-question",
    color: "var(--skyexplorer-color)",

    items: [
        {
            id: "date",
            type: "date",
            label: "Date de la question",
            value: "today"
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
                // Eleve
                {
                    id: "student",
                    label: "Elève",
                    type: "directory",
                    value: "username"
                },
                // Instructeur
                {
                    id: "instructor",
                    label: "Instructeur",
                    type: "directory"
                }
            ]
        },
        // Question
        {
            id: "question",
            type: "textarea",
            label: "Question",
            rows: 10
        },
        // Réponse
        {
            id: "answer",
            type: "textarea",
            label: "Réponse",
            rows: 10
        }
    ]
})

;