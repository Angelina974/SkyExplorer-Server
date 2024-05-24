/**
 * 
 * ## Simple translation management
 * 
 * Provides 4 functions to translate the texts:
 * - txt
 * - txtTitleCase
 * - txtUpperCase
 * - txtLowerCase
 * 
 * Note:
 * - You can also merge data directly into the translated text using a "merge" object (see below).
 * - Any translation which is not found will fallback to the text passed to the function.
 * - Any unfound text will be automatically stored into the "missingTexts" variable to ease the debug phase
 * 
 * @namespace
 * 
 */
kiss.language = {
    // Active language
    current: "en",

    // Available languages
    // If the navigator's default language is not included in the available languages, it defaults to "en"
    available: [{
            code: "en",
            name: "English"
        },
        {
            code: "fr",
            name: "Français"
        },
        {
            code: "es",
            name: "Español"
        }
    ],

    // Store all the localized texts
    texts: {},

    // Store missing texts while browsing the application views
    missingTexts: [],

    /**
     * - 1) Set the language from the browser settings, or system locales, or localStorage
     * - 2) Consolidate the library's texts and the specific application's texts into a single object to lookup
     */
    init() {
        // 1 - Set the language
        kiss.language.get()

        // 2 - Generate a hash for each text
        //this.initHash()
    },

    /**
     * Generate a hash for each localized text
     * 
     * @ignore
     */
    initHash() {
        kiss.language.hash = {}
        Object.keys(kiss.language.texts).forEach(key => {
            kiss.language.hash[key.hashCode()] = key
        })
    },

    /**
     * Get the current language
     * 
     * - first check the url parameter "language" (for example: &language=fr)
     * - if no parameter, tries to get the browser language
     * - defaults to "en" (English)
     * 
     * @returns {string} The current language. Examples: "en", "fr", "de", "it"...
     */
    get() {
        const urlLanguage = kiss.router.getRoute().language
        if (urlLanguage) {
            if (!kiss.language.available.find(lang => lang.code == urlLanguage)) urlLanguage = "en"
            kiss.language.current = urlLanguage
        } else {
            const navigatorLanguage = (navigator.languages ? navigator.languages[0] : navigator.language).substring(0, 2)
            const storedLanguage = localStorage.getItem("config-language")
            kiss.language.current = storedLanguage || navigatorLanguage || "en"

            // Restrict to languages which are available
            if (!kiss.language.available.find(lang => lang.code == kiss.language.current)) kiss.language.current = "en"
        }
        return kiss.language.current
    },

    /**
     * Return a localized text from a key, or a fallback text
     * If a translation is missing, the text key is stored into the "kiss.language.missingTexts" array, in order to ease the debug phase.
     * When a merge object is passed as a parameter, the values are merged into the final string.
     * 
     * @param {string} key - The text key, which should be in lowercase by convention (txtTitleCase, txtUpperCase, and txtLowerCase handle the case)
     * @param {object} [customSourceTexts] - Custom source texts. Must be provided in the same format as default source texts. See example.
     * @param {object} merge - Contextual data that must be merged into the text
     * @returns {string} - The localized text, or the key passed to the function if not found
     * 
     * @example
     * txt("hello") // bonjour
     * txtTitleCase("hello") // Bonjour
     * txt("hello %firstName %lastName", null, {firstName: "Bob", lastName: "Wilson"}) // bonjour Bob Wilson
     * txt("Devil number: %num%num%num", null, {num: 6}) // Devil number: 666
     * 
     * let customSource = {
     *      "apple": {
     *          fr: "pomme"
     *      },
     *      "banana": {
     *          fr: "banana"
     *      },
     *      "fruits": {
     *          en: "choose between those fruits...",
     *          fr: "choisissez parmi ces fruits..."
     *      }
     * }
     * 
     * kiss.language.set("en")
     * txtTitleCase("apple", customSource) // Apple
     * txtUpperCase("banana", customSource) // BANANA
     * txtTitleCase("fruits", customSource) // Choose between those fruits...
     * 
     * kiss.language.set("fr")
     * txtUpperCase("fruits", customSource) // CHOISISSEZ PARMI CES FRUITS...
     */
    translate(key, customSourceTexts, merge) {
        // Get static text
        let translationKey = (customSourceTexts) ? customSourceTexts[key] : kiss.language.texts[key]
        let translation = (translationKey) ? translationKey[kiss.language.current] : null

        // If there is no English text, then the text is the key itself
        let isMissing = false
        if (!translation) {
            translation = key
            isMissing = true
        }

        // Merge dynamic text
        if (merge) {
            Object.keys(merge).forEach(key => {
                let tag = new RegExp("%" + key, "g")
                translation = translation.replace(tag, merge[key])
            })
        }

        if (isMissing && kiss.language.missingTexts.indexOf(key) == -1) {
            kiss.language.missingTexts.push(key)
            log(`kiss.language - Missing [${kiss.language.current}] translation for [${key}]`, 4)
        }

        // On-the-fly translation, not ready yet because of the possibility of merging text into translated strings
        // return `<span class="translation" id="${key.hashCode()}">${translation}</span>`
        return translation
    },

    /**
     * Switch to another language
     * 
     * @param {*} newLanguage 
     */
    set(newLanguage) {
        kiss.language.current = newLanguage
        localStorage.setItem("config-language", newLanguage)
        document.location.reload()
    },

    /**
     * Show all missing texts in the console
     * @returns {string} - All the missing texts
     */
    showMissingTexts() {
        let i = 0
        kiss.language.missingTexts.forEach(text => {
            console.log(text)
            i++
        })
        console.log(`kiss.language - Result: ${i} missing texts for language ${kiss.language.current}`)
    },

    /**
     * Show a window to translate texts without translation
     */
    showTranslationWindow() {
        const containerId = kiss.tools.uid()

        const items = kiss.language.missingTexts.map(text => {
            return {
                type: "text",
                label: text,
                labelPosition: "top",
                width: "100%",
                events: {
                    onchange: () => $(containerId).update()
                }
            }
        })

        createPanel({
            title: "Quick translation for " + kiss.language.current.toUpperCase(),
            width: () => kiss.screen.current.width - 100,
            height: () => kiss.screen.current.height - 100,
            align: "center",
            verticalAlign: "center",
            modal: true,
            draggable: true,
            closable: true,
            layout: "horizontal",
            overflowY: "auto",

            defaultConfig: {
                margin: 10,
                borderRadius: 10,
                boxShadow: "var(--shadow-4)"
            },
            items: [{
                    id: containerId,
                    layout: "vertical",
                    flex: 1,
                    overflowY: "auto",
                    padding: 10,
                    items: items,

                    methods: {
                        update: function () {
                            const translationFields = $(containerId).items
                            const translations = {}
                            translationFields.forEach(field => {
                                const translation = field.getValue()
                                if (translation) {
                                    const translationKey = field.getLabel()
                                    translations[translationKey] = {
                                        [kiss.language.current]: translation
                                    }
                                }
                            })
                            $("export").setValue(JSON.stringify(translations, null, 4))
                        }
                    }
                },
                {
                    id: "export",
                    type: "textarea",
                    label: "Export",
                    labelPosition: "top",
                    flex: 1,
                    fieldHeight: "100%"
                }
            ]
        }).render()
    },

    /**
     * Open a window to switch the language
     */
    select() {
        createLanguageWindow()
    }
};

// Shortcuts to uppercase, lowercase, titlecase
const txt = kiss.language.translate
const txtUpperCase = (key, customSourceTexts, merge) => txt(key, customSourceTexts, merge).toUpperCase()
const txtLowerCase = (key, customSourceTexts, merge) => txt(key, customSourceTexts, merge).toLowerCase()
const txtTitleCase = (key, customSourceTexts, merge) => txt(key, customSourceTexts, merge).toTitleCase()

;