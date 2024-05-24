/**
 * Authentication language buttons
 */
kiss.templates.authLanguageButtons = () => kiss.language.available.map(language => {
    return {
        text: language.code.toUpperCase(),
        icon: "fas fa-globe",
        height: 32,
        fontSize: 11,
        margin: "0px 5px 0px 0px",
        color: "#ffffff",
        iconColor: "#ffffff",
        backgroundColor: "transparent",
        borderWidth: 0,
        action: () => kiss.language.set(language.code)
    }
})

;