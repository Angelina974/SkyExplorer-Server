/**
 * 
 * Generates the panel containing the application themes
 * 
 * @ignore
 */
const createThemeWindow = function () {
    if ($("theme-window")) return
    const isMobile = kiss.screen.isMobile

    // Responsive layout options
    let responsiveOptions 

    if (isMobile) {
        responsiveOptions = {
            top: () => 0,
            left: () => 0,
            height: "100%",
            borderRadius: "0 0 0 0",
            draggable: false
        }
    }
    else {
        responsiveOptions = {
            verticalAlign: "center",
            draggable: true
        }
    }

    return createPanel({
        id: "theme-window",
        title: txtTitleCase("theme"),
        icon: "fas fa-sliders-h",
        headerBackgroundColor: (kiss.context.application) ? kiss.context.application.color : "#00aaee",
        modal: true,
        closable: true,
        display: "block",
        position: "absolute",
        align: "center",

        ...responsiveOptions,

        defaultConfig: {
            type: "button",
            icon: "fas fa-palette",
            flex: 1,
            height: (isMobile) ? "" : 100,
            width:(isMobile) ? "calc(100% - 20px)" : 250,
            flex: 1,
            margin: "10px",
            iconSize: 24,
            fontSize: 20,
            textAlign: "left",
            boxShadow: "var(--shadow-1)",
            boxShadowHover: "var(--shadow-4)",
        },

        items: [
            // THEME COLORS
            {
                type: "html",
                classes: {
                    "this": "theme-window-title"
                },
                html: txtTitleCase("color")
            },
            // LIGHT THEME
            {
                text: txtTitleCase("light"),
                color: "#232730",
                iconColor: "#232730",
                backgroundColor: "#dddddd",
                action: () => kiss.theme.set({color: "light"})
            },
            // DARK THEME
            {
                text: txtTitleCase("dark"),
                color: "#ffffff",
                iconColor: "#ffffff",
                backgroundColor: "#232730",
                action: () => kiss.theme.set({color: "dark"})
            },
            // CUSTOM THEME
            {
                hidden: isMobile,
                text: txtTitleCase("custom"),
                color: "#ffffff",
                iconColor: "#ffffff",
                backgroundColor: "#00aaee",
                boxShadow: "0px 0px 10px #00aaee",
                action: function () {
                    kiss.theme.set({color: "custom"})
                    createThemeBuilderWindow()
                }
            },
            // THEME GEOMETRY
            {
                type: "html",
                classes: {
                    "this": "theme-window-title"
                },
                html: txtTitleCase("geometry"),
            },
            {
                text: txtTitleCase("default"),
                icon: "far fa-square",
                action: () => kiss.theme.set({geometry: "default"})
            },
            {
                text: txtTitleCase("sharp"),
                icon: "far fa-gem",
                action: () => kiss.theme.set({geometry: "sharp"})
            },
            {
                text: txtTitleCase("round"),
                icon: "far fa-circle",
                action: () => kiss.theme.set({geometry: "round"})
            }            
        ]
    }).render()
}

;