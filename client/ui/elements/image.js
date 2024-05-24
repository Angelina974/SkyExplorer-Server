/**
 * 
 * The Image component derives from [Component](kiss.ui.Component.html).
 * 
 * @param {object} config
 * @param {string} config.src
 * @param {string} [config.alt]
 * @param {string} [config.objectFit] - fill (default) | contain | cover | scale-down | none
 * @param {string} [config.position]
 * @param {string} [config.top]
 * @param {string} [config.left]
 * @param {string} [config.right]
 * @param {string} [config.float]
 * @param {string} [config.display]
 * @param {string|number} [config.width]
 * @param {string|number} [config.height]
 * @param {string} [config.margin]
 * @param {string} [config.padding]
 * @param {string} [config.border]
 * @param {string} [config.borderStyle]
 * @param {string} [config.borderWidth]
 * @param {string} [config.borderColor]
 * @param {string} [config.borderRadius]
 * @param {string} [config.boxShadow]
 * @param {number} [config.zIndex]
 * @param {boolean} [config.draggable]
 * @param {string} [config.cursor]
 * @returns this
 * 
 * ## Generated markup
 * ```
 * <a-image class="a-image">
 *  <img class="image-content">
 * </a-image>
 * ```
 */
kiss.ui.Image = class Image extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myImage = document.createElement("a-image").init(config)
     * ```
     * 
     * Or use the shorthand for it:
    * ```
    * const myImage = createImage({
    *  src: "./logo.png",
    *  alt: "Company logo"
    * })
    * 
    * myImage.render()
    * ```
    * 
    * Or directly declare the config inside a container component:
    * ```
    * const myPanel = createPanel({
    *   title: "My panel",
    *   items: [
    *       {
    *           type: "image",
    *           src: "./logo.png",
    *           alt: "Company logo"
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
     * Generates an Image from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config) {
        super.init(config)

        // Template
        this.innerHTML = `<img id="image-content-${this.id}" src="${config.src}" ${(config.alt) ? `alt="${config.alt}"` : ""} class="image-content" loading="lazy">`

	    // Attach event to handle token/session renewal
	    kiss.session.setupImg(this.querySelector('img'))

        // Set properties
        this.imageContent = this.querySelector(".image-content")

        this._setProperties(config, [
            [
                ["draggable"],
                [this]
            ],            
            [
                ["minWidth", "minHeight", "width", "height","margin", "position", "top", "left", "right", "float", "boxShadow", "zIndex", "border", "borderStyle", "borderWidth", "borderColor", "borderRadius"],
                [this.style]

            ],
            [
                ["minWidth", "minHeight", "width", "height", "padding", "cursor", "objectFit"],
                [this.imageContent.style]
            ]
        ])

        return this
    }

    /**
     * Set the src of the Image component
     * 
     * @param {string} src
     * @returns this
     */
    setValue(src) {
        this.config.src = src
        this.imageContent.src = src
        return this
    }

    /**
     * Get the src of the Image component
     * 
     * @returns {string} The image src
     */
    getValue() {
        return this.imageContent.src
    } 
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-image", kiss.ui.Image)

/**
 * Shorthand to create a new Image. See [kiss.ui.Image](kiss.ui.Image.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createImage = (config) => document.createElement("a-image").init(config)

;