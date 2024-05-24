/**
 * 
 * Create a form to display a record
 * 
 * @async
 * @param {object} record - record to display in the form
 */
const createForm = function (record) {
    if (!record) return

    const isStandAlone = (kiss.context.ui == "form-view")
    const model = record.model
    const modelId = model.id
    const isMobile = kiss.screen.isMobile
    const isOwner = kiss.session.isOwner
    const isAccountManager = kiss.session.isAccountManager()

    // Can't open the same record twice
    if (record && $(record.id)) {
        return createNotification(txtTitleCase("#record already opened"))
    }

    // Compute the form position
    function computeFormPosition() {
        if (isMobile) {
            // Mobile is always fullscreen
            return {
                top: 0,
                left: 0,
                width: "100%",
                height: "100%"
            }
        }

        if (model.fullscreen) {
            // Fullscreen
            return {
                top: 10,
                left: 10,
                width: "calc(100% - 20px)",
                height: "calc(100% - 20px)"
            }
        }
        else {
            if (model.align == "right") {
                // Right
                return {
                    top: 0,
                    left: () => kiss.screen.current.width - Math.min(kiss.screen.current.width / 3 * 2, 1200),
                    width: () => Math.min(kiss.screen.current.width / 3 * 2, 1200),
                    height: "100%"
                }
            }
            else {
                // Center: the number of records adjust the form panel position / shift
                const numberOfOpenedRecords = Array.from(document.querySelectorAll(".form-record")).length
                return {
                    top: 10,
                    left: () => (kiss.screen.current.width - Math.min(kiss.screen.current.width / 3 * 2, 1000)) / 2 + numberOfOpenedRecords * 10,
                    width: () => Math.min(kiss.screen.current.width / 3 * 2, 1200),
                    height: "calc(100% - 20px)"
                }
            }
        }
    }
    
    const position = computeFormPosition()

    return createPanel({
        class: "form-record",

        id: record.id,
        title: model.name.toTitleCase(),
        icon: model.icon,
        headerBackgroundColor: model.color,
        layout: "horizontal",
        position: "fixed",
        modal: !isStandAlone,
        closable: true,
        draggable: !isMobile,
        expandable: !isMobile,
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height,
        padding: 0,
        borderRadius: (isMobile) ? "0px 0px 0px 0px" : "var(--panel-border-radius)",

        items: [
            {
                hidden: true,
                class: "form-side-bar",
                layout: "vertical",
            },
            {
                layout: "vertical",
                flex: 1,
                items: [
                    // Mobile exit button
                    {
                        hidden: true,//!isMobile,
                        id: "mobile-form-exit",
                        type: "button",
                        text: "Back",
                        textAlign: "left",
                        color: "#ffffff",
                        backgroundColor: model.color,
                        icon: "fas fa-chevron-left",
                        iconColor: "#ffffff",
                        height: 50,
                        borderRadius: 0,
                        action: () => $(record.id).close()
                    },
                    // Tab bar
                    {
                        class: "form-tabs",
                        display: "inline",
                        defaultConfig: {
                            class: "form-tab",
                        }
                    },
                    // Multiview container for form content + form features
                    {
                        class: "form-panels",
                        multiview: true,
                        layout: "vertical",
                        overflow: "hidden",
                        flex: 1
                    }                    
                ]
            }
        ],

        events: {
            close: function (forceClose) {
                // Closing the form while in stand-alone mode get us back to the home
                if (isStandAlone) {
                    kiss.router.navigateTo({
                        ui: "home-start"
                    }, true)
                }

                // Don't try to validate data when we force to close
                if (forceClose) return true

                // Prevent from closing if there are invalid values
                const isValid = $(record.id).validateContent()
                if (!isValid) return false
                return true
            }
        },

        subscriptions: {
            // Reload the form if its model is updated
            "EVT_DB_UPDATE:MODEL": async function (msgData) {
                if (msgData.id == modelId) await this.load()
            },

            // Update the form's record
            ["EVT_DB_UPDATE:" + model.id.toUpperCase()]: async function (msgData) {
                if (msgData.id == record.id) {
                    Object.assign(this.record, msgData.data)
                    this.applyHideFormulae()
                }
            }
        },

        methods: {
            /**
             * Load form:
             * - bind the form to the record
             * - insert default form with fields
             * - add form features according to active plugins
             * - add one tab + one panel per feature
             * - add form headers
             * - add form footers
             */
            async load() {
                let formFeatures = []
                let formHeaderFeatures = []
                let formFooterFeatures = []

                // Bind the record to the form
                this.record = record
                this.activeFeatureIndex = -1 // Form

                // Check if the user can update the model
                this.canEditModel = await this.checkIfUserCanEditModel()

                // Insert default form with fields
                let formPanelFeatures = [createFormContent({
                    record: this.record,
                    editMode: !this.record.isLocked // Can edit if the record is locked
                })]

                if (kiss.app.collections.model) {
                    let modelRecord = kiss.app.collections.model.getRecord(modelId)
                    
                    if (modelRecord) {
                        let modelFeatures = modelRecord.features || {}

                        // Add form features according to active plugins
                        this.getActivePlugins(modelFeatures)
                            .forEach(plugin => {

                                // Check if the plugin should be loaded for non-admin users
                                if (plugin.admin == true && !isOwner && !isAccountManager) return

                                // Check if the plugin is disabled
                                if (plugin.disabled == true) return

                                plugin.features
                                    .forEach(feature => {
                                        
                                        // Render the plugin view
                                        let featureId = kiss.tools.shortUid()
                                        let newFeatureView = feature.renderer(this)
                                        newFeatureView.classList.add(featureId)
                                        newFeatureView.setAttribute("featureId", featureId)

                                        // Plugins to load as separate sections / tabs
                                        if (feature.type == "form-section") {
                                            formPanelFeatures = formPanelFeatures.concat(newFeatureView)

                                            formFeatures.push({
                                                id: featureId,
                                                pluginId: plugin.id,
                                                icon: plugin.icon,
                                                name: plugin.name
                                            })
                                        }

                                        // Plugins to load in the form header
                                        if (feature.type == "form-header") {
                                            formHeaderFeatures = formHeaderFeatures.concat(newFeatureView)
                                        }

                                        // Plugins to load in the form footer
                                        if (feature.type == "form-footer") {
                                            formFooterFeatures = formFooterFeatures.concat(newFeatureView)
                                        }
                                    })
                            })

                        // Add one tab per feature
                        let tabs = createFormTabBar(this, formFeatures)
                        let formTabs = this.getFormTabs()
                        formTabs.setItems(tabs)

                        // Adjust the tabs underline effect color
                        const tabElements = formTabs.querySelectorAll(".underline-effect")
                        tabElements.forEach(tab => tab.style.setProperty("--button-underline-effect", modelRecord.color))

                        // Adjust form panel header
                        this.setTitle(modelRecord.name)
                        this.setIcon(modelRecord.icon)
                        this.setHeaderBackgroundColor(modelRecord.color)
                    }
                }

                // Add one panel per feature
                let formPanels = this.getFormPanels()
                formPanels.setItems(formPanelFeatures)

                // Add form headers
                let formHeader = this.getFormHeader()
                formHeader.setItems(formHeaderFeatures)

                // Add form footers
                let formFooter = this.getFormFooter()
                formFooter.setItems(formFooterFeatures)

                // Build left navigation
                let sideMenus = createFormSideBar(this, formFeatures, formHeaderFeatures, formFooterFeatures)
                let formSideBar = this.getFormSideBar()
                formSideBar.setItems(sideMenus)

                // Highlight required fields
                this.applyFieldSymbols()

                // Apply hide formulae
                this.applyHideFormulae()

                // Restore navigation mode
                this.restoreNavigation()
            },

            /**
             * Switch to fullscreen mode if required
             */
            // _afterRender() {
            //     if (model.fullscreen == true && !isMobile) this.maximize(20)
            // },

            /**
             * Check if the active user can update the Model's fields
             */
            async checkIfUserCanEditModel() {
                if (!kiss.app.collections.model) return false

                const modelRecord = kiss.app.collections.model.records.get(model.id)
                if (!modelRecord) return false

                return await kiss.acl.check({
                    action: "update",
                    record: modelRecord
                })
            },

            /**
             * Get the model's active features
             */
            getActivePlugins(modelFeatures) {
                return kiss.plugins.get()
                    .filter(plugin => {
                        if (!modelFeatures[plugin.id]) return false
                        if (modelFeatures[plugin.id].active == false) return false
                        return true
                    })
            },

            /**
             * Show a feature / displays its panel
             */
            showFeature(featureId) {
                const modelRecord = kiss.app.collections.model.getRecord(modelId)
                const modelFeatures = modelRecord.features || {}
                const activeFeatures = this.getActivePlugins(modelFeatures)
                const featureIndex = activeFeatures.findIndex(feature => feature.id == featureId) + 1

                const animationName = (featureIndex > this.activeFeatureIndex) ? "slideInRight" : "slideInLeft"
                this.activeFeatureIndex = featureIndex

                const animation = {
                    name: animationName,
                    speed: "faster"
                }

                const formFeaturesContainer = this.getFormPanels()
                formFeaturesContainer.showItemByClass(featureId, animation)

                // Adjust the active tab border color
                if (this.getNavigationMode() == "tabs") {
                    const formTabs = $(record.id).querySelector(".form-tabs")
                    const tabs = formTabs.items
    
                    for (let i = 0; i < tabs.length; i++) tabs[i].setBorderColor("var(--button-border)")
                    tabs[featureIndex + 2].setBorderColor(model.color)
                }
            },

            /**
             * Show all sections of the form
             * 
             * @param {string} sectionTitle 
             */
             showAllSections() {
                const content = this.getFormContent()
                const formSections = content.querySelectorAll(".a-panel")
                Array.from(formSections).forEach(panelElement => $(panelElement.id).show())
            },

            /**
             * Show a single section of the form
             * 
             * @param {string} sectionTitle 
             */
            showSection(sectionTitle) {
                this.showFeature("form-content")

                const content = this.getFormContent()
                const formSections = content.querySelectorAll(".a-panel")
                
                Array.from(formSections).forEach(panelElement => {
                    const panel = $(panelElement.id)
                    if (panel.config.title == sectionTitle) {
                        panel.show()
                        panel.expand()
                    }
                    else panel.hide()
                })
            },

            /**
             * Helpers to access form parts
             */
            getFormContent() {
                return this.querySelector(".form-content")
            },

            getFormSections() {
                let sections = []
                const formContent = this.querySelector(".form-fields")
                const formItems = Array.from(formContent.children)
                formItems.forEach(item => {
                    if (item.items) sections.push(item)
                })
                return sections
            },

            getFormTabs() {
                return this.querySelector(".form-tabs")
            },

            getFormSideBar() {
                return this.querySelector(".form-side-bar")
            },

            getFormHeader() {
                return this.querySelector(".form-header")
            },

            getFormFooter() {
                return this.querySelector(".form-footer")
            },

            getFormPanels() {
                return this.querySelector(".form-panels")
            },

            getFormFields() {
                return this.querySelector(".form-fields")
            },

            getNavigationMode() {
                return localStorage.getItem("config-formNavigationMode-" + model.id)
            },

            /**
             * Show / hide tab bar and side bar
             */
            showTabBar() {
                const tabs = this.getFormTabs()
                tabs.setAnimation({
                    name: "slideInLeft",
                    speed: "faster"
                }).show()
            },

            hideTabBar() {
                const tabs = this.getFormTabs()
                tabs.hide()
            },

            showSideBar() {
                const sideBar = this.getFormSideBar()
                sideBar.show()
            },

            hideSideBar() {
                const sideBar = this.getFormSideBar()
                sideBar.hide()
            },            

            switchNavigation(mode) {
                localStorage.setItem("config-formNavigationMode-" + model.id, mode)
                if (mode == "left") {
                    this.hideTabBar()
                    this.showSideBar()
                }
                else {
                    this.hideSideBar()
                    this.showTabBar()
                    this.showAllSections()
                }
            },

            hideNavigation() {
                this.hideTabBar()
                this.hideSideBar()
            },

            restoreNavigation() {
                const navigationMode = localStorage.getItem("config-formNavigationMode-" + model.id)
                if (navigationMode == "left") {
                    this.hideTabBar()
                    this.showSideBar()
                }
                else {
                    this.hideSideBar()
                    this.showTabBar()
                }
            },

            validateContent() {
                const formContent = this.getFormContent()
                const isValid = formContent.validate()
                if (!isValid) return false
                return true
            },

            applyHideFormulae() {
                const isDesigner = (kiss.router.getRoute().ui == "form-designer")
                if (isDesigner) return

                this.applyHideFormulaeToSections()
                this.applyHideFormulaeToFields()
            },

            applyHideFormulaeToSections() {
                const sections = this.getFormSections()
                sections.forEach(section => {
                    const sectionElement = this.querySelector("#" + section.id.replaceAll(":", "\\:"))
                    if (!sectionElement) return

                    const hideWhen = sectionElement.config.hideWhen
                    if (!hideWhen) return

                    const hideFormula = section.config.hideFormula
                    if (!hideFormula) return

                    try {
                        kiss.context.record = record
                        const result = kiss.formula.execute(hideFormula, record, model.getActiveFields())
                        if (result === true) sectionElement.hide()
                        else sectionElement.show()
                    }
                    catch(err) {
                        log("kiss.ui - Warning: could not hide the section " + section)
                    }                    
                })
            },

            applyHideFormulaeToFields() {
                const formContent = this.getFormContent()
                const fields = formContent.getFields()
                fields.forEach(field => {
                    const fieldElement = this.querySelector("#" + field.id.replaceAll(":", "\\:"))
                    if (!fieldElement) return

                    const hideWhen = fieldElement.config.hideWhen
                    if (!hideWhen) return

                    const hideFormula = fieldElement.config.hideFormula
                    if (!hideFormula) return

                    try {
                        kiss.context.record = record
                        const result = kiss.formula.execute(hideFormula, record, model.getActiveFields())
                        if (result === true) fieldElement.hide()
                        else fieldElement.show()
                    }
                    catch(err) {
                        log("kiss.ui - Warning: could not hide the field " + field)
                    }
                })
            },

            applyFieldSymbols() {
                try {
                    const formContent = this.getFormContent()
                    const fields = formContent.getFields()

                    fields.forEach(field => {
                        const item = $(field.id)
                        const config = (item) ? item.config : null
                        const isLocked = (config && config.locked === true)

                        // Display a lock symbol on read only fields
                        if (isLocked) {
                            const fieldElement = this.querySelector("#" + field.id.replaceAll(":", "\\:"))
                            if (fieldElement) {
                                const fieldLabel = fieldElement.querySelector(".field-label")
                                if (fieldLabel) {
                                    const locker = `<span class="field-label-read-only fas fa-lock"></span> `
                                    fieldLabel.innerHTML = locker + fieldLabel.innerHTML
                                }
                            }                        
                        }
                        else if (field.required && !field.readOnly) {
                            // Display a red star on required fields
                            const fieldElement = this.querySelector("#" + field.id.replaceAll(":", "\\:"))
                            if (fieldElement) {
                                const fieldLabel = fieldElement.querySelector(".field-label")
                                if (fieldLabel) {
                                    const requiredAsterisk = ` <span class="field-label-required"><sup>*</sup></span>`
                                    fieldLabel.innerHTML += requiredAsterisk
                                }
                            }
                        }
                    })
                }
                catch(err) {
                    log("kiss.ui - Warning: could not apply field symbols")
                }
            }            
        }
    }).render()
}

;