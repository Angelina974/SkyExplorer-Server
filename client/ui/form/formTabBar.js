/**
 * 
 * Form tab bar
 * 
 * @ignore
 */
const createFormTabBar = function (form, activeFeatures) {
    const record = form.record
    const formTabHeight = "var(--form-tab-height)"
    const formTabFontSize = "var(--form-tab-font-size)"
    const formTabBorderRadius = "var(--form-tab-border-radius)"
    const hasFeatures = (activeFeatures.length > 0)
    const isMobile = kiss.screen.isMobile

    let formFeatures = [
        // Switch between tab bar and side navigation
        {
            hidden: isMobile,
            type: "button",
            tip: txtTitleCase("#side navigation"),
            icon: "fas fa-columns",
            borderWidth: "0px",
            borderRadius: "32px",
            fontSize: formTabFontSize,
            height: formTabHeight,
            borderRadius: formTabBorderRadius,
            backgroundColorHover: "transparent",
            action: () => form.switchNavigation("left")
        },

        // Action menu
        {
            type: "button",
            text: (isMobile) ? "" : txtTitleCase("#action menu"),
            icon: "fas fa-bars",
            borderWidth: "0px",
            borderRadius: "32px",
            fontSize: formTabFontSize,
            height: formTabHeight,
            borderRadius: formTabBorderRadius,
            backgroundColorHover: "transparent",
            action: function () {
                createMenu({
                    left: this.getBoundingClientRect().x,
                    top: this.getBoundingClientRect().y,
                    items: createFormActions(form, activeFeatures)
                }).render()
            }
        }
    ]

    // Add main form tab if there are some features enabled
    if (hasFeatures) {
        formFeatures.push({
            id: "button-form-" + record.id,
            type: "button",
            text: (isMobile) ? "" : txtTitleCase("form"),
            icon: "far fa-window-restore",
            fontSize: formTabFontSize,
            height: formTabHeight,
            borderRadius: formTabBorderRadius,
            backgroundColorHover: "transparent",
            classes: {
                "this": "underline-effect"
            },
            action: () => form.showFeature("form-content")
        })
    }

    // Insert one tab per active form feature
    activeFeatures.forEach(feature => {
        let newFeature = {
            id: "button-" + feature.id + "-" + record.id,
            type: "button",
            text: (isMobile) ? "" : feature.name,
            icon: feature.icon,
            fontSize: formTabFontSize,
            height: formTabHeight,
            borderRadius: formTabBorderRadius,
            backgroundColorHover: "transparent",
            classes: {
                "this": "underline-effect"
            },
            action: () => form.showFeature(feature.pluginId)
        }
        
        formFeatures = formFeatures.concat(newFeature)
    })

    return formFeatures
}

;