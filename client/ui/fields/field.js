/**
 * 
 * The Field derives from [Component](kiss.ui.Component.html).
 * 
 * Build an input or textarea field with a label.
 * 
 * TODO: make computed fields with formula work even when it's not bound to a model
 * 
 * TODO: implement config.validationMessage
 * 
 * @param {object} config
 * @param {string} config.type - text | textarea | number | date | password
 * @param {*} [config.value] - Default value
 * @param {string} [config.label]
 * @param {*} [config.labelWidth]
 * @param {*} [config.fieldWidth]
 * @param {*} [config.fieldHeight]
 * @param {*} [config.fieldPadding]
 * @param {*} [config.fontSize]
 * @param {*} [config.lineHeight]
 * @param {number} [config.fieldFlex]
 * @param {string} [config.textAlign] - left | right
 * @param {string} [config.labelPosition] - left | right | top | bottom
 * @param {string} [config.labelAlign] - left | right
 * @param {number} [config.labelFlex]
 * @param {string} [config.formula] - For computed fields only
 * @param {string} [config.validationType] - Pre-built validation type: alpha | alphanumeric | email | url | ip
 * @param {*} [config.validationRegex] - Regexp
 * @param {*} [config.validationFormula] - Regexp
 * @param {string} [config.validationMessage] - TODO
 * @param {string} [config.placeholder]
 * @param {boolean} [config.autocomplete] - Set "off" to disable
 * @param {number} [config.minLength]
 * @param {number} [config.maxLength]
 * @param {number} [config.maxHeight]
 * @param {boolean} [config.readOnly]
 * @param {boolean} [config.disabled]
 * @param {boolean} [config.required]
 * @param {boolean} [config.draggable]
 * @param {boolean} [config.autocomplete] - set to "off" to disable native browser autocomplete feature
 * @param {string} [config.min] - (for number only)
 * @param {string} [config.max] - (for number only)
 * @param {number} [config.precision] - (for number only)
 * @param {string} [config.margin]
 * @param {string} [config.padding]
 * @param {string} [config.fontFamily] - Font used for the input field
 * @param {boolean} [config.rows] - For textarea only
 * @param {boolean} [config.cols] - For textarea only
 * @param {boolean} [config.autoGrow] - For textarea only
 * @param {string} [config.display] - flex | inline flex
 * @param {string} [config.border]
 * @param {string} [config.borderStyle]
 * @param {string} [config.borderWidth]
 * @param {string} [config.borderColor]
 * @param {string} [config.borderRadius]
 * @param {string|number} [config.width]
 * @param {string|number} [config.height]
 * 
 * ## Generated markup
 * For all input fields:
 * ```
 * <a-field class="a-field">
 *  <label class="field-label"></label>
 *  <input type="text|number|date" class="field-input"></input>
 * </a-field>
 * ```
 * For textarea:
 * ```
 * <a-field class="a-field">
 *  <span class="field-label"></span>
 *  <textarea class="field-input"></textarea>
 * </a-field>
 * ```
 */
