/**
 * 
 * The Code Editor component derives from [Component](kiss.ui.Component.html).
 * 
 * It allows to write code, embedding the famous Ace Editor.
 * 
 * @param {object} config
 * @param {*} [config.value] - Default value
 * @param {string} [config.label]
 * @param {string} [config.labelWidth]
 * @param {string} [config.fieldWidth]
 * @param {string} [config.fieldHeight]
 * @param {string} [config.labelPosition] - left | right | top | bottom
 * @param {string} [config.labelAlign] - left | right
 * @param {boolean} [config.readOnly]
 * @param {boolean} [config.disabled]
 * @param {boolean} [config.required]
 * @param {boolean} [config.draggable]
 * @param {string} [config.margin]
 * @param {string} [config.display] - flex | inline flex
 * @param {string|number} [config.width]
 * @param {string|number} [config.height]
 * @param {string|number} [config.border]
 * @param {string|number} [config.borderStyle]
 * @param {string|number} [config.borderWidth]
 * @param {string|number} [config.borderColor]
 * @param {string|number} [config.borderRadius]
 * @param {string|number} [config.boxShadow]
 * @param {boolean} [config.showMargin]
 * 
 * ## Generated markup
 * ```
 * <a-codeeditor class="a-codeeditor">
 *  <label class="field-label"></label>
 *  <div class="code-editor"></div>
 * </a-codeeditor>
 * ```
 */
