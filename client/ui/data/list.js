/** 
 * 
 * The **List** derives from [DataComponent](kiss.ui.DataComponent.html).
 * 
 * ------------- WORK IN PROGRESS ------------
 * 
 * @ignore
 * 
 * @param {object} config
 * @param {boolean} [config.startOnMonday]
 * @param {boolean} [config.showWeekend]
 * @param {string} [config.date]
 * @param {string} config.dateField
 * @param {string} [config.timeField]
 * @param {Collection} config.collection - The data source collection
 * @param {object} [config.record] - Record to persist the view configuration into the db
 * @param {object[]} [config.columns] - Where each column is: {title: "abc", type: "text|number|integer|float|date|button", id: "fieldId", button: {config}, renderer: function() {}}
 * @param {string} [config.color] - Hexa color code. Ex: #00aaee
 * @param {boolean} [config.showToolbar] - false to hide the toolbar (default = true)
 * @param {boolean} [config.showActions] - false to hide the custom actions menu (default = true)
 * @param {boolean} [config.canFilter] - false to hide the filter button (default = true)
 * @param {boolean} [config.canEdit] - Can we edit the cells?
 * @param {boolean} [config.canCreateRecord] - Can we create new records from the list?
 * @param {object[]} [config.actions] - Array of menu actions, where each menu entry is: {text: "abc", icon: "fas fa-check", action: function() {}}
 * @param {object[]} [config.buttons] - Array of custom buttons, where each button is: {position: 3, text: "button 3", icon: "fas fa-check", action: function() {}}
 * @param {number|string} [config.width]
 * @param {number|string} [config.height]
 * @returns this
 * 
 * ## Generated markup
 * ```
 * <a-list class="a-list">
 *      <div class="list-toolbar">
 *          <!-- List toolbar items -->
 *      </div>
 *      <div class="list-body">
 *          <!-- List entries here -->
 *      </div>
 * </a-list>
 * ```
 */
