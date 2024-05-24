/**
 * 
 * The Slider derives from [Component](kiss.ui.Component.html).
 * 
 * Provides a progress bar field.
 * 
 * @param {object} config
 * @param {string} config.label
 * @param {number} [config.value] - Default value
 * @param {number} [config.min] - Default 0
 * @param {number} [config.max] - Default 100
 * @param {number} [config.step] - Slider step - Default 5
 * @param {string} [config.labelWidth]
 * @param {string} [config.labelPosition] - left | right | top | bottom
 * @param {string} [config.labelAlign] - left | right
 * @param {string} [config.fontSize]
 * @param {string} [config.formula]
 * @param {string|number} [config.width]
 * @param {string|number} [config.height]
 * @param {string} [config.margin]
 * @param {string} [config.padding]
 * @param {boolean} [config.readOnly]
 * @param {boolean} [config.disabled]
 * 
 * ## Generated markup
 * ```
 * <a-slider class="a-slider">
 *  <label class="field-label"></label>
 *  <span class="field-slider-container">
 *      <span class="field-slider" type="range">
 *      <span class="field-slider-value">
 *  </span>
 * </a-slider>
 * ```
 */
kiss.ui.Slider = class Slider extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const mySlider = document.createElement("a-slider").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const mySlider = createSlider({
     *  label: "%complete",
     *  min: 0,
     *  max: 200
     * })
     * 
     * mySlider.render()
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *   title: "My panel",
     *   items: [
     *       {
     *           type: "slider",
     *           label: "% complete",
     *           colorOn: "#00aaee",
     *           colorOff: "#dddddd"
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
     * Generates a Rating field from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config) {
        super.init(config)

        const id = this.id
        this.value = Number(config.value) || 0
        this.min = Number(config.min) || 0
        this.max = Number(config.max) || 100
        this.step = Number(config.step) || 5

        // Disable the field if it's readOnly
        this.readOnly = !!config.readOnly || !!config.computed
        if (this.readOnly) {
            this.disabled = true
            config.disabled = true
        }

        // Template
        this.innerHTML = /*html*/
            `${(config.label) ? `<label id="field-label-${id}" for="${id}" class="field-label">${config.label || ""} ${(config.unit) ? " (" + config.unit + ")" : ""}</label>` : "" }
            <span class="field-slider-container">
                <input class="field-slider" type="range" value="${this.value}" min="${this.min}" max="${this.max}" step="${this.step}" ${(this.disabled) ? "disabled" : ""}>
                <span class="field-slider-value">${this.value}</span>
            </span>
            `.removeExtraSpaces()

        // Set properties
        this.label = this.querySelector(".field-label")
        this.field = this.querySelector(".field-slider")
        this.sliderValue = this.querySelector(".field-slider-value")

        // Other W3C properties
        this._setProperties(config, [
            [
                ["draggable"],
                [this]
            ],
            [
                ["width", "height", "display", "margin", "padding", "flex"],
                [this.style]
            ],
            [
                ["color", "fontSize", "labelAlign=textAlign", "labelFlex=flex"],
                [this?.label?.style]
            ]
        ])

        // Set the default display mode that will be restored by the show() method
        this.displayMode = "flex"

        // Manage label and field layout according to label position
        this.style.flexFlow = "row"

        // Listen to events if the field is *not* disabled or *readOnly*
        if (config.disabled != true && !this.readOnly) {
            this.field.onchange = (event) => this.setValue(Number(event.target.value))
            this.field.oninput = (event) => this.sliderValue.innerHTML = event.target.value
        }

        // Label setup
        if (config.label) {
            // Label width
            if (config.labelWidth) this.setLabelWidth(config.labelWidth)

            // Label position
            this.config.labelPosition = config.labelPosition || "left"
            this.setLabelPosition(config.labelPosition)

            // Listen to click events if the field is *not* disabled or *readOnly*
            if (config.disabled != true) this.label.onclick = this.field.onclick
        }

        // Bind the field to a record, if any
        if (config.record) this._bindRecord(config.record)
        this._renderValues()

        return this
    }

    /**
     * Get the icon classes for each checkbox shape
     * 
     * @returns {object}
     */
    getIconClasses() {
        return {
            star: "fas fa-star",
            heart: "fas fa-heart",
            thumb: "fas fa-thumbs-up"
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

        if (record[this.id]) {
            this.value = this.initialValue = record[this.id]
        }

        const updateField = (updates) => {
            if (this.id in updates) {
                const newValue = updates[this.id]
                if (newValue || (newValue === false)) {
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
     * Render the current value(s) of the widget.
     * 
     * @private
     * @ignore
     */
    _renderValues() {
        this.field.value = this.sliderValue.innerHTML =this.value
        return this
    }

    /**
     * Set the field value
     * 
     * @param {boolean} newValue - The new field value
     * @param {boolean} [rawUpdate] - If true, it doesn't update the associated record and doesn't trigger "change" event 
     * @returns this
     */
    setValue(newValue, rawUpdate) {
        newValue = Number(newValue)

        if (newValue == this.value) return this
        if (rawUpdate) return this._updateValue(newValue, rawUpdate)

        if (this.record) {
            // If the field is connected to a record, we update the database
            this.record.updateFieldDeep(this.id, newValue).then(success => {
                if (success) {
                    this._updateValue(newValue)
                }
                else {
                    // Rollback the initial value if the update failed (ACL)
                    this._updateValue(this.initialValue)
                }
            })
        } else {
            this._updateValue(newValue)
        }
        
        return this
    }

    /**
     * Update the field's value internally
     * 
     * @private
     * @ignore
     * @param {boolean} newValue
     * @param {boolean} [rawUpdate]
     * @returns this
     */
    _updateValue(newValue, rawUpdate) {
        this.value = newValue
        this._renderValues()
        this.setValid()
        if (!rawUpdate) this.dispatchEvent(new Event("change"))
        return this
    }


    /**
     * Get the field value
     * 
     * @returns {number} - The field value
     */
    getValue() {
        return Number(this.value)
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
        this.field.classList.remove("field-input-invalid")
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
        this.field.classList.add("field-input-invalid")
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
     * Set the input field width
     * 
     * @param {*} width
     * @returns this
     */
    setFieldWidth(width) {
        this.config.fieldWidth = width
        this.field.style.width = this._computeSize("fieldWidth", width)
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
        this.label.style.minWidth = this.label.style.maxWidth = this._computeSize("labelWidth")
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
                this.style.alignItems = "unset"
                this.field.style.order = 1
                break
            case "bottom":
                this.style.flexFlow = "column"
                this.style.alignItems = "unset"
                this.field.style.order = -1
                break
            case "right":
                this.style.flexFlow = "row"
                this.style.alignItems = "center"
                this.field.style.order = -1
                break
            default:
                this.style.flexFlow = "row"
                this.style.alignItems = "center"
                this.field.style.order = 1
        }
        return this
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-slider", kiss.ui.Slider)

/**
 * Shorthand to create a new Progress bar. See [kiss.ui.Slider](kiss.ui.Slider.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createSlider = (config) => document.createElement("a-slider").init(config)

;