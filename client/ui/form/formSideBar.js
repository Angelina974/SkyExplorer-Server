/**
 * 
 * Form side bar
 * 
 * @ignore
 */
const createFormSideBar = function (form, activeFeatures, formHeaderFeatures, formFooterFeatures) {
    const record = form.record
    const model = record.model

    // Creates a navigation entry per section
    const headerSections = Array.from(formHeaderFeatures).map(section => {
        return {
            type: "button",
            text: section.config.title,
            textAlign: "left",
            icon: section.config.icon,
            margin: "0px 5px 10px 50px",
            classes: {
                "this": "form-side-bar-button"
            },
            action: () => form.showSection(section.config.title)
        }        
    })

    const sections = model.items.map(section => {
        if (section.type != "panel") return ""
        return {
            type: "button",
            text: section.title,
            textAlign: "left",
            icon: section.icon,
            margin: "0px 5px 10px 50px",
            classes: {
                "this": "form-side-bar-button"
            },
            action: () => form.showSection(section.title)
        }
    })

    const footerSections = Array.from(formFooterFeatures).map(section => {
        return {
            type: "button",
            text: section.config.title,
            textAlign: "left",
            icon: section.config.icon,
            margin: "0px 5px 10px 50px",
            classes: {
                "this": "form-side-bar-button"
            },
            action: () => form.showSection(section.config.title)
        }        
    })

    // Creates a navigation entry per feature
    let formFeatures = [
        {
            layout: "horizontal",
            margin: "0 0 20px 0",
            flexShrink: 0,
            items: [
                // Switch between tab bar and side navigation
                {
                    type: "button",
                    tip: txtTitleCase("#tabs navigation"),
                    icon: "fas fa-columns",
                    classes: {
                        "this": "form-side-bar-menu"
                    },
                    action: () => form.switchNavigation("tabs")
                },

                // Action menu
                {
                    type: "button",
                    text: txtTitleCase("#action menu"),
                    textAlign: "left",
                    icon: "fas fa-bars",
                    classes: {
                        "this": "form-side-bar-menu"
                    },
                    action: function () {
                        createMenu({
                            left: this.getBoundingClientRect().x,
                            top: this.getBoundingClientRect().y,
                            items: createFormActions(form, activeFeatures)
                        }).render()
                    }
                }
            ]
        },

        // Main form
        {
            id: "button-form-" + record.id,
            type: "button",
            text: txtTitleCase("form"),
            textAlign: "left",
            icon: "far fa-window-restore",
            iconColor: model.color,
            classes: {
                "this": "form-side-bar-button"
            },
            action: function () {
                form.showFeature("form-content")
                form.showAllSections()
            }
        },

        // Form sections
        ...headerSections,
        ...sections,
        ...footerSections
    ]

    // Insert one tab per active form feature
    activeFeatures.forEach(feature => {
        let newFeature = {
            id: "button-" + feature.id + "-" + record.id,
            type: "button",
            text: feature.name,
            textAlign: "left",
            icon: feature.icon,
            iconColor: model.color,
            classes: {
                "this": "form-side-bar-button"
            },
            action: () => form.showFeature(feature.pluginId)
        }

        formFeatures = formFeatures.concat(newFeature)
    })

    return formFeatures
}

;