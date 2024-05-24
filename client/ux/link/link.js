/**
 * 
 * A *Link* field allows to link records together by picking a foreign record from a list.
 * 
 * @ignore
 * @param {object} config
 * @param {object[]} config.options - List of options, where each option is an object like: {value: "France"} or {label: "France", value: "FR"} or {label: "France", value: "FR", color: "#00aaee"}
 * @param {boolean} [config.multiple] - True to enable multi-select
 * @param {boolean} [config.linkStyle] - "default" or "compact"
 * @param {string|string[]} [config.value] - Default value
 * @param {string} [config.optionsColor] - Default color for all options
 * @param {string} [config.valueSeparator] - Character used to display multiple values
 * @param {string} [config.inputSeparator] - Character used to input multiple values
 * @param {boolean} [config.stackValues] - True to render the values one on another
 * @param {boolean} [config.hideInput] - true (default) to automatically hide the input field after a completed search
 * @param {boolean} [config.allowValuesNotInList] - Allow to input a value which is not in the list of options
 * @param {boolean} [config.allowDuplicates] - Allow to input duplicate values. Default to false.
 * @param {boolean} [config.allowClickToDelete] - Add a "cross" icon over the values to delete them. Default to false.
 * @param {boolean} [config.allowSwitchOnOff] - Allow to click on a value to switch it on/off
 * @param {function} [config.optionRenderer] - Custom function to render each option in the list of options
 * @param {function} [config.valueRenderer] - Custom function to render the actual field values
 * @param {string} [config.label]
 * @param {string} [config.labelWidth]
 * @param {string} [config.labelPosition] - left | right | top | bottom
 * @param {string} [config.labelAlign] - left | right
 * @param {boolean} [config.autocomplete] - Set "off" to disable
 * @param {boolean} [config.readOnly]
 * @param {boolean} [config.disabled]
 * @param {boolean} [config.required]
 * @param {string} [config.margin]
 * @param {string} [config.padding]
 * @param {string} [config.display] - flex | inline flex
 * @param {string|number} [config.width]
 * @param {string|number} [config.minWidth]
 * @param {string|number} [config.height]
 * @param {boolean} [config.canCreateRecord] - false to prevent from creating a new foreign record directly from the Link field
 * @param {boolean} [config.canLinkRecord] - false to prevent from linking to a new foreign record directly from the Link field
 * @returns this
 * 
 */
