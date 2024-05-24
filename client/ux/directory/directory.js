/**
 * 
 * A *Directory* field allows to select users, groups, roles.
 * It also handles API clients, which can be considered as users with specific rights inside an application.
 * 
 * It has some special options compared to the standard <Select> field:
 * - users: use false to hide users
 * - groups: use false to hide groups
 * - roles: add custom roles in the list (like "everyone", "nobody, "creator"...)
 * - apiClients: use true to show them
 * - sortBy: to sort by first name or last name
 * - nameOrder: to display the first name or the last name first
 * - sortOrder: use "asc" or "desc"
 * - displayAsCards: to display the selected users as nice colored card
 * 
 * @ignore
 * @param {object} config
 * @param {boolean} [config.multiple] - True to enable multi-select - Default to true
 * @param {boolean} [config.users] - true to list the users - Default to true
 * @param {boolean} [config.groups] - true to list the groups - Default to true
 * @param {object[]} [config.roles] - list of custom roles like: ["everyone", "authenticated", "creator", "userId", "nobody"]
 * @param {boolean} [config.apiClients] - true to list the API clients - Default to false
 * @param {string} [config.sortBy] - Use "firstName" or "lastName", to sort users according to their first name or last name
 * @param {string} [config.nameOrder] - Use "firstName" or "lastName", to show users like "Smith John" or "John Smith"
 * @param {string} [config.sortOrder] - Use "asc" (default) or "desc", to change the sort order for users and groups
 * @param {boolean} [config.displayAsCards] - true to display values as cards
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
 * @param {boolean} [config.disabled] - TODO
 * @param {boolean} [config.required] - TODO
 * @param {string} [config.margin]
 * @param {string} [config.padding]
 * @param {string} [config.display] - flex | inline flex
 * @param {string|number} [config.width]
 * @param {string|number} [config.minWidth]
 * @param {string|number} [config.height]
 * @returns this
 * 
 */
