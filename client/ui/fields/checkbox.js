/**
 * 
 * The Checkbox derives from [Component](kiss.ui.Component.html).
 * 
 * Provides a customizable checkbox.
 * 
 * @param {object} config
 * @param {string} config.label
 * @param {string} [config.labelWidth]
 * @param {string} [config.labelPosition] - left | right | top | bottom
 * @param {string} [config.labelAlign] - left | right
 * @param {string} [config.color]
 * @param {string} [config.fontSize]
 * @param {string} [config.shape] - check | square | circle | switch | star
 * @param {string} [config.iconSize]
 * @param {string} [config.iconOn]
 * @param {string} [config.iconOff]
 * @param {string} [config.iconColorOn]
 * @param {string} [config.iconColorOff]
 * @param {string} [config.formula]
 * @param {boolean} [config.checked] - Default state - Can use "checked" or "value" indifferently
 * @param {boolean} [config.value] - Default state - Can use "checked" or "value" indifferently
 * @param {string|number} [config.width]
 * @param {string|number} [config.height]
 * @param {string} [config.margin]
 * @param {string} [config.padding]
 * @param {boolean} [config.readOnly]
 * @param {boolean} [config.disabled]
 * 
 * ## Generated markup
 * ```
 * <a-checkbox class="a-checkbox">
 *  <label class="field-label"></label>
 *  <span class="field-checkbox-icon font-awesome-icon-class"></span>
 *  <input type="checkbox" class="field-checkbox">
 * </a-checkbox>
 * ```
 */
