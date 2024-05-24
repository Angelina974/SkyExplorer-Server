/** 
 * 
 * The **Kanban** derives from [DataComponent](kiss.ui.DataComponent.html).
 * 
 * @param {object} config
 * @param {Collection} config.collection - The data source collection
 * @param {object} [config.record] - Record to persist the view configuration into the db
 * @param {object[]} [config.columns] - Where each column is: {title: "abc", type: "text|number|integer|float|date|button", id: "fieldId", button: {config}, renderer: function() {}}
 * @param {string} [config.color] - Hexa color code. Ex: #00aaee
 * @param {boolean} [config.showToolbar] - false to hide the toolbar (default = true)
 * @param {boolean} [config.showActions] - false to hide the custom actions menu (default = true)
 * @param {boolean} [config.showLayoutButton] - false to hide the button to adjust the layout (default = true)
 * @param {boolean} [config.canSearch] - false to hide the search button (default = true)
 * @param {boolean} [config.canSort] - false to hide the sort button (default = true)
 * @param {boolean} [config.canFilter] - false to hide the filter button (default = true)
 * @param {boolean} [config.canGroup] - false to hide the group button (default = true)
 * @param {boolean} [config.canSelectFields] - Can we select the fields (= columns) to display in the kanban? (default = true)
 * @param {boolean} [config.canCreateRecord] - Can we create new records from the kanban?
 * @param {object[]} [config.actions] - Array of menu actions, where each menu entry is: {text: "abc", icon: "fas fa-check", action: function() {}}
 * @param {number|string} [config.width]
 * @param {number|string} [config.height]
 * @returns this
 * 
 * ## Generated markup
 * ```
 * <a-kanban class="a-kanban">
 *      <div class="kanban-toolbar">
 *          <!-- Kanban toolbar items -->
 *      </div>
 *      <div class="kanban-header-container">
 *          <div class="kanban-header">
 *              <!-- Header columns -->
 *          </div>
 *      </div>
 *      <div class="kanban-body-container">
 *          <div class="kanban-body">
 *              <!-- Body columns -->
 *          </div>
 *      </div>
 * </a-kanban>
 * ```
 */