kiss.ux.Directory = class Directory extends kiss.ui.Select {
    constructor() {
        super()
    }

    /**
     * @ignore
     */
    init(config = {}) {
        // Defaults
        config.multiple = !!config.multiple
        config.optionRenderer = this.optionRenderer
        config.allowDuplicates = false
        config.allowClickToDelete = true
        config.maxHeight = (kiss.screen.isMobile) ? "calc(100% - 32px)" : 420

        // Load options for users and/or groups and/or roles
        this.showUsers = (config.users !== false)
        this.showGroups = (config.groups !== false)
        this.showRoles = (Array.isArray(config.roles) && config.roles.length > 0)
        this.showApiClients = (config.apiClients === true)
        this.roles = config.roles || []

        // Define icons for each entry type
        this.types = {
            user: "fas fa-user directory-user-icon",
            group: "fas fa-user-friends directory-group-icon",
            role: "fas fa-key directory-role-icon",
            api: "fas fa-plug directory-role-icon"
        }

        // If true, display values as cards
        this.displayAsCards = config.displayAsCards

        // Ordering
        this.nameOrder = config.nameOrder || "lastName"
        this.sortBy = config.sortBy || "lastName"
        this.sortOrder = config.sortOrder || "asc"

        // Readonly
        this.readOnly = !!config.readOnly || !!config.computed

        // Generates the <Select> field
        super.init(config)
        
        if (!this.readOnly) {
            // Override click event
            this.onclick = function (event) {
                event.stop()
                const classes = event.target.classList
                if (classes.contains("field-select-value-delete")) return this._deleteValueByClick(event)
                else if (classes.contains("field-select-value")) return this._showOptions()
                else if (classes.contains("field-select-values")) return this._showOptions()
                else if (classes.contains("field-select")) return this._showOptions()
                else if (classes.contains("field-select-input")) return this._showOptions()
                else if (classes.contains("directory-item-initials")) return this._showOptions()
                else if (classes.contains("directory-item-title")) return this._showOptions()
                else if (classes.contains("directory-item-subtitle")) return this._showOptions()
                else if (classes.contains("field-option")) return this._selectOption(event)
            }
        }

        return this
    }

    /**
     * Defines how values are displayed
     * 
     * @private
     * @ignore
     */
    _renderValues() {
        this._loadOptions()

        // Check if the field is empty
        let isEmpty = false

        if (this.multiple) {
            if (this.value && Array.isArray(this.value) && this.value.length == 0) isEmpty = true
        } else {
            if (this.value === undefined || this.value === "") isEmpty = true
        }

        if (isEmpty) {
            this.fieldValues.innerHTML = ""
            this._adjustSizeAndPosition()
            return
        }

        // Set the value renderer
        let renderer = (this.displayAsCards) ? (this._renderValueAsCard).bind(this) : (this._renderValue).bind(this)

        // Separate values by <br> if the option "stackValues" is true
        let htmlSeparator = (this.stackValues) ? "<br>" : ""

        this.fieldValues.innerHTML = []
            .concat(this.value)
            .filter(value => value != "" && value != undefined && value != null)
            .map(value => {
                let option = this.options.find(option => option.value == value)

                if (option) return renderer(option)

                if (this.allowValuesNotInList) return renderer({
                    label: value,
                    value
                })
            })
            .join(htmlSeparator)

        // Adjust the size of the options wrapper depending on the field content
        this._adjustSizeAndPosition()
    }

    /**
     * Default renderer to render a single value
     * 
     * @private
     * @ignore
     * @param {object} option 
     */
    _renderValue(option) {
        return /*html*/ `
            <div class="field-select-value" value="${option.value}" ${(option.color || this.optionsColor) ? `style="background: ${option.color || this.optionsColor}"` : ""}>
                ${option.label || option.value}
                ${(this.allowClickToDelete == true) ? `<span class="field-select-value-delete fas fa-times"></span>` : ""}
            </div>
        `.removeExtraSpaces()
    }

    /**
     * Extended renderer to render a single value
     * 
     * @private
     * @ignore
     * @param {object} option 
     */
    _renderValueAsCard(option) {
        let initials = kiss.directory.getUserInitials(option)
        let userColor = kiss.directory.getEntryColor(option.value)

        return /*html*/ `
            <div class="field-select-value directory-item" value="${option.value}">
                <span class="directory-item-initials" style="background: ${userColor}">${initials}</span>
                <div class="directory-item-infos">
                    <span class="directory-item-title">${option.label}</span>
                    <span class="directory-item-subtitle">${option.value}</span>
                </div>
                ${(this.allowClickToDelete == true) ? `<span class="field-select-value-delete fas fa-times"></span>` : ""}
            </div>
        `.removeExtraSpaces()
    }

    /**
     * Create the list of options
     */
    async _createOptions() {
        await this._loadOptions()
        super._createOptions()
    }

    /**
     * Get the list of possible values from the directory
     * 
     * @private
     * @ignore
     */
    _loadOptions() {
        if (this.isLoaded) return

        this.options = []

        if (this.showRoles) {
            kiss.directory._initRoles()
            this.options = this.options.concat(this.roles.map(roleId => kiss.directory.roles[roleId]))
        }
        if (this.showUsers != false) this.options = this.options.concat(this.getUsers())
        if (this.showGroups == true) this.options = this.options.concat(this.getGroups())
        if (this.showApiClients == true) this.options = this.options.concat(this.getApiClients())

        this.isLoaded = true
    }

    /**
     * Get users
     * 
     * @ignore
     * @returns {object[]} Array of users
     */
    getUsers() {
        return kiss.directory
            .getUsers({
                sortBy: this.sortBy,
                sortOrder: this.sortOrder,
                nameOrder: this.nameOrder,
                onlyActiveUsers: true
            })
            .map(user => {
                return {
                    type: "user",
                    label: user.name,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    value: user.email
                }
            })
    }

    /**
     * Get groups
     * 
     * @ignore
     * @returns {object[]} Array of groups
     */
    getGroups() {
        return kiss.directory
            .getGroups(this.sortOrder)
            .map(group => {
                return {
                    type: "group",
                    label: group.name,
                    value: group.id
                }
            })
    }

    /**
     * Get API clients
     * 
     * @ignore
     * @returns {object[]} Array of API clients
     */
    getApiClients() {
        return kiss.directory
            .getApiClients()
            .map(client => {
                return {
                    type: "api",
                    label: client.name,
                    value: client.id
                }
            })
    }    

    /**
     * Defines how options are displayed
     * 
     * @ignore
     */
    optionRenderer(option) {
        return `<span class="${this.types[option.type]} field-option-icon" style="color: #00aaee"></span>${option.label}`
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-directory", kiss.ux.Directory)
const createDirectory = (config) => document.createElement("a-directory").init(config)

;