kiss.ux.Link = class Link extends kiss.ui.Select {
    constructor() {
        super()
    }

    init(config = {}) {
        this.readOnly = !!config.readOnly
        this.canCreateRecord = config.canCreateRecord
        this.canLinkRecord = config.canLinkRecord
        this.canDeleteLinks = config.canDeleteLinks

        // Init the foreign table
        this.foreignModel = kiss.app.models[config.link.modelId]
        this.foreignCollection = this.foreignModel?.collection || {}
        this.sort = []

        // Init the global table that contains relationships
        this.linkModel = kiss.app.models.link
        this.linkCollection = this.linkModel.collection

        // Implement the default <Select> field
        super.init(config)

        // Overrides default click event
        this.onclick = this._handleClick
        
        // Disable the dropdown list that shows options
        this._showOptions = () => {}

        return this
    }

    /**
     * Handle the click event
     * 
     * @private
     * @ignore
     * @param {object} event 
     */
    _handleClick(event) {
        const classes = event.target.classList

        // Clicked on the unlink button
        if (classes.contains("field-link-value-delete")) {
            if (!this.readOnly) {
                const fieldValueElement = event.target.closest("div")
                const linkId = fieldValueElement.getAttribute("linkId")
                return this._deleteLink(linkId)
            }
        }

        // Clicked on a foreign record item
        const item = event.target.closest(".field-link-value")
        if (item) {
            const clickedItem = event.target.closest(".field-link-value")
            const recordId = clickedItem.getAttribute("recordId")
            return this._openRecord(recordId)
        }

        // Clicked on a button
        const button = event.target.closest(".a-button")
        if (button) {
            if (button.classList.contains("field-link-button-link")) return this._linkForeignRecords()
            if (button.classList.contains("field-link-button-add")) return this._createAndLink()
            if (button.classList.contains("field-link-button-expand")) return this._showForeignRecords()
        }

        // Clicked in the buttons area
        if (event.target.closest(".field-link-buttons") && this.canLinkRecord && !this.readOnly) {
            this._linkForeignRecords()
        }
    }

    /**
     * Bind the field to a record
     * (this subscribes the field to react to database changes)
     * 
     * @private
     * @ignore
     * @param {object} record
     * @returns this
     */
    _bindRecord(record) {
        this.record = record
        this.modelId = record.model.id
        this.recordId = record.id

        // React to changes on a single record update of the binded foreign model
        const foreignModelId = this.foreignModel.id

        this.subscriptions.push(
            subscribe("EVT_DB_UPDATE:" + foreignModelId.toUpperCase(), (msgData) => {
                if (msgData.modelId == foreignModelId) {
                    const recordIds = this.links.map(link => link.recordId)
                    if (recordIds.includes(msgData.id)) {
                        this._renderValues()
                    }
                }
            })
        )

        // React to changes on foreign records deletions
        this.subscriptions.push(
            subscribe("EVT_DB_DELETE:" + foreignModelId.toUpperCase(), (msgData) => {
                if (msgData.modelId == foreignModelId) {
                    const recordIds = this.links.map(link => link.recordId)
                    if (recordIds.includes(msgData.id)) {
                        this._renderValues()
                    }
                }
            })
        )

        // React to changes on multiple records changes of the binded foreign model
        this.subscriptions.push(
            subscribe("EVT_DB_UPDATE_BULK", (msgData) => {
                let shouldUpdate = false
                const recordIds = this.links.map(link => link.recordId)
                const operations = msgData.data

                operations.forEach(operation => {
                    if ((operation.modelId == foreignModelId) && recordIds.includes(operation.recordId)) shouldUpdate = true
                })

                if (shouldUpdate) {
                    this._renderValues()
                }
            })
        )

        // React to changes on link creations
        this.subscriptions.push(
            subscribe("EVT_DB_INSERT:LINK", (msgData) => {
                if ((msgData.data.rX == this.record.id) || (msgData.data.rY == this.record.id)) {
                    this._renderValues()
                }
            })
        )

        // React to changes on link deletions
        this.subscriptions.push(
            subscribe("EVT_DB_DELETE:LINK", (msgData) => {
                const recordIds = this.links.map(link => link.linkId)
                if (recordIds.includes(msgData.id)) {
                    this._renderValues()
                }
            })
        )

        return this
    }

    /**
     * Get the field value
     * 
     * @returns {object[]} - The field value, which is an array of foreign records
     */
    getValue() {
        return this.links || []
    }

    /**
     * Create a new foreign record then link it directly with the active record
     * 
     * @private
     * @ignore
     */
    async _createAndLink() {
        // Prevent from linking multiple records if the field is not flagged "multiple"
        if (!this.multiple && this.links.length > 0) {
            return createNotification(txtTitleCase("#only one link"))
        }

        // Creates the new foreign record
        let newForeignRecordData = {}
        let newForeignRecord

        if (!this.config.inherit) {
            newForeignRecord = this.foreignModel.create()
        }
        else {
            // If the inheritance option is enabled,
            // each new document created will be pre-filled with the values of the fields of the same name
            const model = kiss.app.models[this.modelId]
            const sharedFields = model.fields.filter(fX => this.foreignModel.fields.find(
                fY => fX.label == fY.label &&
                !fX.deleted &&
                !fY.deleted &&
                !fX.isSystem &&
                !fX.isFromPlugin
            ))
            
            sharedFields.forEach(field => {
                const foreignField = this.foreignModel.getFieldByLabel(field.label)
                newForeignRecordData[foreignField.id] = this.record[field.id]
            })

            newForeignRecord = this.foreignModel.create(newForeignRecordData, true)
        }
        
        await newForeignRecord.save()

        // Display the new record in a form
        createForm(newForeignRecord)

        // Link the 2 records together
        await this.record.linkTo(newForeignRecord, this.id, this.config.link.fieldId)

        // Update the list of links
        this._renderValues()
    }

    /**
     * Delete a link to a foreign record
     * 
     * @private
     * @ignore
     * @param {string} linkId - id of the record that holds the link
     */
    async _deleteLink(linkId) {
        createDialog({
            title: txtTitleCase("delete a link"),
            type: "dialog",
            message: txtTitleCase("#delete link"),
            colorOK: "var(--red)",
            colorCancel: "var(--green)",
            action: async () => {
                const success = await this.record.deleteLink(linkId)
                if (!success) return

                this._renderValues()
                this.dispatchEvent(new Event("change"))
            }
        })
    }

    /**
     * Open a foreign record
     * 
     * @private
     * @ignore
     * @param {string} recordId - id of the record to open
     */
    async _openRecord(recordId) {
        const link = this.links.find(linkInfo => linkInfo.record.id == recordId)
        const record = this.foreignModel.create(link.record)
        createForm(record)
    }

    /**
     * Show linked foreign records
     * 
     * @private
     * @ignore
     */
    async _showForeignRecords() {
        const foreignRecords = this.links.map(link => link.record)
        createRecordSelectorWindow(this.foreignModel, this.id, foreignRecords, null, {
            canSelect: false
        })
    }

    /**
     * Link a record from the datatable
     * 
     * @private
     * @ignore
     * @param {object} record
     */
    async _linkRecord(record) {
        createDialog({
            title: txtTitleCase("#connect records"),
            message: txtTitleCase("#connect confirmation"),
            icon: "fas fa-link",
            action: async () => {
                const linkField = $(this.config.fieldId)

                const success = await linkField._addLink(record)
                if (!success) return createNotification(txtTitleCase("#record already linked"))
                
                linkField.setValid()
                this.closest("a-panel").close()
            }
        })

    }

    /**
     * Show all the foreign records that can be selected
     * 
     * @private
     * @ignore
     */
    async _linkForeignRecords() {
        // Prevent from linking multiple records if the field is not flagged "multiple"
        if (!this.multiple && this.links.length > 0) {
            return createNotification(txtTitleCase("#only one link"))
        }

        createRecordSelectorWindow(this.foreignModel, this.id, null, this._linkRecord, {
            iconAction: "fas fa-link",
            canSelect: false
        })
    }

    /**
     * Add a link with an existing foreign record
     * 
     * @private
     * @ignore
     * @param {object} foreignRecord
     * @eturns {boolean} false if the operation failed
     */
    async _addLink(foreignRecord) {
        // Prevent from selecting a record which is already linked
        if (this.links.map(link => link.recordId).includes(foreignRecord.id)) return false

        await this.record.linkTo(foreignRecord, this.id, this.config.link.fieldId)
        this._renderValues()
        this.dispatchEvent(new Event("change"))
        return true
    }

    /**
     * Get the view configuration
     * 
     * @private
     * @ignore
     * @returns {object[]}
     */
    _getViewConfig() {
        const viewRecord = kiss.app.collections.view.records.find(view => view.modelId == this.foreignModel.id && view.fieldId == this.id)

        // Register the field to listen to view changes
        if (viewRecord && !this.viewId) {
            this.viewId = viewRecord.id
            this.subscriptions.push(
                kiss.pubsub.subscribe("EVT_DB_UPDATE:VIEW", msgData => {
                    if (msgData.id != this.viewId) return
                    if (msgData.data.sort) this._renderValues()
                    if (msgData.data.config && msgData.data.config.columns) this._renderValues()
                })
            )
        }

        // Assign sort infos
        this.sort = (viewRecord) ? viewRecord.sort : this.sort
        
        return (viewRecord) ? viewRecord.config.columns : []
    }

    /**
     * Load the linked records
     * 
     * @private
     * @ignore
     */
    async _loadLinks() {
        if (!this.record) {
            this.links = []
            return
        }
        this.links = await kiss.data.relations.getLinksAndRecords(this.record.model.id, this.record.id, this.id, this.sort)
    }

    /**
     * Render the current value(s) of the widget
     * 
     * @private
     * @ignore
     * @async
     */
    async _renderValues() {
        const viewConfig = this._getViewConfig()

        await this._loadLinks()

        const linkButtonId = kiss.tools.shortUid()
        const hasLinks = (this.links.length != 0)
        const canLinkOtherRecords = (hasLinks && this.multiple != true) ? false : true

        const showAddButton = this.record && !this.readOnly && this.canCreateRecord !== false && canLinkOtherRecords
        const showLinkButton = !this.readOnly && this.canLinkRecord !== false && canLinkOtherRecords
        const showExpandButton = this.multiple && hasLinks
        const showButtons = showAddButton || showLinkButton || showExpandButton

        const linkButtons = (!showButtons) ? "" : `
            <div class="field-link-buttons">
                ${(showAddButton) ? `<div id="${linkButtonId}" class="a-button field-link-button field-link-button-add"><span class="button-icon fas fa-plus"></span><span class="button-text">${txtTitleCase("new")}</span></div>` : ""}
                ${(showLinkButton) ? `<div class="a-button field-link-button field-link-button-link"><span class="button-icon fas fa-link"></span><span class="button-text">${txtTitleCase("#select link")}</span></div>` : ""}
                ${(showExpandButton) ? `<div class="a-button field-link-button field-link-button-expand"><span class="button-icon fas fa-table"></span><span class="button-text">${txtTitleCase("display as table")}</span></div>` : ""}
            </div>`.removeExtraSpaces()

        // No record attached, or no links => just display buttons
        if (!this.record || !hasLinks) {
            this.fieldValues.innerHTML = linkButtons
            return
        }

        // Separate values with <br> if the option "stackValues" is true
        let htmlSeparator = (this.stackValues) ? "<br>" : ""

        // Get the fields to display in the cards, depending on the config
        const isCompact = (this.config.linkStyle == "compact")
        const displayLabels = (!["compact", "no labels"].includes(this.config.linkStyle))

        let fields = this.foreignModel.getActiveFields()
        let fieldsToDisplay = fields

        if (isCompact) {
            const primaryKeyField = this.foreignModel.getPrimaryKeyField()
            fieldsToDisplay = [primaryKeyField || fields[0]]
        } else {
            if (viewConfig.length > 0) {
                fieldsToDisplay = viewConfig
                    .filter(column => column.hidden != true)
                    .map(column => fieldsToDisplay.find(field => field.id == column.id))
                    .filter(field => field)
            }
        }

        // Render!
        const badge = (isCompact) ? "" : `<div class="field-link-item-badge" style="background: ${this.foreignModel.color}">
                            <span class="${this.foreignModel.icon}"></span>
                        </div>`

        this.fieldValues.innerHTML =
            linkButtons +
            this.links.map(recordInfo => {
                return `<div class="field-link-value ${(isCompact) ? "field-link-value-compact" : ""}" recordId="${recordInfo.recordId}" linkId="${recordInfo.linkId}" style="border-color: ${this.foreignModel.color}">
                            ${badge}
                            <div class="field-link-record" id="field-link-record:${recordInfo.recordId}">
                                ${this._renderSingleValue(recordInfo.record, fieldsToDisplay, displayLabels)}
                            </div>
                            ${(this.readOnly || !this.canDeleteLinks) ? "" : `<span class="field-link-value-delete fas fa-times"></span>`}
                        </div>`.removeExtraSpaces()
            }).join(htmlSeparator)
    }

    /**
     * Render a single value of the the widget
     * 
     * @private
     * @ignore
     * @param {object} record - Record to render
     * @returns {string} Html for the value
     */
    _renderSingleValue(record, fieldsToDisplay, displayLabels) {
        return fieldsToDisplay.map(field => {
            // Skip system fields
            if (field.isSystem) return ""

            let value = record[field.id]

            // Convert summary & lookup fields to mimic the type of their source field
            let type = field.type
            if (type == "lookup") {
                type = field.lookup.type
            } else if (type == "summary") {
                if (field.summary.type == "directory" && field.summary.operation == "LIST_NAMES") type = "directory"
            }

            // Field label
            const htmlLabel = (displayLabels) ? `<div class="field-link-item-label">${field.label}</div>` : ""

            switch (type) {
                case "date":
                    const date = (value) ? new Date(value).toLocaleDateString() : "-"
                    return `<div class="field-link-item">
                            ${htmlLabel}
                            <div class="field-link-item-value">${date}</div>
                        </div>`

                case "checkbox":
                    return this._rendererForCheckbox(field, value, displayLabels)

                case "directory":
                    return this._rendererForDirectory(field, value, displayLabels)

                case "color":
                    return `<div class="field-link-item">
                        ${htmlLabel}
                        <div class="field-link-item-color" style="background-color: ${value}"></div>
                    </div>`

                case "icon":
                    return `<div class="field-link-item">
                        ${htmlLabel}
                        <div class="field-link-item-icon ${value}"></div>
                    </div>`

                case "link":
                    return ""

                case "slider":
                    return this._rendererForSlider(field, value, displayLabels)

                case "attachment":
                    if (value) {
                        const fileInfos = value[0] // Get the first file only
                        if (!fileInfos) return ""

                        //let filePath = fileInfos.path.replaceAll("\\", "/")
                        let filePath = `/file/${fileInfos.id}`
                        const isRelativePath = !filePath.startsWith("http")
                        if (isRelativePath) filePath = "/" + filePath

                        let fileType = filePath.split(".").pop().toLowerCase()
                        let isImage = (["jpg", "jpeg", "png", "gif", "webp"].includes(fileType))

                        if (isImage) return `<div class="field-link-item-image">
                            ${htmlLabel}
                            <div class="field-link-item-value">
                                <img class="field-link-item-image-thumbnail" src="${filePath}" loading="lazy">
                            </div>
                        </div>`

                        // It's not an image: switch to default rendering with the filename as value
                        value = fileInfos.filename
                    }

                    default:
                        if (!value) value = "-"
                        else if (field.valueRenderer) value = field.valueRenderer(value, record)

                        return `<div class="field-link-item">
                            ${htmlLabel}
                            <div class="field-link-item-value">${value}</div>
                        </div>`
            }
        }).join("")
    }

    /**
     * Render for directory fields
     * 
     * @private
     * @ignore
     * @param {object} field - The field config
     * @param {boolean} value
     * @param {boolean} displayLabels - true to display the field labels
     */
    _rendererForDirectory(field, values, displayLabels) {
        let listOfNames = "-"
        if (values) {
            listOfNames = [].concat(values).map(value => {
                if (!value) return ""

                let name
                switch (value) {
                    case "*":
                        name = kiss.directory.roles.everyone.label
                        break
                    case "$authenticated":
                        name = kiss.directory.roles.authenticated.label
                        break
                    case "$creator":
                        name = kiss.directory.roles.creator.label
                        break
                    case "$nobody":
                        name = kiss.directory.roles.nobody.label
                        break
                    default:
                        name = kiss.directory.getEntryName(value)
                }

                return (name) ? name : ""
            }).join(", ")
        }

        return `<div class="field-link-item">
                    ${(displayLabels) ? `<div class="field-link-item-label">${field.label}</div>` : ""}
                    <div class="field-link-item-value">${listOfNames}</div>
                </div>`
    }

    /**
     * Render the value for a single checkbox
     * 
     * @private
     * @ignore
     * @param {object} field - The field config
     * @param {boolean} value
     * @param {boolean} displayLabels - true to display the field labels
     */
    _rendererForCheckbox(field, value, displayLabels) {
        let shape = field.shape || "square"
        let iconColorOn = field.iconColorOn || "#000000"

        try {
            if (field.type == "lookup") {
                const linkId = field.lookup.linkId
                const linkField = this.foreignModel.getField(linkId)
                const foreignModelId = linkField.link.modelId
                const foreignModel = kiss.app.models[foreignModelId]
                const sourceField = foreignModel.getField(field.lookup.fieldId)
                shape = sourceField.shape
                iconColorOn = sourceField.iconColorOn
            }
        } catch (err) {
            log("kiss.ui - Datatable - Couldn't generate renderer for checkboxes", 4)
        }

        const iconClasses = kiss.ui.Checkbox.prototype.getIconClasses()
        const defaultIconOn = iconClasses[shape]["on"] + " "
        const defaultIconOff = iconClasses[shape]["off"] + " "

        return `<div class="field-link-item">
                    ${(displayLabels) ? `<div class="field-link-item-label">${field.label}</div>` : ""}
                    <div class="field-link-item-value">
                        <span ${(value === true) ? `style="color: ${iconColorOn}"` : ""} class=\"${(value === true) ? `${defaultIconOn} datatable-type-checkbox-checked` : `${defaultIconOff} datatable-type-checkbox-unchecked`}\"/>
                    </div>
                </div>`
    }

    /**
     * Render the value for a slider
     * 
     * @private
     * @ignore
     * @param {object} field - The field config
     * @param {boolean} value
     * @param {boolean} displayLabels - true to display the field labels
     */
    _rendererForSlider(field, value, displayLabels) {
        return `<div class="field-link-item">
                    ${(displayLabels) ? `<div class="field-link-item-label">${field.label}</div>` : ""}
                    <div class="field-link-item-value">
                        <span class="field-slider-value">${value || 0} ${field.unit}</span>
                        <input type="range" class="field-slider field-link-item-slider" value="${value || 0}">
                    </div>
                </div>`
    }    

    /**
     * Get the list of possible values from the linked collection
     * 
     * @private
     * @ignore
     */
    async _loadOptions() {
        if ((!this.foreignCollection) || (!this.config.link.modelId)) {
            this.options = []
            return
        }

        const options = await this.foreignCollection.find()
        this.options = options.map(record => record.id)
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-link", kiss.ux.Link)
const createLink = (config) => document.createElement("a-link").init(config)

;