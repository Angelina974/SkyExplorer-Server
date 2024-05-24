/**
 * 
 * Create a new widget used to sort a data collection by field.
 * It's composed of:
 * - a delete button, to remove the sort option
 * - a field selector
 * - a sort direction selector (ascending / descending)
 * 
 * @ignore
 * @param {string} viewId - Id the widget containing this sort widget
 * @param {string} fieldId - Field to sort by
 * @param {string} sortDirection - "asc" or "desc"
 * @param {number} sortIndex - Index of the sorting option (within the array of sort options)
 * @param {array} sortFields
 * 
 */
const createDataSort = function (viewId, fieldId, sortDirection, sortIndex, sortFields, color) {
    return createBlock({
        class: "data-sorter",
        layout: "horizontal",
        alignItems: "center",
        items: [
            // DELETE BUTTON
            {
                id: "sort-delete-for-view-" + viewId + "-index:" + sortIndex,
                type: "html",
                width: "20px",
                html: `<span class="fa fa-times data-sorter-delete"></span>`,
                events: {
                    click: (event) => {
                        let sortIndex = event.target.closest("a-html").id.split(":")[1]
                        
                        // Publish a sort event to update the active view
                        kiss.pubsub.publish("EVT_VIEW_SORTING:" + viewId, {
                            sortAction: "remove",
                            sortIndex: sortIndex
                        })
                    }
                }
            },
            // FIELD SELECTOR
            {
                id: "sort-field-for-view-" + viewId + "-index:" + sortIndex,
                type: "select",
                label: (sortIndex == 0) ? txtTitleCase("sort by") : txt("then by"),

                width: 500,
                fieldWidth: 300,
                labelWidth: 200,
                labelPosition: "left",

                value: [fieldId],
                multiple: false,
                options: sortFields,
                optionsColor: color,
                events: {
                    change: async (event) => {
                        let sortDirectionId = event.target.id.replace("field", "direction")
                        let sortDirection = $(sortDirectionId).getValue()
                        if (sortDirection == "") sortDirection = "asc"

                        // Publish a sort event to update the view
                        kiss.pubsub.publish("EVT_VIEW_SORTING:" + viewId, {
                            sortFieldName: event.target.value,
                            sortDirection: sortDirection,
                            sortIndex: event.target.id.split(":")[1]
                        })
                    }
                }
            },
            // SORT DIRECTION SELECTOR
            {
                id: "sort-direction-for-view-" + viewId + "-index:" + sortIndex,
                type: "checkbox",
                label: txtTitleCase("inverse order"),
                labelWidth: 200,
                labelPosition: "right",
                checked: (sortDirection == "desc"),

                shape: "switch",
                iconSize: "20px",
                iconColorOn: color,

                events: {
                    change: async (event) => {
                        let isChecked = event.target.getValue()
                        let sortDirection = (isChecked) ? "desc" : "asc"
                        let sortFieldId = event.target.id.replace("direction", "field")
                        let fieldName = $(sortFieldId).getValue()
                        if (fieldName == "") return

                        // Publish a sort event to update the view
                        kiss.pubsub.publish("EVT_VIEW_SORTING:" + viewId, {
                            sortFieldName: fieldName,
                            sortDirection: sortDirection,
                            sortIndex: event.target.id.split(":")[1]
                        })
                    }
                }
            }
        ]
    })
}

;