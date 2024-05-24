/**
 * 
 * ## Create a filter for a view
 * 
 * A filter is a compound object containing:
 * - a delete button, to remove the filter
 * - a dropdown list to select the field to filter
 * - a dropdown list to select the comparison operator (=, >, contains, is empty, is not empty...)
 * - a value to be compared to. The input depends on the field type (for example: a calendar widget for a date field)
 * 
 * @ignore
 * @param {string} viewId - Target view to apply data filtering
 * @param {string} color - window color theme
 * @param {object} config
 * @param {string} [config.target] - Node id where the filter should be inserted
 * @param {string} config.fieldId - The default field id
 * @param {string} config.operator - The default operator
 * @param {string} config.value - The default field value
 * 
 */
const createDataFilter = function (viewId, color, config) {
    // Get initial values
    let id = kiss.tools.shortUid()
    let fieldId = config.fieldId || ""
    let filterOperator = config.operator || "="
    let filterDateOperator = config.dateOperator || "exact date"
    let fieldValue = (kiss.tools.isNumber(config.value)) ? config.value || 0 : config.value || ""

    // Get the possible list of fields to filter
    const model = $(viewId).collection.model
    const isDynamicModel = kiss.tools.isUid(model.id)
    let selectFields = model
        .getFilterableFields()
        .map(field => {
            const needsTranslation = (field.isSystem || field.isFromPlugin || field.label.startsWith("#")) ? true : false
            return {
                type: field.type,
                label: (isDynamicModel && !needsTranslation) ? field.label.toTitleCase() : txtTitleCase(field.label),
                value: field.id
            }
        })

    //
    // Some helpers to get / show / hide filter parameters
    //
    function getFieldId() {
        const filterField = $("filter-field:" + id)
        if (filterField) return filterField.getValue()
    }

    function getFieldType(fieldId) {
        let fieldConfig = $(viewId).collection.model.getField(fieldId)
        let type = (fieldConfig) ? fieldConfig.type : "text"
        if (type == "lookup") type = fieldConfig.lookup.type
        if (type == "summary") type = fieldConfig.summary.type
        if (type == "lookup") type = "text"
        return type || "text"
    }

    function getFilterOperator() {
        const filterOperator = $("filter-operator:" + id)
        if (filterOperator) return filterOperator.getValue()
        return config.operator
    }

    function getFilterDateOperator() {
        const filterDateOperator = $("filter-date-operator:" + id)
        if (filterDateOperator) return filterDateOperator.getValue()
        return config.dateOperator
    }

    function showFilterDateOperator() {
        const filterDateOperator = $("filter-date-operator:" + id)
        if (filterDateOperator) filterDateOperator.show()
    }

    function hideFilterDateOperator() {
        const filterDateOperator = $("filter-date-operator:" + id)
        if (filterDateOperator) filterDateOperator.hide()
    }

    function shouldHideFilterDateOperator() {
        if (getFieldType(fieldId) != "date") return true
        if (getFilterOperator().includes("empty")) return true
        return false
    }    

    function getFilterValue() {
        const filterValue = $("filter-value:" + id)
        return filterValue.getValue()
    }

    function setFilterValue(value) {
        const filterValue = $("filter-value:" + id)
        if (filterValue) filterValue.setValue(value)
    }

    function showFilterInput() {
        const filterValue = $("filter-value:" + id)
        if (filterValue) filterValue.show()
    }

    function hideFilterInput() {
        const filterValue = $("filter-value:" + id)
        if (filterValue) filterValue.hide()
    }
    
    function updateFilterOperator(fieldId) {
        // Reset the operator if its value is not part of the new possible operators
        const filterOperator = $("filter-operator:" + id)
        const newFilterOperators = generateFilterOperators(fieldId)
        filterOperator.updateOptions(newFilterOperators)
        
        const currentOperator = filterOperator.getValue()
        const hasOperator = newFilterOperators.findIndex(operator => operator.value == currentOperator)
        if (hasOperator == -1) filterOperator.setValue("")
    }

    function updateFilterDateOperator(fieldId) {
        const fieldType = getFieldType(fieldId)
        const filterOperator = getFilterOperator()

        if (fieldType == "date" && !filterOperator.includes("empty")) {
            showFilterDateOperator()
        } else {
            hideFilterDateOperator()
        }
    }

    function updateFilterInput(fieldId) {
        // Delete the previous input field
        let field = $("filter-value:" + id)
        let target = field.target
        field.deepDelete()

        // Rebuild a new field at the same position
        let fieldConfig = buildFilterInput(fieldId)
        fieldConfig.target = target
        let input = fieldConfig.renderer(fieldConfig)
        input.render()

        // Show/hide the input
        const fieldType = getFieldType(fieldId)
        const operatorValue = getFilterOperator()
        const dateOperatorValue = getFilterDateOperator()

        if (operatorValue.includes("empty") || (fieldType == "date" && dateOperatorValue.includes("today"))) {
            setFilterValue("")
            hideFilterInput()
        }
        else {
            showFilterInput()
        }
    }    

    /**
     * Define all the possible operators according to the field type.
     * The operator type tells weither it's suitable for text expressions, scalar expressions (numbers & dates), or both (*)
     * 
     * @param {string} fieldId 
     */
    const generateFilterOperators = function (fieldId) {
        const fieldType = getFieldType(fieldId)

        const possibleOperators = {
            text: ["=", "<>", "contains", "does not contain", "is empty", "is not empty"],
            password: ["is empty", "is not empty"],
            textarea: ["=", "<>", "contains", "does not contain", "is empty", "is not empty"],
            aiTextarea: ["=", "<>", "contains", "does not contain", "is empty", "is not empty"],
            number: ["=", "<>", "<", ">", "<=", ">=", "is empty", "is not empty"],
            rating: ["=", "<>", "<", ">", "<=", ">=", "is empty", "is not empty"],
            slider: ["=", "<>", "<", ">", "<=", ">=", "is empty", "is not empty"],
            date: ["=", "<>", "<", ">", "<=", ">=", "is empty", "is not empty"],
            checkbox: ["=", "<>", "is empty", "is not empty"],
            select: ["=", "<>", "contains", "does not contain", "is empty", "is not empty"],
            selectViewColumn: ["=", "<>", "contains", "does not contain", "is empty", "is not empty"],
            selectViewColumns: ["=", "<>", "contains", "does not contain", "is empty", "is not empty"],
            directory: ["contains", "does not contain", "is empty", "is not empty"],
            summary: ["=", "<>", "<", ">", "<=", ">=", "is empty", "is not empty"],
            attachment: ["is empty", "is not empty"],
            color: ["=", "<>", "is empty", "is not empty"],
            icon: ["=", "<>", "is empty", "is not empty"]
        } [fieldType]

        return [{
                label: "=",
                value: "="
            },
            {
                label: "<>",
                value: "<>"
            },
            {
                label: "<",
                value: "<"
            },
            {
                label: ">",
                value: ">"
            },
            {
                label: "<=",

                value: "<="
            },
            {
                label: ">=",
                value: ">="
            },
            {
                label: txtTitleCase("contains"),
                value: "contains"
            },
            {
                label: txtTitleCase("does not contain"),
                value: "does not contain"
            },
            {
                label: txtTitleCase("is empty"),
                value: "is empty"
            },
            {
                label: txtTitleCase("is not empty"),
                value: "is not empty"
            }
        ].filter(operator => possibleOperators.indexOf(operator.value) != -1)
    }

    /**
     * Build the configuration of an input field, according to the desired type (text | number | date | select | ...)
     * 
     * @param {string} fieldId
     * @returns {object} A field configuration, ready to be injected into the field builder function
     */
    function buildFilterInput(fieldId) {
        let fieldConfig = $(viewId).collection.model.getField(fieldId)
        let fieldType = getFieldType(fieldId)
        let isHidden = (filterOperator.includes("empty"))

        let fieldBuilderFunction = createField
        let checked = false
        let options = []
        let optionsFilter
        let shape = ""
        let lookup = {}
        let summary = {}
        let roles = []
        let unit
        let min
        let max
        
        switch (fieldType) {
            case "attachment":
            case "textarea":
            case "aiTextarea":
            case "selectViewColumn":
            case "selectViewColumns":
                fieldType = "text"
                break
            case "select":
                options = fieldConfig.options
                optionsFilter = fieldConfig.optionsFilter
                fieldBuilderFunction = createSelect
                break
            case "checkbox":
                shape = fieldConfig.shape
                fieldBuilderFunction = createCheckbox
                if (fieldValue == true) checked = true
                break
            case "slider":
                min = fieldConfig.min || 0
                max = fieldConfig.max || 100
                fieldBuilderFunction = createSlider
                break
            case "rating":
                shape = fieldConfig.shape || "star"
                min = fieldConfig.min || 0
                max = fieldConfig.max || 10
                color = fieldConfig.iconColorOn
                fieldBuilderFunction = createRating
                break
            case "color":
                fieldBuilderFunction = createColorField
                break
            case "icon":
                fieldBuilderFunction = createIconField
                break
            case "lookup":
                lookup = fieldConfig.lookup
                break
            case "summary":
                summary = fieldConfig.summary
                break
            case "directory":
                roles = ["userId"]
                fieldBuilderFunction = createDirectory
                break
            case "date":
                let dateOperator = getFilterDateOperator() || filterDateOperator
                if (dateOperator == "days from now" || dateOperator == "days ago") {
                    fieldType = "number"
                    unit = txt("days")

                } else if (dateOperator == "today") {
                    isHidden = true
                }
        }

        // Create an input field configuration with the right type
        return {
            hidden: isHidden,

            id: "filter-value:" + id,
            type: fieldType,
            label: txtTitleCase("value"),
            labelPosition: "top",
            minWidth: 250,

            value: fieldValue,
            min,
            max,
            unit,
            checked,
            draggable: true,
            allowValuesNotInList: true,

            // Special fields options
            renderer: fieldBuilderFunction, // renderer
            options, // select
            optionsFilter, // select
            optionsColor: color,
            roles, // directory
            shape, // checkbox
            iconColorOn: color, // checkbox
            iconSize: "20px", // checkbox
            lookup, // lookup field

            events: {
                change: function (event) {
                    // Update filter
                    let rootFilter = event.target.closest(".root-filter")
                    rootFilter.updateFilter()
                },
                dragstart: (event) => event.preventDefault()
            }
        }
    }

    /**
     * Block that contains all the filter's components
     * (delete button + field + operator + field value)
     */
    let dataFilter = createBlock({
        id: "filter-" + id,
        target: config.target,

        layout: "horizontal",
        alignItems: "center",
        draggable: true,
        class: "filter",

        items: [
            // DELETE BUTTON
            {
                id: "filter-delete:" + id,
                type: "button",
                icon: "fas fa-trash",
                iconColor: "var(--datatable-filter-buttons)",
                width: "30px",
                height: "30px",

                events: {
                    click: function (event) {
                        let filter = event.target.closest("a-block")
                        let rootFilter = event.target.closest(".root-filter")
                        let doUpdate = (filter.getFilter() != null)

                        filter.deepDelete()
                        if (doUpdate) rootFilter.updateFilter()
                    }
                }
            },
            // FIELD SELECTOR
            {
                id: "filter-field:" + id,
                type: "select",
                label: txtTitleCase("where field"),
                labelPosition: "top",
                width: 250,

                value: fieldId,
                options: selectFields,
                optionsColor: color,

                events: {
                    change: function (event) {
                        const fieldId = getFieldId()
                        updateFilterOperator(fieldId)
                        updateFilterDateOperator(fieldId)
                        updateFilterInput(fieldId)

                        // Update the global filter if the local filter is valid
                        const filter = event.target.closest("a-block")
                        if (filter.getFilter() == null) return
                        const rootFilter = event.target.closest(".root-filter")
                        rootFilter.updateFilter()
                    }
                }
            },
            // COMPARISON OPERATOR SELECTOR
            {
                id: "filter-operator:" + id,
                type: "select",
                label: txtTitleCase("operator"),
                labelPosition: "top",
                width: 150,

                autocomplete: "off",
                value: filterOperator,
                options: generateFilterOperators(fieldId),
                optionsColor: color,

                events: {
                    change: function (event) {
                        const fieldId = getFieldId()
                        updateFilterDateOperator(fieldId)
                        updateFilterInput(fieldId)

                        // Update filter
                        const filter = event.target.closest("a-block")
                        if (filter.getFilter() == null) return
                        const rootFilter = event.target.closest(".root-filter")
                        rootFilter.updateFilter()
                    }
                }
            },
            // COMPARISON MODIFIER FOR DATE FIELDS ONLY
            {
                hidden: shouldHideFilterDateOperator(),

                id: "filter-date-operator:" + id,
                type: "select",
                label: txtTitleCase("comparison"),
                labelPosition: "top",
                width: 150,

                autocomplete: "off",
                value: filterDateOperator,
                options: [{
                        label: txtTitleCase("exact date"),
                        value: "exact date"
                    },
                    {
                        label: txtTitleCase("today"),
                        value: "today"
                    },
                    {
                        label: txtTitleCase("days from now"),
                        value: "days from now"
                    },
                    {
                        label: txtTitleCase("days ago"),
                        value: "days ago"
                    }
                ],
                optionsColor: color,

                events: {
                    change: function (event, value) {
                        const fieldId = getFieldId()
                        updateFilterInput(fieldId)

                        // Update filter
                        const filter = event.target.closest("a-block")
                        if (filter.getFilter() == null) return
                        const rootFilter = event.target.closest(".root-filter")
                        rootFilter.updateFilter()
                    }
                }
            },
            // FIELD VALUE TO FILTER
            buildFilterInput(fieldId),
        ],

        // Put the currently dragged element available as a global context
        events: {
            dragstart: function (event) {
                kiss.context.draggedElement = event.target
            }
        },

        methods: {
            /**
             * Get the filter configuration.
             * 
             * @returns {object} The filter config
             * @example
             * {
             *   type: "filter",
             *   fieldId: "firstName",
             *   operator: "contains",
             *   value: "wilson"
             * }
             */
            getFilter: function () {
                const filterFieldId = getFieldId()
                const filterFieldType = getFieldType(filterFieldId)
                const filterOperator = getFilterOperator()
                const filterDateOperator = getFilterDateOperator()
                const filterValue = getFilterValue()

                // Exit if the filter is not valid
                if (
                    (filterFieldId === "")
                    || (filterOperator === "")
                    || ((filterValue === "") && !filterOperator.includes("empty") && !filterDateOperator.includes("today"))
                ) return null

                return {
                    type: "filter",
                    id: this.id,
                    fieldId: filterFieldId,
                    fieldType: filterFieldType,
                    operator: filterOperator,
                    dateOperator: filterDateOperator,
                    value: filterValue
                }
            }
        }
    })

    return dataFilter
}

;