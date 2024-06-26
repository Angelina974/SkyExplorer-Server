/**
 * 
 * The Panel derives from [Container](kiss.ui.Container.html).
 * 
 * It's a container with a header and other properties that allow to create standard draggable windows and modal windows.
 * 
 * Don't forget you can use the Container's methods like **update, addItem, insertItem, deleteItem, getFields, getData...**
 * 
 * @param {object} config
 * @param {object[]} config.items - The array of contained items
 * @param {boolean} [config.multiview] - If true, the container only displays one item at a time. Useful for Tab layouts.
 * @param {boolean} [config.header]
 * @param {boolean} [config.headerColor]
 * @param {string} [config.headerBackgroundColor]
 * @param {string} [config.headerBorderRadius]
 * @param {string} [config.headerBorderColor]
 * @param {object[]} [config.headerButtons] - Buttons injected in the header. See example below.
 * @param {object[]} [config.headerIcons] - Icons injected in the header. See example below.
 * @param {string} [config.title]
 * @param {string} [config.icon]
 * @param {string} [config.iconColor]
 * @param {string} [config.iconSize]
 * @param {boolean} [config.modal] - Makes the panel modal (clicking out of the panel will close it)
 * @param {boolean} [config.expandable] - Adds a header icon to expand the panel in fullscreen
 * @param {boolean} [config.closable] - Adds a header icon to close the panel
 * @param {string} [config.closeMethod] - Use "hide" or "remove" (default, destroys the DOM node)
 * @param {boolean} [config.draggable] - Makes the panel draggable.
 * @param {boolean} [config.collapsible] - Allows the panel content to be collapsed. Note that This property is disabled if the panel is also draggable.
 * @param {boolean} [config.collapsed] - Default collapse state
 * @param {string} [config.position]
 * @param {string|number} [config.top]
 * @param {string|number} [config.left]
 * @param {string|number} [config.right]
 * @param {string} [config.align] - "center" to center the panel horizontally on the screen
 * @param {string} [config.verticalAlign] - "center" to center the panel vertically on the screen
 * @param {string} [config.layout]
 * @param {string} [config.display]
 * @param {string} [config.flex]
 * @param {string} [config.flexFlow]
 * @param {string} [config.flexWrap]
 * @param {string} [config.alignItems]
 * @param {string} [config.alignContent]
 * @param {string} [config.justifyContent]
 * @param {string|number} [config.width]
 * @param {string|number} [config.minWidth]
 * @param {string|number} [config.maxWidth]
 * @param {string|number} [config.height] - A calculation involving the header's height and panel border-width
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
 * @param {number} [config.opacity]
 * @param {number} [config.transform] 
 * @param {string} [maskBackgroundColor] - Allows to adjust the opacity of the mask for modal windows. Example: rgba(0, 0, 0, 0.5)
 * @returns this
 * 
 * ## Generated markup
 * ```
 * <a-panel class="a-panel">
 *  <div class="panel-header">
 *      <span class="panel-icon"></span>
 *      <span class="panel-title"></span>
 *      <span class="panel-custom-buttons"></span>
 *      <span class="panel-button-expand-collapse"></span>
 *      <span class="panel-button-maximize"></span>
 *      <span class="panel-button-close"></span>
 *  </div>
 *  <div class="panel-body">
 *      <!-- Panel items are inserted here -->
 *  </div>
 * </a-panel>
 * ```
 * 
 * ## Todo
 * - add a panel footer?
 * - add a panel toolbar?
 * 
 */
