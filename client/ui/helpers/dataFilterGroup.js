/**
 * 
 * ## Creates a group of filters for a view
 * 
 * - the group allows to apply a boolean operator (AND / OR) to a list of filters.
 * - the goal is to be able to filter a collection of data with an easy drag&drop interface.
 * 
 * @ignore
 * @param {string} viewId - Target view to apply data filtering
 * @param {string} color - window color theme
 * @param {object} config
 * @param {string} [config.id] - Desired node id
 * @param {string} [config.target] - Node id where the filter group should be inserted
 * @param {boolean} config.canAddGroup - Display the button to add a subgroup
 * @param {boolean} config.canDeleteGroup - Display a trash button to delete the group
 * 
 * The method getFilters() of this component returns a hierarchical object containing all the filters.
 * "Get all people born in France within years 2000 and 2020, which last name is Dupont or Dupond":
 * 
 * @example
 * filters = {
 *  type: "group",
 *  operator: "and",
 *  filters: [
 *      {
 *          type: "group",
 *          operator: "and",
 *          filters: [
 *              {
 *                  type: "filter",
 *                  fieldId: "country",
 *                  operator: "=",
 *                  value: "France"
 *              },
 *              {
 *                  type: "filter",
 *                  fieldId: "birthDate",
 *                  operator: ">=",
 *                  value: "2000-01-01"
 *              },
 *              {
 *                  type: "filter",
 *                  fieldId: "birthDate",
 *                  operator: "<",
 *                  value: "2020-01-01"
 *              }
 *          ]
 *      },
 *      {
 *          type: "group",
 *          operator: "or",
 *          filters: [
 *              {
 *                  type: "filter",
 *                  fieldId: "lastName",
 *                  operator: "=",
 *                  value: "dupond"
 *              },
 *              {
 *                  type: "filter",
 *                  fieldId: "lastName",
 *                  operator: "=",
 *                  value: "dupont"
 *              }
 *          ]
 *      }
 *   ]
 * }
 */
