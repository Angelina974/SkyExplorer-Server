/**
 * 
 * Form actions
 * 
 * @ignore
 */
const createFormActions = function (form, activeFeatures) {
    const record = form.record
    const isMobile = kiss.screen.isMobile
    const hasFeatures = (activeFeatures.length > 0)
    let featureButtons = []

    if (kiss.screen.isMobile && hasFeatures) {
        featureButtons.push({
            id: "button-form-" + record.id,
            text: txtTitleCase("form"),
            icon: "far fa-window-restore",
            action: () => form.showFeature("form-content")
        })

        activeFeatures.forEach(feature => {
            featureButtons.push({
                id: "button-" + feature.id + "-" + record.id,
                text: feature.name,
                icon: feature.icon,
                action: () => form.showFeature(feature.pluginId)
            })
        })
    }

    return [
        ...featureButtons,

        (kiss.screen.isMobile && hasFeatures) ? "-" : "",

        // Action to edit form properties
        {
            hidden: !form.canEditModel || isMobile,
            icon: "fas fa-cog",
            text: txtTitleCase("form properties"),
            action: () => {
                kiss.context.modelId = record.model.id
                kiss.views.show("model-properties")
            }
        },

        // Action to edit the form (=> go to form designer)
        {
            hidden: !form.canEditModel || isMobile,
            icon: "fas fa-wrench",
            text: txtTitleCase("edit form"),
            action: () => {
                // Close the active form without saving
                const form = $(record.id)
                form.close("remove", true)

                // Try to close all other forms that are stacked
                let areFormsClosed = true
                const openedForms = document.querySelectorAll(".form-record")
                openedForms.forEach(openedForm => {
                    areFormsClosed = areFormsClosed && openedForm.close()
                })
                if (!areFormsClosed) return

                kiss.context.formDesignerBackUrl = kiss.router.getRoute()
                kiss.router.navigateTo({
                    ui: "form-designer",
                    modelId: record.model.id
                })
            }
        },

        // Action to edit form features
        {
            hidden: !form.canEditModel || isMobile,
            icon: "fas fa-puzzle-piece",
            text: txtTitleCase("#edit features") + " <b></b>",
            action: () => {
                kiss.context.modelId = record.model.id
                kiss.views.show("model-features")
            }
        },

        // Action to edit form access
        {
            hidden: !form.canEditModel || isMobile,
            icon: "fas fa-key",
            text: txtTitleCase("#secure table"),
            action: () => {
                kiss.context.modelId = record.model.id
                kiss.views.show("model-access")
            }
        },        

        (form.canEditModel && !isMobile) ? "-" : "",

        // Action to delete a record
        {
            icon: "fas fa-trash",
            iconColor: "var(--red)",
            text: txtTitleCase("delete this record"),
            action: () => {
                createDialog({
                    type: "danger",
                    title: txtTitleCase("delete this record"),
                    message: txtTitleCase("#delete record warning"),
                    buttonOKPosition: "left",
                    action: async () => {
                        const form = $(record.id)
                        const success = await record.delete(true)
                        if (success) form.close("remove", true)
                    }
                })
            }
        },

        // Action to get a link to the document
        {
            icon: "fas fa-link",
            text: txtTitleCase("get a link to this document"),
            action: () => {
                kiss.router.updateUrlHash({
                    recordId: record.id
                })

                kiss.tools.copyTextToClipboard(window.location.href)
                createNotification(txtTitleCase("#link copied"))
            }
        }
    ]
}

;