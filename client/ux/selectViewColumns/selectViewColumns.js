/**
 * 
 * A *SelectViewColumns* field allows to select a record in a view, and assign values to multiple fields at once:
 * - this field
 * - other fields of the same record
 * 
 * The field value is set by getting the value of the foreign field which id is fieldId[0].
 * The other fields are set by comparing their label:
 * - if the foreign field has the same label as a field inside the record, it's a match: the local field is set
 * - otherwise, the foreign field is skipped
 * 
 * Example:
 * - you pick a product in a view showing all products
 * - it assigns the product name, product category and unit price at the same time
 * - if extra fields are present in the foreign record but not in the local record, they are skipped
 * 
 * @ignore
 * @param {object} config
 * @param {object} config.viewId - The view to pick records in
 * @param {object} config.fieldId - The field or fields which will be set when picking a record
 * @param {string|string[]} [config.value] - Default value
 * @param {string} [config.optionsColor] - Default color for all options
 * @param {boolean} [config.allowValuesNotInList] - Allow to create a new entry in the view
 * @param {function} [config.optionRenderer] - Custom function to render each option in the list of options
 * @param {function} [config.valueRenderer] - Custom function to render the actual field values
 * @param {string} [config.label]
 * @param {string} [config.labelWidth]
 * @param {string} [config.labelPosition] - left | right | top | bottom
 * @param {string} [config.labelAlign] - left | right
 * @param {boolean} [config.readOnly]
 * @param {boolean} [config.disabled]
 * @param {boolean} [config.required]
 * @param {string} [config.margin]
 * @param {string} [config.padding]
 * @param {string} [config.display] - flex | inline flex
 * @param {string|number} [config.width]
 * @param {string|number} [config.minWidth]
 * @param {string|number} [config.height]
 * @returns this
 * 
 */
kiss.ux.SelectViewColumns = class SelectViewColumns extends kiss.ui.Select {
    constructor() {
        super()
    }

    /**
     * @ignore
     */
    init(config = {}) {
        // Generates the <Select> field
        super.init(config)

        // View used to retrieve data
        this.viewId = config.viewId

        // Field to retrieve in the view
        this.fieldId = config.fieldId[0]

        // Other fields to set automatically
        this.otherFieldIds = config.fieldId.slice(1)

        // Allow to create a new value if necessary
        this.allowValuesNotInList = !!config.allowValuesNotInList

        // Overrides default click event
        this.onclick = this._handleClick

        // Disable the dropdown list that shows options
        this._showOptions = () => {}
        return this
    }

    /**
     * Handle the click event
     * 
     * @private
     * @ignore
     * @param {object} event 
     */    
    async _handleClick(event) {
        if (event.target.classList.contains("field-label")) return
        this._showView()
    }

    /**
     * Show the view to pick records in
     * 
     * @private
     * @ignore
     */
    async _showView() {
        const _this = this
        const viewRecord = await kiss.app.collections.view.findOne(this.viewId)
        this.viewModel = kiss.app.models[viewRecord.modelId]
        
        // Build the datatable
        const datatable = createDatatable({
            collection: this.viewModel.collection,
            sort: viewRecord.sort,
            filter: viewRecord.filter,
            group: viewRecord.group,

            canEdit: false,
            canAddField: false,
            canEditField: false,
            canCreateRecord: this.allowValuesNotInList,
            showActions: false,
            columns: viewRecord.config.columns,
            color: this.viewModel.color,
            height: () => kiss.screen.current.height - 250,

            methods: {
                selectRecord: async function(record) {
                    await _this.setValue(record)
                    this.closest("a-panel").close()
                },

                // Creates a new blank record
                async createRecord(model) {
                    const record = model.create()
                    const success = await record.save()
                    if (!success) return
                    createForm(record)
                }
            }
        })

        // Build the panel to embed the datatable
        createPanel({
            modal: true,
            closable: true,

            // Header
            title: "<b>" + this.viewModel.namePlural + "</b>",
            icon: this.viewModel.icon,
            headerBackgroundColor: this.viewModel.color,

            // Size and layout
            display: "flex",
            layout: "vertical",
            width: () => kiss.screen.current.width - 200,
            height: () => kiss.screen.current.height - 200,
            align: "center",
            verticalAlign: "center",
            autoSize: true,

            items: [datatable]
        }).render()
    }

    /**
     * Set the value of the field + other connected fields.
     * 
     * @ignore
     * @param {object} record
     * @returns this
     */
    async setValue(record) {
        let mapping = this.otherFieldIds.map(viewFieldId => {
            let label = this.viewModel.getField(viewFieldId).label
            let localField = this.record.model.getFieldByLabel(label) || {}
            return {
                label,
                id: localField.id,
                viewFieldId
            }
        }).filter(map => map.id)
        
        let update = {}
        update[this.id] = record[this.fieldId]
        mapping.forEach(map => update[map.id] = record[map.viewFieldId])

        await this.record.updateDeep(update)
        return this
    }
}

// Create a Custom Element
customElements.define("a-selectviewcolumns", kiss.ux.SelectViewColumns)

;