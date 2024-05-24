/**
 * 
 * The Button derives from [Component](kiss.ui.Component.html).
 * 
 * Its a standard clickable button with an icon.
 * 
 * @param {object} config
 * @param {function} [config.action] Action to perform when clicked. Shortcut for config.events.onclick
 * @param {string} [config.text]
 * @param {string} [config.tip] - Tip displayed when hovering the button
 * @param {string} [config.textAlign]
 * @param {string} [config.fontSize]
 * @param {string} [config.fontWeight]
 * @param {string} [config.color]
 * @param {string} [config.colorHover]
 * @param {string} [config.icon]
 * @param {string} [config.iconHover]
 * @param {string} [config.iconSize]
 * @param {string} [config.iconColor]
 * @param {string} [config.iconColorHover]
 * @param {string} [config.iconShadow]
 * @param {string} [config.iconShadowHover]
 * @param {string} [config.iconPosition] Use "top" to put the icon at the top
 * @param {string} [config.iconPadding]
 * @param {string} [config.iconMargin]
 * @param {string} [config.background]
 * @param {string} [config.backgroundColor]
 * @param {string} [config.backgroundColorHover]
 * @param {string} [config.boxShadow]
 * @param {string} [config.boxShadowHover]
 * @param {string} [config.cursor]
 * @param {string} [config.position]
 * @param {string} [config.top]
 * @param {string} [config.left]
 * @param {string} [config.right]
 * @param {string} [config.float]
 * @param {string} [config.display]
 * @param {string} [config.flex]
 * @param {string|number} [config.width]
 * @param {string|number} [config.minWidth]
 * @param {string|number} [config.maxWidth]
 * @param {string|number} [config.height]
 * @param {string|number} [config.minHeight]
 * @param {string|number} [config.maxHeight]
 * @param {string} [config.margin]
 * @param {string} [config.padding]
 * @param {string} [config.border]
 * @param {string} [config.borderStyle]
 * @param {string} [config.borderWidth]
 * @param {string} [config.borderColor]
 * @param {string} [config.borderColorHover]
 * @param {string} [config.borderRadius]
 * @param {string} [config.overflow]
 * @param {string} [config.overflowX]
 * @param {string} [config.overflowY]
 * @param {number} [config.zIndex]
 * @param {boolean} [config.draggable]
 * @returns this
 * 
 * ## Generated markup
 * ```
 * <a-button class="a-button">
 *  <span class="button-icon font-awesome-icon-class"></span>
 *  <span class="button-text"></span>
 * </a-button>
 * ```
 */
