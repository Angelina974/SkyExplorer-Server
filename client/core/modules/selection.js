/**
 * 
 * ## A simple selection manager
 * 
 * - keeps track of selected records for a specific view
 * - allow simple operations like add/delete/get/reset
 * - store in a localStorage object, which key is the viewId
 * - works in combination with datatables or other data components with selection capabilities
 * 
 * @namespace
 * 
 */
kiss.selection = {
    /**
     * Insert one record into the view selection
     * 
     * @param {string} viewId 
     * @param {string} recordId 
     */
    insertOne(viewId, recordId) {
        let selection = localStorage.getItem("config-selection-" + viewId)
        if (!selection) {
            localStorage.setItem("config-selection-" + viewId, recordId)
            return
        }

        let records = selection.split(",")
        if (records.indexOf(recordId) != -1) return

        localStorage.setItem("config-selection-" + viewId, selection + "," + recordId)
    },

    /**
     * Insert many records into the view selection
     * 
     * @param {string} viewId 
     * @param {string[]} recordIds
     */    
    insertMany(viewId, recordIds) {
        recordIds.forEach(recordId => {
            kiss.selection.insertOne(viewId, recordId)
        })
    },

    /**
     * Delete a record from the view selection
     * 
     * @param {string} viewId 
     * @param {string} recordId 
     */    
    delete(viewId, recordId) {
        let selection = localStorage.getItem("config-selection-" + viewId)
        if (!selection) return

        let records = selection.split(",").remove(recordId)
        records = records.filter(recordId => recordId != "")
        localStorage.setItem("config-selection-" + viewId, records.join(","))
    },

    /**
     * Reset the selection of a view
     * 
     * @param {string} viewId 
     */       
     reset(viewId) {
        let selection = localStorage.getItem("config-selection-" + viewId)
        if (!selection) return

        localStorage.removeItem("config-selection-" + viewId)
    },    

    /**
     * Get the current selection for a view
     * 
     * @param {string} viewId
     * @returns {string[]} The list of ids of the selected records
     */    
    get(viewId) {
        let selection = localStorage.getItem("config-selection-" + viewId)
        if (!selection) return []

        return selection.split(",")
    },

    /**
     * Get the current selection for the active view
     * 
     * @param {string} viewId
     * @returns {string[]} The list of ids of the selected records
     */    
    getFromActiveView() {
        const viewId = kiss.context.viewId
        if (!viewId) return []
        let selection = localStorage.getItem("config-selection-" + viewId)
        if (!selection) return []

        return selection.split(",")
    },    

    /**
     * Get the selected records in a view
     * 
     * @param {string} viewId
     * @returns {object[]} The list of selected records
     */      
    async getRecords(viewId) {
        const recordIds = kiss.selection.get(viewId)
        const viewCollection = $(viewId).collection
        return await viewCollection.findById(recordIds)
    },

    /**
     * Get the selected records in the active view
     * 
     * @returns {object[]} The list of selected records
     */
    async getRecordsFromActiveView() {
        const viewId = kiss.context.viewId
        return await kiss.selection.getRecords(viewId)
    },

    /**
     * Opens a window to batch update the selected records
     */
    updateSelectedRecords() {
        const ids = kiss.selection.getFromActiveView()
        if (ids.length == 0) return createNotification(txtTitleCase("#no selection"))

        const model = kiss.app.models[kiss.context.modelId]
        if (!model) return

        const fields = model.getBatchableFields()

        createPanel({
            id: "selection-batch-update",
            title: txtTitleCase("update selected documents"),
            modal: true,
            closable: true,
            draggable: true,
            icon: "fas fa-bolt",
            align: "center",
            verticalAlign: "center",
            layout: "vertical",
            width: 400,


            items: [
                // Field to update
                {
                    id: "batch-field",
                    type: "select",
                    label: txtTitleCase("field to update"),
                    labelPosition: "top",
                    width: "100%",
                    options: fields.map(field => {
                        return {
                            value: field.id,
                            label: field.label
                        }
                    }),
                    events: {
                        change: function() {
                            const fieldId = this.getValue()
                            $("selection-batch-update").updateInput(fieldId)
                        }
                    }
                },
                // Value to set (will be replaced by the input field)
                {
                    id: "batch-value-container",
                },
                // Button to update the records
                {
                    hidden: true,
                    id: "batch-update-button",
                    type: "button",
                    text: txtTitleCase("update"),
                    icon: "fas fa-bolt",
                    iconColor: "var(--yellow)",
                    margin: "5px 5px 0 5px",
                    action: () => $("selection-batch-update").updateRecords(ids)
                }
            ],

            methods: {
                updateRecords(ids) {
                    // Warn the user that the operation is irreversible
                    createDialog({
                        title: txtTitleCase("update selected documents"),
                        type: "danger",
                        buttonOKPosition: "left",
                        message: txtTitleCase("#warning update docs", null, {
                            n: ids.length
                        }),
                        action: async () => {
                            const fieldId = $("batch-field").getValue()
                            const value = $("batch-value").getValue()

                            if (value == "") {
                                // Warn the user that the value is empty
                                createDialog({
                                    title: txtTitleCase("empty value"),
                                    type: "danger",
                                    buttonOKPosition: "left",
                                    message: txtTitleCase("#warning empty value"),
                                    action: async () => {
                                        kiss.selection._updateRecords(fieldId, value)
                                        $("selection-batch-update").close()
                                    }
                                })  
                            }
                            else {
                                kiss.selection._updateRecords(fieldId, value)
                                $("selection-batch-update").close()
    
                            }
                        }
                    })
                },

                /**
                 * Update the input field according to the selected field
                 * 
                 * @param {string} fieldId 
                 */
                updateInput(fieldId) {
                    let currentField = $("batch-value")
                    if (currentField) currentField.deepDelete()

                    const fieldConfig = this.buildInput(fieldId)
                    let input = fieldConfig.renderer(fieldConfig)
                    input.render()

                    $("batch-update-button").show()
                },

                /**
                 * Build an input field according to the selected field
                 * 
                 * @param {string} fieldId 
                 * @returns {object} The input field configuration
                 */
                buildInput(fieldId) {
                    const fieldConfig = fields.find(field => field.id == fieldId)
                    let fieldType = fieldConfig.type
                    let fieldBuilderFunction = createField
                    let allowValuesNotInList = true
                    let iconColorOn
                    let checked = false
                    let options = []
                    let optionsFilter
                    let shape = ""
                    let roles = []
                    let multiple
                    let unit
                    let min
                    let max
                    let rows
            
                    switch (fieldType) {
                        case "textarea":
                        case "aiTextarea":
                            fieldType = "textarea"
                            rows = 5
                            break
                        case "select":
                            options = fieldConfig.options
                            optionsFilter = fieldConfig.optionsFilter
                            multiple = fieldConfig.multiple
                            allowValuesNotInList = fieldConfig.allowValuesNotInList
                            fieldBuilderFunction = createSelect
                            break
                        case "checkbox":
                            shape = fieldConfig.shape
                            iconColorOn = fieldConfig.iconColorOn
                            fieldBuilderFunction = createCheckbox
                            break
                        case "slider":
                            min = fieldConfig.min || 0
                            max = fieldConfig.max || 100
                            fieldBuilderFunction = createSlider
                            break
                        case "rating":
                            shape = fieldConfig.shape || "star"
                            min = fieldConfig.min || 0
                            max = fieldConfig.max || 10
                            iconColorOn = fieldConfig.iconColorOn
                            fieldBuilderFunction = createRating
                            break
                        case "color":
                            fieldBuilderFunction = createColorField
                            break
                        case "icon":
                            fieldBuilderFunction = createIconField
                            break
                        case "directory":
                            roles = ["userId"]
                            multiple = fieldConfig.multiple
                            allowValuesNotInList = false
                            fieldBuilderFunction = createDirectory
                            break
                    }
            
                    // Create an input field configuration with the right type
                    return {
                        id: "batch-value",
                        target: "batch-value-container",
                        type: fieldType,
                        label: txtTitleCase("new field value"),
                        labelPosition: "top",
                        width: "100%",

                        // Field options
                        rows,
                        min,
                        max,
                        unit,
                        checked,
                        multiple,
                        allowValuesNotInList,
            
                        // Special fields options
                        renderer: fieldBuilderFunction, // renderer
                        options, // select
                        optionsFilter, // select
                        optionsColor: model.color,
                        roles, // directory
                        shape, // checkbox
                        iconColorOn, // checkbox
                        iconSize: "20px", // checkbox
                    }
                }
            }
        }).render()
    },

    /**
     * Private utility function to update records from a view
     * 
     * @private
     * @ignore
     * @param {string} fieldLabel 
     * @param {*} value 
     */
    async _updateRecords(fieldLabel, value) {
        const model = kiss.app.models[kiss.context.modelId]
        if (!model) return

        const field = model.getFieldByLabel(fieldLabel)
        if (!field) return

        const viewId = kiss.context.viewId
        if (!$(viewId)) return

        const recordIds = kiss.selection.get(viewId)
        const viewCollection = $(viewId).collection
        const selectedRecords = await viewCollection.findById(recordIds)
    
        const loadingId = kiss.loadingSpinner.show()
        let counter = 0
        for (let record of selectedRecords) {
            await record.update({
                [field.id]: value
            })
            counter++
            createNotification(counter + " / " + selectedRecords.length)
        }
        kiss.loadingSpinner.hide(loadingId)
    },

    /**
     * Delete the selected records
     */
    deleteSelectedRecords() {
        const model = kiss.app.models[kiss.context.modelId]
        if (!model) return

        const ids = this.getFromActiveView()
        if (ids.length == 0) return createNotification(txtTitleCase("#no selection"))

        createDialog({
            title: txtTitleCase("delete selected documents"),
            type: "danger",
            buttonOKPosition: "left",
            message: txtTitleCase("#warning delete docs", null, {
                n: ids.length
            }),
            action: async () => {
                await kiss.db.deleteMany(model.id, {
                    _id: {
                        "$in": ids
                    }
                }, true)
                kiss.selection.reset(this.id)
            }
        })
    }    
}

;