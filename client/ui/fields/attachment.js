/**
 * 
 * The Attachment derives from [Component](kiss.ui.Component.html).
 * 
 * It allow to manipulate files:
 * - upload files
 * - preview uploaded files
 * - delete files
 * 
 * @param {object} config
 * @param {string} [config.label]
 * @param {string} [config.buttonText] - Text of the upload button. Defaults to "attach files"
 * @param {object[]} [config.value] - Default value
 * @param {string} [config.layout] - "" (default) | "thumbnails" | "thumbnails-large"
 * @param {boolean} [config.allowLayout] - true (default) to display the buttons to change the layout
 * @param {boolean} [config.multiple] - TODO: true to enable multi-select
 * @param {boolean} [config.readOnly]
 * @param {boolean} [config.disabled] - TODO
 * @param {boolean} [config.required] - TODO
 * @param {string} [config.margin]
 * @param {string} [config.padding]
 * @returns this
 * 
 * ## Generated markup
 * The field is a composition of various elements:
 * - a span for the field label
 * - a span for the button to upload new files, which includes a span for the button icon
 * - a div to display the gallery of thumbnails
 * 
 * ```
 * <a-attachment class="a-attachment">
 *   <span class="field-label"></span>
 *   <span class="a-button attachment-button field-upload-button">
 *       <span class="fas fa-paperclip attachment-icon"></span> Attach files
 *   </span>
 *   <div class="field-attachment-gallery">
 *   </div>
 * </a-attachment>
 * ```
 */