kiss.ui.Button = class Button extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myButton = document.createElement("a-button").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myButton = createButton({
     *  text: "Click me!",
     *  icon: "fas fa-check",
     *  action: () => console.log("click!")
     * })
     * 
     * myButton.render()
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *   title: "My panel",
     *   items: [
     *       {
     *           type: "button",
     *           text: "Click me!",
     *           icon: "fas fa-check",
     *           action: () => console.log("click!")
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
     * Generates a Button from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config = {}) {
        super.init(config)

        // Template
        this.icon = config.icon || ""
        this.text = config.text || ""
        this.text = this.text.replaceAll("\n", "<br>")

        this.innerHTML = `
            ${ (config.icon) ? `<span id="button-icon-${this.id}" class="button-icon ${this.icon}"></span>` : "" }
            ${ (config.text) ? `<span id="button-text-${this.id}" class="button-text">${this.text}</span>` : "" }`.removeExtraSpaces()

        // Set properties
        this.buttonIcon = this.querySelector(".button-icon") || {}
        this.buttonText = this.querySelector(".button-text") || {}

        this._setProperties(config, [
            [
                ["draggable"],
                [this]
            ],
            [
                ["display", "flex", "position", "float", "top", "left", "right", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "margin", "padding", "background", "backgroundColor", "borderColor", "borderRadius", "borderStyle", "borderWidth", "boxShadow", "cursor", "zIndex"],
                [this.style]
            ],
            [
                ["color", "fontSize", "fontWeight", "textAlign"],
                [this.buttonText.style]
            ],
            [
                ["iconSize=fontSize", "iconColor=color", "iconPadding=padding", "iconMargin=margin", "iconShadow=textShadow"],
                [this.buttonIcon.style]
            ]
        ])

        // Set the default display mode that will be restored by the show() method
        this.displayMode = "inline-flex"

        // Bind action to onclick
        if (config.action) this.onclick = config.action

        // Build hover events
        if (config.iconHover) this._createHoverListener("iconHover", config.iconHover, "_setHoverIcon", "_resetIcon")
        if (config.colorHover) this._createHoverListener("colorHover", config.colorHover, "_setHoverColor", "_resetColor")
        if (config.iconColorHover) this._createHoverListener("iconColorHover", config.iconColorHover, "_setHoverIconColor", "_resetIconColor")
        if (config.iconShadowHover) this._createHoverListener("iconShadowHover", config.iconShadowHover, "_setHoverIconShadow", "_resetIconShadow")
        if (config.boxShadowHover) this._createHoverListener("boxShadowHover", config.boxShadowHover, "_setHoverBoxShadow", "_resetBoxShadow")
        if (config.borderColorHover) this._createHoverListener("borderColorHover", config.borderColorHover, "_setHoverBorderColor", "_resetBorderColor")
        if (config.backgroundColorHover) this._createHoverListener("backgroundColorHover", config.backgroundColorHover, "_setHoverBackgroundColor", "_resetBackgroundColor")

        // Force the button's hover to reset after click
        // @note: this is necessary in situations where the "click" hides the view which contains the button, and sends the button to cache in its wrong "hover" state.
        this.onmouseup = () => {
            if (config.colorHover) this._resetColor()
            if (config.iconColorHover) this._resetIconColor()
            if (config.iconShadowHover) this._resetIconShadow()
            if (config.boxShadowHover) this._resetBoxShadow()
            if (config.borderColorHover) this._resetBorderColor()
            if (config.backgroundColorHover) this._resetBackgroundColor()
        }

        if (config.icon) {
            // Define the width of the icon area, to be able to center it properly
            // The width of the icon span should be equal to the height of the button in order to create a regular square and center icons within it
            this.buttonIcon.style.width = (config.height) ? this._computeSize("height") : "var(--button-height)"

            // Change flex flow if depending on the icon position
            this.iconPosition = config.iconPosition || "left"

            const flow = {
                top: "column",
                left: "row",
                bottom: "column-reverse",
                right: "row-reverse"
            }
            this.style.flexFlow = flow[this.iconPosition]
        }

        return this
    }

    /**
     * Change the text of the button
     * 
     * @param {string} text - The new button text
     * @returns this
     * 
     * @example
     * myButton.setText("Click here")
     */
    setText(text = "") {
        text = text.replaceAll("\n", "<br>")
        this.config.text = text
        this.buttonText.innerText = text
        return this
    }

    /**
     * Change the icon of the button
     * 
     * @param {string} iconClass - The new Font Awesome icon class
     * @returns this
     * 
     * @example
     * myButton.setIcon("fas fa-check")
     */
    setIcon(iconClass) {
        this.config.icon = iconClass
        this.icon.split(" ").forEach(className => this.buttonIcon.classList.remove(className))
        this.icon = iconClass
        this.icon.split(" ").forEach(className => this.buttonIcon.classList.add(className))
        return this
    }

    /**
     * Change the color of the text
     * 
     * @param {string} color - The new color, in hexa format
     * @returns this
     * 
     * @example
     * myButton.setColor("#00aaee")
     */
    setColor(color) {
        this.config.color = color
        if ((this.buttonText) && (this.buttonText.style)) this.buttonText.style.color = color
        return this
    }

    /**
     * Change the background color of the text
     * 
     * @param {string} color - The new color, in hexa format
     * @returns this
     * 
     * @example
     * myButton.setBackgroundColor("#00aaee")
     */
    setBackgroundColor(color) {
        this.config.backgroundColor = this.style.backgroundColor = color
        return this
    }

    /**
     * Change the color of the icon
     * 
     * @param {string} color - The new color, in hexa format
     * @returns this
     * 
     * @example
     * myButton.setIconColor("#00aaee")
     */
    setIconColor(color) {
        this.config.iconColor = color
        if (this.config.icon) this.buttonIcon.style.color = color
        return this
    }

    /**
     * Change the color of the border
     * 
     * @param {string} color - The new color, in hexa format
     * @returns this
     * 
     * @example
     * myButton.setBorderColor("#00aaee")
     */
    setBorderColor(color) {
        this.config.borderColor = color
        this.style.borderColor = color
        return this
    }

    /**
     * Manage HOVER for backgroundColor, color, and icon color
     * 
     * @private
     * @ignore
     */
    _createHoverListener(propertyName, propertyValue, setMethod, resetMethod) {
        this[propertyName] = propertyValue
        this.addEventListener("mouseenter", this[setMethod])
        this.addEventListener("mouseleave", this[resetMethod])
    }

    // Color
    _setHoverColor() {
        if (!this.buttonText) return
        this.currentColor = this.buttonText.style.color
        this.buttonText.style.color = this.colorHover
    }

    _resetColor() {
        this.buttonText.style.color = this.currentColor
    }

    // Icon
    _setHoverIcon() {
        if (!this.icon) return
        this.currentIcon = this.icon
        this.setIcon(this.config.iconHover)
    }

    _resetIcon() {
        this.setIcon(this.currentIcon)
    }

    // Icon color
    _setHoverIconColor() {
        if (!this.buttonIcon) return
        this.currentIconColor = this.buttonIcon.style.color
        this.buttonIcon.style.color = this.iconColorHover
    }

    _resetIconColor() {
        this.buttonIcon.style.color = this.currentIconColor
    }

    // Icon shadow
    _setHoverIconShadow() {
        if (!this.buttonIcon) return
        this.currentIconShadow = this.buttonIcon.style.textShadow
        this.buttonIcon.style.textShadow = this.iconShadowHover
    }

    _resetIconShadow() {
        this.buttonIcon.style.textShadow = this.currentIconShadow
    }    

    // Shadow
    _setHoverBoxShadow() {
        this.currentShadow = this.style.boxShadow
        this.style.boxShadow = this.boxShadowHover
    }

    _resetBoxShadow() {
        this.style.boxShadow = this.currentShadow
    }

    // Border color
    _setHoverBorderColor() {
        this.currentBorderColor = this.style.borderColor
        this.style.borderColor = this.borderColorHover
    }

    _resetBorderColor() {
        this.style.borderColor = this.currentBorderColor
    }

    // Background color
    _setHoverBackgroundColor() {
        this.currentBackgroundColor = this.style.backgroundColor
        this.style.backgroundColor = this.backgroundColorHover
    }

    _resetBackgroundColor() {
        this.style.backgroundColor = this.currentBackgroundColor
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-button", kiss.ui.Button)

/**
 * Shorthand to create a new Button. See [kiss.ui.Button](kiss.ui.Button.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createButton = (config) => document.createElement("a-button").init(config)

;