/**
 * 
 * Main interface to SHOW or HIDE the FIELDS of a Data Component
 * 
 * @ignore
 */
const createDataFieldsWindow = function (viewId, color = "#00aaee") {
    const selectWindowId = "field-selection-for-" + viewId

    return createPanel({
        id: selectWindowId,
        title: txtTitleCase("select your fields"),
        icon: "fas fa-bars fa-rotate-90",
        headerBackgroundColor: color,
        maxHeight: () => kiss.screen.current.height - 150,
        
        modal: true,
        closable: true,
        draggable: true,
        layout: "vertical",

        items: [
            // Block that contains the list of checkboxes to show/hide fields
            {
                id: "field-selection-for-datable:" + viewId,
                layout: "vertical",
                overflowY: "auto"
            },
            // Buttons
            {
                layout: "horizontal",
                margin: "10px 0px 0px 0px",
                overflow: "unset",

                items: [
                    // Button to hide all fields
                    {
                        type: "button",
                        text: txtTitleCase("hide all"),
                        icon: "fas fa-eye-slash",
                        flex: 1,
                        events: {
                            click: function () {
                                let selectionWindow = $(selectWindowId)
                                selectionWindow.toggleAll("hide")
                            }
                        }
                    },
                    {
                        type: "spacer",
                        width: "10px"
                    },
                    // Button to show all fields
                    {
                        type: "button",
                        text: txtTitleCase("show all"),
                        icon: "fas fa-eye",
                        flex: 1,
                        events: {
                            click: function () {
                                let selectionWindow = $(selectWindowId)
                                selectionWindow.toggleAll("show")
                            }
                        }
                    }
                ]
            }
        ],

        subscriptions: {
            "EVT_DB_UPDATE:VIEW": (msgData) => {
                if ($(selectWindowId) && (msgData.id == viewId) && (msgData.userId != kiss.session.getUserId())) $(selectWindowId).load()
            },
            ["EVT_VIEW_FIELD_MOVED:" + viewId]: () => $(selectWindowId).load()
        },        

        methods: {
            load: () => {
                // Build all the checkboxes to toggle the fields on/off
                let checkboxFields = []

                $(viewId).getFields().forEach(field => {
                    if (field.deleted) return
                    
                    checkboxFields.push({
                        id: "checkbox-" + field.id,
                        type: "checkbox",
                        label: field.title.toTitleCase(),
                        labelWidth: "100%",
                        labelPosition: "right",
                        
                        checked: !field.hidden,

                        shape: "switch",
                        iconSize: "16px",
                        iconColorOn: color,
                        class: "switch-field",
                        draggable: true,

                        events: {
                            /**
                             * Show / hide a single field when clicking on the checkbox
                             */
                            click: function () {
                                let fieldId = this.id.split("checkbox-")[1]
                                kiss.pubsub.publish("EVT_VIEW_FIELD_TOGGLED_ONE:" + viewId, fieldId)
                            },

                            /**
                             * Handle drag&drop
                             */
                            ondragstart: function(event) {
                                event.stopPropagation()
                                kiss.context.draggedElement = event.target.closest("a-checkbox")
                                kiss.context.dragStartY = event.clientY
                            },

                            ondragover: function(event) {
                                event.stop()

                                const dropTarget = event.target.closest("a-checkbox")
                                if (dropTarget.id == kiss.context.draggedElement.id) return
                                dropTarget.style.minHeight = "60px"
                                dropTarget.style.alignItems = "unset"
                                dropTarget.style.transition = "all 0.1s"
                            },

                            ondragleave: function(event) {
                                const dropTarget = event.target.closest("a-checkbox")
                                dropTarget.style.minHeight = "26px"
                                dropTarget.style.alignItems = "center"
                            },

                            ondrop: function(event) {
                                const dropTarget = event.target.closest("a-checkbox")
                                dropTarget.style.minHeight = "26px"
                                dropTarget.style.alignItems = "center"
                                
                                const sourceFieldId = kiss.context.draggedElement.id.split("checkbox-")[1]
                                const targetFieldId = dropTarget.id.split("checkbox-")[1]

                                publish("EVT_VIEW_FIELD_MOVING:" + viewId, {
                                    sourceFieldId,
                                    targetFieldId,
                                    position: "after"
                                })
                            }
                        }
                    })
                })

                $("field-selection-for-datable:" + viewId).setItems(checkboxFields)
            },

            /**
             * Show / hide all fields
             * 
             * @param {string} newState - "show" or "hide"
             */
            toggleAll: (newState) => {
                let isChecked = (newState == "show")

                $(viewId).getFields().forEach(field => {
                    if (field.deleted) return
                    let checkboxId = "checkbox-" + field.id
                    let checkbox = $(checkboxId)
                    checkbox.setValue(isChecked)
                })

                publish("EVT_VIEW_FIELD_TOGGLED_ALL:" + viewId, newState)
            }
        }
    })
}

;