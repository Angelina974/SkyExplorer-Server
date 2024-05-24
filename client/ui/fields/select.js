/**
 * 
 * The Select derives from [Component](kiss.ui.Component.html).
 * 
 * It's a multi-purpose select field, also known as "dropdown" or "combobox".
 * It can have a single or multiple values.
 * When multiple values, the field value returns an Array.
 * 
 * ## Features:
 * - auto-generation of options with templates like "time" | "weekday" | "month"...
 * - possible to use labels, to display something different than the field values
 * - single or multiple values
 * - auto-complete
 * - possible to disable some options (they are hidden, but it could be easily extended to be visible, using a different class name)
 * - possible to update the list of options afterward
 * - keyboard navigation up and down within options
 * - selection with mouse or Enter
 * - can delete existing entries with Backspace
 * - can sort values asc or desc
 * - option to add values which are not in list
 * - option to prevent duplicates
 * - option to add entries using a separator, comma by default (useful for email-like inputs)
 * - option to have a custom renderer for options
 * - option to have a custom renderer for values
 * - option to delete values by clicking on them
 * - option to switch a value on/off by clicking on it in the dropdown list
 * - option to hide or show the input (search) field
 * - option to position the input (search) field after the values (default) or before
 * - option to display values stacked one on another
 * 
 * ## To do
 * - option to sort the list of options
 * - option to reorder the field values with drag & drop
 * - possibility to navigate the current values / delete them hitting the del key
 * - other templates like range, weekday, month
 * 
 * ## Usage
 * 
 * To define the list of options, you can use a simple array of strings:
 * ```
 * const listOfOptions = ["France", "Great Britain"]
 * ```
 * Or an array of objects:
 * ```
 * const listOfOptions = [
 *  {value: "France"},
 *  {value: "Great Britain"}
 * ]
 * ```
 * Or a function that returns the list of options:
 * ```
 * const listOfOptions = () => {
 *  let options = []
 *  for (let i = 0; i < 10; i++) options.push({label: "Option " + i, value: i})
 *  return options
 * }
 * ```
 * If you used a function to generate the options, you can also combine it with a filtering function:
 * ```
 * const optionsFilter = (optionItem) => optionItem.value > 5
 * 
 * createSelect({
 *  label: "Select field with generated options",
 *  multiple: true,
 *  options: listOfOptions,
 *  optionsFilter // Will keep only the option items which value is > 5
 * })
 * ```
 * You can use labels that are different from the values:
 * ```
 * const listOfOptions = [
 *  {value: "FR", label: "France"},
 *  {value: "GB", label: "Great Britain"}
 * ]
 * ```
 * You can also set a color per option:
 * ```
 * const listOfOptions = [
 *  {value: "FR", color: "#00aaee"},
 *  {value: "GB", color: "#a1ed00"}
 * ]
 * ```
 * You can disable some options:
 * ```
 * const listOfOptions = [
 *  {value: "FR", color: "#00aaee"},
 *  {value: "GB", color: "#a1ed00"},
 *  {value: "USA", color: "#ff0000", disabled: true}
 * ]
 * ```
 * You can select one or multiple values thanks to the "multiple" parameter:
 * ```
 * createSelect({
 *  label: "Countries",
 *  multiple: true,
 *  options: listOfOptions
 * })
 * ```
 * You can define a custom renderer to display the field values. The default renderer is a function like this:
 * ```
 * // Default renderer for field values
 * const valueRenderer = (option) =>
 *  `<div class="field-select-value" value="${option.value}" ${(option.color || this.optionsColor) ? `style="background: ${option.color || this.optionsColor}"` : ""}>
 *      ${option.label || option.value}
 *      ${(this.allowClickToDelete == true) ? `<span class="field-select-value-delete fas fa-times"></span>` : ""}
 *  </div>`
 * ```
 * You can define a custom renderer for each option of the list. The default renderer is a function like this:
 * ```
 * // Default renderer for the list of options
 * const optionRenderer = (option) => option.label || option.value
 * 
 * // It could be like:
 * const optionRenderer = (option) => "Label: " + option.label + " - Value: " + option.value
 * ```
 * 
 * @param {object} config
 * @param {object} config.template - "time" - TODO: other template like "range" | "weekday" | "month" | ...
 * @param {string[]|object[]|function} config.options - List of options or function that returns a list of options, where each option must a string, or an object like:
 *                                                      <br>
 *                                                      {value: "France"} or {label: "France", value: "FR"} or {label: "France", value: "FR", color: "#00aaee"}.
 * @param {function} [optionsFilter] - When the options are defined by a function, you can provide a filtering function that will be executed at runtime to filter only a specific set of options, depending on the context
 * @param {boolean} [config.multiple] - True to enable multi-select
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
 * @param {string} [config.fieldWidth]
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
 * @param {string|number} [config.height]
 * @returns this
 * 
 * ## Generated markup
 * The field is a composition of various elements:
 * - a div for the field label
 * - a div that renders the existing values (as chips, by default)
 * - an input field, used to filter options
 * - a div to display and select the options
 * 
 * ```
 * <a-select class="a-select">
 *  <label class="field-label"></label>
 * 
 *  <div class="field-select">
 *      <span class="field-select-values"></span>
 *  </div>
 * 
 *  <div class="field-select-options">
 *      <span class="field-select-input"></span>
 * 
 *      <!-- For each option -->
 *      <div class="field-option"></div>
 *  </div>
 * 
 * </a-select>
 * ```
 */
