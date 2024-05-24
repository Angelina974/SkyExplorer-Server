/**
 * 
 * kiss.language
 * 
 * A simple translation module 
 * 
 */
module.exports = {
    // Default language
    current: "en",

    // Store all the localized texts
    texts: {},

    /**
     * Return a localized text from a key, or a fallback text
     * When a merge object is passed as a parameter, the values are merged into the final string.
     * 
     * @param {string} language - The target language
     * @param {string} key - The text key
     * @param {object} merge - Contextual data that must be merged into the text
     * @returns {string} - The localized text, or the key passed to the function if not found
     * 
     * @example
     * txt("fr", "hello") // bonjour
     * txtTitleCase("fr", "hello") // Bonjour
     * txt("fr", "hello %firstName %lastName", {firstName: "Bob", lastName: "Wilson"}) // bonjour Bob Wilson
     * txt("fr", "Devil number: %num%num%num", {num: 6}) // Devil number: 666
     */
    translate(language, key, merge) {
        const translationKey = kiss.language.texts[key]
        let translation = (translationKey) ? translationKey[language || kiss.language.current] : null

        if (!translation) translation = key
        
        if (merge) {
            Object.keys(merge).forEach(key => {
                let tag = new RegExp("%" + key, "g")
                translation = translation.replace(tag, merge[key])
            })
        }
        return translation
    },

    // Shorthands
    txt: (language, key, merge) => kiss.language.translate(language, key, merge),
    txtTitleCase: (language, key, merge) => kiss.language.translate(language, key, merge).toTitleCase(),
    txtUppercase: (language, key, merge) => kiss.language.translate(language, key, merge).toUpperCase(),
    txtLowerCase: (language, key, merge) => kiss.language.translate(language, key, merge).toLowerCase()
}