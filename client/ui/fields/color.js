/**
 * 
 * The color field allows to pick a color and display its hexa color code.
 * 
 * @param {object} config
 * @param {string} [config.value] - Initial color value
 * @param {boolean} [config.hideCode] - Set to true to hide the hexa color code
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
 * <a-color class="a-color">
 *  <label class="field-label"></label>
 *  <div class="field-color-container">
 *      <div class="field-color-palette"></div>
 *      <div class="field-color-input"></div>
 *  </div>
 * </a-color
 * ```
 */
kiss.ui.Color = class Color extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myColorField = document.createElement("a-color").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myColorField = createColorField({
     *  value: "#00aaee",
     *  height: "32px"
     * })
     * 
     * myColorField.render()
     * myColorField.getValue() // #00aaee
     * myColorField.setValue("#ff0000")
     * myColorField.getValue() // #ff0000
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *   title: "My panel",
     *   items: [
     *       {
     *           type: "color",
     *           value: "#00aaee",
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
        this.readOnly = !!config.readOnly

        // Template
        this.innerHTML = /*html*/ `
            ${ (config.label) ? `<label id="field-label-${this.id}" for="${this.id}" class="field-label">${config.label || ""}</label>` : "" }
            <div class="field-color-container ${(config.palette != "default") ? " field-color-container-custom " : " field-color-container-standard "} ${(config.readOnly) ? "field-input-read-only" : ""}">
                ${(config.palette != "default")
                    ? `<div class="field-color-palette field-color-palette-custom" style="background-color: ${this.value.trim()}"></div>`
                    : `<input class="field-color-palette field-color-palette-standard" type="color" value=${this.value}>`
                }
                ${(!config.hideCode) ? `<input type="text" ${(this.readOnly) ? " readonly " : ""} class="field-color-input" value="${this.value}"></input>` : ""}
            </div>
            `.removeExtraSpaces()

        this.label = this.querySelector(".field-label")
        this.fieldContainer = this.querySelector(".field-color-container")
        this.color = this.querySelector(".field-color-palette")
        this.field = this.querySelector(".field-color-input")

        // The width and height of the color zone is adjusted if the color code is displayed or not
        if (config.hideCode == true) this.color.style.width = this.color.style.height = "100%"

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
                ["borderRadius"],
                [this.color.style]
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

        // Listen to click events if the field is *not* disabled or *readOnly* or *computed* or a default HTML5 palette (which listens to click by default)
        if (!this.readOnly && !config.disabled && !config.computed && config.palette != "default") {
            this.onclick = (event) => {
                const clickedElement = event.target.closest(".field-color-container")
                if (!clickedElement) return
                
                const picker = createPanel({
                    modal: true,
                    header: false,
                    width: 705,
                    align: "center",
                    verticalAlign: "center",
                    items: [{
                        type: "colorPicker",
                        value: $(id).getValue(),
                        palette: config.palette || kiss.global.palette,
                        selectorBorderRadius: "32px",
                        height: 100,
                        events: {
                            change: function () {
                                let color = this.getValue()
                                $(id).setValue(color)
                                picker.close()
                            }
                        }
                    }]
                }).render()
            }
        }

        // Update color when we directly enter a color code inside the input field
        if (this.field) {
                this.field.onchange = (event) => {
                let color = event.target.value
                $(id).setValue(color)
            }
        }
        
        if (config.palette == "default") {
            // Lock default behavior and prevent the palette from diplaying
            if (this.readOnly) this.color.onclick = (event) => {event.stop()}

            // Update color when we exit the default color palette
            this.color.onchange = (event) => {
                let color = event.target.value
                $(id).setValue(color)
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
     * @param {string} color - Hex color like #aa00ee
     * @param {boolean} [rawUpdate] - If true, it doesn't update the associated record and doesn't trigger "change" event 
     * @returns this
     */
    setValue(color, rawUpdate) {
        if (color == this.getValue()) return

        if (rawUpdate) return this._updateValue(color, rawUpdate)

        if (this.record) {
            // If the field is connected to a record, we update the database
            this.record.updateFieldDeep(this.id, color).then(success => {
                if (success) {
                    this._updateValue(color)
                }
                else {
                    // Rollback the initial value if the update failed (ACL)
                    this._updateValue(this.initialValue)
                }
            })
        }
        else {
            this._updateValue(color)
        }

        this.validate()
        return this
    }

    /**
     * Update the field's value internally
     * 
     * @private
     * @ignore
     * @param {string} color
     * @param {boolean} [rawUpdate]
     * @returns this
     */
    _updateValue(color, rawUpdate) {
        // const updateValue = (color) => {
        //     this.value = color
        //     this._renderValues()
        //     this.dispatchEvent(new Event("change"))
        // }

        this.value = color
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
     * Set the color
     * 
     * @private
     * @ignore
     * @param {string} color - Hex color
     */
    _renderValues() {
        const color = this.value || ""
        if (this.field) this.field.value = color
        this.color.style.background = (color == "#TRANSPARENT") ? "transparent" : color
    }

    /**
     * Get the field value
     * 
     * @returns {string} The field hex color value. Ex: #00aaee
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
     * Set the color selector field width
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
customElements.define("a-color", kiss.ui.Color)

/**
 * Shorthand to create a new Color field. See [kiss.ui.Color](kiss.ui.Color.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createColorField = (config) => document.createElement("a-color").init(config)

;