kiss.ui.List = class List extends kiss.ui.DataComponent {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myList = document.createElement("a-list").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myList = createList({
     *   id: "my-list",
     *   color: "#00aaee",
     *   collection: kiss.app.collections["meetings"],
     *   
     *   // We can add custom methods, and also override default ones
     *   methods: {
     * 
     *      // Override the createRecord method
     *      createRecord(model) {
     *          // Create a record from this model
     *          console.log(model)
     *      },
     * 
     *      // Override the selectRecord method
     *      selectRecord(record) {
     *          // Show the clicked record
     *          console.log(record)
     *      },
     * 
     *      sayHello: () => console.log("Hello"),
     *   }
     * })
     * 
     * myList.render()
     * ```
     */
    constructor() {
        super()
    }

    /**
     * Generates a List from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config) {
        // This component must be resized with its parent container
        config.autoSize = true

        // Init the parent DataComponent
        super.init(config)

        // If a record is binded to persist the view configuration,
        // we take the view parameters from this record
        if (this.record) {
            this.id = this.record.id
            this.name = this.record.name
            this._initColumns(this.record.config.columns)
        } else {
            this.id = config.id || kiss.tools.shortUid()
            this.name = config.name
            this._initColumns(config.columns)
        }

        // Display options
        this.showToolbar = (config.showToolbar !== false)
        this.showActions = (config.showActions !== false)
        this.canSearch = (config.canSearch !== false)
        this.canFilter = (config.canFilter !== false)
        this.color = config.color || "#00aaee"

        // Behaviour options
        this.canCreateRecord = !!config.canCreateRecord
        this.actions = config.actions || []
        this.buttons = config.buttons || []

        // Build list skeletton markup
        let id = this.id
        this.innerHTML =
            /*html*/
            `<div id="list-toolbar:${id}" class="list-toolbar">
                <div id="create:${id}"></div>
                <div id="actions:${id}"></div>
                <div id="setup:${id}"></div>
                <div id="select:${id}"></div>
                <div id="filter:${id}"></div>
                <div class="spacer"></div>
                <div id="title:${id}" class="list-title"></div>
                <div class="spacer"></div>
                <div id="pager-index:${id}" class="list-toolbar-pager-index"></div>
                <div id="pager-mode:${id}"></div>
                <div id="pager-previous:${id}"></div>
                <div id="pager-next:${id}"></div>
                <div id="layout:${id}"></div>
                <div id="refresh:${id}"></div>
            </div>
            <div id="list-body:${id}" class="list-body">`.removeExtraSpaces()

        // Set list components
        this.list = this.querySelector(".list")
        this.listToolbar = this.querySelector(".list-toolbar")
        this.listBody = this.querySelector(".list-body")

        // Set toolbar visibility
        if (this.showToolbar == false) this.listToolbar.style.display = "none"

        this._initEvents()
        this._initSubscriptions()

        return this
    }

    /**
     * Initialize subscriptions to PubSub
     * 
     * TODO: don't reload the view when records are inserted/deleted/updated outside of the current viewport
     * 
     * @private
     * @ignore
     */
    _initSubscriptions() {
        super._initSubscriptions()

        const viewModelId = this.modelId.toUpperCase()

        this.subscriptions = this.subscriptions.concat([
            // React to database mutations
            subscribe("EVT_DB_INSERT:" + viewModelId, (msgData) => this._reloadWhenNeeded(msgData)),
            subscribe("EVT_DB_UPDATE:" + viewModelId, (msgData) => this._updateOneAndReload(msgData)),
            subscribe("EVT_DB_DELETE:" + viewModelId, (msgData) => this._reloadWhenNeeded(msgData)),
            subscribe("EVT_DB_INSERT_MANY:" + viewModelId, (msgData) => this._reloadWhenNeeded(msgData, 2000)),
            subscribe("EVT_DB_UPDATE_MANY:" + viewModelId, (msgData) => this._reloadWhenNeeded(msgData, 2000)),
            subscribe("EVT_DB_DELETE_MANY:" + viewModelId, (msgData) => this._reloadWhenNeeded(msgData, 2000)),
            subscribe("EVT_DB_UPDATE_BULK", (msgData) => this._reloadWhenNeeded(msgData, 2000))
        ])
    }

    /**
     * Initialize all list events
     * 
     * @private
     * @ignore
     */
    _initEvents() {
        this.onclick = async (event) => {
            const clickedElement = event.target
            const recordElement = clickedElement.closest(".list-record")
            if (!recordElement) return

            if (recordElement.classList.contains("list-record")) {
                const recordId = recordElement.getAttribute("recordid")
                const record = await this.collection.getRecord(recordId)
                await this.selectRecord(record)
                return event
            }
        }
    }

    /**
     * Load data into the list.
     * 
     * @private
     * @ignore
     */
    async load() {
        try {
            log(`kiss.ui - List ${this.id} - Loading collection <${this.collection.id} (changed: ${this.collection.hasChanged})>`)

            this.collection.filter = this.filter
            this.collection.filterSyntax = this.filterSyntax
            await this.collection.find({}, true)

            this._renderToolbar()
            this._renderBody()

        } catch (err) {
            log(err)
            log(`kiss.ui - List ${this.id} - Couldn't load data properly`)
        }
    }

    /**
     * Reload the data and re-render
     */
    async reload() {
        await this.load()
        this._initColumns()
        this._render()
    }

    /**
     * Update the list layout
     */
    updateLayout() {
        if (this.isConnected) {
            this._render()
        }
    }

    /**
     * Update the list color (toolbar buttons + modal windows)
     * 
     * @param {string} newColor
     */
    async setColor(newColor) {
        this.color = newColor
        Array.from(this.listToolbar.children).forEach(item => {
            if (item && item.firstChild && item.firstChild.type == "button") item.firstChild.setIconColor(newColor)
        })
        this._render()
    }

    /**
     * Render the list for 2, 3 or 6 weeks
     * 
     * @private
     * @ignore
     * @param {number} numberOfWeeks - 1 to 6 (month)
     * @param {boolean} expanded - If true, display large items in the list
     * @returns this
     */
    _render() {
        this._renderBody()
    }

    /**
     * Render records inside the list
     * 
     * @private
     * @ignore
     * @param {boolean} expanded - If true, display large items in the list
     */
    _renderBody() {
        let html
        this.collection.records.forEach(record => {
            html += `<div class="list-record" recordid="${record.id}">${record.id}</div>`
        })
        this.listBody.innerHTML = html
    }

    /**
     * Render a single value inside a card
     * 
     * @private
     * @ignore
     * @param {object} field - Field to render
     * @param {*} value - Field value
     * @param {object} value - The record, useful for custom renderers
     * @returns {string} Html for the value
     */    
    _renderSingleValue(field, value, record) {
        
        // Convert summary & lookup fields to mimic the type of their source field
        let type = field.type
        if (type == "lookup") {
            type = field.lookup.type
        } else if (type == "summary") {
            if (field.summary.type == "directory" && field.summary.operation == "LIST_NAMES") type = "directory"
        }

        if (field.valueRenderer) return field.valueRenderer(value, record)

        switch(type) {
            case "date":
                return new Date(value).toLocaleDateString()
            case "directory":
                return this._rendererForDirectoryFields(value)
            case "select":
                return this._rendererForSelectFields(field, value)
            case "checkbox":
                return this._rendererForCheckboxFields(field, value)
            case "rating":
                return this._rendererForRatingFields(field, value)
            case "attachment":
                return "..."
            case "password":
                return "***"
            default:
                return value
        }
    }

    /**
     * Renderer for "Checkbox" fields
     * 
     * @private
     * @ignore
     * @param {object} field
     * @param {string|string[]} values - Select field values.
     * @returns {string} Html for the value
     */
    _rendererForCheckboxFields(field, value) {
        const shape  = field.shape || "square"
        const iconColorOn = field.iconColorOn || "#000000"

        try {
            if (field.type == "lookup") {
                const linkId = field.lookup.linkId
                const linkField = this.model.getField(linkId)
                const foreignModelId = linkField.link.modelId
                const foreignModel = kiss.app.models[foreignModelId]
                const sourceField = foreignModel.getField(field.lookup.fieldId)
                shape = sourceField.shape
                iconColorOn = sourceField.iconColorOn
            }
        }
        catch(err) {
            log("kiss.ui - List - Couldn't generate renderer for checkboxes", 4)
            return value
        }

        const iconClasses = kiss.ui.Checkbox.prototype.getIconClasses()
        const defaultIconOn = iconClasses[shape]["on"]
        const defaultIconOff = iconClasses[shape]["off"]
        return `<span ${(value === true) ? `style="color: ${iconColorOn}"` : ""} class=\"${(value === true) ? defaultIconOn + " datatable-type-checkbox-checked" : defaultIconOff + " datatable-type-checkbox-unchecked"}\"></span>`
    }

    /**
     * Renderer for "Rating" fields
     * 
     * @private
     * @ignore
     * @param {object} field
     * @param {string|string[]} values - Select field values.
     * @returns {string} Html for the value
     */
    _rendererForRatingFields(field, value) {
        const iconColorOn  = field.iconColorOn || "#ffd139"
        const iconColorOff  = field.iconColorOff || "#dddddd"
        const shape  = field.shape || "star"
        const iconClasses = kiss.ui.Rating.prototype.getIconClasses()
        const icon = iconClasses[shape]
        const max = field.max || 5

        let html = ""
        for (let i = 0; i < max; i++) {
            const color = (i < value) ? iconColorOn : iconColorOff
            html += /*html*/`<span class="rating ${icon}" style="color: ${color}" index=${i}></span>`
        }
        return html
    }    

    /**
     * Renderer for "Select" fields
     * 
     * @private
     * @ignore
     * @param {object} field
     * @param {string|string[]} values - Select field values.
     * @returns {string} Html for the value
     */
    _rendererForSelectFields(field, values) {
        const options = (typeof field.options == "function") ? field.options() : field.options

        // If no options, returns default layout
        if (!options) {
            return [].concat(values).map(value => {
                if (!value) return ""
                return `<span class="field-select-value">${value}</span>`
            }).join("")
        }        
        
        // If options, returns values with the right option colors
        return [].concat(values).map(value => {
            if (!value) return ""

            let option = options.find(option => option.value === value)

            if (!option) option = {
                value
            }

            if (!option.value || option.value == " ") return ""

            return `<span class="field-select-value" ${(option.color) ? `style="color: #ffffff; background-color: ${option.color}"` : ""}>${option.value}</span>`
        }).join("")
    }    

    /**
     * Render for "Directory" fields
     * 
     * @private
     * @ignore
     * @param {boolean} values
     */
    _rendererForDirectoryFields(values) {
        let listOfNames = "-"
        if (values) {
            listOfNames = [].concat(values).map(value => {
                if (!value) return ""

                let name
                switch (value) {
                    case "*":
                        name = kiss.directory.roles.everyone.label
                        break
                    case "$authenticated":
                        name = kiss.directory.roles.authenticated.label
                        break
                    case "$creator":
                        name = kiss.directory.roles.creator.label
                        break
                    case "$nobody":
                        name = kiss.directory.roles.nobody.label
                        break
                    default:
                        name = kiss.directory.getEntryName(value)
                }

                return (name) ? name : ""
            }).join(", ")
        }

        return listOfNames
    }    

    /**
     * Update a single record then reload the view if required.
     * 
     * @private
     * @ignore
     * @param {object} msgData - The original pubsub message
     */
    async _updateOneAndReload(msgData) {
        const filterFields = kiss.db.mongo.getFilterFields(this.filter)
        let filterHasChanged = false

        let updates = msgData.data
        for (let fieldId of Object.keys(updates)) {
            if (filterFields.indexOf(fieldId) != -1) filterHasChanged = true
        }

        this._updateRecord(msgData.id)

        if (filterHasChanged) {
            this._reloadWhenNeeded(msgData, 2000)
        }
    }

    /**
     * Update a single record of the list.
     * 
     * Does nothing if the record is not displayed on the active page.
     * 
     * @private
     * @ignore
     * @param {string} recordId 
     */
    _updateRecord(recordId) {
        const record = this.collection.getRecord(recordId)
        const recordNode = document.querySelector(`.list-record[recordid="${recordId}"]`)

        if (recordNode) {
            const replacementNode = document.createElement("div")
            replacementNode.classList.add("list-record")
            replacementNode.style.borderColor = this.model.color
            replacementNode.innerHTML = "TEST" //this._renderRecordAsCard(record)
            recordNode.parentNode.replaceChild(replacementNode, recordNode)
            replacementNode.setAttribute("recordid", recordId)
        }
    }

    /**
     * Render the toolbar
     * 
     * @private
     * @ignore
     */
    _renderToolbar() {
        if (this.isToolbarRendered) return
        this.isToolbarRendered = true

        // New record creation button
        createButton({
            hidden: !this.canCreateRecord,
            class: "list-create-record",
            target: "create:" + this.id,
            text: this.model.name.toTitleCase(),
            icon: "fas fa-plus",
            iconColor: this.color,
            borderWidth: "3px",
            borderRadius: "32px",
            action: async () => this.createRecord(this.model)
        }).render()

        // Column selection button
        createButton({
            target: "select:" + this.id,
            tip: txtTitleCase("#display fields"),
            icon: "fas fa-bars fa-rotate-90",
            iconColor: this.color,
            width: 32,
            action: () => this.showFieldsWindow()
        }).render()

        // Filtering button
        createButton({
            hidden: !this.canFilter,
            target: "filter:" + this.id,
            tip: txtTitleCase("to filter"),
            icon: "fas fa-filter",
            iconColor: this.color,
            width: 32,
            action: () => this.showFilterWindow()
        }).render()

        // Pager previous
        createButton({
            target: "pager-previous:" + this.id,
            icon: "fas fa-chevron-left",
            iconColor: this.color,
            width: 32,
            events: {
                click: () => {
                }
            }
        }).render()

        // Pager next
        createButton({
            target: "pager-next:" + this.id,
            icon: "fas fa-chevron-right",
            iconColor: this.color,
            width: 32,
            events: {
                click: () => {
                }
            }
        }).render()

        // View refresh button
        if (!kiss.screen.isMobile) {
            createButton({
                target: "refresh:" + this.id,
                icon: "fas fa-undo-alt",
                iconColor: this.color,
                width: 32,
                events: {
                    click: () => this.reload()
                }
            }).render()
        }
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-list", kiss.ui.List)

/**
 * Shorthand to create a new List. See [kiss.ui.List](kiss.ui.List.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createList = (config) => document.createElement("a-list").init(config)

;