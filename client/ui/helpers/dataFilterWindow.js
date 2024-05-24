/**
 * 
 * Main interface to filter data of a data component
 * 
 * @ignore
 */
const createDataFilterWindow = function (viewId, color = "#00aaee") {
    const filterWindowId = "filter-selection-for-" + viewId

    let filterWindow = createPanel({
        id: filterWindowId,
        title: txtTitleCase("filter your data"),
        icon: "fas fa-filter",
        headerBackgroundColor: color,
        minWidth: "800px",

        modal: true,
        draggable: true,
        closable: true,

        maxHeight: () => kiss.screen.current.height - 100,
        align: "center",
        verticalAlign: "center",
        overflowY: "auto",

        items: [
            // Placeholder for the query builder
            {
                id: "query-builder-" + viewId
            }
        ],

        methods: {
            // Build or re-build the filter interface from the current filter configuration
            load: function () {
                let fields = $(viewId).collection.model.getFields()

                let filterGroup = {
                    isRootFilter: true,
                    canAddGroup: true,
                    id: viewId,
                    target: "query-builder-" + viewId,
                    fields: fields,
                }

                let filter = $(viewId).filter || {}

                if (Object.keys(filter).length != 0) {
                    if (filter.type == "filter") {
                        filterGroup.filters = [filter]
                    } else {
                        filterGroup.operator = filter.operator
                        filterGroup.filters = filter.filters
                    }
                }

                createDataFilterGroup(viewId, color, filterGroup)
            }
        }
    })

    return filterWindow
}

;