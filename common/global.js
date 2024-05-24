/**
 * 
 * ## Namespace for misc global variables
 * 
 * @namespace
 * 
 */
kiss.addToModule("global", {

    // Authentication
    tokens: {},
    refreshTokens: {},

    // Ajax max retries
    // Prevents refreshToken loops for invalid tokens
    ajaxRetries: 0,
    ajaxMaxRetries: 3,

    // Models cache
    models: [],

    // Exiting view types
    viewTypes: [{
            name: "datatable",
            icon: "fas fa-table",
            description: "datatable view"
        }, {
            name: "calendar",
            icon: "far fa-calendar",
            description: "calendar view"
        },
        {
            name: "kanban",
            icon: "fab fa-trello",
            description: "kanban view"
        },
        {
            name: "timeline",
            icon: "fas fa-align-left",
            description: "timeline view"
        },
        // {
        //     name: "gallery",
        //     icon: "fas fa-th",
        //     description: "gallery view"
        // }
    ],

    // Existing field types
    fieldTypes: [{
            value: "text",
            label: "text",
            icon: "fas fa-font",
            dataType: "text"
        },
        {
            value: "textarea",
            label: "paragraph",
            icon: "fas fa-comment-dots",
            dataType: "text"
        },
        {
            value: "aiTextarea",
            label: "AI paragraph",
            icon: "far fa-lightbulb",
            dataType: "text"
        },
        {
            value: "number",
            label: "number",
            icon: "fas fa-hashtag",
            dataType: "number"
        },
        {
            value: "date",
            label: "date",
            icon: "fas fa-calendar",
            dataType: "date"
        },
        {
            value: "time",
            label: "time",
            icon: "fas fa-clock",
            dataType: "text"
        },
        {
            value: "select",
            label: "#select",
            icon: "fas fa-mouse-pointer",
            dataType: "text"
        },
        {
            value: "selectViewColumn",
            label: "#select view column",
            icon: "fas fa-th-list",
            dataType: "text"
        },
        {
            value: "selectViewColumns",
            label: "#select view columns",
            icon: "fas fa-table",
            dataType: "text"
        },
        {
            value: "checkbox",
            label: "checkbox",
            icon: "fas fa-check-square",
            dataType: "boolean"
        },
        {
            value: "attachment",
            label: "attachment",
            icon: "fas fa-paperclip"
        },
        {
            value: "aiImage",
            label: "AI image",
            icon: "fas fa-images"
        },
        {
            value: "directory",
            label: "collaborators",
            icon: "fas fa-users"
        },
        {
            value: "slider",
            label: "slider",
            icon: "fas fa-sliders-h"
        },
        {
            value: "rating",
            label: "rating",
            icon: "fas fa-star"
        },
        {
            value: "color",
            label: "color",
            icon: "fas fa-palette"
        },
        {
            value: "colorPicker",
            label: "color picker",
            icon: "fas fa-palette"
        },
        {
            value: "icon",
            label: "icon",
            icon: "far fa-heart"
        },
        {
            value: "iconPicker",
            label: "icon picker",
            icon: "far fa-heart"
        },
        {
            value: "password",
            label: "password",
            icon: "fas fa-key"
        },
        {
            value: "link",
            label: "link to another table",
            icon: "fas fa-link"
        },
        {
            value: "lookup",
            label: "lookup a value on linked records",
            icon: "fas fa-eye"
        },
        {
            value: "summary",
            label: "summarize data from linked records",
            icon: "fas fa-calculator"
        },
        {
            value: "codeEditor",
            label: "code editor",
            icon: "fas fa-code"
        },
        /*
        {
            value: "duration",
            label: "duration"),
            icon: "fas fa-hourglass-half"
        },
        {
            value: "autonumber",
            label: "automatic number",
            icon: "fas fa-angle-double-right"
        },
        {
            value: "image",
            label: "embedded image",
            icon: "far fa-image"
        }
        */
    ],

    // Used to auto-increment component ids
    componentCount: 0,

    palette: [
        // Palette 1
        "00CCEE", "00AAEE", "0075FF", "0088CC", "004499", "007766", "008833", "00AA99", "55CC00", "88CC00", "FFD139", "FFAA00", "F77D05", "B22222", "CC0055", "ED3757", "EE00AA", "CC0088", "8833EE", "772288",
        // Palette 2
        "77DDEE", "77CCEE", "429AFF", "66AACC", "447799", "537772", "528866", "6FAAA4", "91CC66", "C3E673", "EACD64", "FFD480", "CCA266", "B25959", "CC6690", "FF8080", "EE77CC", "AD77EE", "7B68EE", "815F88",
        // Palette 3
        "BEDBE0", "B4DDED", "87BFFF", "A1BDCC", "6B8699", "6E8777", "899E91", "8AA8A4", "BACCAD", "D0D8BC", "E2D7A1", "CCBB99", "AFA495", "B28C8C", "FFFFFF", "BBBBBB", "999999", "777777", "555555", "000000"
    ]
})

;