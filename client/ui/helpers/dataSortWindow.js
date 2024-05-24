/**
 * 
 * Main interface to SORT a collection
 * 
 * @ignore
 */
const createDataSortWindow = function (viewId, color = "#00aaee") {
    const sortWindowId = "sort-selection-for-" + viewId
    const sortListId = "sort-list-for-" + viewId
    const sortFieldId = "sort-create-for-view-" + viewId

    let sortWindow = createPanel({
        id: sortWindowId,
        title: txtTitleCase("sorting options"),
        icon: "fas fa-sort",
        headerBackgroundColor: color,

        modal: true,
        closable: true,
        draggable: true,

        layout: "vertical",
        items: [
            // BLOCK TO DISPLAY EXISTING SORTING OPTIONS
            {
                id: sortListId,
                layout: "vertical"
            },
            {
                layout: "horizontal",
                items: [
                    // FIELD TO ADD A SORT OPTION
                    {
                        id: sortFieldId,
                        type: "select",
                        label: txtTitleCase("select a field to sort by"),
                        width: 500,
                        fieldWidth: 300,
                        labelWidth: 200,
                        labelPosition: "left",
                        margin: "0px 0px 0px 36px",

                        multiple: false,
                        events: {
                            change: async (event) => {

                                // Publish a sort event to update the view
                                kiss.pubsub.publish("EVT_VIEW_SORTING:" + viewId, {
                                    viewId: viewId,
                                    sortFieldName: event.target.value,
                                    sortDirection: "asc",
                                    sortIndex: $(viewId).sort.length
                                })

                                // Reset the field value
                                $(sortFieldId).resetValue()
                            }
                        }
                    }
                ]
            }
        ],

        subscriptions: {
            "EVT_DB_UPDATE:VIEW": (msgData) => {
                if ($(sortWindowId) && (msgData.id == viewId) && (msgData.userId != kiss.session.getUserId())) $(sortWindowId).load()
            },
            ["EVT_VIEW_SORTED:" + viewId]: () => $(sortWindowId).load()
        },        

        // Render (or re-render) sorting options each time the sort window is displayed
        methods: {
            load: function () {
                this.renderExistingOptions()
            },

            /**
             * Render existing sort options in the pop-up window
             * (it builds a sort widget for each sort option)
             */
            renderExistingOptions: function () {
                // Reset the existing sort options
                this.resetExistingOptions()

                // Build the current list of sort options
                let sortIndex = 0
                const remainingSortFields = this.getRemainingSortFields()
                let currentSortConfig = $(viewId).sort || []

                currentSortConfig.forEach(sortOption => {
                    let sortField = Object.keys(sortOption)[0]
                    let sortDirection = sortOption[sortField]
                    createDataSort(viewId, sortField, sortDirection, sortIndex, remainingSortFields, color).render("sort-list-for-" + viewId)
                    sortIndex++
                })

                // Reset the possible sort options for the field used to add sort options
                const sortField = $(sortFieldId)
                sortField._hideOptions()
                sortField.updateOptions(remainingSortFields)
            },

            /**
             * Reset the content of the block containing the sort options
             */
            resetExistingOptions: () => $("sort-list-for-" + viewId).deepDelete(false),

            /**
             * - Get the fields which the view can still be sorted by.
             * - This is the list of fields, minus the fields already used.
             * - The returned array always have the full list of fields, but fields that can't be used anymore for sorting are disabled.
             * 
             * @returns {array} The list of remaining fields, ready to be injected into a Select field
             * @example
             * [{label: "First name", value: "firstName", disabled: false, color: "#00aaee"}, {...}, ...]
             */
            getRemainingSortFields: function () {
                // Get current sort fields
                const currentSortConfig = $(viewId).sort || []
                const currentSortFields = currentSortConfig.map(sortField => Object.keys(sortField)[0])

                // Build the list of remaining fields (= prevent to sort twice on the same field)
                let remainingSortFields = []
                const model = $(viewId).collection.model
                const isDynamicModel = kiss.tools.isUid(model.id)
                const fields = model.getSortableFields()

                for (let i = 0, length = fields.length; i < length; i++) {
                    const field = fields[i]
                    const disabled = !((field.deleted != true) && (currentSortFields.indexOf(field.id) == -1))
                    const needsTranslation = (field.isSystem || field.isFromPlugin) ? true : false

                    remainingSortFields.push({
                        label: (isDynamicModel && !needsTranslation) ? field.label.toTitleCase() : txtTitleCase(field.label),
                        value: field.id,
                        disabled: disabled // This makes the field unavailable for sorting
                    })
                }
                return remainingSortFields
            }
        }
    })

    return sortWindow
}

;