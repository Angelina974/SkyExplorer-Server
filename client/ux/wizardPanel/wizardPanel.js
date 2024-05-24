/**
 * 
 * The Wizard Panel derives from [Panel](kiss.ui.Panel.html).
 * 
 * It's a panel where items are displayed one at a time (each wizard page) with helper buttons (next, previous) to navigate through the pages.
 * 
 * @param {object} config
 * @param {object} config.action - Action triggered when the last page of the wizard is validated
 * @param {object} [config.actionText] - Text of the action button of the last page, like "Done", "Proceed", "Let's go". Default = "OK"
 * @param {boolean} [config.pageValidation] - If true, validate each page when navigating next/previous. Default = false
 * @returns this
 * 
 * ## Generated markup
 * ```
 * <a-wizardpanel class="a-panel">
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
 * </a-wizardpanel>
 * ```
 * 
 */
kiss.ux.WizardPanel = class WizardPanel extends kiss.ui.Panel {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myWizardPanel = document.createElement("a-wizardpanel").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myWizardPanel = createWizardPanel({
     * 
     *   // Can have the same config properties as a panel
     *   title: "Setup"
     *   icon: "fas fa-wrench",
     *   headerBackgroundColor: "#00aaee",
     *   closable: true,
     *   draggable: true,
     *   modal: true,
     *   display: "flex"
     *   flexFlow: "column",
     *   padding: "10px",
     * 
     *   // Wizard pages
     *   items: [
     *      wizardPage1,
     *      wizardPage2,
     *      wizardPage3
     *   ],
     *   actionText: "Proceed",
     *   action: () => {
     *      // Perform action
     *   }
     * })
     * 
     * myWizardPanel.render()
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myBlock = createBlock({
     *   items: [
     *       {
     *           type: "wizardpanel",
     *           title: "Foo",
     *           items: [
     *               wizardPage1,
     *               wizardPage2,
     *               wizardPage3
     *           ],
     *           actionText: "Proceed",
     *           action: () => {
     *              // Perform action
     *           }
     *       }
     *   ]
     * })
     * myBlock.render()
     * ```
     */
    constructor() {
        super()
    }

    /**
     * Generates a Wizard Panel from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config) {
        config.id = config.id || "cmp-" + (kiss.global.componentCount++).toString()
        this.id = config.id
        this.currentPage = 0
        this.numberOfPages = config.items.length
        this.pageValidation = !!config.pageValidation

        this._initButtons(config)
        config.items = this._initStructure(config)
        super.init(config)

        this.classList.add("a-panel")
        return this
    }

    /**
     * Initialize the DOM structure of the wizard panel:
     * - original items are inserted into "pages" block
     * - a button bar is added to the bottom of the panel to navigate between pages
     * 
     * @private
     * @ignore
     * @param {object} config 
     * @returns {object} The final structure
     */
    _initStructure(config) {
        const items = [
            {
                id: this.id + "-pages",
                multiview: true,
                items: config.items
            },
            {
                id: this.id + "-buttons",
                layout: "horizontal",
                defaultConfig: {
                    type: "button",
                    margin: "10px 5px 0px 0px",
                    height: 40,
                    flex: 1
                },
                items: [
                    this.buttonCancel,
                    (this.numberOfPages > 1) ? this.buttonNext : this.buttonOK
                ]
            }
        ]
        return items
    }

    /**
     * Initialize the buttons of the wizard panel:
     * - cancel
     * - previous / next
     * - validate
     * 
     * @private
     * @ignore
     * @param {object} config 
     */
    _initButtons(config) {
        this.buttonCancel = {
            icon: "fas fa-times",
            text: txtTitleCase("cancel"),
            action: function () {
                this.closest("a-wizardpanel").close()
            }
        }

        this.buttonPrevious = {
            icon: "fas fa-chevron-left",
            text: txtTitleCase("previous"),
            action: function () {
                this.closest("a-wizardpanel").previous()
            }
        }

        this.buttonNext = {
            icon: "fas fa-chevron-right",
            iconPosition: "right",
            text: txtTitleCase("next"),
            action: function () {
                this.closest("a-wizardpanel").next()
            }
        }             

        this.buttonOK = {
            icon: "fas fa-check",
            text: config.actionText || "OK",
            action: () => {
                if (this.pageValidation && !this.validatePage()) return
                config.action()
            }
        }     
    }

    /**
     * Update the buttons when navigating between pages
     * 
     * @private
     * @ignore
     */
    _updateButtons() {
        let buttons
        if (this.currentPage == 0) {
            buttons = [this.buttonCancel, (this.numberOfPages > 1) ? this.buttonNext : this.buttonOK]
        }
        else if (this.currentPage == this.numberOfPages - 1) {
            buttons = [this.buttonPrevious, this.buttonOK]
        }
        else {
            buttons = [this.buttonPrevious, this.buttonNext]
        }
        $(this.id + "-buttons").setItems(buttons)
    }

    /**
     * Validates the form of a wizard page.
     * Prevents from navigating to the next page if the form is not validated.
     * 
     * @param {number} [pageIndex] - Optional wizard's page to validate. If not specified, tries to validate the current page.
     */
    validatePage(pageIndex) {
        this.pages = $(this.id + "-pages").children
        if (!this.pages) return true
        const currentPage = this.pages[pageIndex || this.currentPage]
        return (currentPage.validate) ? currentPage.validate() : true
    }

    /**
     * Navigate to the next wizard page
     */
    next() {
        if (this.pageValidation && !this.validatePage()) return

        this.currentPage++
        this._updateButtons()
        $(this.id + "-pages").showItem(this.currentPage, {
            name: "slideInRight",
            speed: "faster"
        })
    }

    /**
     * Navigate to the previous wizard page
     */
    previous() {
        this.currentPage--
        this._updateButtons()
        $(this.id + "-pages").showItem(this.currentPage, {
            name: "slideInLeft",
            speed: "faster"
        })
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-wizardpanel", kiss.ux.WizardPanel)

/**
 * Shorthand to create a new Wizard Panel. See [kiss.ui.WizardPanel](kiss.ui.WizardPanel.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createWizardPanel = (config) => document.createElement("a-wizardpanel").init(config)

;