kiss.ui.Attachment = class Attachment extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myAttachment = document.createElement("a-attachment").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myAttachment = createAttachment({
     *  label: "My uploaded files",
     *  multiple: true
     * })
     * 
     * myAttachment.render()
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *   title: "My panel",
     *   items: [
     *       {
     *          type: "attachment",
     *          label: "My uploaded files",
     *          multiple: true
     *       }
     *   ]
     * })
     * myPanel.render()
     * ```
     */
    constructor() {
        super()
    }

    /**
     * Generates a Select field from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config = {}) {
        super.init(config)

        this.value = config.value || []
        this.multiple = config.multiple || false
        this.readOnly = !!config.readOnly

        // The component only works with arrays
        if (!Array.isArray(this.value)) this.value = []

        // Template
        this.innerHTML =
            `${(config.label) ? `<span id="field-label-${this.id}" class="field-label">${config.label || ""}</span>` : "" }
                ${(!this.readOnly)
                    ? `<span class="a-button field-attachment-button field-upload-button">
                        <span class="fas fa-paperclip field-attachment-icon"></span>
                        ${config.buttonText || txtTitleCase("attach files")}
                    </span>`
                    : ""}
                
                <span class="field-attachment-layout">
                    <span class="a-button field-attachment-button display-as-list fas fa-th-list"></span>
                    <span class="a-button field-attachment-button display-as-thumbnails fas fa-th-large"></span>
                    <span class="a-button field-attachment-button display-as-thumbnails-large fas fa-stop"></span>
                </span>

                <div class="field-attachment-gallery"></div>
             `.removeExtraSpaces()

        this.label = this.querySelector(".field-label")
        this.fieldValues = this.querySelector(".field-attachment-gallery")
        this.layoutButtons = this.querySelector(".field-attachment-layout")

        // Set properties
        this._setProperties(config, [
            [
                ["margin", "padding"],
                [this.style]
            ]
        ])

        // Set the default display mode
        this.displayMode = "flex"

        // Get the layout: list or thumbnails
        this._initLayout()

        // Add field base class
        this.classList.add("a-attachment")
        // if (this.readOnly) this.classList.add("field-attachment-read-only")

        // Bind the field to a record, if any
        if (config.record) this._bindRecord(config.record)

        // Render values after a short delay to not interfer with form rendering
        setTimeout(() => this._renderValues(), 200)

        this._initClickEvent()
        this._initSubscriptions()

        return this
    }

    /**
     * Handle click event
     * 
     * @private
     * @ignore
     */
    _initClickEvent() {
        this.onclick = function (event) {
            if (event.target.classList.contains("field-upload-button")) {
                this.showUploadWindow()
            } else if (event.target.classList.contains("display-as-list")) {
                this.renderAs("list")
            } else if (event.target.classList.contains("display-as-thumbnails")) {
                this.renderAs("thumbnails")
            }  else if (event.target.classList.contains("display-as-thumbnails-large")) {
                this.renderAs("thumbnails-large")
            }
        }
    }

    /**
     * Render the attachments in different modes:
     * - list
     * - thumbnails
     * - large thumbnails
     * 
     * @param {string} mode - "list" | "thumbnails" | "thumbnails-large"
     */
    renderAs(mode) {
        if (mode == "list") {
            localStorage.removeItem("config-layout-" + this.id)
            mode = ""
        }
        else {
            localStorage.setItem("config-layout-" + this.id, mode)
            mode = "-" + mode
        }
        
        this._initLayout()
        this._setItemClass("item", "field-attachment-item" + mode)
        this._setItemClass("preview", "field-attachment-preview" + mode)
        this._setItemClass("filename", "field-attachment-filename" + mode)
    }

    /**
     * @private
     * @ignore
     */
    _getItemsByRole(role) {
        return Array.from(this.querySelectorAll(`[role="${role}"]`))
    }

    /**
     * @private
     * @ignore
     */
    _setItemClass(role, classname) {
        const items = this._getItemsByRole(role)
        items.forEach(item => {
            item.classList.remove("field-attachment-" + role)
            item.classList.remove("field-attachment-" + role + "-thumbnails")
            item.classList.remove("field-attachment-" + role + "-thumbnails-large")
            item.classList.add(classname)
        })
    }

    /**
     * Switch 2 classes of an element
     * 
     * @private
     * @ignore
     */    
    _switchClass(fromClass, toClass, large) {
        Array.from(this.querySelectorAll(".field-attachment-item")).forEach(element => {
            element.classList.remove(fromClass)
            element.classList.add(toClass)
        })
    }

    /**
     * Init subscriptions
     * Bind the field to upload events
     * 
     * @private
     * @ignore
     */
    _initSubscriptions() {
        this.subscriptions.push(
            subscribe("EVT_FILE_UPLOAD", msgData => {
                if ((msgData.modelId == this.modelId) && (msgData.recordId == this.recordId) && (msgData.fieldId == this.id) && msgData.files) {
                    let newValues = msgData.files.map(file => {
                        return {
                            id: file.id,
                            filename: file.originalname,
                            path: file.path,
                            size: file.size,
                            type: file.type,
                            mimeType: file.mimeType,
                            thumbnails: file.thumbnails,
                            accessReaders: file.accessReaders,
                            createdAt: file.createdAt,
                            createdBy: file.createdBy
                        }
                    })
                    this.setValue(this.getValue().concat(newValues))
                }
            })
        )
    }

    /**
     * Display the upload window of the attachment field
     */
    showUploadWindow() {
        createFileUploadWindow({
            modelId: this.record?.model.id,
            recordId: this.record?.id,
            fieldId: this.id
        })
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

        if (record[this.id]) {
            this.value = this.initialValue = record[this.id]
        }

        const updateField = (updates) => {
            if (this.id in updates) {
                const newValue = updates[this.id]
                if (newValue) {
                    this.value = newValue
                    this._renderValues()
                }
            }
        }

        // React to changes on a single record of the binded model
        this.subscriptions.push(
            subscribe("EVT_DB_UPDATE:" + this.modelId.toUpperCase(), (msgData) => {
                if ((msgData.modelId == this.modelId) && (msgData.id == this.recordId)) {
                    const updates = msgData.data
                    updateField(updates)
                }
            })
        )

        // React to changes on multiple records of the binded Model
        this.subscriptions.push(
            subscribe("EVT_DB_UPDATE_BULK", (msgData) => {
                const operations = msgData.data
                operations.forEach(operation => {
                    if ((operation.modelId == this.modelId) && (operation.recordId == this.recordId)) {
                        const updates = operation.updates
                        updateField(updates)
                    }
                })
            })
        )

        return this
    }

    /**
     * Set the field value
     * 
     * @param {object[]} newValues - The new field value
     * @param {boolean} [rawUpdate] - If true, it doesn't update the associated record and doesn't trigger "change" event 
     * @returns this
     */
    setValue(newValues, rawUpdate) {
        newValues = [].concat(newValues)

        if (rawUpdate) return this._updateValue(newValues, rawUpdate)

        if (this.record) {
            // If the field is connected to a record, we update the database
            this.record.updateFieldDeep(this.id, newValues).then(success => {
                if (success) {
                    this._updateValue(newValues)
                } else {
                    // Rollback the initial value if the update failed (ACL)
                    this._updateValue(this.initialValue)
                }
            })
        } else {
            this._updateValue(newValues)
        }

        return this
    }

    /**
     * Update the field's value internally
     * 
     * @private
     * @ignore
     * @param {object[]} newValues
     * @param {boolean} [rawUpdate]
     * @returns this
     */
    _updateValue(newValues, rawUpdate) {
        // const updateValue = (newValues) => {
        //     this.value = newValues
        //     this._renderValues()
        //     if (this.onchange) this.onchange(newValues)    
        // }

        this.value = newValues
        this._renderValues()
        if (this.onchange && !rawUpdate) this.onchange(newValues)
        return this
    }

    /**
     * Get the field value
     * 
     * @returns {string[]} - The field value
     */
    getValue() {
        return this.value || []
    }

    /**
     * Reset the field value
     * 
     * @returns this
     */
    resetValue() {
        this.value = []
        this._renderValues()
        return this
    }

    /**
     * Get the field label
     * 
     * @returns {string}
     */
    getLabel() {
        return this?.label?.innerText || ""
    }

    /**
     * Set the field label
     * 
     * @param {string} newLabel
     * @returns this
     */
    setLabel(newLabel) {
        if (!this.label) return

        this.config.label = newLabel
        this.label.innerText = newLabel
        return this
    }

    /**
     * Validate the field (always true because Attachment fields can't have wrong values)
     * 
     * @returns {boolean}
     */
    validate() {
        return true
    }

    /**
     * Restore the layout (list or thumbnails)
     * 
     * @private
     * @ignore
     */
    _initLayout() {
        this.layout = localStorage.getItem("config-layout-" + this.id)
        if (!this.layout) this.layout = this.config.layout || ""
    }

    /**
     * Render the current value(s) of the widget.
     * 
     * @private
     * @ignore
     */
    _renderValues() {
        // Empty value
        if ((this.value == "") || (this.value == null) || (this.value == "undefined") || (this.value[0] == null) || (this.value[0] == "")) {
            this.fieldValues.innerHTML = ""
            this.fieldValues.style.display = "none"
            this.layoutButtons.style.display = "none"
            return
        }

        // The component accepts values that are not arrays, but it only works with arrays internally
        if (!Array.isArray(this.value)) this.value = [this.value]

        this.fieldValues.innerHTML = this.value.map((file, i) => {
            return this._renderValue(file, i)

        }).join("")

        this.fieldValues.style.display = "flex"
        if (this.config.allowLayout !== false) {
            this.layoutButtons.style.display = "inline-block"
        }
        else {
            this.layoutButtons.style.display = "none"
        }
        

        // All files that don't have a public URL will be handled by a specific and authenticated download link
        kiss.session.setupDownloadLink(...this.fieldValues.querySelectorAll('a[download]'))
        kiss.session.setupImg(...this.fieldValues.querySelectorAll('img'))
    }

    /**
     * Render a single file
     * 
     * @private
     * @ignore
     */
    _renderValue(file, i) {
        if (!file.path) return ""
        const isPublic = (file.accessReaders && Array.isArray(file.accessReaders) && file.accessReaders.includes("*"))
        const lockIcon = (isPublic) ? "fas fa-lock-open" : "fas fa-lock"
        const layout = (this.layout.includes("thumbnails")) ? "-" + this.layout : ""

        let preview
        let filePath = kiss.tools.createFileURL(file)
        let fileThumbnail = kiss.tools.createFileURL(file, "m")
        const fileExtension = file.path.split(".").pop().toLowerCase()

        if (["jpg", "jpeg", "png", "gif", "webp"].indexOf(fileExtension) != -1) {
            // Image
            preview = `<img role="preview" public="${isPublic}" class="field-attachment-preview${layout}" src="${fileThumbnail}" loading="lazy"></img>`
        } else {
            // Other
            const {
                icon,
                color
            } = kiss.tools.fileToIcon(fileExtension)
            preview = `<span role="preview" style="color: ${color}" class="fas ${icon} field-attachment-preview${layout}"></span>`
        }

        return /*html*/ `
                <div role="item" class="field-attachment-item${layout}" id="${file.id}" onclick="this.closest('.a-attachment')._previewAttachment(event)">
                    <div class="field-attachment-preview-container">${preview}</div>
                    <span role="filename" class="field-attachment-filename${layout}">${file.filename}</span>
                    <span class="field-attachment-buttons">
                        <span class="field-attachment-filesize">${file.size.toFileSize()}</span>
                        <span style="flex:1"></span>
                        ${(this.readOnly) ? "" : `<span class="field-attachment-delete fas fa-trash" index="${i}" onclick="$('${this.id}')._deleteFile(event, '${file.id}')"></span>`}
                        ${(this.readOnly) ? "" : `<span class="field-attachment-access ${lockIcon}" index="${i}" onclick="$('${this.id}')._switchFileACL(event, '${file.id}')"></span>`}
                        <a href="${filePath}" download public="${isPublic}" target="_blank"><span class="field-attachment-download far fa-arrow-alt-circle-down"></span></a>
                    </span>
                </div>`

        // Add this line *inside* the div to show the file menu icon
        // <span class="field-attachment-menu fas fa-ellipsis-v" index="${i}" onclick="$('${this.id}')._openFileMenu(event, '${file.id}')"></span>     
    }

    /**
     * !Not used yet
     * Open a menu with the file operations
     * 
     * @private
     * @ignore
     * @param {*} event 
     * @param {string} fileId 
     */
    _openFileMenu(event, fileId) {
        event.stop()

        const currentValues = this.getValue()
        const file = currentValues.get(fileId)
        const ACL = (file.accessReaders.includes("*")) ? "private" : "public"
        const lockIcon = (ACL == "public") ? "fas fa-lock-open" : "fas fa-lock"

        createMenu({
            top: event.clientY - 10,
            left: event.clientX - 10,
            items: [{
                icon: lockIcon,
                text: txtTitleCase("#update file ACL", null, {
                    access: txtUpperCase(ACL)
                }),
                action: async () => {
                    const response = await kiss.ajax.request({
                        url: "/updateFileACL",
                        method: "patch",
                        showLoading: true,
                        body: JSON.stringify({
                            modelId: this.modelId,
                            recordId: this.recordId,
                            fieldId: this.id,
                            file,
                            ACL
                        })
                    })

                    if (response.success) {
                        const message = "<center>" + txtTitleCase("#updating ACL") + "<br><b>" + txtUpperCase(ACL)
                        createNotification({
                            message,
                            duration: 2000
                        })
                    }                    
                }
            }]
        }).render()
    }

    /**
     * Preview an attachment
     * 
     * @private
     * @ignore
     * @param {object} event
     * @param {string} fieldId 
     */
    _previewAttachment(event) {

        // Exit if clicked on the download link
        if ([...event.target.classList].includes("field-attachment-download")) return

        const itemClass = (this.layout) ? ".field-attachment-item-" + this.layout : ".field-attachment-item"
        const attachmentId = event.target.closest(itemClass).id
        const cellAttachments = this.getValue()
        createPreviewWindow(cellAttachments, attachmentId)
    }

    /**
     * Switch a file ACL between public and private
     * 
     * @private
     * @ignore
     * @param {*} event 
     * @param {string} fileId 
     */
    async _switchFileACL(event, fileId) {
        event.stop()
        if (kiss.session.isOffline()) return

        const currentValues = this.getValue()
        const file = currentValues.get(fileId)
        const newACL = (file.accessReaders && Array.isArray(file.accessReaders) && file.accessReaders.includes("*")) ? "private" : "public"

        const response = await kiss.ajax.request({
            url: "/updateFileACL",
            method: "patch",
            showLoading: true,
            body: JSON.stringify({
                modelId: this.modelId,
                recordId: this.recordId,
                fieldId: this.id,
                file,
                ACL: newACL
            })
        })

        if (response.success) {
            const message = "<center>" + txtTitleCase("#updating ACL") + "<br><b>" + txtUpperCase(newACL)
            createNotification({
                message,
                duration: 2000
            })
        }
    }

    /**
     * Delete a file from the attachment field
     * 
     * @private
     * @ignore
     * @param {object} event
     * @param {string} fileId 
     */
    _deleteFile(event, fileId) {
        event.stop()
        if (kiss.session.isOffline()) return

        createDialog({
            type: "danger",
            title: txtTitleCase("deleting a file"),
            message: txtTitleCase("#warning delete file"),
            buttonOKPosition: "left",

            action: async () => {
                let currentValues = this.getValue()
                let newValues = currentValues.removeById(fileId)

                // Delete the file from the "file" collection
                const fileCollection = kiss.app.collections.file

                const loadingId = kiss.loadingSpinner.show()
                const success = await fileCollection.deleteOne(fileId)

                // Update the field value if the file could be physically deleted
                if (success) {
                    this.setValue(newValues)
                }
                kiss.loadingSpinner.hide(loadingId)
            }
        })
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-attachment", kiss.ui.Attachment)

/**
 * Shorthand to create a new File Uploader field. See [kiss.ui.Attachment](kiss.ui.Attachment.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createAttachment = (config) => document.createElement("a-attachment").init(config)

;