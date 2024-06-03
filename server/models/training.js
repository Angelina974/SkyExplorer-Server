kiss.app.defineModel({
    id: "training",
    name: "Formation",
    namePlural: "Formations",
    icon: "fas fa-clipboard",
    color: "#aaee00",

    items: [
        {
            type: "panel",
            title: "General",
            icon: "far fa-file-alt",
            collapsible: true,
            items: [{
                    label: "Type",
                    type: "select",
                    coloredOptions: true,
                    computed: false,
                    required: false,
                    multiple: false,
                    allowValuesNotInList: false,
                    value: "",
                    tip: "",
                    hideWhen: false,
                    hideFormula: "",
                    accessRead: [],
                    accessUpdate: [],
                    options: [{
                            value: "Cours théoriques",
                            color: "#0075FF"
                        },
                        {
                            value: "Briefings longs",
                            color: "#ED3757"
                        },
                        {
                            value: "Formation pratique",
                            color: "#55CC00"
                        },
                        {
                            value: "Exercice en vol",
                            color: "#F77D05"
                        }
                    ],
                    allowClickToDelete: false,
                    readOnly: false,
                    display: "inline-flex",
                    width: "100%",
                    fieldWidth: "100%",
                    labelWidth: "100%",
                    labelPosition: "top",
                    labelAlign: "left",
                    id: "type",
                    acl: {
                        read: true,
                        update: true
                    },
                    target: "panel-body-cDdyXna9"
                },
                {
                    label: "Catégorie",
                    type: "selectViewColumn",
                    computed: false,
                    required: false,
                    value: "",
                    validationType: "free",
                    validationRegex: "",
                    alidationFormula: "",
                    validationMessage: "",
                    ti: "",
                    hideWhen: false,
                    hideFormula: "",
                    accessRead: [],
                    accessUpdate: [],
                    minLength: 0,
                    readOnly: false,
                    display: "inline-flex",
                    width: "100%",
                    fieldWidth: "100%",
                    labelWidth: "100%",
                    labelPosition: "top",
                    labelAlign: "left",
                    id: "category",
                    acl: {
                        "read": true,
                        "update": true
                    },
                    target: "panel-body-cDdyXna9",
                    viewId: "018fa062-b03e-788b-98f7-f85c6ea60311",
                    fieldId: "ieFFFOhc",
                    multiple: false,
                    allowValuesNotInList: true
                },
                {
                    label: "Sous-catégorie",
                    type: "selectViewColumn",
                    computed: false,
                    required: false,
                    value: "",
                    validationType: "free",
                    validationRegex: "",
                    validationFormula: "",
                    validationMessage: "",
                    tip: "",
                    hideWhen: false,
                    hideFormula: "",
                    accessRead: [],
                    accessUpdate: [],
                    minLength: 0,
                    readOnly: false,
                    display: "inline-flex",
                    width: "100%",
                    fieldWidth: "100%",
                    labelWidth: "100%",
                    labelPosition: "top",
                    labelAlign: "left",
                    id: "subcategory",
                    acl: {
                        "read": true,
                        "update": true
                    },
                    target: "panel-body-cDdyXna9",
                    viewId: "018fa062-b03e-788b-98f7-f85c6ea60311",
                    fieldId: "wFt1WwBJ",
                    multiple: false,
                    allowValuesNotInList: true
                },
                {
                    primary: true,
                    label: "Sujet",
                    type: "text",
                    labelPosition: "top",
                    fieldWidth: "100.00%",
                    labelWidth: "100.00%",
                    width: "100.00%",
                    display: "inline-flex",
                    id: "subject",
                    acl: {
                        "read": true,
                        "update": true
                    },
                    computed: false,
                    required: false,
                    value: "",
                    validationType: "free",
                    validationRegex: "",
                    validationFormula: "",
                    validationMessage: "",
                    tip: "",
                    hideWhen: false,
                    hideFormula: "",
                    accessRead: [],
                    accessUpdate: [],
                    minLength: 0,
                    readOnly: false,
                    labelAlign: "left",
                    target: "panel-body-cDdyXna9"
                },
                {
                    label: "Ordre",
                    type: "number",
                    computed: false,
                    required: false,
                    precision: 0,
                    unit: "",
                    min: 0,
                    value: 0,
                    tip: "",
                    hideWhen: false,
                    hideFormula: "",
                    accessRead: [],
                    accessUpdate: [],
                    readOnly: false,
                    display: "inline-flex",
                    width: "100%",
                    fieldWidth: "100%",
                    labelWidth: "100%",
                    labelPosition: "top",
                    labelAlign: "left",
                    id: "order",
                    acl: {
                        "read": true,
                        "update": true
                    },
                    target: "panel-body-cDdyXna9"
                }
            ],
            id: "cDdyXna9",
            acl: {
                "read": true,
                "update": true
            },
            display: "block",
            target: "panel-body-form-builder",
            position: "relative",
            headerBackgroundColor: "#66AACC"
        }

    ]

});