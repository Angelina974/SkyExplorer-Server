/**
 * 
 * The HTML component derives from [Component](kiss.ui.Component.html).
 * 
 * It's a simple component to encapsulate html.
 * 
 * @param {object} config
 * @param {object} config.html - The HTML content
 * @param {string} [config.position]
 * @param {string} [config.top]
 * @param {string} [config.left]
 * @param {string} [config.right]
 * @param {string} [config.float]
 * @param {string} [config.display]
 * @param {string} [config.flex]
 * @param {string} [config.flexFlow]
 * @param {string} [config.flexWrap]
 * @param {string} [config.alignItems]
 * @param {string} [config.justifyContent]
 * @param {string|number} [config.width]
 * @param {string|number} [config.minWidth]
 * @param {string|number} [config.maxWidth]
 * @param {string|number} [config.height]
 * @param {string|number} [config.minHeight]
 * @param {string|number} [config.maxHeight]
 * @param {string} [config.margin]
 * @param {string} [config.padding]
 * @param {string} [config.color]
 * @param {string} [config.background]
 * @param {string} [config.backgroundColor]
 * @param {string} [config.border]
 * @param {string} [config.borderStyle]
 * @param {string} [config.borderWidth]
 * @param {string} [config.borderColor]
 * @param {string} [config.borderRadius]
 * @param {string} [config.boxShadow]
 * @param {string} [config.overflow]
 * @param {string} [config.overflowX]
 * @param {string} [config.overflowY]
 * @param {number} [config.zIndex]
 * @param {string} [config.cursor]
 * @returns this
 * 
 * ## Generated markup
 * ```
 * <a-html class="a-html">
 * </a-html>
 * ```
 */
kiss.ui.Html = class Html extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myHtml = document.createElement("a-html").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myHtml = createHtml({
     *   html: "Hello!"
     * })
     * 
     * myHtml.render()
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *   title: "My panel",
     *   items: [
     *       {
     *           type: "html",
     *           html: "Hello!"
     *       }
     *   ]
     * })
     * 
     * myPanel.render()
     * ```
     */
    constructor() {
        super()
    }

    /**
     * Generates an HTML block from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config) {
        super.init(config)

        this.innerHTML = config.html || ""

        this._setProperties(config, [
            [
                ["display", "flex", "flexFlow", "flexFlow", "flexWrap", "alignItems", "justifyContent", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "overflow", "overflowX", "overflowY", "padding", "margin", "position", "top", "left", "right", "float", "color", "background", "backgroundColor", "boxShadow", "zIndex", "border", "borderStyle", "borderWidth", "borderColor", "borderRadius", "cursor"],
                [this.style]
            ]
        ])

        return this
    }

    /**
     * Set the content of the Html component
     * 
     * @param {string} html
     * @returns this
     */
    setInnerHtml(html) {
        this.config.html = html
        this.innerHTML = html
        return this
    }

    /**
     * Get the content of the Html component
     * 
     * @returns {string} The html content
     */
    getInnerHtml() {
        return this.innerHTML
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-html", kiss.ui.Html)

/**
 * Shorthand to create a new Html. See [kiss.ui.Html](kiss.ui.Html.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createHtml = (config) => document.createElement("a-html").init(config)

;