kiss.ux.CodeEditor = class CodeEditor extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myCodeEditor = document.createElement("a-codeeditor").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myCodeEditor = createCodeEditor({
     *   label: "Enter your code",
     *   height: 300
     * })
     * 
     * myCodeEditor.render()
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *   title: "My panel",
     *   items: [
     *       {
     *           type: "codeEditor",
     *           label: "Enter your code",
     *           height: 300
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
     * Generates an Code Editor from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config) {
        super.init(config)

        // Template
        this.innerHTML = /*html*/ `
            ${ (config.label) ? `<label id="field-label-${this.id}" for="${this.id}" class="field-label">${config.label || ""}</label>` : "" }
            <div id="editor-for:${this.id}" class="code-editor"></div>
            `.removeExtraSpaces()

        // Set properties
        this.label = this.querySelector(".field-label")
        this.field = this.querySelector(".code-editor")

        this._setProperties(config, [
            [
                ["draggable"],
                [this]
            ],
            [
                ["width", "minWidth", "height", "flex", "display", "margin"],
                [this.style]
            ],
            [
                ["fieldWidth=width", "fieldHeight=height", "maxHeight", "fieldFlex=flex", "boxShadow", "border", "borderStyle", "borderWidth", "borderColor", "borderRadius"],
                [this.field.style]
            ],
            [
                ["labelAlign=textAlign", "labelFlex=flex"],
                [this.label?.style]
            ]
        ])

        // Set the default display mode that will be restored by the show() method
        this.displayMode = "flex"

        // Manage label and field layout according to label position
        this.style.flexFlow = "row"

        // The field will be display after ACE component is fully loaded
        this.field.style.display = "none"

        if (config.label) {
            // Label width
            if (config.labelWidth) this.setLabelWidth(config.labelWidth)

            // Label position
            this.config.labelPosition = config.labelPosition || "left"
            this.setLabelPosition(config.labelPosition)
        }

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

        // Set initial value
        if (record[this.id]) {
            this.initialValue = record[this.id]
            this.editor.setValue(this.initialValue)
        }

        // React to changes on a single record of the binded model
        this.subscriptions.push(
            subscribe("EVT_DB_UPDATE:" + this.modelId.toUpperCase(), (msgData) => {
                if ((msgData.modelId == this.modelId) && (msgData.id == this.recordId)) {
                    const updates = msgData.data
                    this._updateField(updates)
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
                        this._updateField(updates)
                    }
                })
            })
        )

        return this
    }

    /**
     * Update the code editor value internally
     * 
     * @private
     * @ignore
     * @param {*} updates
     * @returns this
     */
    _updateField(updates) {
        if (this.id in updates) {
            const newValue = updates[this.id]
            if (newValue || (newValue === 0) || (newValue === "")) {
                this.editor.setValue(newValue)
            }
        }
        return this
    }    

    /**
     * Insert Ace editor into the Web Component
     * 
     * @private
     * @render
     */
    async _afterRender() {
        if (!window.ace) {
            await kiss.loader.loadScript("../../kissjs/client/ux/codeEditor/ace")
        }

        this.editor = ace.edit("editor-for:" + this.id, {
            selectionStyle: "text"
        })

        this.editor.setOptions({
            autoScrollEditorIntoView: true,
            copyWithEmptySelection: false,
            showPrintMargin: false,
            fontSize: "var(--field-font-size)",
            showFoldWidgets: false
        })

        // Show hide line number
        this.editor.renderer.setShowGutter((this.config.showMargin == false) ? false : true)

        // Set Ace to Javascript / Monokai
        this.editor.session.setMode("ace/mode/javascript")
        this.editor.setTheme("ace/theme/monokai")
        this.editor.session.setUseWorker(false)

        //
        // Override common events: focus, blur, change
        //
        
        // FOCUS
        this.editor.on("focus", () => {
            this.previousValue = this.editor.getValue()
            this.dispatchEvent(new Event("focus"))
        })

        // BLUR
        this.editor.on("blur", () => {
            const newValue = this.editor.getValue()
            if (newValue != this.previousValue) this.hasChanged = true
            else this.hasChanged = false
            this.dispatchEvent(new Event("blur"))
        })

        // CHANGE
        this.editor.session.on("change", () => {
            this.dispatchEvent(new Event("change"))
        })

        // Set initial value + eventually bind record
        if (this.config.record) {
            this._bindRecord(this.config.record)
        }
        else if (this.config.value) {
            this.editor.setValue(this.config.value)
        }

        this.field.style.display = "block"
        setTimeout(() => this.editor.resize(), 50)
    }

    /**
     * Set the code
     * 
     * @param {string} newValue
     * @param {boolean} [fromBlurEvent] - If true, the update is only performed on binded record, not locally
     * @returns this
     */
    setValue(newValue, fromBlurEvent) {
        if (this.record) {
            // If the field is connected to a record, we update the database
            this.record.updateFieldDeep(this.id, newValue).then(success => {

                // Rollback the initial value if the update failed (ACL)
                if (!success) this.editor.setValue(this.initialValue || "")
            })
        } else {
            // Otherwise, we just change the field value
            if (!fromBlurEvent) {
                this.editor.setValue(newValue)
            }
        }

        return this
    }

    /**
     * Get the code
     * 
     * @returns {string} The image src
     */
    getValue() {
        if (!this.editor) return ""
        return this.editor.getValue()
    }

    validate() {
        return true
    }

    /**
     * Insert a text at the current cursor position
     * 
     * @param {string} text
     * @returns this
     */
    insert(text) {
        const cursorPosition = this.editor.getCursorPosition()
        this.editor.session.insert(cursorPosition, text)
        this.editor.focus()
        return this
    }

    /**
     * Give focus to the input field
     * 
     * @returns this
     */
    focus() {
        this.editor.focus()
        return this
    }

    /**
     * Unset the focus of the input field
     * 
     * @returns this
     */
    blur() {
        this.editor.blur()
        return this
    }
    
    /**
     * Clear the current selection
     * 
     * @returns this
     */
    clearSelection() {
        this.editor.clearSelection()
        return this
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
        this.label.style.width = this.label.style.maxWidth = this._computeSize("labelWidth", width)
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
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-codeeditor", kiss.ux.CodeEditor)

/**
 * Shorthand to create a new Image. See [kiss.ui.Image](kiss.ui.Image.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createCodeEditor = (config) => document.createElement("a-codeeditor").init(config)

;