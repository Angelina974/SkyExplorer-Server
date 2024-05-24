/**
 * 
 * The Spacer component derives from [Component](kiss.ui.Component.html).
 * 
 * It's a simple empty element used as a spacer in the layout.
 * It can be useful to take advantage of the CSS flex layout system, or if you need to fill some space.
 * 
 * @param {object} config
 * @param {string} [config.display]
 * @param {string} [config.flex]
 * @param {string|number} [config.width]
 * @param {string|number} [config.height]
 * @returns this
 * 
 * ## Generated markup
 * ```
 * <a-spacer class="a-spacer">
 * </a-spacer>
 * ```
 */
kiss.ui.Spacer = class Spacer extends kiss.ui.Component {
   /**
    * The only use case is when you need to set space between elements without using margins:
    * ```
    * const myPanel = createPanel({
    *   title: "My panel",
    *   display: "flex",
    *   flexFlow: column,
    *   items: [
    *       {
    *           type: "html",
    *           html: "Block 1",
    *           flex: 1
    *       },
    *       {
    *           type: "spacer",
    *           flex: 0.5
    *       },
    *       {
    *           type: "html",
    *           html: "Block 2",
    *           flex: 1
    *       },
    *       {
    *           type: "spacer",
    *           height: "32px"
    *       },
    *       {
    *           type: "html",
    *           html: "Block 3",
    *           flex: 1
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
     * Generates an simple spacer DIV from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config) {
        super.init(config)

        this.style.display = "block"

        // Set properties
        this._setProperties(config, [
            [
                ["display", "width", "height", "flex"],
                [this.style]
            ]
        ])

        return this
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-spacer", kiss.ui.Spacer)
const createSpacer = (config) => document.createElement("a-spacer").init(config)

;