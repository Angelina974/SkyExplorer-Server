/**
 * 
 * Main form content
 * 
 * The form items are given either:
 * - indirectly through the record (config.record.model.items)
 * - directly through the model
 * 
 * @ignore
 * @param {object} config
 * @param {object} [config.record]
 * @param {object} [config.model]
 * @param {boolean} [config.editMode] - If false, the form is in read only mode
 * 
 */
const createFormContent = function (config) {
    let model, modelItems, record

    if (config.record) {
        record = config.record
        model = record.model
        modelItems = JSON.parse(JSON.stringify(model.items))
        
    } else if (config.model) {
        model = config.model
        modelItems = config.model.items
    }

    // Cache user ACL
    const userACL = kiss.session.getACL()

    // Screen orientation
    const orientation = kiss.screen.getOrientation()

    // Format model's items in a usable format for a form UI:
    // - filters out deleted fields
    // - regen section ids to be able to open multiple forms of the same type
    // - show a star for required fields
    // - show a locker for readOnly fields
    // - assign model's color to sections
    // - show/hide sections and items according to ACL fields
    function getFormItems(items, editMode) {
        items = items.filter(item => item != null && item.deleted != true)
        items.forEach(item => {
            if (item.items) {
                //
                // Section
                // 
                if (config.record && item.accessRead) item.accessRead = item.accessRead.map(entry => (entry != "$creator") ? entry : config.record.createdBy)
                const canRead = kiss.tools.intersects(item.accessRead, userACL) || !item.accessRead

                if (!canRead) {
                    item.hidden = true
                }
                else {
                    if (config.record && item.accessUpdate) item.accessUpdate = item.accessUpdate.map(entry => (entry != "$creator") ? entry : config.record.createdBy)
                    const canUpdate = (editMode === false) ? false : kiss.tools.intersects(item.accessUpdate, userACL) || !item.accessUpdate

                    item.id = kiss.tools.shortUid()
                    item.headerBackgroundColor = model.color
                    item.items = getFormItems(item.items, canUpdate)
                }

                // Force clean case
                item.title = item.title.toTitleCase()

                // Set section "light" style
                if (item.colored === false) {
                    item.headerColor = model.color
                    item.headerBorderColor = model.color
                    item.headerBackgroundColor = "transparent"
                    item.iconColor = model.color
                }
            } else {
                // 
                // Field or Widget
                //

                // Display a lock symbol on read only fields
                if (editMode === false) {
                    item.readOnly = true
                    item.locked = true
                    // item.label = `<span class="field-label-read-only fas fa-lock"></span> ` + item.label
                    item.required = false // Can't be both readOnly and required!
                }
                else if (item.required) {
                    // item.label = item.label + ` <span class="field-label-required"><sup>*</sup></span>`
                }

                // Convert summary & lookup fields to mimic the type of their source field
                if (item.type == "summary") {
                    if (item.summary.type == "directory" && item.summary.operation == "LIST_NAMES") item.type = "directory"
                }
                else if (item.type == "lookup") {
                    item.type = item.lookup.type || "text"
                    if (item.type == "selectViewColumns") item.type = "text"
                }

                // Set layout according to orientation
                if (orientation == "vertical") {
                    item.labelPosition = "top"
                    item.width = "100.00%"
                    item.fieldWidth = "100.00%"
                    item.labelWidth = "100.00%"
                }
            }
        })
        return items
    }

    modelItems = getFormItems(modelItems, config.editMode)

    // Build form content block
    return createBlock({
        class: "form-content",
        layout: "vertical",
        overflowY: "auto",
        flex: 1,
        padding: (orientation == "vertical") ? "0" : "var(--panel-padding)",

        defaultConfig: {
            overflow: "unset"
        },

        items: [
            // Form header
            {
                class: "form-header"
            },

            // Form
            {
                class: "form-fields",

                defaultConfig: {
                    width: "100%",
                    labelWidth: "100%",
                    labelPosition: "top"
                },

                record: record,
                items: modelItems
            },

            // Form footer
            {
                class: "form-footer"
            }
        ],

        methods: {
            async load() {
                // Enable ability to edit fields setup for non mobile UI
                if (kiss.screen.isMobile) return
                const form = this.closest(".form-record")
                if (form.canEditModel) this.enableFieldDesign()
            },

            /**
             * Enable the ability to edit the fields directly inside the form
             */
            enableFieldDesign() {
                const fieldLabels = this.querySelectorAll(".field-label")

                fieldLabels.forEach(labelElement => {
                    labelElement.classList.add("field-label-setup")
                    const fieldId = labelElement.parentNode.id
                    const field = model.getField(fieldId)
                    const isPrimary = field.primary

                    labelElement.onclick = function (event) {

                        createMenu({
                            items: [
                                // EDIT FIELD
                                {
                                    text: txtTitleCase("edit field") + " <b>" + field.label + "</b>",
                                    icon: "fas fa-edit",
                                    action: () => {
                                        kiss.context.dockFieldProperties = false

                                        kiss.router.updateUrlHash({
                                            modelId: model.id,
                                            fieldId
                                        })
                                        kiss.views.show("model-field")
                                    }
                                },

                                // Menu separator
                                (!isPrimary) ? "-" : "",

                                // DELETE FIELD
                                (!isPrimary) ? {
                                    text: txtTitleCase("delete field"),
                                    icon: "fas fa-trash",
                                    action: () => {
                                        createDialog({
                                            type: "dialog",
                                            title: txtTitleCase("delete a field"),
                                            message: txtTitleCase("#delete field warning"),
                                            action: async () => {
                                                await model.deleteField(fieldId)
                                            }
                                        })
                                    }
                                } : ""
                            ]
                        }).render().showAt(event.clientX - 10, event.clientY - 10)
                    }
                })
            }
        }
    })
}

;