kiss.ui.Field = class Field extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myField = document.createElement("a-field").init(config)
     * ```
     * 
     * Or use a shorthand to create one the various field types:
     * ```
     * const myText = createTextField({
     *   label: "I'm a text field"
     * })
     * 
     * const myTextArea = createTextareaField({
     *   label: "I'm a long text field",
     *   cols: 100,
     *   rows: 10
     * })
     * 
     * const myNumber = createNumberField({
     *   label: "I'm a number field",
     *   value: 250,
     *   min: 0
     * })
     * 
     * const myDate = createDateField({
     *   label: "I'm a date field",
     *   value: new Date()
     * })
     * 
     * // You can also use the generic constructor, but then you'll have to specify the field type in the config, like this:
     * const myText = createField({
     *   type: "number", // <= Field type, which can be: text | textarea | number | date
     *   label: "foo",
     *   value: 123
     * })
     * 
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *   title: "My panel",
     *   items: [
     *       {
     *           type: "text",
     *           label: "I'm a text"
     *       },
     *       {
     *           type: "number":
     *           label: "I'm a number"
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
     * Generates a Field from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config) {
        super.init(config)
        const id = this.id

        // Overwrite default value if the field is binded to a record
        // (default value must not override record's value)
        if (config.record) config.value = config.record[this.id]

        // Force computed fields to be read-only
        config.readOnly = !!config.readOnly || !!config.computed

        if (this.type != "textarea" && this.type != "aiTextarea") {

            // Template for text, number, date
            this.innerHTML = `
                ${ (config.label) ? `<label id="field-label-${id}" for="${id}" class="field-label">${config.label || ""} ${(config.unit) ? " (" + config.unit + ")" : ""}</label>` : "" }
                <input type="${this.type}" id="field-input-${id}" name="${id}" class="field-input ${(!!config.readOnly) ? "field-input-read-only" : ""}">
                `.removeExtraSpaces()

        } else {

            // Template for textarea
            this.innerHTML = `
                ${ (config.label) ? `<label id="field-label-${id}" for="${id}" class="field-label">${config.label || ""}</label>` : "" }
                <textarea id="field-textarea-${id}" name="${id}"
                    class="field-input ${(!!config.readOnly) ? "field-input-read-only" : ""}"
                    ${(config.rows) ? `rows="${config.rows}"` : ""}
                    ${(config.cols) ? `rows="${config.cols}"` : ""}
                >${(config.value) ? config.value : ""}</textarea>`.removeExtraSpaces()
        }

        this.field = this.querySelector(".field-input")
        this.label = this.querySelector(".field-label")

        // Cancel max property if set to 0
        if (config.max == 0) delete config.max
        if (config.maxLength == 0) delete config.maxLength

        // Set properties
        this._setProperties(config, [
            [
                ["draggable"],
                [this]
            ],
            [
                ["width", "minWidth", "height", "flex", "display", "margin", "padding"],
                [this.style]
            ],
            [
                ["value", "minLength", "maxLength", "min", "max", "placeholder", "readOnly", "disabled", "required", "autocomplete"],
                [this.field]
            ],
            [
                ["textAlign", "fontSize", "lineHeight", "fieldWidth=width", "fieldHeight=height", "fieldPadding=padding", "fieldFlex=flex", "maxHeight", "fontFamily", "border", "borderStyle", "borderWidth", "borderColor", "borderRadius", "boxShadow"],
                [this.field.style]
            ],
            [
                ["fontSize", "labelAlign=textAlign", "labelFlex=flex"],
                [this.label?.style]
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

        // Add field base class
        this.classList.add("a-field")

        // Propapate field changes
        this.field.onchange = (event) => {
            const newValue = event.target.value

            // Check if the value is valid before updating the database
            if (this.validate()) {
                this.setValue(newValue)
            }
        }

        // Attach focus and blur events, if any
        if (config.events) {
            if (config.events.focus) this.field.onfocus = config.events.focus
            else if (config.events.onfocus) this.field.onfocus = config.events.onfocus

            if (config.events.blur) this.field.onblur = config.events.blur
            else if (config.events.onblur) this.field.onblur = config.events.onblur
        }

        if (config.type == "number") {
            // Prevent number fields to be changed with arrow keys (and spam the update process)
            this.field.onkeydown = (event) => {
                if (event.key == "ArrowDown" || event.key == "ArrowUp") event.stop()
            }

        } else if (config.type == "textarea" && config.autoGrow) {
            // Auto-grow textarea field at startup
            this._initTextareaHeight()

        } else if (config.type == "text" && config.computed == true) {
            // URL field that are computed can be clicked to open the URL
            this.field.onclick = () => {
                const value = this.getValue()
                const urlRegex = new RegExp(`^(http(s?):\\/)?\\/(.)+$`)
                if (value && value.match(urlRegex)) window.open(value)
            }
        }

        // Auto-compose phone number on mobile devices
        this._initMobileAutoCompose()

        // Field validation
        this.isValid = true
        this._initValidationRules()

        // Bind the field to a record, if any
        if (config.record) this._bindRecord(config.record)

        return this
    }

    /**
     * Enables auto-composition for phone numbers, on Mobile devices
     * 
     * TODO: evaluate if it's useful to explicitly add a config option to define phone number fields
     * 
     * @private
     * @ignore
     */
    _initMobileAutoCompose() {
        if (!kiss.screen.isMobile) return
        if (!this.label) return
        if (this.config.type != "text" && this.config.type != "number") return

        const phoneLabels = ["phone", "mobile", "tel."]
        if (!phoneLabels.some(phoneLabel => this.config.label.toLowerCase().includes(phoneLabel))) return
        this.label.onmousedown = () => window.location.href = "tel:" + this.getValue()
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
            this.field.value = this.initialValue = record[this.id]
        }

        const updateField = (updates) => {
            if (this.id in updates) {
                const newValue = updates[this.id]
                if (newValue || (newValue === 0) || (newValue === "")) {
                    this.field.value = newValue
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
     * Init basic validation rules according to the following field parameters:
     * - validationType: a predefined regex
     * - validationRegex: a custom regex
     * - validationFormula: a javascript formula that must return true to be valid
     * 
     * So far, pre-defined validation types are:
     * - alpha
     * - alphanumeric
     * - email
     * - url
     * - ip
     * 
     * @private
     * @ignore
     */
    _initValidationRules() {
        this.required = this.config.required
        this.validationRegex = this.config.validationRegex
        this.validationType = this.config.validationType
        this.validationFormula = this.config.validationFormula

        this.field.onkeyup = () => {
            this.validate()

            // Auto grow textarea
            if (this.config.type == "textarea" && this.config.autoGrow) {
                this._updateTextareaHeight()
            }
        }

        // A required field is immediately invalid if it's empty
        if (this.required && this.field.value == "") this.isValid = false
    }

    /**
     * Init the height of the textarea at startup
     * 
     * @private
     * @ignore
     */
    _initTextareaHeight() {
        this._afterRender = () => this._updateTextareaHeight()
    }

    /**
     * Automatically grow the textarea to fit the content
     * 
     * @private
     * @ignore
     */
    _updateTextareaHeight() {
        this.field.style.height = this.field.scrollHeight + "px"
    }

    /**
     * Validate the field value and apply UI style accordingly
     * 
     * @returns {boolean} true is the field is valid, false otherwise
     */
    validate() {
        const isValid = kiss.tools.validateValue(this.type, this.config, this.field.value)
        if (isValid) {
            this.setValid()
        }
        else {
            this.setInvalid()
        }
        return isValid
    }

    /**
     * Set the field value
     * 
     * @param {string|number|date} newValue - The new field value
     * @param {boolean} [rawUpdate] - If true, it doesn't update the associated record and doesn't trigger "change" event 
     * @returns this
     */
    setValue(newValue, rawUpdate) {
        if (rawUpdate) {
            this.field.value = newValue
            return this
        }

        // Cast number field value
        if (this.getDataType() == "number") newValue = Number(newValue)

        if (this.record) {
            // If the field is connected to a record, we update the database
            this.record.updateFieldDeep(this.id, newValue).then(success => {

                // Rollback the initial value if the update failed (ACL)
                if (!success) this.field.value = this.initialValue || ""
            })
        } else {
            // Otherwise, we just change the field value
            this.field.value = newValue
        }

        // If it's a textarea, we scroll down to the last row
        if (this.type == "textarea") this.field.scrollTop = this.field.scrollHeight

        return this
    }

    /**
     * Get the field value.
     * 
     * @returns {string|number|date} - The field value
     */
    getValue() {
        const fieldType = this.getDataType()

        if (fieldType == "number") {
            return Number(this.field.value)
        } else {
            return this.field.value || ""
        }
    }

    /**
     * Get the data type of a field, depending on its configuration:
     * text => text
     * number => number
     * date => date
     * textarea => text
     * password => text
     * summary => data type of the foreign field
     * lookup => data type of the foreign field
     * 
     * @returns {string} The field data type: "text" | "number" | "date"
     */
    getDataType() {
        if (this.type == "summary") return this.config.summary.type
        if (this.type == "lookup") return this.config.lookup.type
        if (this.type == "textarea") return "text"
        if (this.type == "password") return "text"
        return this.type
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
                this.field.style.order = 1
                break
            case "bottom":
                this.style.flexFlow = "column"
                this.field.style.order = -1
                break
            case "right":
                this.style.flexFlow = "row"
                this.field.style.order = -1
                break
            default:
                this.style.flexFlow = "row"
                this.field.style.order = 1
        }
        return this
    }

    /**
     * Change the field default display mode
     * 
     * @param {string} [displayMode] - "flex" (default) | "inline-flex"
     */
    setDisplayMode(displayMode = "flex") {
        this.config.display = this.style.display = displayMode
    }

    /**
     * Give focus to the input field
     * 
     * @returns this
     */
    focus() {
        this.field.focus()
        return this
    }

    /**
     * Unset the focus of the input field
     * 
     * @returns this
     */
    blur() {
        this.field.blur()
        return this
    }

    /**
     * Reset the focus
     */
    resetFocus() {
        this.blur()
        setTimeout(() => this.focus(), 100)
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
}

// Create a Custom Element and add somes shortcuts to create the various field types
customElements.define("a-field", kiss.ui.Field)

/**
 * Shorthand to create a new Field. See [kiss.ui.Field](kiss.ui.Field.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createField = (config) => document.createElement("a-field").init(config)

/**
 * Shorthand to create a new **text** Field. See [kiss.ui.Field](kiss.ui.Field.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createTextField = (config) => document.createElement("a-field").init(Object.assign(config, {
    type: "text"
}))

/**
 * Shorthand to create a new **textarea** Field. See [kiss.ui.Field](kiss.ui.Field.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createTextareaField = (config) => document.createElement("a-field").init(Object.assign(config, {
    type: "textarea"
}))

/**
 * Shorthand to create a new **number** Field. See [kiss.ui.Field](kiss.ui.Field.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createNumberField = (config) => document.createElement("a-field").init(Object.assign(config, {
    type: "number"
}))

/**
 * Shorthand to create a new **date** Field. See [kiss.ui.Field](kiss.ui.Field.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createDateField = (config) => document.createElement("a-field").init(Object.assign(config, {
    type: "date"
}))

/**
 * Shorthand to create a new **password** Field. See [kiss.ui.Field](kiss.ui.Field.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createPasswordField = (config) => document.createElement("a-field").init(Object.assign(config, {
    type: "password"
}))

;