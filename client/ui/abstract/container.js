/** 
 * 
 * The Container derives from [Component](kiss.ui.Component.html).
 * 
 * A Container is useful to embed other items.
 * Containers can also embed other containers to build complex layouts.
 * 
 * The Container class should not be instanciated directly: it's the base class for the 2 types of containers:
 * - [Block](kiss.ui.Block.html), which is a simple "div" container
 * - [Panel](kiss.ui.Panel.html), which has a header and is useful to build windows or modals, for example.
 * 
 * It's also possible to bind a Record to a container:
 * - in this case, the record will be bound to all the container's fields (text, number, date, checkbox, select...)
 * - the fields will be automatically synchronized with the Record, **but only if their id matches a record's property**
 * - it's a 2-way binding:
 *      - if a field of the container is updated, the database will be updated automatically
 *      - if the database is updated, the fields will react to the change as well
 * 
 * @param {object} config
 * @param {boolean} [multiview] - If true, only displays one item at a time
 * @param {object[]} config.items - The array of contained items
 * @param {Record} [config.record] - Record to bind to the contained fields
 * @returns this
 * 
 * @example
 * let myRecord = myModel.create({firstName: "Bob", lastName: "Wilson"})
 * await myRecord.save()
 * 
 * let myForm = createPanel({
 *  title: "Binding example",
 *  width: 300,
 *  height: 300,
 *  align: "center",
 *  verticalAlign: "center",
 * 
 *  record: myRecord, // Bind the record to the container's fields
 * 
 *  items: [
 *      {
 *          id: "firstName", // Updating the field will update the database
 *          type: "text",
 *          value: myRecord.firstName
 *      },
 *      {
 *          id: "lastName",
 *          type: "text",
 *          value: myRecord.lastName
 *      }
 *  ]
 * }).render()
 * 
 * await myRecord.update({firstName: "Will"}) // Updating the database will update the field in the UI
 * 
 */