const createDataFilterGroup = function (viewId, color, config) {
    let id = config.id || kiss.tools.shortUid()
    let filterContentId = "group-" + id

    let target = config.target || null
    let isRootFilter = config.isRootFilter || false

    // Setup group options
    let groupOperator = config.operator || "and"
    let canAddGroup = config.canAddGroup || false
    let canDeleteGroup = config.canDeleteGroup || false

    // Create the block that contains the group of filters
    let filterGroup = createBlock({
        id: "filter-group-" + id,
        target,

        layout: "horizontal",
        alignItems: "center",
        classes: {
            "this": "filter-group" + ((isRootFilter) ? " root-filter" : "")
        },

        items: [{
                layout: "horizontal",
                alignItems: "center",
                minWidth: 128,

                items: [
                    // Button to add a new subgroup within this group
                    {
                        hidden: !canAddGroup,

                        id: "filter-group-add:" + id,
                        type: "button",
                        icon: "fas fa-plus",
                        iconColor: "var(--datatable-filter-buttons)",
                        width: "30px",
                        height: "30px",
                        tip: {
                            text: txtTitleCase("add a subgroup"),
                            deltaX: 0,
                            deltaY: 20
                        },

                        events: {
                            click: function () {
                                let filterGroup = this.closest(".filter-group")
                                filterGroup.addFilterGroup({
                                    target: filterContentId,
                                    canDeleteGroup: true
                                })
                            }
                        }
                    },
                    // Button to delete the filter group
                    {
                        hidden: !canDeleteGroup,

                        id: "filter-group-delete:" + id,
                        type: "button",
                        icon: "fas fa-trash",
                        iconColor: "var(--datatable-filter-buttons)",
                        width: "30px",
                        height: "30px",

                        events: {
                            click: function (event) {
                                let rootFilter = this.closest(".root-filter")
                                $("filter-group-" + id).deepDelete()
                                rootFilter.updateFilter()
                            }
                        }
                    },
                    // Field to select AND / OR operator
                    {
                        id: "filter-group-operator:" + id,
                        type: "select",
                        autocomplete: "off",
                        width: 80,

                        value: groupOperator,
                        options: [{
                                label: txtTitleCase("and"),
                                value: "and"
                            },
                            {
                                label: txtTitleCase("or"),
                                value: "or"
                            }
                        ],
                        optionsColor: "#00aaee",

                        events: {
                            change: function(event) {
                                // Update the filter
                                let rootFilter = this.closest(".root-filter")
                                rootFilter.updateFilter()
                            }
                        }
                    }
                ]
            },
            // Block that contains both:
            // - the filters
            // - the button to add a filter
            {
                class: "filter-group-content",
                layout: "vertical",
                items: [
                    // Block that contains all the filters of this group
                    {
                        id: "group-" + id,
                        flex: 1,
                        class: "filter-group-items",
                        filters: []
                    },
                    // Space between filters and button
                    {
                        type: "spacer",
                        height: "10px"
                    },
                    // Button to add a new filter within this group
                    {
                        type: "button",
                        text: txtTitleCase("add a filter"),
                        icon: "fas fa-plus",
                        iconColor: "var(--datatable-filter-buttons)",
                        width: 150,
                        height: 30,

                        events: {
                            click: function () {
                                let filterGroup = this.closest(".filter-group")
                                filterGroup.addFilter({
                                    fieldId: "",
                                    operator: "=",
                                    value: ""
                                })
                            }
                        }
                    },
                    // Space between button and border
                    {
                        type: "spacer",
                        height: "10px"
                    }
                ],

                events: {
                    dragenter: function(event) {
                        this.classList.add("filter-group-dragover")
                    },
                    dragover: function(event) {
                        event.preventDefault()
                    },
                    dragleave: function(event) {
                        if (kiss.tools.isEventInElement(event, this)) return
                        this.classList.remove("filter-group-dragover")
                    },
                    ondrop: function (event) {
                        event.stop()
                        // The currently dragged element is kept into the kiss.context.draggedElement object
                        kiss.views.removeAndCacheNode(kiss.context.draggedElement.id)
                        kiss.context.draggedElement.render(filterContentId)

                        // Update the filter
                        let rootFilter = event.target.closest(".root-filter")
                        rootFilter.updateFilter()
                    }
                }                
            }
        ],

        methods: {
            /**
             * Show / Hide the button to delete a filter group
             * 
             * @param {*} visible 
             * @returns {object} The button
             */
            toggleDeleteGroupButton: function (visible) {
                let deleteGroupButton = $("filter-group-delete:" + id)
                return (visible) ? deleteGroupButton.show() : deleteGroupButton.hide()
            },

            /**
             * Add a list of filters to the filter group.
             * Each filter can be a single filter, or a filter group, so the function is called recursively.
             * 
             * @param {array} filters - Array of filters
             * @example
             * [{
             *     type: "filter",
             *     fieldId: "firstName",
             *     operator: "contains",
             *     value: "wilson"
             *   },
             *   {
             *     type: "filter",
             *     fieldId: "birthDate",
             *     operator: ">",
             *     value: "2020-01-01"
             *   }
             * ]
             */
            addFilters: function (filters) {
                if (!filters) return

                filters.forEach(filterConfig => {
                    if (filterConfig) {
                        if (filterConfig.type == "filter") {
                            this.addFilter(filterConfig)
                        } else {
                            this.addFilterGroup(filterConfig)
                        }
                    }
                })
            },

            /**
             * Add a filter to the group
             * 
             * @param {string} config.target - DOM Element where the filter should be inserted
             */
            addFilter: function (config) {
                config.target = filterContentId
                createDataFilter(viewId, color, config).render()
            },

            /**
             * Add a filter group to the group (which allows to create nested groups)
             * 
             * @param {string} config.target - DOM Element where the filter group should be inserted
             * @param {string} config.canDeleteGroup - True to add a delete button to the group
             */
            addFilterGroup: function (config) {
                config.target = filterContentId
                config.canDeleteGroup = true
                createDataFilterGroup(viewId, color, config).render()
            },

            /**
             * Get the filter group configuration.
             * 
             * @returns {object} The filter group config
             * @example:
             * {
             *      type: "group",
             *      operator: "and",
             *      filters: [
             *          {
             *              type: "filter",
             *              fieldId: "firstName",
             *              operator: "contains",
             *              value: "wilson"
             *          },
             *          {
             *              type: "filter",
             *              fieldId: "birthDate",
             *              operator: ">",
             *              value: "2020-01-01"
             *          }
             *      ]
             * }
             */
            getFilters: function () {
                // Get the group operator (AND / OR)
                let operator = $("filter-group-operator:" + id).getValue()

                // Parse group items
                let filterGroup = this.querySelector(".filter-group-items")//.firstChild
                let filters = []

                Array.from(filterGroup.children).forEach(filter => {
                    if (filter.id.indexOf("filter-group") != -1) {
                        // If it's a filter group, then we get the filters of the group recursively
                        let newGroupFilter = filter.getFilters()

                        // If the filter group contains no item, we skip it
                        if (newGroupFilter == null) return null

                        // Otherwise add it to the list of filters
                        filters.push(filter.getFilters())
                    } else {
                        // If it's a single filter, we directly get the filter values
                        filters.push(filter.getFilter())
                    }
                })

                // If the group is empty, we skip it
                if (filters.length == 0) return null

                // If the group contains a single item, we don't return a group of filters, but a single filter
                if (filters.length == 1) return filters[0]

                // Returns the filters in the appropriate format
                return {
                    type: "group",
                    id: this.id,
                    operator: operator,
                    filters: filters
                }
            },

            /**
             * Update the filter
             */
            updateFilter() {
                let newFilterConfig = this.getFilters() || {}
                kiss.pubsub.publish("EVT_VIEW_FILTERING:" + viewId, newFilterConfig)
            }
        }
    }).render()

    // If the group have filters passed as parameter, we add them directly after render
    if (config.filters) filterGroup.addFilters(config.filters)

    return filterGroup
}

;