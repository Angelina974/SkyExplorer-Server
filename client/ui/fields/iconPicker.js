/**
 * 
 * The IconPicker derives from [Component](kiss.ui.Component.html).
 * It allows to pick an icon.
 * At the moment, KissJS is using Font Awesome free icons.
 * 
 * @param {object} config
 * @param {string} [config.value] - The default icon class name. Ex: "fas fa-check"
 * @param {string[]} [config.icons] - Optional array of icon classes to use. Ex: ["fas fa-check", "fas fa-user"]
 * @param {function} [config.autoFocus] - Automatically scroll down to the selected icon if true (default false)
 * @param {function} [config.action] - Function executed when an icon is selected. Receives the selected icon class as an argument.
 * @param {object[]} [config.columns] - Nnumber of columns to display the icons
 * @param {string} [config.iconSize] - Size of the icons. Ex: "16px"
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
 * <a-iconpicker class="a-iconpicker">
 * 
 *  <!-- For each icon selector -->
 *  <span class="icon-selector"></span>
 * 
 * </a-iconpicker>
 * ```
 */
kiss.ui.IconPicker = class IconPicker extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myIconPicker = document.createElement("a-iconpicker").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myIconPicker = createIconPicker({
     *   value: "fas fa-check", 
     *   columns: 10,
     *   action: (iconClass) => console.log(iconClass)
     * })
     * 
     * myIconPicker.render()
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *   title: "My panel",
     *   items: [
     *       {
     *           type: "iconPicker",
     *           value: "fas fa-check", 
     *           columns: 10,
     *           action: (iconClass) => console.log(iconClass)
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
     * Generates an icon picker from a JSON config
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
        this.iconSize = config.iconSize || "32px"
        this.selectorSize = config.selectorSize || "50px"
        this.selectorBorderRadius = config.selectorBorderRadius || "5px"
        this.color = config.color || "var(--body)"
        this.colorSelected = config.colorSelected || "#ffffff"
        this.backgroundColor = config.backgroundColor || "var(--body-background)"
        this.backgroundColorSelected = config.backgroundColorSelected || "#00aaee"
        this.columns = config.columns || 10000
        this.autoFocus = config.autoFocus

        // Bind the field to a record, if any
        if (config.record) this._bindRecord(config.record)

        // Id used to track the right picker when there is more than one on the same page
        this.specialId = this.id.replace(new RegExp("-", "g"), "_")

        // Template
        let icons = config.icons || kiss.webfonts.all

        this.innerHTML =
            icons.map((font, index) => /*html*/ `
                <span id="${this.specialId}:icon-${font}"
                    class="icon-selector ${font} ${(this.value == font) ? "icon-selector-selected" : ""}"
                    style=
                    "
                        width: ${this.selectorSize};
                        height: ${this.selectorSize};
                        line-height: ${this.selectorSize};
                        font-size: ${this.iconSize};
                        color: ${this.color};
                        background-color: ${(this.value == font) ? this.backgroundColorSelected : this.backgroundColor};
                        border-radius: ${this.selectorBorderRadius};
                    "
                >
                </span>${((index + 1) % this.columns == 0) ? "<br>" : ""}`.removeExtraSpaces()).join("")

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
            const icon = event.target.closest(".icon-selector")
            if (!icon) return
            const iconClass = icon.classList[1] + " " + icon.classList[2]
            this.setValue(iconClass)
            if (config.action) config.action(iconClass)
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
     * Set a new icon
     * 
     * @param {string} iconClass - Ex: "fas fa-check"
     * @param {string} [newBackgroundColor] - Optional background color to set under the selected icon
     * @param {boolean} [rawUpdate] - If true, it doesn't update the associated record and doesn't trigger "change" event 
     * @returns this
     */
    setValue(iconClass, newBackgroundColor, rawUpdate) {
        if (iconClass == this.getValue()) return
        if (newBackgroundColor === true) rawUpdate = true // If only 2 arguments are passed, the second one is rawUpdate (exception to the rule to be consistent with the other fields)

        if (rawUpdate) return this._updateValue(iconClass, newBackgroundColor, rawUpdate)

        if (this.record) {
            // If the field is connected to a record, we update the database
            this.record.updateFieldDeep(this.id, iconClass).then(success => {
                if (success) {
                    this._updateValue(iconClass, newBackgroundColor)
                }
                else {
                    // Rollback the initial value if the update failed (ACL)
                    this._updateValue(this.initialValue, this.backgroundColorSelected)
                }
            })
        } else {
            this._updateValue(iconClass, newBackgroundColor)
        }

        return this
    }

    /**
     * Update the field's value internally
     * 
     * @private
     * @ignore
     * @param {string} iconClass
     * @param {string} [newBackgroundColor]
     * @param {boolean} [rawUpdate]
     * @returns this
     */
    _updateValue(iconClass, newBackgroundColor, rawUpdate) {
        // const updateValue = (iconClass, newBackgroundColor) => {
        //     this.value = iconClass
        //     if (newBackgroundColor) this.backgroundColorSelected = newBackgroundColor
        //     this._renderValues()
        //     this.dispatchEvent(new Event("change"))
        // }

        this.value = iconClass
        if (newBackgroundColor) this.backgroundColorSelected = newBackgroundColor
        this._renderValues()
        if (!rawUpdate) this.dispatchEvent(new Event("change"))
        return this
    }

    /**
     * Render the current value(s) of the widget.
     * 
     * @private
     * @ignore
     */
    _renderValues() {
        const iconClass = this.value || ""
        const newBackgroundColor = this.backgroundColorSelected

        Array.from(this.children).forEach(icon => {
            icon.classList.remove("icon-selector-selected")
            icon.style.color = this.color
            icon.style.backgroundColor = this.backgroundColor
        })

        let icon = $(this.specialId + ":icon-" + iconClass)
        if (!icon) return

        icon.classList.add("icon-selector-selected")
        icon.style.color = this.colorSelected
        icon.style.backgroundColor = (newBackgroundColor) ? newBackgroundColor : this.backgroundColorSelected
    }

    /**
     * Set a new background color for the selected icon
     * 
     * @param {string} newBackgroundColor - Color background to set under the selected icon
     * @returns this
     */
    setColor(newBackgroundColor) {
        const selectedIcon = this.querySelector(".icon-selector-selected")
        this.backgroundColorSelected = selectedIcon.style.backgroundColor = newBackgroundColor
    }

    /**
     * Get the current selected icon class
     * 
     * @returns {string} The icon class. At the moment, we use Font Awesome. Example: "fas fa-check"
     */
    getValue() {
        return this.value
    }

    /**
     * Validate the field (always true because IconPicker fields can't have wrong values)
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
     * Scroll down to the selected icon
     * 
     * @returns this
     */
    focus() {
        const selectedIcon = this.querySelector(".icon-selector-selected")
        if (!selectedIcon) return

        selectedIcon.scrollIntoView({
            block: "center",
            behavior: "smooth"
        })

        return this
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-iconpicker", kiss.ui.IconPicker)

/**
 * Shorthand to create a new IconPicker. See [kiss.ui.IconPicker](kiss.ui.IconPicker.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createIconPicker = (config) => document.createElement("a-iconpicker").init(config)

;