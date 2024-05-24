/**
 * 
 * Generates the panel containing the application languages
 * 
 * @ignore
 */
const createLanguageWindow = function () {

    const languageButtons = kiss.language.available.map(language => {
        return {
            type: "button",
            text: language.name,
            icon: "fas fa-globe",
            flex: 1,
            margin: "0px 10px 0px 0px",
            action: () => kiss.language.set(language.code)
        }
    })

    return createPanel({
        title: txtTitleCase("pick a language"),

        modal: true,
        draggable: true,
        closable: true,
        layout: "horizontal",
        align: "center",
        verticalAlign: "center",
        width: 400,

        defaultConfig: {
            height: 50
        },

        items: languageButtons
    }).render()
}

;