kiss.ui.Checkbox = class Checkbox extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myCheckbox = document.createElement("a-checkbox").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myCheckbox = createCheckbox({
     *  text: "Check me!",
     *  shape: "switch"
     * })
     * 
     * myCheckbox.render()
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *   title: "My panel",
     *   items: [
     *       {
     *           type: "checkbox",
     *           text: "Check me!",
     *           shape: "switch"
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
     * Generates a Checkbox from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config) {
        super.init(config)

        const id = this.id

        // Checkbox shape
        config.shape = config.shape || "square"
        const iconClasses = this.getIconClasses()
        const defaultIconOn = iconClasses[config.shape]["on"]
        const defaultIconOff = iconClasses[config.shape]["off"]

        // Accept "value" or "checked" as default value to keep it uniform with all other field types
        let isChecked = config.checked || config.value

        // Overwrite default value if the field is binded to a record
        // (default value must not override record's value)
        if (config.record && config.record[this.id] !== undefined) isChecked = config.record[this.id]

        this.iconOn = config.iconOn || defaultIconOn
        this.iconOff = config.iconOff || defaultIconOff
        this.iconColorOn = config.iconColorOn || "#20c933"
        this.iconColorOff = config.iconColorOff || "#aaaaaa"
        const defaultIcon = (isChecked == true) ? this.iconOn : this.iconOff
        const defaultIconColor = (isChecked == true) ? this.iconColorOn : this.iconColorOff

        // Disable the field if it's readOnly
        this.readOnly = !!config.readOnly || !!config.computed
        if (this.readOnly) config.disabled = true
        
        // Template
        this.innerHTML = /*html*/
            `${(config.label) ? `<label id="field-label-${id}" for="${id}" class="field-label">${config.label || ""}</label>` : "" }
                <span id="" style="color: ${defaultIconColor}" class="field-checkbox-icon ${defaultIcon} ${(this.readOnly) ? "field-checkbox-read-only" : ""}"></span>
                <input type="checkbox" id="${id}" name="${id}" ${(isChecked) ? `checked="${isChecked}"` : ""} class="field-checkbox" ${(config.disabled == true) ? "disabled" : ""}>
            `.removeExtraSpaces()

        // Set properties
        this.label = this.querySelector(".field-label")
        this.field = this.querySelector(".field-checkbox")
        this.icon = this.querySelector(".field-checkbox-icon")

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
                ["value"],
                [this.field]
            ],
            [
                ["fieldWidth=width", "height=lineHeight", "iconSize=fontSize"],
                [this.icon.style]
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

        // Listen to click events if the field is *not* disabled or *readonly*
        if (config.disabled != true && !this.readOnly) {
            this.icon.onclick = () => {
                this.field.checked = !this.field.checked
                this.setValue(this.field.checked)
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
            if (config.disabled != true) this.label.onclick = this.icon.onclick
        }

        // Add field base class
        this.classList.add("a-field")

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
            check: {
                on: "far fa-check-square",
                off: "far fa-square"
            },            
            square: {
                on: "far fa-check-square",
                off: "far fa-square"
            },
            circle: {
                on: "far fa-check-circle",
                off: "far fa-circle"
            },
            switch: {
                on: "fas fa-toggle-on",
                off: "fas fa-toggle-off"
            },
            star: {
                on: "fas fa-star",
                off: "far fa-star"
            }
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
            this.field.checked = this.initialValue = record[this.id]
        }

        const updateField = (updates) => {
            if (this.id in updates) {
                const newValue = updates[this.id]
                if (newValue || (newValue === false)) {
                    this.field.checked = newValue
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
        const newState = this.field.checked
        const iconAdd = (newState == true) ? this.iconOn : this.iconOff
        const iconRemove = (newState == true) ? this.iconOff : this.iconOn
        iconRemove.split(" ").forEach(className => this.icon.classList.remove(className))
        iconAdd.split(" ").forEach(className => this.icon.classList.add(className))
        this.icon.style.color = (newState == true) ? this.iconColorOn : this.iconColorOff
    }

    /**
     * Set the field value
     * 
     * @param {boolean} newState - The new field value
     * @param {boolean} [rawUpdate] - If true, it doesn't update the associated record and doesn't trigger "change" event 
     * @returns this
     */
    setValue(newState, rawUpdate) {
        if (rawUpdate) return this._updateValue(newState, rawUpdate)

        if (this.record) {
            // If the field is connected to a record, we update the database
            this.record.updateFieldDeep(this.id, newState).then(success => {
                if (success) {
                    this._updateValue(newState)
                }
                else {
                    // Rollback the initial value if the update failed (ACL)
                    this._updateValue(this.initialValue)
                }
            })
        } else {
            this._updateValue(newState)
        }
        
        return this
    }

    /**
     * Update the field's value internally
     * 
     * @private
     * @ignore
     * @param {boolean} newState
     * @param {boolean} [rawUpdate]
     * @returns this
     */
    _updateValue(newState, rawUpdate) {
        // const updateValue = (newState) => {
        //     this.field.checked = newState
        //     this._renderValues()
        //     this.dispatchEvent(new Event("change"))
        // }

        this.field.checked = newState
        this._renderValues()
        if (!rawUpdate) this.dispatchEvent(new Event("change"))
        return this
    }


    /**
     * Get the field value
     * 
     * @returns {boolean} - The field value
     */
    getValue() {
        return this.field.checked
    }

    /**
     * Validate the field (always true because Checkbox fields can't have wrong values)
     * 
     * @ignore
     * @returns {boolean}
     */
    validate() {
        return true
    }    

    /**
     * Toggle the value true / false
     */
    toggleValue() {
        this.setValue(!this.getValue())
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
        this.icon.style.width = this._computeSize("fieldWidth", width)
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
                this.icon.style.order = 1
                break
            case "bottom":
                this.style.flexFlow = "column"
                this.style.alignItems = "unset"
                this.icon.style.order = -1
                break
            case "right":
                this.style.flexFlow = "row"
                this.style.alignItems = "center"
                this.icon.style.order = -1
                break
            default:
                this.style.flexFlow = "row"
                this.style.alignItems = "center"
                this.icon.style.order = 1
        }
        return this
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-checkbox", kiss.ui.Checkbox)

/**
 * Shorthand to create a new Checkbox. See [kiss.ui.Checkbox](kiss.ui.Checkbox.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createCheckbox = (config) => document.createElement("a-checkbox").init(config)

;