kiss.ui.Select = class Select extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const mySelect = document.createElement("a-select").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const mySelect = createSelect({
     *   label: "Countries",
     *   options: [
     *       {value: "France"},
     *       {value: "Great Britain"}
     *   ]
     * })
     * 
     * mySelect.render()
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *   title: "My panel",
     *   items: [
     *       {
     *           type: "select",
     *           options: [
     *               {value: "France"},
     *               {value: "Great Britain"}
     *           ]
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

        // Setup all the field options
        const isMobile = kiss.screen.isMobile
        this.optionsColor = config.optionsColor
        this.readOnly = !!config.readOnly || !!config.computed
        this.disabled = !!config.disabled
        this.required = !!config.required
        this.placeholder = config.placeholder || ""
        this.autocomplete = (config.autocomplete != "off")
        this.hideInput = (config.hideInput !== false)
        this.multiple = !!config.multiple
        this.inputSeparator = config.inputSeparator || ","
        this.valueSeparator = config.valueSeparator || ","
        this.stackValues = !!config.stackValues
        this.allowValuesNotInList = !!config.allowValuesNotInList
        this.allowDuplicates = !!config.allowDuplicates
        this.allowClickToDelete = !!config.allowClickToDelete && (this.readOnly !== true)
        this.allowSwitchOnOff = !!config.allowSwitchOnOff
        if (isMobile) this.allowSwitchOnOff = true
        this.displayedOptions = []
        this.selectedOption = null
        this.optionRenderer = config.optionRenderer || null
        this.valueRenderer = config.valueRenderer || null

        // Overwrite default value if the field is binded to a record
        // (default value must not override record's value)
        if (config.record && config.record[this.id]) config.value = config.record[this.id]

        // De-reference the initial value to avoid side effects
        this.value = (Array.isArray(config.value)) ? config.value.map(val => val) : (config.value)

        // Cast value to Array if "multiple" option is enabled
        if (this.multiple && (!Array.isArray(this.value))) this.value = [].concat(this.value)

        // The list of options can vary depending on some pre-defined field templates
        switch (config.template) {
            case "time":
                // Special template for "Time" field
                this.options = this._generateTimes(config.min || 0, config.max || 24, config.interval || 60, true)
                break

            case "gmt":
            case "countries":
            case "... other templates to come":

            default:
                // Other
                // Options can be passed as an array of strings, or an array of objects, or a function.
                if (config.options && typeof config.options == "function") {
                    this.options = config.options(config.optionsFilter)
                } else {
                    this.options = config.options || []
                    this.options = this.options.map(option => {
                        if (typeof option == "object") return option
                        return {
                            value: option
                        }
                    })
                }

                // Options which value contains a pipe "|" auto-generate a label/value option
                this.options.forEach(option => {
                    if (option.value && typeof option.value === "string" && option.value.includes("|")) {
                        const optionConfig = option.value.split("|")
                        option.label = optionConfig[0].trim()
                        option.value = optionConfig[1].trim()
                    }
                })
        }

        // Will keep track of the last value typed into the input field
        this.lastEnteredValue = ""

        // Template
        this.innerHTML =
            `${ (config.label) ? `<label id="field-label-${this.id}" for="${this.id}" class="field-label">${config.label || ""}</label>` : "" }
            <div class="field-select ${(!!config.readOnly) ? "field-input-read-only" : ""}">
                <div class="field-select-values"></div>
            </div>
            <div class="field-select-options">
                ${(!isMobile) ? "" :
                    `<span class="a-select-mobile-close-container">
                        <span class="a-select-mobile-close fas fa-chevron-left"></span>
                        <span class="field-label">${config.label}</span>
                    </span>`
                }
                <input class="field-select-input" type="text" ${(this.autocomplete && !isMobile) ? "" : `style="display: none"`}>
                <div class="field-select-options-list"></div>
            </div>
            `.removeExtraSpaces()

        this.label = this.querySelector(".field-label")
        this.field = this.querySelector(".field-select")
        this.fieldValues = this.querySelector(".field-select-values")
        this.fieldInput = this.querySelector(".field-select-input")
        this.optionsWrapper = this.querySelector(".field-select-options")
        this.optionsList = this.querySelector(".field-select-options-list")

        // Set properties
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
                ["value", "maxLength", "min", "max", "placeholder", "readOnly", "disabled", "required"],
                [this.field]
            ],
            [
                ["fieldWidth=width", "minWidth", "fieldHeight=height", "fieldFlex=flex", "boxShadow"],
                [this.field.style]
            ],
            [
                ["fieldLabelWidth=width", "labelAlign=textAlign", "labelFlex=flex"],
                [this.label?.style]
            ],
            [
                ["fieldWidth=width", "minWidth"],
                [this.optionsWrapper.style]
            ],
            [
                ["maxHeight"],
                [this.optionsList.style]
            ],
            [
                ["placeholder"],
                [this.fieldInput]
            ]
        ])

        // Set the default display mode that will be restored by the show() method
        this.displayMode = "flex"

        // Manage label and field layout according to label position
        this.style.flexFlow = "column"

        if (config.label) {
            // Label width
            if (config.labelWidth) this.setLabelWidth(config.labelWidth)

            // Label position
            this.config.labelPosition = config.labelPosition || "left"
            this.setLabelPosition(config.labelPosition)
        }

        // Override mousedown event which can't be customized for a select field (too many edge cases)
        if (!this.readOnly && !this.disabled) {
            this.onmousedown = function (event) {
                event.stop()

                let classes = event.target.classList
                if (classes.contains("field-select-value-delete")) return this._deleteValueByClick(event)
                if (classes.contains("field-select-value")) return this._showOptions()
                if (classes.contains("field-select-values")) return this._showOptions()
                if (classes.contains("field-select-placeholder")) return this._showOptions()
                if (classes.contains("field-select")) return this._showOptions()
                if (classes.contains("field-option")) return this._selectOption(event)
                
                if (!isMobile) return
                const closeHeader = event.target.closest(".a-select-mobile-close-container")
                if (closeHeader) return this._hideOptions()
            }
        }

        // Add field base class
        this.classList.add("a-field")

        // Close option list when exiting the select field
        this.field.onmouseleave = (event) => {
            // We only close it if the mouse is outside the dropdown list
            if (!kiss.tools.isEventInElement(event, this.optionsWrapper, 10)) this._hideOptions()
        }

        // Close option list when leaving the dropdown area
        this.optionsWrapper.onmouseleave = (event) => {
            if (document.activeElement.classList.contains("field-select-input")) {
                if (this.fieldInput.value == "") {
                    this._hideOptions()
                }
            }
            else {
                this._hideOptions()
            }
        }

        // Close option list when leaving the search field
        this.fieldInput.onblur = (event) => {
            this.fieldInput.value = ""
            this._hideOptions()
        }

        // Keyboard management
        if (this.autocomplete != "off") {
            this._manageKeyboard()
        }

        // Bind the field to a record, if any
        if (config.record) this._bindRecord(config.record)

        // Render default values
        this._renderValues()

        return this
    }

    /**
     * Render the current value(s) of the widget.
     * By default, values are rendered as "chips", but we can provide any other renderer using the 'valueRenderer' config.
     * 
     * @private
     * @ignore
     */
    _renderValues() {
        // Check if the field is empty
        let isEmpty = false

        if (this.multiple) {
            if (this.value && Array.isArray(this.value) && this.value.length == 0) isEmpty = true
        } else {
            if (this.value === undefined || this.value === "") isEmpty = true
        }

        if (isEmpty) {
            this.fieldValues.innerHTML = `<span class="field-select-placeholder">${this.placeholder}</span>` || ""
            this._adjustSizeAndPosition()
            return
        }

        // Transform the array of options to a Map, which is faster to retrieve a keyed value
        const mapOptions = new Map(this.options.map(option => [option.value, option]))

        // Separate values by <br> if the option "stackValues" is true
        const htmlSeparator = (this.stackValues) ? "<br>" : ""

        this.fieldValues.innerHTML = []
            .concat(this.value)
            .filter(value => value !== "" && value !== undefined && value !== null)
            .map(value => {
                let option = mapOptions.get(value)

                // If the value is not part of the configurated options, we generate a default config
                if (!option) {
                    option = {
                        value,
                        color: this.defaultColor
                    }
                }

                // Render!
                if (!this.valueRenderer) {
                    // Default renderer
                    return `<div class="field-select-value" value="${option.value}" ${(option.color || this.optionsColor) ? `style="background: ${option.color || this.optionsColor}"` : ""}>
                            ${option.label || option.value}
                            ${(this.allowClickToDelete == true) ? `<span class="field-select-value-delete fas fa-times"></span>` : ""}
                        </div>`.removeExtraSpaces()
                } else {
                    // Custom renderer
                    return this.valueRenderer(option, this.record)
                }
            })
            .join(htmlSeparator)

        // Adjust the size of the options wrapper depending on the field content
        this._adjustSizeAndPosition()
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
            this.value = (this.multiple) ? [].concat(record[this.id]) : record[this.id]
            this.initialValue = this.value
        }

        const updateField = (updates) => {
            if (this.id in updates) {
                const newValue = updates[this.id]
                if (newValue || (newValue === 0) || (newValue === "")) {
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
     * @param {string|string[]} newValue - The new field value
     * @param {boolean} [rawUpdate] - If true, it doesn't update the associated record and doesn't trigger "change" event 
     * @returns this
     */
    setValue(newValue, rawUpdate) {
        if (rawUpdate) return this._updateValue(newValue, rawUpdate)

        this._updateValue(newValue)

        if (this.record) {
            // If the field is connected to a record, we update the database
            this.record.updateFieldDeep(this.id, this.value).then(success => {

                // Rollback the initial value if the update failed (ACL)
                if (!success) this._updateValue(this.initialValue)
            })
        }

        this.validate()
        return this
    }

    /**
     * Update the field's value internally
     * 
     * @private
     * @ignore
     * @param {string|string[]} newValue
     * @param {boolean} [rawUpdate]
     * @returns this
     */
    _updateValue(newValue, rawUpdate) {
        this.value = newValue

        // Cast value to Array if it's a multiple select
        if (this.multiple) {
            const values = [].concat([...newValue])
            this.value = values.filter(value => value != "" && value != undefined && value != null)
        }

        this._renderValues()

        if (!rawUpdate) this.dispatchEvent(new Event("change"))
        return this
    }

    /**
     * Add a value to the Select field. This method does a few things:
     * - check for duplicate entries (and remove if not allowed)
     * - check for multiple entries (and exit if not allowed)
     * - update the field value
     * - reset the input field then give it focus
     * 
     * @param {string} newValue - Value to add
     */
    async addValue(newValue) {

        // Excludes HTML
        if (("" + newValue).containsHTML()) {
            return
        }

        let nextValue

        if (this.multiple) {
            nextValue = [].concat(this.value)

            // Check for duplicate entries
            // If it's a duplicate, we check the option "allowSwitchOnOff" to know if we switch off the value or just exit
            let switchOff = false
            if ((this.allowDuplicates != true) && (this._isDuplicate(newValue) == true)) {
                if (!this.allowSwitchOnOff) {
                    this._resetInputField()
                    return
                }
                switchOff = true
            }

            if (switchOff) {
                nextValue.remove(newValue)
            } else {
                nextValue.push(newValue)
            }
        } else {
            nextValue = newValue
        }

        this.setValue(nextValue)

        // Reset input field
        this._resetInputField()

        // Reset selected option
        this.selectedOption = null

        // Hide the list of options
        this._hideOptions()
    }    

    /**
     * Validate the field value against validation rules
     * 
     * @returns {boolean}
     */
    validate() {
        this.setValid()

        // Exit if field is readOnly
        if (this.config.readOnly) return true

        // Required
        if (this.required && this.isEmpty()) this.setInvalid()
        return this.isValid
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
     * Check if the field is empty
     * 
     * @returns {boolean}
     */
    isEmpty() {
        if (this.multiple && this.getValue().length == 0) return true
        if (this.getValue() == "") return true
        return false
    }

    /**
     * Sort values
     * 
     * @param {string} order - "asc" or "desc"
     * @returns this
     */
    sort(order = "asc") {
        if (order == "desc") this.value.sort().reverse()
        else this.value.sort()

        this._renderValues()
        return this
    }

    /**
     * Sort values according to their corresponding label
     * 
     * @param {string} order - "asc" or "desc"
     * @returns this
     */
    sortByLabel(order = "asc") {
        const coef = (order == "asc") ? 1 : -1
        this.value.sort((a, b) => {
            const optionA = this.options.find(option => option.value == a)
            const optionB = this.options.find(option => option.value == b)
            if (optionA && optionA.label && optionB && optionB.label) return optionA.label.localeCompare(optionB.label) * coef
            return -1
        })

        this._renderValues()
        return this
    }    

    /**
     * Get the field value
     * 
     * @returns {string|string[]} - Returns an array of strings if the "multiple" option is true. Returns a string otherwise.
     */
    getValue() {
        if (this.multiple == true) {
            const values = [].concat(this.value)
            return values.filter(value => value != "" && value != undefined && value != null)
        } else {
            const value = (Array.isArray(this.value)) ? this.value[0] : this.value
            return (value == undefined) ? "" : value
        }
    }

    /**
     * Get the selected option(s)
     * 
     * @returns {object|object[]} A single option or an array of options if multiple values are selected
     */
    getSelection() {
        const currentValue = this.getValue()
        if (Array.isArray(currentValue)) {
            return this.options.filter(option => currentValue.includes(option.value))
        }
        else {
            return this.options.find(option => option.value == currentValue)
        }
    }

    /**
     * Reset the field value
     * 
     * @returns this
     */
    resetValue() {
        this.value = (this.multiple) ? [] : ""
        this._renderValues()
        return this
    }

    /**
     * Update the list of options
     * 
     * @param {array} newOptions - An array of object defining the field options
     * @example
     * mySelectField.updateOptions([
     *      {
     *          value: "firstName",
     *          disabled: false,
     *          color: "#00aaee"
     *      },
     *      {...}
     * ])
     */
    updateOptions(newOptions) {
        if (!newOptions) return
        this.options = newOptions

        // Options can be passed as an array of strings or an array of objects
        // We cast to an array of objects
        this.options = this.options.map(option => {
            if (typeof option == "object") return option
            return {
                value: option
            }
        })

        // Delete the content of the options wrapper
        this.optionsList.deepDelete(false)

        // Then re-generate the options
        this._createOptions()

        // Update the field values according to the new configuration
        // + filters out the field values that are not anymore in the possible options
        let currentValues = this.getValue()

        if (Array.isArray(currentValues)) {
            let currentOptionValues = this.options.map(option => option.value)
            let newValue = currentValues.filter(value => currentOptionValues.indexOf(value) != -1)

            this.value = newValue
        }
        this._renderValues()
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
     * Set the field container width
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
     * Allow/forbid to select multiple values
     * 
     * @param {boolean} state 
     */
    setMultiple(state = true) {
        this.multiple = state
    }

    /**
     * Allow/forbid to click on field values to delete them
     * 
     * @param {boolean} state 
     */
    setClickToDelete(state = true) {
        this.allowClickToDelete = state
    }

    /**
     * Give focus to the input field
     * 
     * @returns this
     */
    focus() {
        this.fieldInput.focus()
        return this
    }

    /**
     * Manage keyboard interactions:
     * - arrow up/down to navigate within the select options
     * - either ENTER or the "inputSeparator" key, to validate an option
     * - backspace to delete a value
     * 
     * @private
     * @ignore
     */
    _manageKeyboard() {
        this.fieldInput.onkeydown = (event) => {
            if (event.key == "Enter") event.preventDefault()
        }

        this.fieldInput.onkeyup = (event) => {
            event.stop()

            let enteredValue = event.target.value

            // ARROW DOWN (navigate down the list of options)
            if (event.which == 40) {
                this._navigateOptions("down")
                return
            }

            // ARROW UP (navigate down the list of options)
            if (event.which == 38) {
                this._navigateOptions("up")
                return
            }

            // BACKSPACE (delete the last value)
            if (event.key == "Backspace") {
                if ((this.lastEnteredValue == "") && this.value && (this.value.length > 0)) {
                    this.lastEnteredValue = enteredValue
                    let lastValue = this.value[this.value.length - 1]
                    this._deleteValue(lastValue)
                    return
                }
            }

            // ENTER or the SEPARATOR character (comma by default) add the selected value
            if ((event.key == "Enter") || (event.key == this.inputSeparator)) {
                if (this.selectedOption != null) {
                    // An option was selected in the list
                    this._addValueFromOption(this.selectedOption)
                } else {
                    // No options was selected, we use the input field
                    let newValue = (event.key == "Enter") ? enteredValue : enteredValue.slice(0, enteredValue.length - 1)

                    if (newValue != "") {
                        if (!this.allowValuesNotInList) {
                            let checkedValue = this._findValue(newValue)
                            if (!checkedValue) {
                                this._resetInputField()
                                return
                            }
                            this.addValue(checkedValue)
                        } else {
                            this.addValue(newValue)
                        }
                    }
                }
                return
            }

            this._showOptions(enteredValue)
            this.lastEnteredValue = enteredValue
        }

        // Prevent from jumping to the beginning of the input field when hitting "up" key
        /*
        this.field.onkeydown = (event) => {
            if (event.which == 38) {
                event.stop()
                return
            }
        }*/
    }

    /**
     * Checks if a value exists within the options.
     * Search is case insensitive.
     * Returns the found option or null if not found.
     * 
     * @private
     * @ignore
     * @param {string} value - Value to search within the values
     * @returns {boolean}
     */
    _findValue(value) {
        let option = this.options.find(option => option.value.toLowerCase() == value.toLowerCase())
        return (option) ? option.value : null
    }

    /**
     * Create the list of options:
     * - each option generates a div which is inserted into the "optionsWrapper" parent div
     * - the first option is highlighted by default, so that the user can press ENTER to validate it, or navigate within the options
     * 
     * Each option should be composed of:
     * - a value
     * - a label: optional, only when we want to display a different value than the "stored value"
     * - a color: optional, will default to a neutral gray when selected
     * 
     * By default, options are rendered as simple divs, but we can provide any other renderer using the 'optionRenderer' config
     * 
     * @private
     * @ignore
     */
    async _createOptions() {
        for (let index = 0, length = this.options.length; index < length; index++) {
            let option = this.options[index]
            let optionElement = document.createElement("div")
            optionElement.className = "field-option"
            optionElement.setAttribute("value", option.value)
            optionElement.setAttribute("index", index)

            if (option.label) optionElement.setAttribute("label", option.label)
            if (option.color) optionElement.setAttribute("style", "border-color:" + option.color)

            // Hide disabled options
            if (option.disabled == true) optionElement.classList.add("field-option-disabled")

            // Render the option with the default renderer or a custom one
            if (this.optionRenderer) {
                optionElement.innerHTML = this.optionRenderer(option)
            } else {
                optionElement.textContent = option.label || option.value
            }

            this.optionsList.append(optionElement)
        }

        // By default, every options are displayed
        this.displayedOptions = Array.from(this.optionsList.children)
    }

    /**
     * Show the list of options and filter them
     * - the list of options is created the first time this method is called
     * - subsequent calls just change the visibility of the list of options
     * - displaying the list of options also give focus to the input field so the user can start filtering the options (or navigate withing them)
     * - showing the list also trigger a re-filtering according to the last entered value, if any
     * 
     * @private
     * @ignore
     * @param {string} enteredValue 
     */
    _showOptions(enteredValue) {
        // Create the list of options when it's opened for the 1st time
        if (this.optionsList.children.length == 0) this._createOptions()

        // Show the options
        this.optionsWrapper.style.position = "fixed"
        setTimeout(() => {
            this.optionsWrapper.style.display = "block"
            if (this.fieldInput) {
                this.fieldInput.placeholder = ""
                this.fieldInput.focus()
            }
            this._filterOptions(enteredValue || "")
            this._adjustSizeAndPosition()
        }, 100)

        this.optionsList.onmousewheel = (event) => {
            event.preventDefault()
            const direction = event.deltaY < 0 ? -1 : 1;
            this.optionsList.scrollTop += direction * 50;
        }        
    }

    /**
     * Re-compute the size and position of the options wrapper
     * 
     * @private
     * @ignore
     */
    _adjustSizeAndPosition() {
        if (kiss.screen.isMobile) {
            this.optionsWrapper.style.top = "10px"
            this.optionsWrapper.style.left = "10px"
            this.optionsWrapper.style.width = "calc(100% - 20px)"
            this.optionsWrapper.style.height = "calc(100% - 20px)"
            return
        }

        // Align top to search field if it's visible. Otherwise align to widget
        this.optionsWrapper.style.top = (this.field.getBoundingClientRect().top + this.field.clientHeight) + 4 + "px"
        this.optionsWrapper.style.left = this.field.getBoundingClientRect().left + "px"
        this.optionsWrapper.style.width = this.field.getBoundingClientRect().width + "px"
        
        // Adjust max height
        if (this.config.maxHeight) {
            this.optionsWrapper.style.maxHeight = Math.min(this.config.maxHeight, kiss.screen.current.height - 20) + "px"
            this.optionsList.style.maxHeight = Math.min(this.config.maxHeight - 55, kiss.screen.current.height - 55) + "px"
        }
        else {
            this.optionsWrapper.style.maxHeight = kiss.screen.current.height - 20 + "px"
            this.optionsList.style.maxHeight = kiss.screen.current.height - 55 + "px"
        }

        // Ensure the dropdown is 100% visible inside the viewport
        kiss.tools.moveToViewport(this.optionsWrapper)
    }

    /**
     * Hide the list of options
     * 
     * @private
     * @ignore
     */
    _hideOptions() {
        this.optionsWrapper.style.display = "none"
    }

    /**
     * Reset the input field
     * 
     * @private
     * @ignore
     */
    _resetInputField() {
        this.fieldInput.value = ""
        this.fieldInput.focus()
    }

    /**
     * Filter the list of options according to the value entered in the input field of the widget.
     * Note: if options have labels, we search within the labels, otherwise, we search within the values
     * 
     * @private
     * @ignore
     * @param {string} enteredValue
     */
    _filterOptions(enteredValue) {
        this.displayedOptions = []
        let searchExpression = enteredValue.toLowerCase()

        // Check wether we have to search within the value OR the label
        let propertyToSearch = (this.optionsList.firstChild && this.optionsList.firstChild.getAttribute("label")) ? "label" : "value"

        Array.from(this.optionsList.children).forEach(option => {
            // Remove styling
            option.classList.remove("field-option-selected")
            option.classList.remove("field-option-highlight")

            // Hide options that doesn't match the entered value
            if (!option.getAttribute(propertyToSearch).toLowerCase().includes(searchExpression)) {
                option.classList.add("field-option-hidden")
                return
            }

            // Show other options
            option.classList.remove("field-option-hidden")

            // Show the active values as *selected*
            const optionValue = option.getAttribute("value")
            if (this.value && ((this.multiple && this.value.includes(optionValue)) || (this.value == optionValue))) option.classList.add("field-option-selected")

            // Keep track of all the remaining displayed options
            this.displayedOptions.push(option)
        })

        // Highlight the 1st available option of the new filtered list.
        // This allows to validate this option just by pressing <Enter> key
        this.selectedOption = null

        if (this.displayedOptions.length != 0) {
            this.selectedOption = this.displayedOptions[0]
            this._highlightOption(this.displayedOptions[0], true)
        }
    }

    /**
     * Select the next option (above or below) in the list of options
     * 
     * @private
     * @ignore
     * @param {string} direction - "up" or "down": tells in which direction the user navigated the list
     */
    _navigateOptions(direction) {
        let currentSelectedOption = this.selectedOption
        let index = Array.from(this.displayedOptions).findIndex(node => node == currentSelectedOption)
        let nextIndex = (direction == "down") ? Math.min((index + 1), this.displayedOptions.length) : Math.max((index - 1), 0)
        let newSelectedOption = this.displayedOptions[nextIndex]
        if (newSelectedOption) this._highlightOption(newSelectedOption, true)
    }

    /**
     * Highlight an option in the list of options
     * 
     * @private
     * @ignore
     * @param {HTMLElement} selectedOption - Node representing the selected option
     * @param {boolean} scroll - true to scroll to the option
     */
    _highlightOption(selectedOption, scroll) {
        // Remove styling on previously selected option
        if (this.selectedOption) this.selectedOption.classList.remove("field-option-highlight")

        // Add styling to the newly selected option
        selectedOption.classList.add("field-option-highlight")

        // Store the new selected option and scroll to it
        this.selectedOption = selectedOption

        // TODO: should scroll, but creates strange behavior when encapsulated in iframe: fix that!
        //if (scroll == true) this.selectedOption.scrollIntoView()
    }

    /**
     * Select an option of the list when the user click on it
     * 
     * @private
     * @ignore
     * @param {Event} event - Click event
     * @param {boolean} scroll - true to scroll to the option
     */
    _selectOption(event, scroll) {
        let newSelectedOption = event.target.closest("div")
        //this._highlightOption(newSelectedOption, scroll)
        this.selectedOption = newSelectedOption
        this._addValueFromOption(newSelectedOption)
    }

    /**
     * Add a value to the field when the user clicked an option from the list
     * 
     * @private
     * @ignore
     * @param {HTMLElement} selectedOption - Clicked node
     */
    _addValueFromOption(selectedOption) {
        const optionIndex = selectedOption.getAttribute("index")
        if (!optionIndex) return
        const option = this.options[optionIndex]
        this.addValue(option.value)
    }

    /**
     * Check if a value is a duplicate of an existing value
     * 
     * @private
     * @ignore
     * @param {object} newValue 
     * @returns {boolean}
     */
    _isDuplicate(newValue) {
        return this.value.includes(newValue)
    }

    /**
     * Delete a field value if the user clicked on the "cross" icon.
     * The methods also hides the list of options automatically.
     * 
     * @private
     * @ignore
     * @param {Event} event - The click event that triggered the deletion
     */
    _deleteValueByClick(event) {
        this._hideOptions()

        let fieldValueElement = event.target.closest("div")
        let clickedValue = fieldValueElement.getAttribute("value")
        this._deleteValue(clickedValue)

        event.stop()
    }

    /**
     * Delete value
     * 
     * @private
     * @ignore
     * @param {string} valueToDelete 
     */
    _deleteValue(valueToDelete) {
        let newValue

        if (Array.isArray(this.value)) newValue = this.value.remove(valueToDelete)
        else newValue = ""

        this.setValue(newValue)
    }

    /**
     * Generate a list of times with daytime colors, for Time fields
     * (ex: blue = afternoon, dark blue = night...)
     * 
     * @private
     * @ignore
     * @param {number} from - Start time, as decimal. 16 means 16:00, 16.5 means 16:30, 16.25 means 16:15, 16.75 means 16:45
     * @param {number} to - End time, as decimal.
     * @param {number} step - Step in minutes (default = 60)
     * @param {boolean} colored 
     * @returns {*} Array of times directly usable as options for a <Select> field
     * 
     * @example
     * this._generateTimes(16, 18, 30) // => ['16:00', '16:30', '17:00', '17:30', '18:00']
     * this_.generateTimes(16.5, 18.5, 30) // => ['16:30', '17:00', '17:30', '18:00', '18:30']
     * this_.generateTimes(16.25, 16.75, 5) // => ['16:15', '16:20', '16:25', '16:30', '16:35', '16:40', '16:45']
     * 
     * // Step is not necessary a multiple of 60:
     * this_.generateTimes(12, 14, 13) // => ['12:00', '12:13', '12:26', '12:39', '12:52', '13:05', '13:18', '13:31', '13:44', '13:57']
     * 
     * // When the colored parameter is true, the time is given with a color to illustrate day light:
     * this_.generateTimes(10, 16, 60, true)
     * 
     * // Returns...
     * [
     *   {
     *       "value": "10:00",
     *       "color": "#0075FF"
     *   },
     *   {
     *       "value": "11:00",
     *       "color": "#0075FF"
     *   },
     *   {
     *       "value": "12:00",
     *       "color": "#FFAA00"
     *   },
     *   {
     *       "value": "13:00",
     *       "color": "#FFAA00"
     *   },
     *   {
     *       "value": "14:00",
     *       "color": "#87BFFF"
     *   },
     *   {
     *       "value": "15:00",
     *       "color": "#87BFFF"
     *   },
     *   {
     *       "value": "16:00",
     *       "color": "#87BFFF"
     *   }
     * ]
     */
    _generateTimes(from = 0, to = 24, step = 60, colored) {

        // Add some basic controls
        from = (from < 0 || from > 23) ? 0 : from
        to = (to <= 0 || to > 24) ? 24 : to
        step = (step <= 0 || step > 60) ? 60 : step
        if (to <= from) {
            from = 0
            to = 24
            step = 60
        }

        const colors = {
            night: "#555555",
            morning: "#0075FF",
            midday: "#FFAA00",
            afternoon: "#87BFFF",
            dawn: "#8833EE"
        }

        const times = []
        for (let h = from * 60; h <= to * 60 && h < 1440; h += step) {
            let value
            const hourValue = Math.floor(h / 60)
            const hour = ("0" + hourValue).slice(-2)
            const minutes = ("0" + Math.round(h % 60)).slice(-2)

            if (colored) {
                let color
                if (hourValue < 5) color = colors.night
                else if (hourValue < 12) color = colors.morning
                else if (hourValue < 14) color = colors.midday
                else if (hourValue < 18) color = colors.afternoon
                else if (hourValue < 20) color = colors.dawn
                else color = colors.night

                value = {
                    value: hour + ":" + minutes,
                    color
                }
            } else {
                value = hour + ":" + minutes
            }

            times.push(value)
        }
        return times
    }    
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-select", kiss.ui.Select)

/**
 * Shorthand to create a new Select field. See [kiss.ui.Select](kiss.ui.Select.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createSelect = (config) => document.createElement("a-select").init(config)

;