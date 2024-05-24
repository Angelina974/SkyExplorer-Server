/**
 * 
 * The Block derives from [Container](kiss.ui.Container.html).
 * 
 * A Block is a general purpose container for items, where items can be:
 * - KissJS components (Field, Button, ...)
 * - KissJS containers (Block, Form, Panel...)
 * - KissJS views
 * - any HTMLElement
 * - any function that returns an HTMLElement
 * 
 * Don't forget you can use the Container's methods like **update, addItem, insertItem, deleteItem, getFields, getData...**
 * 
 * @param {object} config
 * @param {object[]} config.items - The array of contained items
 * @param {boolean} [config.multiview] - If true, the container only displays one item at a time. Useful for Tab layouts.
 * @param {boolean} [config.fullscreen]
 * @param {string} [config.position]
 * @param {string} [config.top]
 * @param {string} [config.left]
 * @param {string} [config.right]
 * @param {string} [config.align] - "center" to center the block horizontally on the screen
 * @param {string} [config.verticalAlign] - "center" to center the block vertically on the screen
 * @param {string} [config.display]
 * @param {string} [config.flex]
 * @param {string} [config.flexFlow]
 * @param {string} [config.flexWrap]
 * @param {string} [config.flexGrow]
 * @param {string} [config.flexShrink]
 * @param {string} [config.alignItems]
 * @param {string} [config.alignContent]
 * @param {string} [config.justifyContent]
 * @param {string|number} [config.width]
 * @param {string|number} [config.minWidth]
 * @param {string|number} [config.maxWidth]
 * @param {string|number} [config.height]
 * @param {string|number} [config.minHeight]
 * @param {string|number} [config.maxHeight]
 * @param {string} [config.margin]
 * @param {string} [config.padding]
 * @param {string} [config.background]
 * @param {string} [config.backgroundColor]
 * @param {string} [config.backgroundImage]
 * @param {string} [config.backgroundSize]
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
 * @param {number} [config.transform]
 * @param {boolean} [config.draggable]
 * @returns this
 * 
 * ## Generated markup
 * ```
 * <a-block class="a-block">
 *  <!-- Block items are inserted here -->
 * </a-block>
 * ```
 */
kiss.ui.Block = class Block extends kiss.ui.Container {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myBlock = document.createElement("a-block").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myBlock = createBlock({
     *   padding: "10px",
     *   items: [
     *       // Block items...
     *   ]
     * })
     * 
     * myBlock.render()
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *   items: [
     *       {
     *           type: "block",
     *           title: "Foo",
     *           items: [
     *               // Block items...
     *           ]
     *       }
     *   ]
     * })
     * myPanel.render()
     * ```
     * 
     * ## IMPORTANT
     * When embedded into another container, the item type defaults to "block", which means it's not necessary to set the **type** property for **block** elements:
     * ```
     * const myPanel = createPanel({
     *   items: [
     *       {
     *           // This item has no type: KissJS will generate a block by default
     *           title: "Foo",
     *           items: [
     *               // Block items...
     *           ]
     *       }
     *   ]
     * })
     * myPanel.render()
     * ```
     * 
     */
    constructor() {
        super()
    }

    /**
     * Generates a Block and its items from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config) {
        super.init(config)

        // Fullscreen
        if (config.fullscreen) {
            this.style.display = "block"
            this.style.position = "fixed"
            this.style.top = "0px"
            this.style.left = "0px"
            this.style.width = "100%"
            this.style.height = "100%"
        }

        // Define component's items container
        // It can vary depending on the component: for example, for the Panel, the items container is the panel body
        // The basic block directly contains the items without any sub-hierarchy
        this.container = this

        // Dispatch component's config properties to the right targets
        this._setProperties(config, [
            [
                ["draggable"],
                [this]
            ],
            [
                ["display", "padding", "margin", "position", "top", "left", "right", "overflow", "overflowX", "overflowY", "flex", "flexFlow", "flexWrap", "flexGrow", "flexShrink", "alignItems", "alignContent", "justifyContent", "width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight", "background", "backgroundColor", "backgroundImage", "backgroundSize", "border", "borderStyle", "borderWidth", "borderColor", "borderRadius", "boxShadow", "zIndex", "transform"],
                [this.style]
            ]
        ])

        return this
    }

    /**
     * Set the Html content of the block component
     * 
     * @param {string} html
     * @returns this
     */
    setInnerHtml(html) {
        this.innerHTML = html
        return this
    }

    /**
     * Get the Html content of the block component
     * 
     * @returns {string} The html content
     */
    getInnerHtml() {
        return this.innerHTML
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-block", kiss.ui.Block)

/**
 * Shorthand to create a new Block. See [kiss.ui.Block](kiss.ui.Block.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createBlock = (config) => document.createElement("a-block").init(config)

;