kiss.ui.Kanban = class Kanban extends kiss.ui.DataComponent {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myKanban = document.createElement("a-kanban").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myKanban = createKanban({
     *   id: "my-kanban",
     *   color: "#00aaee",
     *   collection: kiss.app.collections["contact"],
     * 
     *   // We can define a menu with custom actions
     *   actions: [
     *       {
     *           text: "Group by status",
     *           icon: "fas fa-sort",
     *           action: () => $("my-kanban").groupBy(["Status"])
     *       }
     *   ],
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
     * myKanban.render()
     * ```
     */
    constructor() {
        super()
    }

    /**
     * Generates a Kanban from a JSON config
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

        // Options
        this.showToolbar = (config.showToolbar !== false)
        this.showActions = (config.showActions !== false)
        this.showLayoutButton = (config.showLayoutButton !== false)
        this.canSearch = (config.canSearch !== false)
        this.canSort = (config.canSort !== false)
        this.canFilter = (config.canFilter !== false)
        this.canGroup = (config.canGroup !== false)
        this.canSelectFields = (config.canSelectFields !== false)
        this.actions = config.actions || []
        this.buttons = config.buttons || []
        this.color = config.color || "#00aaee"
        this.defaultColumnWidth = 280

        // Build kanban skeletton markup
        let id = this.id
        this.innerHTML = /*html*/
            `<div class="kanban">
                <div id="kanban-toolbar:${id}" class="kanban-toolbar">
                    <div id="create:${id}"></div>
                    <div id="actions:${id}"></div>
                    <div id="select:${id}"></div>
                    <div id="sort:${id}"></div>
                    <div id="filter:${id}"></div>
                    <div id="group:${id}"></div>
                    <div id="refresh:${id}"></div>
                    <div id="search-field:${id}"></div>
                    <div id="search:${id}"></div>
                    <div class="spacer"></div>
                    <div id="layout:${id}"></div>
                </div>

                <div class="kanban-header-container">
                    <div id="kanban-header:${id}" class="kanban-header"></div>
                </div>

                <div class="kanban-body-container">
                    <div id="kanban-body:${id}" class="kanban-body"></div>
                </div>
            </div>`.removeExtraSpaces()

        // Set kanban components
        this.kanban = this.querySelector(".kanban")
        this.kanbanToolbar = this.querySelector(".kanban-toolbar")
        this.kanbanHeaderContainer = this.querySelector(".kanban-header-container")
        this.kanbanHeader = this.querySelector(".kanban-header")
        this.kanbanBodyContainer = this.querySelector(".kanban-body-container")
        this.kanbanBody = this.querySelector(".kanban-body")

        this._initColumns(config.columns)
            ._initSize(config)
            ._initElementsVisibility()
            ._initEvents()
            ._initSubscriptions()

        return this
    }

    /**
     * 
     * KANBAN METHODS
     * 
     */

    /**
     * Load data into the kanban.
     * 
     * Remark:
     * - rendering time is proportional to the number of cards and visible fields (cards x fields)
     * - rendering takes an average of 0.03 millisecond per card on an Intel i7-4790K
     * 
     * @ignore
     */
    async load() {
        try {
            log(`kiss.ui - Kanban ${this.id} - Loading collection <${this.collection.id} (changed: ${this.collection.hasChanged})>`)

            // Apply filter, sort, group, projection
            // Priority is given to local config, then to the passed collection, then to default
            this.collection.filter = this.filter
            this.collection.filterSyntax = this.filterSyntax
            this.collection.sort = this.sort
            this.collection.sortSyntax = this.sortSyntax
            this.collection.group = this.group
            this.collection.projection = this.projection
            this.collection.groupUnwind = this.groupUnwind

            // Load records
            await this.collection.find()

            // Render the kanban toolbar
            this._renderToolbar()

        } catch (err) {
            log(err)
            log(`kiss.ui - Kanban ${this.id} - Couldn't load data properly`)
        }
    }

    /**
     * Generic method to refresh / re-render the view
     * 
     * Note: used in dataComponent (parent class) showSearchBar method.
     * This method is invoked to refresh the view after a full-text search has been performed
     */
    refresh() {
        this._render()
    }

    /**
     * Move a card to a new column.
     * This is equivalent to changing the value of a field.
     * 
     * @param {string} recordId 
     * @param {string} fieldId 
     * @param {string} value
     */
    moveCardToColumn(recordId, fieldId, value) {
        const record = this.collection.getRecord(recordId)
        const currentValue = record[fieldId]
        const color = this._getCategoryColor(fieldId, value)

        let message
        if (value !== undefined && value !== "") {
            message = txtTitleCase("#move card") + ` <span class="fas fa-circle kanban-column-header-icon" style="color: ${color}"></span><b>${value}</b> ?`
        } else {
            message = txtTitleCase("#move card") + ` <span class="fas fa-circle kanban-column-header-icon" style="color: #cccccc"></span><b>${txtTitleCase("#no category")}</b> ?`
        }
        createDialog({
            title: currentValue + " → " + value,
            icon: "fas fa-clipboard-check",
            type: "dialog",
            message,
            action: async () => {
                const loadingId = kiss.loadingSpinner.show()
                await this.collection.updateOne(recordId, {
                    [fieldId]: value
                })
                kiss.loadingSpinner.hide(loadingId)
                await this.reload()

                createNotification(txtTitleCase("#card moved") + " " + value)
                // const card = this.querySelector(`.kanban-record[recordid="${recordId}"]`)
                // setTimeout(() => this.jumpToCard(card), 1000)
            }
        })
    }

    /**
     * WORK IN PROGRESS - FOCUSING ON THE DRAGGED CARD
     */
    jumpToCard(card) {
        kiss.global.kanbanScrollStop = true
        const container = card.closest(".kanban-column-container")
        const cardPosition = card.getBoundingClientRect()
        const containerPosition = container.getBoundingClientRect()
        const relativeTop = cardPosition.top - containerPosition.top + container.scrollTop
        container.scrollTop = relativeTop - 20
    }

    scrollToCard(card) {
        kiss.global.kanbanScrollStop = true
        let attempts = 0

        function scroll() {
            card.scrollIntoView({
                block: "end",
                inline: "end",
                // behavior: "auto"
            });

            setTimeout(() => {
                const cardPosition = card.getBoundingClientRect()
                const isCardInView = (
                    cardPosition.top >= 0 &&
                    cardPosition.bottom <= (window.innerHeight || document.documentElement.clientHeight)
                )

                if (!isCardInView && attempts < 5) {
                    attempts++
                    scroll()
                } else kiss.global.kanbanScrollStop = false
            }, 300)
        }
        scroll()
    }

    /**
     * Switch to search mode
     * 
     * Show/hide only the necessary buttons in this mode.
     */
    switchToSearchMode() {
        if (kiss.screen.isMobile) {
            $("create:" + this.id).hide()
            $("search:" + this.id).hide()
        }
    }

    /**
     * Reset search mode
     */
    resetSearchMode() {
        if (kiss.screen.isMobile) {
            $("create:" + this.id).show()
            $("search:" + this.id).show()
        }
    }

    /**
     * Update the kanban color (toolbar buttons + modal windows)
     * 
     * @param {string} newColor
     */
    async setColor(newColor) {
        this.color = newColor
        Array.from(this.kanbanToolbar.children).forEach(item => {
            if (item && item.firstChild && item.firstChild.type == "button") item.firstChild.setIconColor(newColor)
        })
    }

    /**
     * Show the window just under the sorting button
     */
    showSortWindow() {
        let sortButton = $("sort:" + this.id)
        const box = sortButton.getBoundingClientRect()
        super.showSortWindow(box.left, box.top + 40, this.color)
    }

    /**
     * Show the window just under the fields selector button
     */
    showFieldsWindow() {
        let selectionButton = $("select:" + this.id)
        const box = selectionButton.getBoundingClientRect()
        super.showFieldsWindow(box.left, box.top + 40, this.color)
    }

    /**
     * Show the window just under the filter button
     */
    showFilterWindow() {
        let filterButton = $("filter:" + this.id)
        const box = filterButton.getBoundingClientRect()
        super.showFilterWindow(null, null, this.color)
    }

    /**
     * Update the kanban size (recomputes its width and height functions)
     */
    updateLayout() {
        if (this.isConnected) {
            this._setWidth()
            this._setHeight()
            this._render()
        }
    }

    /**
     * Set the kanban column width
     * 
     * @param {number} width - The column width in pixels
     */
    setColumnWidth(width) {
        this.columnWidth = width
        document.documentElement.style.setProperty("--kanban-column-width", this.columnWidth + "px")

        // Save new row height locally
        const localStorageId = "config-kanban-" + this.id + "-column-width"
        localStorage.setItem(localStorageId, this.columnWidth)
        this.reload()
    }

    /**
     * Reset all the columns to their default width
     */
    async resetColumnsWidth() {
        this.columnWidth = this.defaultColumnWidth
        document.documentElement.style.setProperty("--kanban-column-width", this.columnWidth + "px")

        const localStorageId = "config-kanban-" + this.id + "-column-width"
        localStorage.removeItem(localStorageId)
    }

    /**
     * Set header visibility
     * 
     * @private
     * @ignore
     * @returns this
     */
    _initElementsVisibility() {
        if (this.showToolbar === false) this.timelineToolbar.style.display = "none"
        return this
    }

    /**
     * Initialize kanban sizes
     * 
     * @private
     * @ignore
     * @returns this
     */
    _initSize(config) {
        if (config.width) {
            this._setWidth()
        } else {
            this.style.width = this.config.width = "100%"
        }

        if (config.height) {
            this._setHeight()
        } else {
            this.style.height = this.config.height = "100%"
        }
        return this
    }

    /**
     * Init the columns width according to local settings and/or config.
     * If the kanban is displayed on a mobile device, the column width is set to the screen width.
     * 
     * @private
     * @ignore
     */
    _initColumnWidth(config = {}) {
        const isMobile = kiss.screen.isMobile
        const isPortrait = kiss.screen.isVertical()

        if (isMobile && isPortrait) {
            this.columnWidth = kiss.screen.current.width - 20
            document.documentElement.style.setProperty("--kanban-column-width", this.columnWidth + "px")
        } else {
            this.columnWidth = this.columnWidth || config.columnWidth || this._getColumnsWidthFromLocalStorage()
            document.documentElement.style.setProperty("--kanban-column-width", this.columnWidth + "px")
        }
    }

    /**
     * Initialize all kanban events
     * 
     * @private
     * @ignore
     * @eturns this
     */
    _initEvents() {

        // Clicked somewhere in the kanban
        this.onclick = async (event) => {
            const clickedElement = event.target
            const card = clickedElement.closest(".kanban-record")
            const cardButton = clickedElement.closest(".kanban-record-button")

            // Clicked on a card button to switch card to another column
            if (cardButton) {
                event.stop()

                const recordId = card.getAttribute("recordid")
                const column = card.closest(".kanban-column-container")
                const columnValue = column.getAttribute("value")
                const fieldId = column.getAttribute("fieldid")
                const field = this.model.getField(fieldId)
                if (!field) return

                return createMenu({
                    title: txtTitleCase("#move card"),
                    icon: "fas fa-exchange-alt",
                    items: field.options
                        .filter(option => option.value != columnValue)
                        .map(option => {
                            return {
                                text: option.value,
                                icon: "fas fa-circle",
                                iconColor: option.color,
                                action: () => this.moveCardToColumn(recordId, fieldId, option.value)
                            }
                        })
                }).render()
            }

            // Open a record
            if (card) {
                const recordId = card.getAttribute("recordid")
                const record = await this.collection.getRecord(recordId)
                await this.selectRecord(record)
            }
        }

        // Clicked on a column resizer
        this.kanbanHeader.onmousedown = (event) => {
            const clickedElement = event.target
            if (clickedElement.classList.contains("kanban-column-header-resizer")) {
                this._columnsResizeWithDragAndDrop(event, clickedElement)
            }
        }

        return this
    }

    /**
     * Initialize subscriptions to PubSub
     * 
     * @private
     * @ignore
     * @returns this
     */
    _initSubscriptions() {
        super._initSubscriptions()

        const viewModelId = this.modelId.toUpperCase()

        // React to database mutations
        this.subscriptions = this.subscriptions.concat([
            subscribe("EVT_DB_INSERT:" + viewModelId, (msgData) => this._reloadWhenNeeded(msgData)),
            subscribe("EVT_DB_UPDATE:" + viewModelId, (msgData) => this._updateOneAndReload(msgData)),
            subscribe("EVT_DB_DELETE:" + viewModelId, (msgData) => this._reloadWhenNeeded(msgData)),
            subscribe("EVT_DB_INSERT_MANY:" + viewModelId, (msgData) => this._reloadWhenNeeded(msgData, 2000)),
            subscribe("EVT_DB_UPDATE_MANY:" + viewModelId, (msgData) => this._reloadWhenNeeded(msgData, 2000)),
            subscribe("EVT_DB_DELETE_MANY:" + viewModelId, (msgData) => this._reloadWhenNeeded(msgData, 2000)),
            subscribe("EVT_DB_UPDATE_BULK", (msgData) => this._reloadWhenNeeded(msgData, 2000))
        ])

        return this
    }

    /**
     * Update a single record then reload the view if required
     * 
     * @private
     * @ignore
     * @param {object} msgData - The original pubsub message
     */
    async _updateOneAndReload(msgData) {
        const sortFields = this.sort.map(sort => Object.keys(sort)[0])
        const filterFields = kiss.db.mongo.getFilterFields(this.filter)

        let groupHasChanged = false
        let sortHasChanged = false
        let filterHasChanged = false

        let updates = msgData.data
        for (let fieldId of Object.keys(updates)) {
            if (this.group.indexOf(fieldId) != -1) groupHasChanged = true
            if (sortFields.indexOf(fieldId) != -1) sortHasChanged = true
            if (filterFields.indexOf(fieldId) != -1) filterHasChanged = true
        }

        this._updateRecord(msgData.id)

        if (sortHasChanged || filterHasChanged || groupHasChanged) {
            this.reload()
        }
    }

    /**
     * Update a single record of the kanban.
     * 
     * @private
     * @ignore
     * @param {string} recordId 
     */
    _updateRecord(recordId) {
        const record = this.collection.getRecord(recordId)
        const recordNode = document.querySelector(`.kanban-record[recordid="${recordId}"]`)

        if (recordNode) {
            const replacementNode = document.createElement("div")
            const recordIndex = recordNode.getAttribute("row")
            replacementNode.setAttribute("row", recordIndex)
            replacementNode.classList.add("kanban-record")
            replacementNode.innerHTML = this._renderRecordAsCard(record, recordIndex)
            recordNode.parentNode.replaceChild(replacementNode, recordNode)
            replacementNode.setAttribute("recordid", recordId)
        }
    }

    /**
     * Initialize the Cards drag and drop
     * 
     * @private
     * @ignore
     */
    _enableDragAndDrop() {
        // Autoscroll management when dragging a card close to the edge of the screen
        let autoScrollInterval
        const kanbanContainer = document.querySelector('.kanban-body-container')
        const scrollSpeed = 20
        const threshold = 100

        function autoScroll(mouseX) {
            clearInterval(autoScrollInterval)
            autoScrollInterval = setInterval(() => {
                if (mouseX < kanbanContainer.getBoundingClientRect().left + threshold) {
                    requestAnimationFrame(() => kanbanContainer.scrollLeft = kanbanContainer.scrollLeft - scrollSpeed)
                } else if (mouseX > kiss.screen.current.width - threshold) {
                    requestAnimationFrame(() => kanbanContainer.scrollLeft = kanbanContainer.scrollLeft + scrollSpeed)
                }
            }, 10)
        }

        const stopAutoScroll = () => clearInterval(autoScrollInterval)

        // Drag and drop helpers
        const getColumns = () => document.querySelectorAll(".kanban-column-container")
        const resetColumns = () => getColumns().forEach(column => column.classList.remove("kanban-column-highlight"))
        const resetColumn = (column) => column.classList.remove("kanban-column-highlight")
        const highlightColumn = (column) => column.classList.add("kanban-column-highlight")

        // Drag and drop events
        const dndEvents = {
            ondragstart: (event) => {
                const kanbanColumn = event.target.closest(".kanban-column-container")
                kiss.context.draggedValue = kanbanColumn.getAttribute("value")
                kiss.context.draggedRecordId = event.target.getAttribute("recordid")
            },

            ondragover: (event) => {
                event.preventDefault()
                resetColumns()
                const kanbanColumn = event.target.closest(".kanban-column-container")
                if (!kanbanColumn) return
                const value = kanbanColumn.getAttribute("value")
                if (value == kiss.context.draggedValue) return
                highlightColumn(kanbanColumn)
                autoScroll(event.clientX);
            },

            ondrop: (event) => {
                event.preventDefault()
                resetColumns()
                const kanbanColumn = event.target.closest(".kanban-column-container")
                if (!kanbanColumn) return

                const columnValue = kanbanColumn.getAttribute("value")
                if (columnValue == kiss.context.draggedValue) return

                const recordId = kiss.context.draggedRecordId
                const fieldId = kanbanColumn.getAttribute("fieldid")
                const value = kanbanColumn.getAttribute("value")
                this.moveCardToColumn(recordId, fieldId, value)
                stopAutoScroll()
            },

            ondragleave: (event) => {
                const kanbanColumn = event.target.closest(".kanban-column-container")
                if (!kanbanColumn) return
                resetColumn(event.target)
            }
        }

        document.querySelectorAll('.kanban-column-container').forEach(kanbanColumn => {
            Object.assign(kanbanColumn, dndEvents)
        })

        document.querySelectorAll('.kanban-record').forEach(kanbanCard => {
            kanbanCard.draggable = true
            kanbanCard.ondragstart = dndEvents.ondragstart
            kanbanCard.ondragend = stopAutoScroll
        })
    }

    /**
     * Adjust the component width
     * 
     * @ignore
     * @param {(number|string|function)} [width] - The width to set
     */
    _setWidth() {
        let newWidth = this._computeSize("width")

        setTimeout(() => {
            this.style.width = newWidth
            this.kanban.style.width = this.clientWidth.toString() + "px"
        }, 50)
    }

    /**
     * Adjust the components height
     * 
     * @private
     * @ignore
     * @param {(number|string|function)} [height] - The height to set
     */
    _setHeight() {
        let newHeight = this._computeSize("height")
        this.style.height = this.kanban.style.height = newHeight
    }

    /**
     * Get the columns width config stored locally
     * 
     * @private
     * @ignore
     */
    _getColumnsWidthFromLocalStorage() {
        const localStorageId = "config-kanban-" + this.id + "-column-width"
        const columnWidth = localStorage.getItem(localStorageId)
        if (!columnWidth) return this.defaultColumnWidth
        return Number(columnWidth)
    }

    /**
     * 
     * DATA GROUPING MANAGEMENT
     * 
     */

    /**
     * Group data by a list of fields
     * 
     * @private
     * @ignore
     * @param {string[]} groupFields - Array of fields to group by.
     */
    async _dataGroupBy(groupFields) {
        // Generates the groups, then get the grouped records
        await this.collection.groupBy(groupFields)
        this._render()

        // Save the new group config
        this.group = groupFields
        await this.updateConfig({
            group: this.group
        })
    }

    /**
     * 
     * RENDERING THE KANBAN
     * 
     */

    /**
     * Render the kanban
     * 
     * @private
     * @ignore
     * @returns this
     */
    _render() {
        // Adjust size
        this._initColumnWidth()

        // Filters out hidden and deleted columns
        this.visibleColumns = this.columns.filter(column => column.hidden != true && column.deleted != true)

        // Render body
        this._renderKanbanBody()
        this._observeCards()
        this._enableDragAndDrop()

        return this
    }

    /**
     * Observe the cards to render them only when they are visible
     * 
     * @private
     * @ignore
     */
    _observeCards() {
        const kanbanColumnContainers = this.querySelectorAll('.kanban-column-container')
        kanbanColumnContainers.forEach(container => {
            container.onscroll = () => {
                if (kiss.global.kanbanScrollStop) return

                clearTimeout(this.scrollTimeout)
                this.scrollTimeout = setTimeout(() => this._renderDetailsOfVisibleCards(), 10)
                // requestAnimationFrame(() => this._renderDetailsOfVisibleCards())
            }
        })

        this.kanbanBodyContainer.onscroll = () => {
            clearTimeout(this.scrollTimeout)
            this.scrollTimeout = setTimeout(() => this._renderDetailsOfVisibleCards(), 10)
            // requestAnimationFrame(() => this._renderDetailsOfVisibleCards())
            this.kanbanHeaderContainer.scrollLeft = this.kanbanBodyContainer.scrollLeft
        }

        this._renderDetailsOfVisibleCards()
    }

    /**
     * Render the details of the visible cards
     * 
     * @private
     * @ignore
     */
    _renderDetailsOfVisibleCards() {
        const _this = this
        const collection = this.collection

        requestAnimationFrame(() => {
            document.querySelectorAll(".kanban-record").forEach(card => {
                if (_this._isElementVisible(card)) {
                    const isRendered = card.getAttribute("rendered")
                    if (isRendered == "true") return

                    const recordId = card.getAttribute("recordid")
                    const rowIndex = card.getAttribute("row")
                    const record = collection.getRecord(recordId)
                    const cardContent = _this._renderRecordAsCard(record, rowIndex)
                    const cardElement = _this.querySelector('.kanban-record[recordid="' + recordId + '"]')

                    cardElement.innerHTML = cardContent
                    cardElement.setAttribute("rendered", "true")
                }
            })
        })
    }

    /**
     * Check if an element is partly visible in the viewport
     * 
     * @private
     * @ignore
     */
    _isElementVisible(el) {
        const rect = el.getBoundingClientRect()
        const windowHeight = (window.innerHeight || document.documentElement.clientHeight)
        const windowWidth = (window.innerWidth || document.documentElement.clientWidth)
        const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0)
        const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0)
        return (vertInView && horInView)
    }

    /**
     * Render the kanban body
     * 
     * Tech note: we don't use string litterals to build the HTML because it's slower than native String concatenation
     * 
     * @private
     * @ignore
     */
    _renderKanbanBody() {
        let cardIndex = 0
        let kanbanHeader = ""
        let kanban = ""

        if (this.collection.group.length === 0) {
            // No group: can't render a Kanban view
            kanban = `<div class="kanban-help">${txtTitleCase("#kanban help")}</div>`

            this.kanbanHeaderContainer.style.display = "none"
            this.kanbanBodyContainer.classList.remove("kanban-body-container-empty")

        } else {

            let lastCellType = "group"

            for (let rowIndex = 0; rowIndex < this.collection.records.length; rowIndex++) {
                let record = this.collection.records[rowIndex]

                if (record.$type == "group" && record.$groupLevel == 0) {
                    cardIndex = 0
                    if (lastCellType == "record") { // Close the last column container
                        kanban += "</div>"
                    }

                    lastCellType = "group"

                    // Group header
                    kanbanHeader += this._renderKanbanHeader(record, rowIndex)

                    // Group container
                    kanban += this._renderKanbanColumnContainer(record, rowIndex)

                } else if (record.$type == "group") {

                    // Sub-category
                    kanban += "<div class=\"kanban-column-category\">" + record.$groupId + " - " + record.$name + "</div>"

                } else {
                    cardIndex++
                    lastCellType = "record"

                    // Regular row
                    kanban += this._renderKanbanCardContainer(record, cardIndex)
                }

                // Close the last column container
                if (rowIndex == this.collection.records.length - 1) {
                    kanban += "</div>"
                }
            }

            // Show / hide "empty" icon and header
            if (this.collection.records.length == "0") {
                this.kanbanBodyContainer.classList.add("kanban-body-container-empty")
                this.kanbanHeaderContainer.style.display = "none"
            } else {
                this.kanbanBodyContainer.classList.remove("kanban-body-container-empty")
                this.kanbanHeaderContainer.style.display = "flex"
            }
        }

        this.kanbanHeader.innerHTML = kanbanHeader
        this.kanbanBody.innerHTML = kanban
    }

    /**
     * Render the content of a Kanban header
     * 
     * @private
     * @ignore
     * @param {object} record 
     * @returns {string} Html source for the column header
     */
    _renderKanbanHeader(record, rowIndex) {
        const color = this._getCategoryColor(this.collection.group[0], record.$name)

        let row = "<div row=\"" + rowIndex + "\" class=\"kanban-column-header\">"
        if (record.$name !== undefined && record.$name !== "") {
            row += `<span class="fas fa-circle kanban-column-header-icon" style="color: ${color}"></span>`
            row += `<div>${record.$name} (${record.$size})</div>`
        } else {
            row += `<span class="fas fa-circle kanban-column-header-icon" style="color: #cccccc"></span>`
            row += `<div>${txtTitleCase("#no category")} (${record.$size})</div>`
        }
        row += "</div>"
        return row
    }

    /**
     * Get the color of a category, if any
     * 
     * @param {string} groupFieldId 
     * @param {*} columnValue 
     * @returns {string} The color of the category
     */
    _getCategoryColor(groupFieldId, columnValue) {
        const field = this.model.getField(groupFieldId)
        const options = field.options || []
        const option = options.find(option => option.value == columnValue)
        return (option) ? option.color : "#cccccc"
    }

    /**
     * Render a Kanban column
     * 
     * @param {object} record 
     * @param {number} rowIndex 
     * @returns {string} Html source for Kanban column container
     */
    _renderKanbanColumnContainer(record, rowIndex) {
        const groupFieldId = this.group[0]
        const value = record.$name
        return "<div row=\"" + rowIndex + "\" fieldid=\"" + groupFieldId + "\" value=\"" + value + "\" class=\"kanban-column-container\">"
    }

    /**
     * Render a single row of the kanban
     * 
     * @private
     * @ignore
     * @param {number} rowIndex
     * @returns {HTMLDivElement} The div containing the row
     */
    _renderKanbanCardContainer(record, cardIndex) {
        return "<div row=\"" + cardIndex + "\" class=\"kanban-record\" recordid=\"" + record.id + "\"></div>"
    }

    /**
     * Render a single record as a Card for 1 week view
     * 
     * @private
     * @ignore
     * @param {object} record
     * @returns {string} Html for a single record
     */
    _renderRecordAsCard(record, index) {
        let recordHtml = "<span class=\"kanban-record-index\">" + index + "</span>"
        this.columns
            .filter(column => column.hidden !== true)
            .forEach(column => {
                let field = this.model.getField(column.id)
                if (!field) return
                if (["password", "link"].includes(field.type)) return

                let value = record[column.id]
                if (!value && value !== false) return

                let valueHtml = this._renderSingleValue(field, value, record)
                recordHtml += /*html*/ `
                    <div class="kanban-record-field">
                        <div class="kanban-record-label">${field.label} ${(field.unit) ? `(${field.unit})` : ""}</div>
                        <div class="kanban-record-value">${valueHtml}</div>
                    </div>
                `.removeExtraSpaces()
            })

        if (kiss.screen.isMobile) {
            recordHtml += /*html*/ `
                <div class="a-button kanban-record-button">
                    <span class="kanban-record-button-icon fas fa-exchange-alt"></span>
                    ${txtTitleCase("#move card")}
                </div>
            `.removeExtraSpaces()
        }

        return recordHtml
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

        switch (type) {
            case "textarea":
            case "aiTextarea":
                return this._rendererForTextarea(field, value)
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
            case "aiImage":
                return this._rendererForAttachmentFields(field, value)
            case "password":
                return "***"
            default:
                return value
        }
    }

    /**
     * Renderer for "Textarea" fields.
     * Mainly keeps the line breaks.
     * 
     * @private
     * @ignore
     * @returns {string} Html for the value
     */
    _rendererForTextarea(field, value) {
        return value.replaceAll("\n", "<br>")
    }

    /**
     * Renderer for "Checkbox" fields
     * 
     * @private
     * @ignore
     * @returns {string} Html for the value
     */
    _rendererForCheckboxFields(field, value) {
        const shape = field.shape || "square"
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
        } catch (err) {
            log("kiss.ui - Kanban - Couldn't generate renderer for checkboxes", 4)
            return value
        }

        const iconClasses = kiss.ui.Checkbox.prototype.getIconClasses()
        const defaultIconOn = iconClasses[shape]["on"]
        const defaultIconOff = iconClasses[shape]["off"]
        return `<span ${(value === true) ? `style="color: ${iconColorOn}"` : ""} class=\"${(value === true) ? defaultIconOn + " kanban-type-checkbox-checked" : defaultIconOff + " kanban-type-checkbox-unchecked"}\"></span>`
    }

    /**
     * Renderer for "Rating" fields
     * 
     * @private
     * @ignore
     * @returns {string} Html for the value
     */
    _rendererForRatingFields(field, value) {
        const iconColorOn = field.iconColorOn || "#ffd139"
        const iconColorOff = field.iconColorOff || "#dddddd"
        const shape = field.shape || "star"
        const iconClasses = kiss.ui.Rating.prototype.getIconClasses()
        const icon = iconClasses[shape]
        const max = field.max || 5

        let html = ""
        for (let i = 0; i < max; i++) {
            const color = (i < value) ? iconColorOn : iconColorOff
            html += /*html*/ `<span class="rating ${icon}" style="color: ${color}" index=${i}></span>`
        }
        return html
    }

    /**
     * Renderer for "Select" fields
     * 
     * @private
     * @ignore
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
     * @returns {string} Html for the value
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
     * Renderer for "Attachment" fields
     * 
     * @private
     * @ignore
     * @returns {string} Html for the value
     */
    _rendererForAttachmentFields(field, value) {
        if ((!value) || (value == " ") || !Array.isArray(value)) return ""

        let attachmentItems = value.map((file, i) => {
            if (!file.path) return ""

            let preview
            let filePath = kiss.tools.createFileURL(file, "s")
            const fileExtension = file.path.split(".").pop().toLowerCase()

            if (["jpg", "jpeg", "png", "gif", "webp"].indexOf(fileExtension) != -1) {
                // Image
                preview = `<img id="${file.id}" class="kanban-type-attachment-image" src="${filePath}" loading="lazy"></img>`
            } else {
                // Other
                const {
                    icon,
                    color
                } = kiss.tools.fileToIcon(fileExtension)
                preview = `<span id="${file.id}" style="color: ${color}" class="fas ${icon} kanban-type-attachment-icon"></span>`
            }

            return /*html*/ `<span id="${file.id}" class="kanban-type-attachment">${preview}</span>`
        }).join("")
        return attachmentItems
    }    

    /**
     * 
     * Render the toolbar
     * 
     * The toolbar includes multiple components:
     * - button to create a new record
     * - button to select columns
     * - button to sort
     * - button to filter
     * - field to group
     * 
     * @private
     * @ignore
     */
    _renderToolbar() {
        // If the toolbar is already rendered, we just update it
        if (this.isToolbarRendered) {
            this._groupUpdateGroupingFields()
            return
        }

        // New record creation button
        createButton({
            hidden: !this.canCreateRecord,
            class: "kanban-create-record",
            target: "create:" + this.id,
            text: this.model.name.toTitleCase(),
            icon: "fas fa-plus",
            iconColor: this.color,
            borderWidth: "3px",
            borderRadius: "32px",
            maxWidth: (kiss.screen.isMobile && kiss.screen.isVertical()) ? 160 : null,
            action: async () => this.createRecord(this.model)
        }).render()

        // Actions button
        createButton({
            hidden: this.showActions === false,
            target: "actions:" + this.id,
            tip: txtTitleCase("actions"),
            icon: "fas fa-bolt",
            iconColor: this.color,
            width: 32,
            action: () => this._buildActionMenu()
        }).render()

        // Column selection button
        createButton({
            hidden: !this.canSelectFields,
            target: "select:" + this.id,
            tip: txtTitleCase("#display fields"),
            icon: "fas fa-bars fa-rotate-90",
            iconColor: this.color,
            width: 32,
            action: () => this.showFieldsWindow()
        }).render()

        // Sorting button
        createButton({
            hidden: !this.canSort,
            target: "sort:" + this.id,
            tip: txtTitleCase("to sort"),
            icon: "fas fa-sort",
            iconColor: this.color,
            width: 32,
            action: () => this.showSortWindow()
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

        // Layout button
        createButton({
            hidden: !this.showLayoutButton,
            target: "layout:" + this.id,
            tip: {
                text: txtTitleCase("layout"),
                minWidth: 100
            },
            icon: "fas fa-ellipsis-v",
            iconColor: this.color,
            width: 32,
            action: () => this._buildLayoutMenu()
        }).render()

        // Grouping
        let groupingFields = this._groupGetModelFields({
            excludeSystemFields: true,
            excludePluginFields: true
        })
        let groupingFieldValues = []

        this.collection.group.forEach(fieldId => {
            let groupingField = groupingFields.find(field => field.value == fieldId)
            if (groupingField) groupingFieldValues.push(groupingField.value)
        })

        createSelect({
            hidden: !this.canGroup,
            target: "group:" + this.id,
            id: "grouping-field:" + this.id,
            label: txtTitleCase("group by"),
            multiple: true,
            allowClickToDelete: true,
            options: groupingFields,
            minWidth: 200,
            maxHeight: () => kiss.screen.current.height - 200,
            optionsColor: this.color,
            value: groupingFieldValues,
            styles: {
                "this": "align-items: center;",
                "field-label": "white-space: nowrap;",
                "field-select": "white-space: nowrap;",
            },
            events: {
                change: async function (event) {
                    let groupFields = this.getValue()

                    // Restrict to 6 grouping fields
                    if (groupFields.length > 6) {
                        let fieldGroupSelect = $(this.id)
                        fieldGroupSelect.value = fieldGroupSelect.getValue().slice(0, 6)
                        fieldGroupSelect._renderValues()

                        createDialog({
                            type: "message",
                            title: txtTitleCase("seriously"),
                            icon: "fas fa-exclamation-triangle",
                            message: txtTitleCase("#too many groups"),
                            buttonOKText: txtTitleCase("#understood")
                        })
                        return
                    }

                    // Publish the "grouping" event
                    let viewId = this.id.split(":")[1]
                    publish("EVT_VIEW_GROUPING:" + viewId, groupFields)
                }
            }
        }).render()

        // View refresh button
        if (!kiss.screen.isMobile) {
            createButton({
                target: "refresh:" + this.id,
                tip: txtTitleCase("refresh"),
                icon: "fas fa-undo-alt",
                iconColor: this.color,
                width: 32,
                events: {
                    click: () => this.reload()
                }
            }).render()
        }

        // Search button
        createButton({
            hidden: !this.canSearch,
            target: "search:" + this.id,
            icon: "fas fa-search",
            iconColor: this.color,
            width: 32,
            events: {
                click: () => this.showSearchBar()
            }
        }).render()

        // Flag the toolbar as "rendered", so that the method _renderToolbar() is idempotent
        this.isToolbarRendered = true
    }

    /**
     * 
     * COLUMNS MANAGEMENT
     * 
     */

    /**
     * Save the width of a column in the localStorage
     * 
     * @private
     * @ignore
     * @param {string} columnId - Id of the column to resize
     * @param {number} newWidth - New column width
     */
    _columnsSetWidth(columnId, newWidth) {
        let localStorageId

        // Other columns: get the column config and update it
        let columnIndex = this.columns.findIndex(column => column.id == columnId)
        if (newWidth <= 10) newWidth = 10
        this.columns[columnIndex].width = newWidth

        // Save new column size locally
        localStorageId = "config-kanban-" + this.id + "-columns"
        localStorage.setItem(localStorageId, JSON.stringify(this.columns))
    }

    /**
     * Drag and drop a column
     * 
     * @private
     * @ignore
     * @param {string} phase - dragstart | dragover | dragleave | drop
     * @param {object} event - The drag Event: dragStart | dragOver | dragLeave | drop
     * @param {object} element - The DOM element which is dragged
     */
    _columnsMoveWithdragAndDrop(phase, event, element) {
        let target = event.target
        let targetCenterX = null
        let colIndex = target.closest("div").getAttribute("col")
        let columnCells = Array.from(this.querySelectorAll("div[col='" + colIndex + "']"))

        switch (phase) {
            case "dragstart":
                // Store the column to be moved
                this.sourceColumnId = target.id.split("title-")[1]
                break

            case "dragover":
                // Adjust target column style to show where to drop the column
                targetCenterX = target.offsetLeft + target.clientWidth / 2

                if (event.x < targetCenterX) {
                    columnCells.forEach(cell => {
                        cell.classList.remove("kanban-column-dragover-right")
                        cell.classList.add("kanban-column-dragover-left")
                    })
                } else {
                    columnCells.forEach(cell => {
                        cell.classList.remove("kanban-column-dragover-left")
                        cell.classList.add("kanban-column-dragover-right")
                    })
                }
                event.preventDefault()
                return false

            case "dragleave":
                // Restore style of header and column
                columnCells.forEach(cell => {
                    cell.classList.remove("kanban-column-dragover-left")
                    cell.classList.remove("kanban-column-dragover-right")
                })
                break

            case "drop":
                event.stopPropagation()

                // Restore style of header and column
                columnCells.forEach(cell => {
                    cell.classList.remove("kanban-column-dragover-left")
                    cell.classList.remove("kanban-column-dragover-right")
                })

                // Perform the drop action
                targetCenterX = target.offsetLeft + target.clientWidth / 2
                let position = (event.x < targetCenterX) ? "before" : "after"
                this._columnsMove(this.sourceColumnId, target.id.split("title-")[1], position)
                break
        }
    }

    /**
     * 
     * OTHER MISC METHODS
     * 
     */

    /**
     * Render the menu to change kanban layout
     * 
     * @private
     * @ignore
     */
    async _buildLayoutMenu() {
        let buttonLeftPosition = $("layout:" + this.id).offsetLeft
        let buttonTopPosition = $("layout:" + this.id).offsetTop

        createMenu({
            top: buttonTopPosition,
            left: buttonLeftPosition,
            items: [
                // Title
                txtTitleCase("cell size"),
                "-",
                // Change row height to  COMPACT
                {
                    icon: "fas fa-circle",
                    iconSize: "2px",
                    text: txtTitleCase("compact"),
                    action: () => {
                        this.columnWidth = 250
                        this.setColumnWidth(this.columnWidth)
                    }
                },
                // Change row height to NORMAL
                {
                    icon: "fas fa-circle",
                    iconSize: "6px",
                    text: txtTitleCase("normal"),
                    action: () => {
                        this.columnWidth = this.defaultColumnWidth
                        this.setColumnWidth(this.columnWidth)
                    }
                },
                // Change row height to MEDIUM
                {
                    icon: "fas fa-circle",
                    iconSize: "10px",
                    text: txtTitleCase("medium"),
                    action: () => {
                        this.columnWidth = 350
                        this.setColumnWidth(this.columnWidth)
                    }
                },
                // Change row height to TALL
                {
                    icon: "fas fa-circle",
                    iconSize: "14px",
                    text: txtTitleCase("tall"),
                    action: () => {
                        this.columnWidth = 400
                        this.setColumnWidth(this.columnWidth)
                    }
                },
                // Change row height to VERY TALL
                {
                    icon: "fas fa-circle",
                    iconSize: "18px",
                    text: txtTitleCase("very tall"),
                    action: () => {
                        this.columnWidth = 450
                        this.setColumnWidth(this.columnWidth)
                    }
                },
                "-",
                // Reset columns width
                {
                    icon: "fas fa-undo-alt",
                    text: txtTitleCase("#reset view params"),
                    action: () => this.resetLocalViewParameters()
                }
            ]
        }).render()
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-kanban", kiss.ui.Kanban)

/**
 * Shorthand to create a new Kanban. See [kiss.ui.Kanban](kiss.ui.Kanban.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createKanban = (config) => document.createElement("a-kanban").init(config)

;