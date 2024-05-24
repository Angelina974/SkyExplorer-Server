/**
 * 
 * ## Manage the application CSS theme (color and geometry)
 * 
 * @namespace
 * 
 */
kiss.theme = {
    // Defaults
    currentColor: "",
    currentGeometry: "",

    /**
     * Init the theme at startup.
     * It will also observe CSS theme passed in the URL hash parameter "themeColor" / "themeGeometry" and switch theme accordingly.
     * The default theme color is "light", and theme geometry is "default"
     */
    init() {
        const localStorageTheme = kiss.theme.get()
        kiss.context.themeColor = kiss.theme.currentColor = kiss.router.getRoute().themeColor || localStorageTheme.color
        kiss.context.themeGeometry = kiss.theme.currentGeometry = kiss.router.getRoute().themeGeometry || localStorageTheme.geometry

        kiss.theme._load({
            color: kiss.context.themeColor,
            geometry: kiss.context.themeGeometry
        })

        // Observe EVT_ROUTE_UPDATED event to adjust theme according to the "themeColor" and "themeGeometry" parameters of the url hash
        kiss.theme._observe()
    },

    /**
     * Update the theme (color and geometry)
     * 
     * @param {object} config
     * @param {string} config.color
     * @param {string} config.geometry
     * 
     * @example
     * kiss.theme.set({
     *  color: "dark",
     *  geometry: "sharp"
     * })
     */
    set({color, geometry}) {
        color = color || kiss.theme.currentColor
        geometry = geometry || kiss.theme.currentGeometry

        localStorage.setItem("config-themeColor", color)
        localStorage.setItem("config-themeGeometry", geometry)

        kiss.theme._load({
            color,
            geometry
        })

        kiss.router.updateUrlHash({
            themeColor: color,
            themeGeometry: geometry
        })
    },

    /**
     * Get the current theme parameters saved in the localStorage
     * 
     * @returns {object} Theme parameters like: {color: "light", geometry: "default"}
     */
    get() {
        kiss.theme.currentColor = localStorage.getItem("config-themeColor")
        if (!kiss.theme.currentColor) kiss.theme.currentColor = "light"
        
        kiss.theme.currentGeometry = localStorage.getItem("config-themeGeometry")
        if (!kiss.theme.currentGeometry) kiss.theme.currentGeometry = "default"

        return {
            color: kiss.theme.currentColor,
            geometry: kiss.theme.currentGeometry
        }
    },

    /**
     * Switch CSS theme dynamically
     * (replace the existing CSS theme link by the new CSS theme link)
     * 
     * @private
     * @ignore
     * @param {object} config
     * @param {string} config.color - New theme color
     * @param {string} config.geometry - New theme geometry
     */
    _load({color, geometry}) {
        if (color) {
            if (color != "custom") {
                // Completely reset the styles
                document.documentElement.removeAttribute("style")

                // Load the new stylesheet
                document.querySelectorAll("link").forEach(link => {
                    if (link.href.indexOf("styles/colors") != -1) {
                        if (kiss.global.absolutePath) {
                            link.href = kiss.global.absolutePath + "/kissjs/client/ui/styles/colors/" + color + ".css"
                        } else {
                            if (typeof pickaform !== "undefined") {
                                // pickaform is built alongside with KissJS
                                link.href = "../../kissjs/client/ui/styles/colors/" + color + ".css"
                            }
                            else {
                                link.href = "https://kissjs.net/resources/lib/kissjs/styles/colors/" + color + ".css"
                            }
                        }
                    }
                })
            } else {
                let theme = localStorage.getItem("config-theme")
                if (!theme) return
                theme = JSON.parse(theme)

                Object.keys(theme).forEach(variable => {
                    const color = theme[variable]
                    document.documentElement.style.setProperty(variable, color)
                })
            }
        }

        if (geometry) {
            document.querySelectorAll("link").forEach(link => {
                if (link.href.indexOf("styles/geometry") != -1) {
                    if (kiss.global.absolutePath) {
                        link.href = kiss.global.absolutePath + "/kissjs/client/ui/styles/geometry/" + geometry + ".css"
                    } else {
                        if (typeof pickaform !== "undefined") {
                            // pickaform is built alongside with KissJS
                            link.href = "../../kissjs/client/ui/styles/geometry/" + geometry + ".css"
                        }
                        else {
                            link.href = "https://kissjs.net/resources/lib/kissjs/styles/geometry/" + geometry + ".css"
                        }
                    }
                }
            })
        }

        kiss.theme.currentColor = color || "light"
        kiss.theme.currentGeometry = geometry || "default"
    },

    /**
     * Observe CSS theme passed in the URL hash parameter "theme" and switch theme automatically.
     * For example: /index.html#ui=home&**theme=dark**
     * 
     * @private
     * @ignore
     */
    _observe() {
        subscribe("EVT_ROUTE_UPDATED", (msgData) => {
            if ((msgData.themeColor != kiss.theme.currentColor) || (msgData.themeGeometry != kiss.theme.currentGeometry)) {
                kiss.theme._load({
                    color: msgData.themeColor,
                    geometry: msgData.themeGeometry
                })
            }
        })
    },

    /**
     * Open a window to switch the theme manually
     */
    select() {
        createThemeWindow()
    }
}

;