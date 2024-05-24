/**
 * 
 * The icon field allows to pick an icon and display its Font Awesome code.
 * 
 * @param {object} config
 * @param {string} [config.value] - Initial icon value
 * @param {string[]} [config.icons] - Optional array of icon classes to use. Ex: ["fas fa-check", "fas fa-user"]
 * @param {string} [config.iconColor] - Icon color. Ex: "#ffffff"
 * @param {string} [config.iconBackground - Icon background. Ex: "#00aaee"
 * @param {string} [config.iconSize] - Icon size. Ex: "16px"
 * @param {string} [config.iconAlign] - Ex: "center"
 * @param {string} [config.iconPadding] - Ex: "3px"
 * @param {boolean} [config.hideCode] - Set to true to hide the Font Awesome code
 * @param {string} [config.display]
 * @param {string} [config.width]
 * @param {string} [config.minWidth]
 * @param {string} [config.height]
 * @param {string} [config.padding]
 * @param {string} [config.margin]
 * @param {string} [config.border]
 * @param {string} [config.borderStyle]
 * @param {string} [config.borderWidth]
 * @param {string} [config.borderColor]
 * @param {string} [config.borderRadius]
 * @param {string} [config.boxShadow]
 * @param {boolean} [config.readOnly]
 * @returns this
 * 
 * ## Generated markup
 * ```
 * <a-icon class="a-icon">
 *  <label class="field-label"></label>
 *  <div class="field-icon-container">
 *      <div class="field-icon-palette"></div>
 *      <div class="field-icon-input"></div>
 *  </div>
 * </a-icon
 * ```
 */
 kiss.ui.Icon = class Icon extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myIconField = document.createElement("a-icon").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myIconField = createIconField({
     *  value: "fas fa-check",
     *  height: "32px"
     * })
     * 
     * myIconField.render()
     * myIconField.getValue() // fas fa-check
     * myIconField.setValue("fas fa-circle")
     * myIconField.getValue() // fas fa-circle
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *   title: "My panel",
     *   items: [
     *       {
     *           type: "icon",
     *           value: "fas fa-check",
     *           width: "32px"
     *           height: "32px",
     *           hideCode: true
     *       }
     *   ]
     * })
     * myPanel.render()
     * ```
     */
    constructor() {
        super()
    }

    init(config) {
        super.init(config)

        // Overwrite default value if the field is binded to a record
        // (default value must not override record's value)
        if (config.record && config.record[this.id]) config.value = config.record[this.id]

        const id = this.id
        this.value = config.value || ""
        this.required = !!config.required

        // Template
        this.innerHTML =
            `${ (config.label) ? `<label id="field-label-${this.id}" for="${this.id}" class="field-label">${config.label || ""}</label>` : "" }
            <div class="field-icon-container ${(config.readOnly) ? "field-input-read-only" : ""}">
                <div class="field-icon-palette ${this.value}"></div>
                ${(!config.hideCode) ? `<input type="text" readonly class="field-icon-input" value="${this.value}"></input>` : ""}
            </div>                
            `.removeExtraSpaces()

        this.label = this.querySelector(".field-label")
        this.fieldContainer = this.querySelector(".field-icon-container")
        this.icon = this.querySelector(".field-icon-palette")
        this.field = this.querySelector(".field-icon-input")

        // The width and height of the icon zone is adjusted if the icon code is displayed or not
        if (config.hideCode == true) this.icon.style.width = this.icon.style.height = "100%"

        // Set properties
        this._setProperties(config, [
            [
                ["draggable"],
                [this]
            ],
            [
                ["width", "height", "flex", "display", "margin", "padding"],
                [this.style]
            ],
            [
                ["fieldWidth=width", "fieldHeight=height", "fieldFlex=flex", "border", "borderStyle", "borderWidth", "borderColor", "borderRadius", "boxShadow"],
                [this.fieldContainer.style]
            ],
            [
                ["labelAlign=textAlign", "labelFlex=flex"],
                [this.label?.style]
            ],
            [
                ["borderRadius", "iconSize=fontSize", "iconColor=color", "iconBackground=background", "iconAlign=textAlign", "iconPadding=padding"],
                [this.icon.style]
            ]
        ])

        // Set the default display mode that will be restored by the show() method
        this.displayMode = "flex"

        // Manage label and field layout according to label position
        this.style.flexFlow = "row"

        if (config.label) {
            // Label width
            if (config.labelWidth) this.setLabelWidth(config.labelWidth)

            // Label position
            this.config.labelPosition = config.labelPosition || "left"
            this.setLabelPosition(config.labelPosition)
        }

        // Listen to click events if the field is *not* disabled or *readOnly* or *computed*
        this.readOnly = !!config.readOnly
        if (!this.readOnly && !config.disabled && !config.computed) {

            // Open the icon palette on click
            this.onclick = (event) => {
                const clickedElement = event.target.closest(".field-icon-container")
                if (!clickedElement) return

                const picker = createPanel({
                    modal: true,
                    header: false,
                    width: 675,
                    align: "center",
                    verticalAlign: "center",
                    items: [{
                        type: "iconPicker",
                        value: $(id).getValue(),
                        icons: config.icons || kiss.webfonts.all,
                        selectorBorderRadius: "32px",
                        height: 660,
                        autoFocus: true,
                        events: {
                            change: function () {
                                let icon = this.getValue()
                                $(id).setValue(icon)
                                picker.close()
                            }
                        }
                    }]
                }).render()
            }
        }

        // Bind the field to a record, if any
        if (config.record) this._bindRecord(config.record)

        // Render default value
        this._renderValues()

        return this
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
                this.value = updates[this.id]
                this._renderValues()
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
     * Set the fieldl value
     * 
     * @param {string} icon - Font Awesome icon code like "fas fa-check"
     * @param {boolean} [rawUpdate] - If true, it doesn't update the associated record and doesn't trigger "change" event 
     * @returns this
     */
    setValue(icon, rawUpdate) {
        if (icon == this.getValue()) return

        if (rawUpdate) return this._updateValue(icon, rawUpdate)

        if (this.record) {
            // If the field is connected to a record, we update the database
            this.record.updateFieldDeep(this.id, icon).then(success => {
                if (success) {
                    this._updateValue(icon)
                }
                else {
                    // Rollback the initial value if the update failed (ACL)
                    this._updateValue(this.initialValue)
                }
            })
        }
        else {
            this._updateValue(icon)
        }

        this.validate()
        return this
    }

    /**
     * Update the field's value internally
     * 
     * @private
     * @ignore
     * @param {string} icon
     * @param {boolean} [rawUpdate]
     * @returns this
     */
    _updateValue(icon, rawUpdate) {
        // const updateValue = (icon) => {
        //     this.value = icon
        //     this._renderValues()
        //     this.dispatchEvent(new Event("change"))
        // }

        this.value = icon
        this._renderValues()
        if (!rawUpdate) this.dispatchEvent(new Event("change"))
        return this
    }

    /**
     * Validate the field value against validation rules
     * 
     * @returns {boolean}
     */
     validate() {
        const isValid = kiss.tools.validateValue(this.type, this.config, this.value)
        if (isValid) {
            this.setValid()
        }
        else {
            this.setInvalid()
        }
        return isValid
    }

    /**
     * Remove the invalid style
     * 
     * @returns this
     */
    setValid() {
        this.isValid = true
        this.fieldContainer.classList.remove("field-input-invalid")
        return this
    }

    /**
     * Change the style when the field is invalid
     * 
     * @returns this
     */
    setInvalid() {
        log("kiss.ui - field.setInvalid - Invalid value for the field: " + this.config.label, 4)

        this.isValid = false
        this.fieldContainer.classList.add("field-input-invalid")
        return this
    }

    /**
     * Set the icon
     * 
     * @private
     * @ignore
     */
    _renderValues() {
        const icon = this.value || ""
        if (this.field) this.field.value = icon
        
        this.icon.className = ""
        const classList = icon.split(" ").filter(className => className != "")
        this.icon.classList.add("field-icon-palette", ...classList)
    }    

    /**
     * Get the field value
     * 
     * @returns {string} Font Awesome icon code like "fas fa-check"
     */
    getValue() {
        return this.value
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
     * Get the field label
     * 
     * @returns {string}
     */
    getLabel() {
        return this?.label?.innerText || ""
    }

    /**
     * Set the field width
     * 
     * @param {*} width
     * @returns this
     */
    setWidth(width) {
        this.config.width = width
        this.style.width = this._computeSize("width", width)
        return this
    }

    /**
     * Set the icon selector field width
     * 
     * @param {*} width
     * @returns this
     */
    setFieldWidth(width) {
        this.config.fieldWidth = width
        this.fieldContainer.style.width = this._computeSize("fieldWidth", width)
        return this
    }

    /**
     * Set the label width
     * 
     * @param {*} width
     * @returns this
     */
    setLabelWidth(width) {
        this.config.labelWidth = width
        this.label.style.minWidth = this.label.style.maxWidth = this._computeSize("labelWidth", width)
        return this
    }

    /**
     * Get the label position
     * 
     * @returns {string} "left" | "right" | "top"
     */
    getLabelPosition() {
        return this.config.labelPosition
    }

    /**
     * Set label position
     * 
     * @param {string} position - "left" (default) | "right" | "top" | "bottom"
     * @returns this
     */
    setLabelPosition(position) {
        this.config.labelPosition = position

        switch (position) {
            case "top":
                this.style.flexFlow = "column"
                this.fieldContainer.style.order = 1
                break
            case "bottom":
                this.style.flexFlow = "column"
                this.fieldContainer.style.order = -1
                break
            case "right":
                this.style.flexFlow = "row"
                this.fieldContainer.style.order = -1
                break
            default:
                this.style.flexFlow = "row"
                this.fieldContainer.style.order = 1
        }
        return this
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-icon", kiss.ui.Icon)

/**
 * Shorthand to create a new Icon field. See [kiss.ui.Icon](kiss.ui.Icon.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createIconField = (config) => document.createElement("a-icon").init(config)

;