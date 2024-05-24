/**
 * 
 * A *SelectViewColumn* field allows to select values from a view column
 * 
 * @ignore
 * @param {object} config
 * @param {boolean} [config.multiple] - True to enable multi-select - Default to true
 * @param {string|string[]} [config.value] - Default value
 * @param {string} [config.optionsColor] - Default color for all options
 * @param {string} [config.valueSeparator] - Character used to display multiple values
 * @param {string} [config.inputSeparator] - Character used to input multiple values
 * @param {boolean} [config.stackValues] - True to render the values one on another
 * @param {boolean} [config.hideInput] - true (default) to automatically hide the input field after a completed search
 * @param {boolean} [config.allowValuesNotInList] - Allow to input a value which is not in the list of options
 * @param {boolean} [config.allowDuplicates] - Allow to input duplicate values. Default to false.
 * @param {boolean} [config.allowClickToDelete] - Add a "cross" icon over the values to delete them. Default to false.
 * @param {boolean} [config.allowSwitchOnOff] - Allow to click on a value to switch it on/off
 * @param {function} [config.optionRenderer] - Custom function to render each option in the list of options
 * @param {function} [config.valueRenderer] - Custom function to render the actual field values
 * @param {string} [config.label]
 * @param {string} [config.labelWidth]
 * @param {string} [config.labelPosition] - left | right | top | bottom
 * @param {string} [config.labelAlign] - left | right
 * @param {boolean} [config.autocomplete] - Set "off" to disable
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
kiss.ux.SelectViewColumn = class SelectViewColumn extends kiss.ui.Select {
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
        this.fieldId = config.fieldId
        return this
    }

    /**
     * Create the list of options
     * 
     * @private
     * @ignore
     */
    async _createOptions() {
        await this._loadOptions()
        super._createOptions()
    }

    /**
     * Get the list of possible values from the view column
     * 
     * @private
     * @ignore
     */
    async _loadOptions() {
        if (this.isLoaded) return
        this.options = []
        const viewRecord = kiss.app.collections.view.records.find(view => view.id == this.viewId)
        const collection = viewRecord.getCollection()

        await collection.find()
        this.options = collection.records

        // Exclude group records
        if (collection.group.length > 0) {
            this.options = this.options.filter(record => !record.$type)
        }

        // Exclude records with empty values
        this.options = this.options.filter(record => !!record[this.fieldId])

        // Convert records to options
        this.options = this.options.map(record => {
            const fieldValue = record[this.fieldId]
            return {
                value: (Array.isArray(fieldValue)) ? fieldValue[0] : fieldValue
            }
        })

        // Remove duplicates
        this.options = this.options.uniqueObject("value")

        // Sort alphabetically
        this.options = this.options.sortBy("value")

        this.isLoaded = true
    }
}

// Create a Custom Element
customElements.define("a-selectviewcolumn", kiss.ux.SelectViewColumn)

;