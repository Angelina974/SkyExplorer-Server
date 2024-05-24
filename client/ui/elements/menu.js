/**
 * 
 * The Menu derives from [Component](kiss.ui.Component.html).
 * 
 * The menu contains a list of items where each items is:
 * ```
 * {
 *      text: "Do this",
 *      icon: "fas fa-cog", // Font awesome icon class
 *      iconSize: "40px", // Optional icon size
 *      iconColor: "#00aaee", // Optional icon color
 *      action: () => {} // Function to execute when the menu is clicked
 * }
 * ```
 * 
 * @param {object} config
 * @param {object[]|string[]} config.items - The array of menu entries
 * @param {boolean} config.closeOnClick - Set to false if the menu should not be closed after an entry is clicked. Default to true
 * @param {string} [config.classModifier] - Custom class to apply to the menu and menu items
 * @param {string} [config.top]
 * @param {string} [config.left]
 * @param {string|number} [config.width]
 * @param {string|number} [config.maxWidth]
 * @param {string|number} [config.height]
 * @param {string|number} [config.maxHeight]
 * @param {string} [config.color]
 * @param {string} [config.background]
 * @param {string} [config.backgroundColor]
 * @param {string} [config.padding]
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
 * <a-menu class="a-menu">
 * 
 *  <!-- For each menu item -->
 *  <div class="menu-item classModifier">
 *      <span class="menu-item-icon classModifier"></span>
 *      <span class="menu-item-text classModifier"></span>
 *  </div>
 * 
 *  <!-- For each menu separator -->
 *  <div class="menu-separator"></div>
 * 
 * </a-menu>
 * ```
 */
kiss.ui.Menu = class Menu extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myMenu = document.createElement("a-menu").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myMenu = createMenu({
     *  items: [
     *      "This is a title", // Simple text is considered a title
     *      {
     *          icon: "fas fa-check",
     *          text: "Do this",
     *          action: () => {...}
     *      },
     *      "-", // Menu separator
     *      {
     *          hidden: !canSeeThisEntry, // It's possible to hide a menu entry using the hidden property
     *          icon: "fas fa-cube",
     *          text: "Do that",
     *          action: () => {...}
     *      },
     *      "Parameters:", // Text entries are processed as section titles inside the menu
     *      {
     *          icon: "fas fa-circle",
     *          iconSize: "32px", // It's possible to alter the default icon size
     *          iconColor: "#00aaee", // It's possible to alter the default icon color
     *          text: "Do that",
     *          action: () => {...}
     *      }
     *  ]
     * })
     * 
     * myMenu.render().showAt(100, 100) // Display the menu at position 100, 100
     * ```
     */
    constructor() {
        super()
    }

    /**
     * Generates an Menu from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config) {
        super.init(config)

        // Define a class modifier
        const altClass = config.classModifier || ""

        // Template for a single menu item
        let defaultMenuItemRenderer = function (config) {
            const iconSize = (config.iconSize) ? `font-size: ${config.iconSize};` : ""
            const iconColor = (config.iconColor) ? `color: ${config.iconColor}` : ""
            const iconStyle = (iconSize || iconColor) ? `style="${iconSize} ${iconColor}"` : ""

            return `
                ${(typeof config != "string")
                    ? `<div class="menu-item ${altClass}">
                            <span class="menu-item-icon ${altClass}"><i ${iconStyle} class="${config.icon}"></i></span>
                            <span class="menu-item-text ${altClass}">${config.text}</span>
                        </div>`
                    : ((config == "-") ? `<div class="menu-separator"></div>` : `<div class="menu-section">${config}</div>`)
                }`.removeExtraSpaces()
        }

        // Template for the complete menu which contains the menu items
        this.visibleItems = config.items.filter(item => item.hidden != true && item != null && item != "")
        
        // Add a header to close the menu for mobile UI
        this.innerHTML = (!kiss.screen.isMobile) ? "" : /*html*/`
            <span class="a-menu-mobile-close fas fa-chevron-left" onclick="this.closest('a-menu').close()"></span>
        `

        this.innerHTML += this.visibleItems.map(item => {
            const itemRenderer = item.itemRenderer || defaultMenuItemRenderer
            return itemRenderer(item)
        }).join("")

        // Set properties
        this.style.position = "absolute"
        this.style.display = "block"
        this.style.zIndex = 10000
        this.menuItems = this.querySelectorAll(".menu-item, .menu-separator, .menu-section")

        // Prevent menu from overflowing the viewport height
        if (!config.maxHeight) config.maxHeight = () => kiss.screen.current.height - 20

        // Apply configs
        this._setProperties(config, [
            [
                ["padding", "top", "left", "bottom", "right", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "color", "background", "backgroundColor", "border", "borderStyle", "borderWidth", "borderColor", "borderRadius", "boxShadow", "zIndex"],
                [this.style]
            ],
            [
                ["itemBackground=background"],
                Array.from(this.menuItems).map(menuItem => menuItem.style) // Apply to all menu sub-items
            ]
        ])

        // Auto closing (default to true)
        if (config.closeOnClick !== false) config.closeOnClick = true

        // Bind menu item actions to DOM nodes 'onclick' event
        let menu = this
        for (let i = 0; i < this.menuItems.length; i++) {
            if (typeof menu.visibleItems[i] != "string") this.menuItems[i].onclick = function (event) {
                if (config.closeOnClick) menu.close()
                menu.visibleItems[i].action(event)
            }
        }

        // Remove menu on exit
        this.onmouseleave = () => this.close()

        // Set a default animation
        this.setAnimation(config.animation || {
            name: "zoomIn",
            speed: "light"
        })

        return this
    }

    /**
     * Close the menu (remove it from the DOM)
     */
    close() {
        kiss.views.remove(this.id)
    }

    /**
     * Ensure the menu is 100% visible inside the viewport
     * 
     * @private
     * @ignore
     */
    _afterRender() {
        kiss.tools.moveToViewport(this)
    }
}

/**
 * Close all menus when clicking outside of menu
 */
document.addEventListener('mousedown', function(event) {
    const menu = document.querySelector('a-menu')
    if (!menu) return

    const rect = menu.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY

    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return

    const menus = Array.from(document.querySelectorAll("a-menu"))
    menus.forEach(menu => menu.close())        
})

// Create a Custom Element and add a shortcut to create it
customElements.define("a-menu", kiss.ui.Menu)

/**
 * Shorthand to create a new Menu. See [kiss.ui.Menu](kiss.ui.Menu.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createMenu = (config) => document.createElement("a-menu").init(config)

;