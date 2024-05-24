/**
 * 
 * The ColorPicker derives from [Component](kiss.ui.Component.html).
 * It allows to pick a color from a pre-defined palette.
 * 
 * @param {object} config
 * @param {string} [config.value] - The default hexa color code. Ex: "#00aaee"
 * @param {string[]} [config.palette] - Custom color palette, for example: ["00aaee", "a1ed00", "ffffff", "000000"]
 * @param {function} [config.autoFocus] - Automatically scroll down to the selected color if true (default false)
 * @param {function} [config.action] - Function executed when a color is selected. Receives the selected hexa color code as an argument.
 * @param {object[]} [config.columns] - Number of columns to display the colors
 * @param {string} [config.iconSize] - Size of the icon displayed into the selected color. Ex: "16px"
 * @param {string} [config.selectorSize] - Should be greater than the icon size. Ex: "32px"
 * @param {string} [config.selectorBorderRadius] - Ex: "10px"
 * @param {string} [config.background]
 * @param {string} [config.backgroundColor]
 * @param {string} [config.backgroundColorSelected]
 * @param {string|number} [config.width]
 * @param {string|number} [config.height]
 * @param {string} [config.padding]
 * @param {string} [config.margin]
 * @param {string} [config.border]
 * @param {string} [config.borderStyle]
 * @param {string} [config.borderWidth]
 * @param {string} [config.borderColor]
 * @param {string} [config.borderRadius]
 * @param {string} [config.boxShadow]
 * @returns this
 * 
 * ## Generated markup
 * ```
 * <a-colorpicker class="a-colorpicker">
 * 
 *  <!-- For each color selector -->
 *  <span class="color-selector"></span>
 * 
 * </a-colorpicker>
 * ```
 */
kiss.ui.ColorPicker = class ColorPicker extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myColorPicker = document.createElement("a-colorpicker").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myColorPicker = createColorPicker({
     *   value: "#00aaee", 
     *   columns: 10,
     *   action: (iconClass) => console.log(iconClass)
     * })
     * 
     * myColorPicker.render()
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *   title: "My panel",
     *   items: [
     *       {
     *           type: "colorPicker",
     *           value: "#00aaee",
     *           columns: 10,
     *           action: (color) => console.log(color)
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
     * Generates a color picker from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config = {}) {
        super.init(config)

        // Overwrite default value if the field is binded to a record
        // (default value must not override record's value)
        if (config.record && config.record[this.id]) config.value = config.record[this.id]

        this.value = config.value
        this.icon = config.icon || "fas fa-check"
        this.iconSize = config.iconSize || "16px"
        this.selectorSize = config.selectorSize || "32px"
        this.selectorBorderRadius = config.selectorBorderRadius || "5px"
        this.columns = config.columns || 10000
        this.palette = config.palette || kiss.global.palette
        this.autoFocus = config.autoFocus

        // Bind the field to a record, if any
        if (config.record) this._bindRecord(config.record)

        // Special id used to track the right picker when there is more than one on the same page
        this.specialId = this.id.replace(new RegExp("-", "g"), "_")

        // Template
        this.innerHTML =
            this.palette.map((color, index) =>
                `<span id="${this.specialId}:color-#${color}"
                    class="color-selector"
                    style=
                    "
                        width: ${this.selectorSize};
                        height: ${this.selectorSize};
                        line-height: ${this.selectorSize};
                        font-size: ${this.iconSize};
                        background-color: #${color};
                        border-radius: ${this.selectorBorderRadius};
                    "
                >
                ${(this.value == "#" + color.toUpperCase()) ? `<span style="color: #ffffff" class="${this.icon} color-selector-selected"></span>` : ""}                
                </span>${((index + 1) % this.columns == 0) ? "<br>" : ""}`.removeExtraSpaces()
            ).join("")


        // Set properties
        this._setProperties(config, [
            [
                ["width", "height", "margin", "padding"],
                [this.style]
            ],
        ])

        // Set the default display mode that will be restored by the show() method
        this.displayMode = "inline-block"

        // Bind action to onclick
        this.onclick = (event) => {
            const colorPicker = event.target.closest(".color-selector")
            if (!colorPicker) return
            const color = colorPicker.id.split("-")[1]
            this.setValue(color)
            if (config.action) config.action(color)
        }

        return this
    }

    /**
     * Automatically set the focus on the selected icon 500ms after rendering, if the autoFocus option is enabled
     * 
     * @private
     * @ignore
     */
    _afterRender() {
        if (!this.autoFocus) return
        setTimeout(() => this.focus(), 500)
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
     * Set a new color
     * 
     * @param {string} color - Hexa color code. Ex: #00aaee
     * @param {boolean} [rawUpdate] - If true, it doesn't update the associated record and doesn't trigger "change" event 
     * @returns this
     */
    setValue(color, rawUpdate) {
        if (color.toUpperCase() == this.getValue()) return

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
        } else {
            this._updateValue(color)
        }

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
     * Render the current value of the widget.
     * 
     * @private
     * @ignore
     */
    _renderValues() {
        const color = (this.value || "").toUpperCase()

        Array.from(this.children).forEach(colorSelector => {
            colorSelector.classList.remove("color-selector-selected")
            colorSelector.innerHTML = ""
        })

        let selectedColor = $(this.specialId + ":color-" + color)
        if (!selectedColor) return

        selectedColor.innerHTML = `<span style="color: #ffffff" class="${this.icon}"></span>`
        selectedColor.classList.add("color-selector-selected")
    }

    /**
     * Get the current selected color
     * 
     * @returns {string} Hexa color code. Ex: #00aaee
     */
    getValue() {
        return (this.value || "").toUpperCase()
    }

    /**
     * Validate the field (always true because ColorPicker fields can't have wrong values)
     * 
     * @ignore
     * @returns {boolean}
     */
    validate() {
        return true
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
     * Set the field height
     * 
     * @param {*} height
     * @returns this
     */    
    setHeight(height) {
        this.config.height = height
        this.style.height = this._computeSize("height", height)
        return this
    }

    /**
     * Scroll down to the selected color
     * 
     * @returns this
     */
    focus() {
        const selectedColor = this.querySelector(".color-selector-selected")
        if (!selectedColor) return

        if (selectedColor) setTimeout(() => {
            selectedColor.scrollIntoView({
                block: "center",
                behavior: "smooth"
            })
        }, 1)

        return this
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-colorpicker", kiss.ui.ColorPicker)

/**
 * Shorthand to create a new ColorPicker. See [kiss.ui.ColorPicker](kiss.ui.ColorPicker.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createColorPicker = (config) => document.createElement("a-colorpicker").init(config)

;