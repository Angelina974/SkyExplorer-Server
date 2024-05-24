/**
 * 
 * The Rating derives from [Component](kiss.ui.Component.html).
 * 
 * Provides a rating field.
 * 
 * @param {object} config
 * @param {string} config.label
 * @param {number} [config.max] - From 1 to 10
 * @param {number} [config.value] - Default value
 * @param {string} [config.labelWidth]
 * @param {string} [config.labelPosition] - left | right | top | bottom
 * @param {string} [config.labelAlign] - left | right
 * @param {string} [config.fontSize]
 * @param {string} [config.shape] - star | heart | thumb
 * @param {string} [config.iconSize]
 * @param {string} [config.iconColorOn]
 * @param {string} [config.iconColorOff]
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
 * <a-rating class="a-rating">
 *  <label class="field-label"></label>
 *  <span class="field-rating">
 *      <span class="rating" index="1">
 *      <span class="rating" index="2">
 *      <span class="rating" index="3">
 *      <span class="rating" index="4">
 *      <span class="rating" index="5">
 *  </span>
 * </a-rating>
 * ```
 */
kiss.ui.Rating = class Rating extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myRating = document.createElement("a-rating").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myRating = createRating({
     *  label: "Rate me!",
     *  max: 5,
     *  iconColorOn: "#00aaee",
     *  iconColorOff: "#dddddd"
     * })
     * 
     * myRating.render()
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *  title: "My panel",
     *  items: [
     *      {
     *          type: "rating",
     *          label: "Rate me!",
     *          max: 5
     *      }
     *  ]
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
        this.max = config.max || 5

        // Rating icons
        config.shape = config.shape || "star"
        const iconClasses = this.getIconClasses()
        this.icon = iconClasses[config.shape]

        this.iconColorOn = config.iconColorOn || "#ffd139"
        this.iconColorOff = config.iconColorOff || "#dddddd"

        // Disable the field if it's readOnly
        this.readOnly = !!config.readOnly || !!config.computed
        if (this.readOnly) config.disabled = true

        // Template
        this.innerHTML = /*html*/
            `${(config.label) ? `<label id="field-label-${id}" for="${id}" class="field-label">${config.label || ""}</label>` : "" }
            <span class="field-rating"></span>
            `.removeExtraSpaces()

        // Set properties
        this.label = this.querySelector(".field-label")
        this.field = this.querySelector(".field-rating")

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

        // Listen to click events if the field is *not* disabled or *readOnly*
        if (config.disabled != true && !this.readOnly) {
            this.field.onclick = (event) => {
                if (event.target.classList.contains("rating")) {
                    const index = event.target.getAttribute("index")
                    this.setValue(Number(index) + 1)
                }
            }
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

        // Render default value
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
        let html = ""
        for (let i = 0; i < this.max; i++) {
            const color = (i < this.value) ? this.iconColorOn : this.iconColorOff
            html += /*html*/`<span class="rating ${this.icon}" style="color: ${color}" index=${i}></span>`
        }
        this.field.innerHTML = html
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
customElements.define("a-rating", kiss.ui.Rating)

/**
 * Shorthand to create a new Rating. See [kiss.ui.Rating](kiss.ui.Rating.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createRating = (config) => document.createElement("a-rating").init(config)

;