kiss.ui.Container = class Container extends kiss.ui.Component {
    constructor() {
        super()
    }

    /**
     * Generates a Container and all its contained items, which are defined from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config) {

        // Define a vertical or horizontal layout (= "layout" is a shortcut to define flex + flexFlow properties at the same time)
        if (config.layout) {
            config.display = "flex"

            if (config.layout == "vertical") {
                config.flexFlow = "column"
            } else if (config.layout == "horizontal") {
                config.flexFlow = "row"
            }
        }

        // Init the base component
        super.init(config)

        if (this.type == "block") this.containerId = this.id
        else this.containerId = "panel-body-" + this.id // panel and wizardPanel

        // Bind a record to the contained fields
        if (config.record) config.items.forEach(item => {
            if (item.items || kiss.global.fieldTypes.map(type => type.value).includes(item.type)) {
                item.record = config.record
            }
        })

        // Insert items into the container (and filters out deleted items)
        this.items = []
        this.config.items = this.config.items || []
        this._insertItems(this.config.items)

        // Observe the window resize
        this.subscriptions = this.subscriptions || []

        // Adjust top and left property if the component is auto-centered
        let _this = this
        if (this.config.align == "center" && !this.config.left) this.config.left = () => (kiss.screen.current.width - $(_this.id).clientWidth) / 2
        if (this.config.verticalAlign == "center" && !this.config.top) this.config.top = () => (kiss.screen.current.height - $(_this.id).clientHeight) / 2

        // Add the container to the resize observer & flag the component as a container (containers are unobserved when destroyed)
        this.isContainer = true
        kiss.screen.getResizeObserver().observe(this)

        return this
    }

    /**
     * For multiview containers, show only a specific item of the container, given by index
     * 
     * @param {number} itemIndex
     * @param {object|string} [animation] - Optional animation when displaying the item
     * @returns this
     */
    showItem(itemIndex, animation) {
        if (itemIndex > this.items.length) return
        if (this.activeItemIndex == itemIndex) return

        this.activeItemIndex = itemIndex
        for (let i = 0; i < this.items.length; i++) this.items[i].hide()
        this.items[itemIndex].show()

        if (animation) this.items[itemIndex].setAnimation(animation)
        return this
    }

    /**
     * For multiview containers, show only a specific item of the container, given by id
     * 
     * @param {string} id
     * @param {object|string} [animation] - Optional animation when displaying the item
     * @returns this
     */
    showItemById(itemId, animation) {
        let itemIndex = this.items.findIndex(item => item.id == itemId)
        if (itemIndex != -1) this.showItem(itemIndex, animation)
        return this
    }

    /**
     * For multiview containers, show only a specific item of the container, given by CSS class
     * 
     * @param {string} className
     * @param {object|string} [animation] - Optional animation when displaying the item
     * @returns this
     */
    showItemByClass(className, animation) {
        let itemIndex = this.items.findIndex(item => Array.from(item.classList).includes(className))
        if (itemIndex != -1) this.showItem(itemIndex, animation)
        return this
    }

    /**
     * Returns the HTMLElement which is the real container of the component.
     * It can differ depending on the component type.
     * For example, for a panel, the container is the panel body.
     * 
     * @returns {HTMLElement} The real component's container
     */
    getContainer() {
        return $(this.containerId)
    }

    /**
     * Get the ids of all the contained items.
     * Can be useful to check if a component is contained by this container.
     * 
     * @returns {string[]}
     */
    getComponentIds() {
        let ids = []
        ids.push(this.id)

        this.items.forEach(function (item) {
            if (item.items) ids.push(item.getComponentIds())
            else if (item.id) ids.push(item.id)
        })
        return ids.flat()
    }

    /**
     * Set container items.
     * 
     * Overwrite existing items if the container is not empty.
     * 
     * @param {object[]} newItems - Array of new items
     * @returns this
     */
    setItems(newItems) {
        const containerElement = this.getContainer()
        containerElement.deepDelete(false)

        // Reset items and also items configuration
        this.items = []
        this.config.items = []

        // Insert new items and re-render
        this._insertItems(newItems)
        this.render(this.target, false)

        return this
    }

    /**
     * Insert items and manage multiview.
     * For multiview containers, only the first item is displayed, other items are hidden.
     * 
     * @private
     * @ignore
     * @param {*} newItems - Items to insert: can be an HTMLElement, a Component, or a Component's JSON config, or all mixed
     */
    _insertItems(newItems) {
        if (this.config.multiview) {
            this.activeItemIndex = 0

            newItems.forEach((item, index) => {
                // Insert the first element
                if (index == 0) {
                    this._insertOrAddItem(item)
                    return
                }

                // Other items must be hidden.
                // An item can be a component JSON config or an HTMLElement
                if (item.tagName) {
                    // It's an HTMLElement, hide it
                    item.hide()
                }
                else {
                    // It's a JSON config: the component is not instanciated yet so we just edit its "hidden" property
                    item.hidden = true
                }

                this._insertOrAddItem(item)
            })
        } else {
            newItems.forEach((item) => this._insertOrAddItem(item))
        }
    }

    /**
     * Insert or add a child item into the container
     * 
     * @private
     * @ignore
     * @param {object} item - Item JSON configuration
     * @param {number} position - Position at which to insert the new item, for insert operations
     * @param {boolean} isNewItem - If true, the item is also added to the initial config object
     * @returns Inserted item
     */
    _insertOrAddItem(item, position, isNewItem) {
        if (!item) return

        // Set the DOM insertion node
        item.target = this.containerId

        // Apply container defaults to the item
        const containerDefaults = this.config.defaultConfig

        if (containerDefaults) {
            for (let defaultProperty in containerDefaults) {
                if (!item[defaultProperty]) item[defaultProperty] = containerDefaults[defaultProperty]
            }
        }

        // Build the new item
        let newItem = this._createNewItem(item)

        if (position != null) {
            // Insert
            //log("kiss.ui.Container - Inserting...... " + item.id + " to " + this.id)
            this.config.items.splice(position, 0, item)
            const targetNode = this.items[position]
            this.items.splice(position, 0, newItem)
            this.insertBefore(newItem, targetNode)
        } else {
            // Add
            //log("kiss.ui.Container - Adding...... " + item.id + " to " + this.id)
            if (isNewItem) this.config.items.push(item)
            this.items.push(newItem)
        }

        return newItem
    }

    /**
     * Creates a new item into the container
     * 
     * @private
     * @ignore
     * @param {object|HTMLElement} item - The item can be a JSON config (= the Component or View has to be built), or an HTMLElement (which can be directly inserted)
     */
    _createNewItem(item) {
        // If the item has no "render" method, it means it's a component config, and we have to generate the markup
        if (!item.render) {
            // Generate items according to their type
            // If no type is specified, KissJS builds a basic "block" container
            const type = item.type

            if (type) {
                if (["text", "textarea", "number", "date", "password", "lookup", "summary"].includes(type)) {
                    // Input fields and textarea
                    return document.createElement("a-field").init(item)
                }
                else if (type == "view") {
                    // Build a view
                    return kiss.views.buildView(item.id, this.containerId)
                }
                else {
                    // Other fields and elements
                    return document.createElement("a-" + type.toLowerCase()).init(item)
                }
            }
            else {
                // Block
                return document.createElement("a-block").init(item)
            }
        } else {
            // The item has a render method: it means it's already a Component and we inject it "as this" into the container
            return item
        }
    }

    /**
     * Add a child item into the container
     * 
     * @param {object} item - Item JSON configuration
     * @returns this
     */
    addItem(item) {
        let insertedItem = this._insertOrAddItem(item, null, true)
        insertedItem.render()
        return this
    }

    /**
     * Insert a child item into the container at a specified position
     * 
     * @param {object} item - Item JSON configuration
     * @param {number} position
     * @returns this
     */
    insertItem(item, position) {
        let insertedItem = this._insertOrAddItem(item, position)
        insertedItem.render()
        return this
    }

    /**
     * Delete an item from the container
     * 
     * @param {string} itemId
     * @returns this
     */
    deleteItem(itemId) {
        this.config.items = this.config.items.filter(item => item.id != itemId)
        this.items = this.items.filter(item => item.id != itemId)
        $(itemId).deepDelete()
        return this
    }

    /**
     * Find all the panels inside a container and expand them recursively
     * 
     * @returns this
     */
    expandAll() {
        this.items.forEach(function (item) {
            if (item.items) {
                if (item.type == "panel") item.expand()
                item.expandAll()
            }
        })
        return this
    }

    /**
     * Find all the panels inside a container and collapse them recursively
     * 
     * @returns this
     */
    collapseAll() {
        this.items.forEach(function (item) {
            if (item.items) {
                if (item.type == "panel") item.collapse()
                item.collapseAll()
            }
        })
        return this
    }

    /**
     * Get all the fields found in this container
     * 
     * @returns {Object[]} An array of objects containing the fields
     */
    getFields() {
        let values = []

        Array.from(this.getContainer().children).forEach(function (item) {
            if (item.items) {
                values.push(item.getFields())
            } else {
                if (kiss.global.fieldTypes.map(type => type.value).indexOf(item.type) != -1) {
                    values.push(item)
                }
            }
        })

        return values.flat()
    }

    /**
     * Validate all the container's fields and return the result
     * 
     * @returns {boolean} true if all fields have passed the validation
     */
    validate() {
        let isValid = true
        const fields = this.getFields()
        fields.forEach(field => {
            let fieldElement = this.querySelector("#" + field.id.replaceAll(":", "\\:"))
            isValid = isValid && fieldElement.validate()
        })
        
        if (!isValid) createNotification(txtTitleCase("#fields incorrect value"))
        return isValid
    }

    /**
     * Get fields data found in this container.
     * 
     * This method:
     * - finds all the contained items which are fields
     * - also explores nested containers, if any
     * 
     * @param {object} config
     * @param {boolean} config.useLabels - If true, return data using field labels instead of field ids
     * @returns {object}
     * 
     * @example
     * let formData = myForm.getData()
     * console.log(formData) // {title: "Training ICT", amount: 1234.56, dueDate: "2020-02-20T20:19:15Z"}
     * 
     * formData = myForm.getData({
     *  useLabels: true
     * })
     * console.log(formData) // {"Lead name": "Training ICT", "Lead amount": 1234.56, "Due date": "2020-02-20T20:19:15Z"}
     */
    getData(config) {
        let record = {}
        this.getFields().forEach(function (field) {
            if (config && config.useLabels) {
                let label = field.getLabel()
                if (!label) label = field.id
                record[label] = field.getValue()
            }
            else {
                record[field.id] = field.getValue()
            }
        })
        return record
    }

    /**
     * Set the value of the fields found in this container, given a data object.
     * 
     * This method:
     * - finds all the contained items which are fields
     * - also explores nested containers, if any
     * - set their value if the field id matches a property of the given data object
     * 
     * @param {object} data
     * @param {boolean} [rawUpdate] - If true, the field's value is updated without triggering the "change" event. Default is false.
     * @returns this
     * 
     * @example
     * const data = {title: "Training ICT", amount: 1234.56, dueDate: "2020-02-20T20:19:15Z"}
     * myForm.setData(data)
     */
    setData(data, rawUpdate) {
        this.getFields().forEach(function (field) {
            if (data[field.id] != undefined) field.setValue(data[field.id], rawUpdate)
        })
        return this
    }

    /**
     * Update layout of the component with its new config parameters.
     * It affects:
     * - the size properties
     * - the position
     * 
     * It can be useful to update the layout for example when:
     * - the global window (screen) is resized
     * - the parent container is resized
     * - a parameter used in the function to compute a width or height has changed
     * 
     * Note: the layout is updated only if the Element is connected to the DOM.
     * 
     * @returns this
     * 
     * @example
     * myComponent.updateLayout()
     */
    updateLayout() {
        if (this.isConnected) {
            // Width
            this._setWidth()
            this._setMinWidth()
            this._setMaxWidth()

            // Height
            this._setHeight()
            this._setMinHeight()
            this._setMaxHeight()

            // Position
            this._setTop()
            this._setLeft()
        }
        return this
    }

    /**
     * Set the label position of all the container's fields
     * 
     * @param {string} position - "left" (default) | "top" | "right" | "bottom"
     * @returns this
     */
    setLabelPosition(position = "left") {
        const fields = this.getFields()

        if (position == "top" || position == "bottom") {
            fields.forEach(item => {
                if (item.field) item.field.style.transition = "all 0.1s"

                if (item.setFieldWidth) item.setFieldWidth("100%")

                if (item.label) {
                    item.label.style.transition = "all 0.1s"
                    if (item.setLabelPosition) {
                        item.setLabelPosition(position)
                    }
                    if (item.setLabelWidth) {
                        item.setLabelWidth("100.00%")
                    }
                }
            })
        } else if (position == "left" || position == "right") {
            fields.forEach(item => {
                if (item.field) item.field.style.transition = "all 0.1s"

                if (item.setFieldWidth) item.setFieldWidth("50%")

                if (item.label) {
                    item.label.style.transition = "all 0.1s"
                    if (item.setLabelPosition) {
                        item.setLabelPosition(position)
                    }
                    if (item.setLabelWidth) {
                        item.setLabelWidth("50.00%")
                    }
                }
            })
        }
        return this
    }

    /**
     * Set the label size of all the container's fields
     * 
     * @param {string} size - "1/4" | "1/3" (default) | "1/2" | "2/3" | "3/4"
     * @returns this
     */
    setLabelSize(size = "1/3") {
        const fields = this.getFields()
        let labelSize
        let fieldSize

        switch (size) {
            case "1/4":
                labelSize = "25.00%"
                fieldSize = "75.00%"
                break
            case "1/3":
                labelSize = "33.33%"
                fieldSize = "66.66%"
                break
            case "1/2":
                labelSize = "50.00%"
                fieldSize = "50.00%"
                break
            case "2/3":
                labelSize = "66.66%"
                fieldSize = "33.33%"
                break
            case "3/4":
                labelSize = "75.00%"
                fieldSize = "25.00%"
                break
        }

        fields.forEach(item => {
            // Don't modify fields with labels at the top or bottom
            if (item.style.flexFlow == "column") return

            if (item.field) item.field.style.transition = "all 0.1s"
            if (item.setFieldWidth) item.setFieldWidth(fieldSize)

            if (item.label) {
                item.label.style.transition = "all 0.1s"
                if (item.setLabelWidth) item.setLabelWidth(labelSize)
            }
        })
        return this
    }

    /**
     * Set the label alignment of all the container's fields
     * 
     * @param {string} position - "left" (default) | "right"
     * @returns this
     */
    setLabelAlign(position = "left") {
        const fields = this.getFields()

        fields.forEach(item => {
            if (item.label) {
                item.label.style.transition = "all 1s"
                item.config.labelAlign = item.label.style.textAlign = position
            }
        })
        return this
    }

    /**
     * Dispatch container's content on multiple columns
     * 
     * @param {number} numberOfColumns
     * @returns this
     */
    setColumns(numberOfColumns = 1) {
        const fields = this.getFields()
        const percent = (100 / numberOfColumns).toFixed(2) + "%"

        if (numberOfColumns > 1) this.setDisplayMode("block")
        else this.setDisplayMode("flex")

        fields.forEach(item => {
            if (!item.config.deleted) item.style.display = item.config.display = "inline-flex"
            if (item.field) item.field.style.transition = "all 1s"
            if (item.setWidth) item.setWidth(percent)
        })
        return this
    }

    /**
     * Set the display mode
     * 
     * @param {string} mode - "flex" | "inline-flex" | "block" | "inline-block"
     */
    setDisplayMode(mode = "flex") {
        this.config.display = this.container.style.display = mode
    }
}

;