kiss.ui.Panel = class Panel extends kiss.ui.Container {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myPanel = document.createElement("a-panel").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myPanel = createPanel({
     *   title: "Setup"
     *   icon: "fas fa-wrench",
     *   headerBackgroundColor: "#00aaee",
     *   closable: true,
     *   draggable: true,
     *   modal: true,
     *   display: "flex"
     *   flexFlow: "column",
     *   padding: "10px",
     *   items: [
     *       // Panel items...
     *   ]
     * })
     * 
     * myPanel.render()
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myBlock = createBlock({
     *   items: [
     *       {
     *           type: "panel",
     *           title: "Foo",
     *           items: [
     *               // Panel items...
     *           ]
     *       }
     *   ]
     * })
     * myBlock.render()
     * ```
     * 
     * To add buttons or icons in the header:
     * ```
     * createPanel({
     *  headerButtons: [
     *      {
     *          icon: "fas fa-bolt",
     *          text: "Do something"
     *          action: () => this.doSomething()
     *      }
     *  ],
     *  headerIcons: [
     *      {
     *          icon: "fas fa-bolt",
     *          action: () => this.doSomething()
     *      }
     *  ],
     *  items: [
     *      // ...
     *  ]
     * })
     * ```
     */
    constructor() {
        super()
    }

    /**
     * Generates a Panel from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config) {
        super.init(config)

        // Template
        const id = this.id
        this.innerHTML =
            `${((config.collapsible == true) && (config.draggable != true))
                ? `<div id="panel-header-${id}" class="panel-header panel-header-collapsible">`
                : `<div id="panel-header-${id}" class="panel-header ${(config.draggable == true) ? "panel-header-draggable" : ""}">`
            }
                <span id="panel-icon-${id}" class="panel-icon ${(config.icon) ? config.icon : ""}"></span>
                <span id="panel-title-${id}" class="panel-title">${config.title || ""}</span>
                <span style="flex:1"></span>
                <span class="panel-custom-buttons"></span>
                <span class="panel-custom-icons"></span>
                ${(config.collapsible) ? `<span id="panel-button-expand-collapse-${id}" class="fas fa-chevron-down panel-buttons panel-button-expand-collapse"></span>` : ""}
                ${(config.expandable) ? `<span id="panel-button-maximize-${id}" class="fas fa-window-maximize panel-buttons panel-button-expand"></span>` : ""}
                ${(config.closable) ? `<span id="panel-button-close-${id}" class="fas fa-times panel-buttons panel-button-close"></span>` : ""}
            </div>
            
            <div tabindex=1 id="panel-body-${id}" class="panel-body ${(config.header == false) ? "panel-body-no-header" : ""}">
            </div>`.removeExtraSpaces()

        // Mask (for modal windows)
        if (config.modal == true) {
            this.mask = document.createElement("div")
            this.mask.setAttribute("id", "panel-mask-" + id)
            this.mask.classList.add("panel-mask")
            this.mask.onmousedown = () => $(id).close()
            if (config.zIndex) this.mask.style = `z-index: ${config.zIndex}`
            document.body.appendChild(this.mask)
        }

        // Set properties
        this.panelHeader = this.querySelector(".panel-header")
        this.panelTitle = this.querySelector(".panel-title")
        this.panelIcon = this.querySelector(".panel-icon")
        this.panelButtonExpandCollapse = this.querySelector(".panel-button-expand-collapse")
        this.panelButtons = this.querySelectorAll(".panel-buttons")
        this.panelCustomButtons = this.querySelector(".panel-custom-buttons")
        this.panelCustomIcons = this.querySelector(".panel-custom-icons")

        // Define component's items container (which can vary depending on the component)
        this.panelBody = this.container = this.querySelector(".panel-body")

        // Draggable panels need to have a fixed position
        config.position = (config.draggable) ? "fixed" : ((config.modal) ? "absolute" : (config.position || "relative"))

        // Restrict header's border radius to upper corners
        if ((config.borderRadius) && (config.borderRadius.split(" ").length == 4)) {
            const borderRadiusConfig = config.borderRadius.split(" ")
            const topLeftBorderRadius = borderRadiusConfig[0]
            const topRightBorderRadius = borderRadiusConfig[1]
            config.headerBorderRadius = topLeftBorderRadius + " " + topRightBorderRadius + " 0px 0px"
        }

        this._setProperties(config, [
            [
                ["position", "top", "left", "right", "flex", "margin", "border", "borderColor", "borderRadius", "boxShadow", "transform", "zIndex", "opacity"],
                [this.style]
            ],
            [
                ["headerHeight=height", "headerBackgroundColor=background", "headerBorderColor=borderColor", "headerBorderRadius=borderRadius"],
                [this.panelHeader.style]
            ],
            [
                ["headerColor=color"],
                [this.panelTitle.style]
            ],            
            [
                ["headerColor=color", "iconColor=color", "iconSize=fontSize"],
                [this.panelIcon.style]
            ],
            [
                ["headerColor=color"],
                Array.from(this.panelButtons).map(panelButton => panelButton.style)
            ],                 
            [
                ["display", "flexFlow", "flexWrap", "alignItems", "alignContent", "justifyContent", "padding", "overflow", "overflowX", "overflowY", "background", "backgroundColor", "backgroundImage", "backgroundSize"],
                [this.panelBody.style]
            ],
            [
                ["maskBackgroundColor=backgroundColor"],
                [this.mask?.style]
            ]
        ])

        // Header visibility
        if (config.header == false) this.panelHeader.style.display = "none"

        // Close action (hide or remove)
        this.closeMethod = config.closeMethod || "remove"

        // Draggable
        if (config.draggable == true) this._enableDrag()

        // Collapsible
        if (config.collapsible) this.isCollapsible = true

        // Default state
        this.expanded = true

        // If it's a draggable (floating) windows or auto-centered window, we update the layout when window is resized
        if (config.draggable || config.align == "center" || config.verticalAlign == "center") {
            this.subscriptions.push(subscribe("EVT_WINDOW_RESIZED", () => this.updateLayout()))
        }

        // Add custom header buttons
        if (config.headerButtons) {
            config.headerButtons.forEach(button => this.addHeaderButton(button))
        }

        // Add custom header icons
        if (config.headerIcons) {
            config.headerIcons.forEach(icon => this.addHeaderIcon(icon))
        }

        // Collapse panel if requested
        if (config.collapsed) {
            setTimeout(() => this.collapse(), 0)
        }

        this._initHeaderClickEvent()
        return this
    }

    /**
     * Manage click event in the panel's header to perform various actions like "close", "expand", "collapse"...
     * 
     * @private
     * @ignore
     */
    _initHeaderClickEvent() {
        this.panelHeader.onclick = function(event) {
            const element = event.target
            const panel = element.closest("a-panel")

            if (element.classList.contains("panel-button-close")) {
                panel.close()
            }
            else if (element.classList.contains("panel-button-expand")) {
                panel.maximize(20)
            }
            else if (element.classList.contains("panel-button-expand-collapse") || element.classList.contains("panel-header-collapsible")) {
                panel.expandCollapse()
            }
            else if ((element.classList.contains("panel-title") || element.classList.contains("panel-icon")) && panel.config.collapsible === true && panel.config.draggable !== true) {
                panel.expandCollapse()
            }
        }
    }

    /**
     * Set or update the panel icon
     * 
     * @param {string} iconClass
     * @returns this
     */
    setIcon(iconClass) {
        this.config.icon = iconClass
        this.panelIcon.className = "panel-icon " + iconClass
        return this
    }

    /**
     * Set or update the panel header text color
     * 
     * @param {string} color - Hexa color code. Ex: #00aaee
     * @returns this
     */
    setHeaderColor(color) {
        this.config.headerColor = color
        this.panelIcon.style.color = color
        this.panelTitle.style.color = color
        Array.from(this.panelButtons).forEach(panelButton => panelButton.style.color = color)
        return this
    }

    /**
     * Set or update the panel header background color
     * 
     * @param {string} color - Hexa color code. Ex: #00aaee
     * @returns this
     */
    setHeaderBackgroundColor(color) {
        this.config.headerBackgroundColor = color
        this.panelHeader.style.backgroundColor = color
        return this
    }

    /**
     * Add a custom button inside the panel's header
     * 
     * @param {object} config
     * @param {string} config.icon - Font Awesome icon class. Ex: "fas fa-check"
     * @param {string} config.tip - Help text
     * @param {function} config.action - Action performed when the button is clicked
     * @returns this
     * 
     * @example
     * myPanel.addHeaderButton({
     *  icon: "fas fa-check",
     *  text: "Save and exit",
     *  action: async () => {
     *      await myRecord.save()
     *      myPanel.close()
     *  }
     * })
     */
    addHeaderButton(config) {
        const button = createButton(config)
        button.classList.add("panel-button")
        this.panelCustomButtons.appendChild(button)
        return this
    }

    /**
     * Add a custom icon inside the panel's header
     * 
     * @param {object} config
     * @param {string} config.icon - Font Awesome icon class. Ex: "fas fa-cog"
     * @param {string} config.tip - Help text
     * @param {function} config.action - Action performed when the icon is clicked
     * @returns this
     * 
     * @example
     * myPanel.addHeaderIcon({
     *  icon: "fas fa-cog",
     *  tip: "Opens the model properties",
     *  action: () => kiss.views.show("model-properties")
     * })
     */    
    addHeaderIcon(config) {
        if (!config.icon) return

        const icon = document.createElement("span")
        icon.setAttribute("id", kiss.tools.shortUid())
        icon.classList.add("panel-buttons", ...config.icon.split(" "))
        if (config.action) icon.onclick = config.action
        if (config.tip) icon.attachTip(config.tip)
        
        this.panelCustomIcons.appendChild(icon)
        return this
    }

    /**
     * Set the panel's title
     * 
     * @param {string} newTitle
     * @returns this
     */
    setTitle(newTitle) {
        this.panelTitle.innerHTML = newTitle
        return this
    }

    /**
     * Set the Html content of the panel component
     * 
     * @param {string} html
     * @returns this
     */
    setInnerHtml(html) {
        this.panelBody.innerHTML = html
        return this
    }

    /**
     * Get the Html content of the panel component
     * 
     * @returns {string} The html content
     */
    getInnerHtml() {
        return this.panelBody.innerHTML
    }

    /**
     * Close the panel using one of 2 possible behaviors:
     * - hide: just hide the panel, without removing it from the DOM
     * - remove: (default) remove the panel from the DOM + all its children + all listeners + all subscriptions
     * 
     * The close method also checks if an event "close|onclose|onClose" has been defined:
     * - if it has been defined, the method is executed
     * - if it returns false, the closing is interrupted
     * 
     * @param {string} [closeMethod] - "hide" or "remove"
     * @param {boolean} [forceClose] - true to force closing, even if the close event returns false
     * @returns {boolean} false if the panel couldn't be closed
     */
    close(closeMethod, forceClose = false) {
        // Trigger onclose event if required
        const closeEvent = (this.config?.events?.onclose) || (this.config?.events?.onClose) || (this.config?.events?.close)
        if (closeEvent) {
            const doClose = closeEvent(forceClose)

            // If the closeEvent returns false, we prevent from closing
            if (doClose === false) return false
        }

        let method = closeMethod || this.closeMethod
        if (method == "hide") {
            this.hide()
            if (this.mask) this.mask.hide()
        } else {
            kiss.views.remove(this.id)
            if (this.mask) kiss.views.remove("panel-mask-" + this.id)
        }
        return true
    }

    /**
     * Set the new panel width
     * 
     * The width can be:
     * - a number, which will be converted in pixels
     * - a valid CSS value: 50px, 10vw
     * - a function that returns a number or a valid CSS value
     * 
     * @param {number|string|function} width 
     * @returns this
     * 
     * @example
     * myPanel.setWidth(500)
     * myPanel.setWidth("500px")
     * myPanel.setWidth("40%")
     * myPanel.setWidth(() => kiss.screen.current.width / 2) // Half the current screen size
     */
    setWidth(width) {
        this.config.width = width
        this.updateLayout()
        return this
    }

    /**
     * Set the new panel height
     * 
     * The height can be:
     * - a number, which will be converted in pixels
     * - a valid CSS value: 50px, 10vw
     * - a function that returns a number or a valid CSS value
     * 
     * @param {number|string|function} height 
     * @returns this
     * 
     * @example
     * myPanel.setHeight(500)
     * myPanel.setHeight("500px")
     * myPanel.setHeight("40%")
     * myPanel.setHeight(() => kiss.screen.current.height / 2) // Half the current screen size
     */    
    setHeight(height) {
        this.config.height = height
        this.updateLayout()
        return this
    }

    /**
     * Collapse the panel
     * 
     * @returns this
     */
    collapse() {
        if (this.expanded) {
            let panelBorderWidth = Number(getComputedStyle(this, "")["border-width"].replace("px", ""))
            this.style.height = (this.panelHeader.offsetHeight + 2 * panelBorderWidth).toString() + "px"
            this.panelBody.style.height = "0px"
            this.panelBody.style.padding = "0px"
            this.panelButtonExpandCollapse.classList.remove("fa-chevron-down")
            this.panelButtonExpandCollapse.classList.add("fa-chevron-right")
            this.expanded = false
        }
        return this
    }

    /**
     * Expand the panel
     * 
     * @returns this
     */
    expand() {
        if (!this.expanded) {
            if (this.config.height) {
                this._setHeight()
            } else {
                this.style.height = ""
                this.panelBody.style.height = ""
                this.panelBody.style.padding = ""
            }

            this.panelButtonExpandCollapse.classList.remove("fa-chevron-right")
            this.panelButtonExpandCollapse.classList.add("fa-chevron-down")
            this.expanded = true
        }
        return this
    }

    /**
     * Expand / Collapse the panel alternatively
     * 
     * @returns this
     */
    expandCollapse() {
        if (!this.isCollapsible) return

        if (this.expanded) {
            this.collapse()
        } else {
            this.expand()
        }
        return this
    }

    /**
     * Enable / Disable the collapsible property
     * 
     * @param {boolean} status
     * @returns this
     */
    setCollapsible(status) {
        this.isCollapsible = status
        return this
    }

    /**
     * Set the panel to the max size
     * 
     * @param {boolean} [delta] - Optional values, in pixels, to make the panel a bit smaller than fullscreen
     * @param {boolean} [state] - true to force fullscreen mode / false to exit fullscreen mode / leave undefined to alternate
     * @returns this
     */
    maximize(delta = 0, state) {
        // Exit for non changing states
        if (this.isFullscreen && state == true) return
        if (!this.isFullscreen && state === false) return

        if (this.isFullscreen != true || state == true) {
            // Set full screen
            // Keep actual values so we can restore them when fullscreen is unset
            this.isFullscreen = true
            this.fullscreenDelta = delta

            this.currentWidth = this.config.width || this.clientWidth
            this.currentHeight = this.config.height || this.clientHeight
            this.currentTop = this.config.top
            this.currentLeft = this.config.left

            // Update config values
            this.config.width = () => kiss.screen.current.width - delta
            this.config.height = () => kiss.screen.current.height - delta
            this.config.top = delta / 2
            this.config.left = delta / 2
        }
        else if (this.isFullscreen == true || state === false) {
            // Unset full screen
            this.isFullscreen = false
            this.config.width = this.currentWidth
            this.config.height = this.currentHeight
            this.config.top = this.currentTop
            this.config.left = this.currentLeft
        }

        this.updateLayout()
        return this
    }

    /**
     * Set the panel to its original size, if it was maximized
     * 
     * @returns this
     */
    minimize() {
        this.maximize(this.fullscreenDelta, false)
        return this
    }

    /**
     * Show the panel's header
     * 
     * @returns this
     */
    showHeader() {
        this.panelHeader.show()
        return this
    }

    /**
     * Hide the panel's header
     * 
     * @returns this
     */
    hideHeader() {
        this.panelHeader.hide()
        return this
    }

    /**
     * Enable a draggable behavior on the Panel
     * 
     * @private
     * @ignore
     */
    _enableDrag() {
        let _this = this
        let deltaX = 0
        let deltaY = 0
        let posX = 0
        let posY = 0

        // Enable the element's header
        let header = _this.querySelector(".panel-header")
        if (header.style.display != "none") {
            header.onmousedown = dragStart
        } else {
            _this.onmousedown = dragStart
        }

        // Enable dragging
        function dragStart(e) {
            e = e || window.event
            e.stop()

            posX = e.clientX
            posY = e.clientY
            document.onmouseup = dragStop
            document.onmousemove = dragMove
        }

        // Move
        function dragMove(e) {
            e = e || window.event

            // Prevent drag behavior when the cursor is inside a field, to allow text selection
            if (e.target.nodeName == "INPUT") {
                dragStop(e)
                return e
            }
            e.stop()

            deltaX = posX - e.clientX
            deltaY = posY - e.clientY
            posX = e.clientX
            posY = e.clientY

            _this.style.opacity = "0.8"
            _this.style.top = (_this.offsetTop - deltaY) + "px"
            _this.style.left = (_this.offsetLeft - deltaX) + "px"
        }

        // Disable dragging
        function dragStop(e) {
            e = e || window.event
            e.stop()

            _this.style.opacity = "1"
            document.onmouseup = null
            document.onmousemove = null
        }
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-panel", kiss.ui.Panel)

/**
 * Shorthand to create a new Panel. See [kiss.ui.Panel](kiss.ui.Panel.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createPanel = (config) => document.createElement("a-panel").init(config)

;