/**
 * 
 * Generates a window to select a record from a list of records.
 * Records are displayed in a datatable.
 * 
 * Important:
 * - This function is only used by the "link" field type.
 * - If the user updates the datatable config (columns, sorts, ...), the configuration is automatically stored in the "view" collection.
 * 
 * @ignore
 * @param {object} model - source model
 * @param {string} fieldId - id of the LINK field which genenrated this window
 * @param {object[]} [records] - Optionnal records to display in the datatable
 * @param {function} [selectRecord] - Optional callback function executed when a record is selected inside the datatable. By default, opens the record.
 * @param {object} [datatableConfig] - Optional parameters to adjust the datatable configuration
 * 
 */
const createRecordSelectorWindow = function(model, fieldId, records, selectRecord, datatableConfig) {
    if (Array.isArray(records) && records.length == 0) return

    const isMobile = kiss.screen.isMobile
    let tempModel = {}
    let tempCollection
    const useMemory = (records) ? true : false
    const tempDatatableId = kiss.tools.shortUid()

    // Defines a default behavior when selecting a record.
    if (!selectRecord) {
        selectRecord = async function(record) {
            // In offline, we need to re-create a temp in-memory record
            if (kiss.session.isOffline()) {
                let tempRecord = await kiss.db.findOne(model.id, record.id)
                record = model.create(tempRecord)
            }
            
            createForm(record)
            this.closest("a-panel").close()
        }
    }

    // Responsive options
    let responsiveOptions

    if (isMobile) {
        responsiveOptions = {
            expandable: false,
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            borderRadius: "0 0 0 0",
            padding: 0
        }
    }
    else {
        responsiveOptions = {
            expandable: true,
            width: () => kiss.screen.current.width - 100,
            height: () => kiss.screen.current.height - 100
        }
    }

    // Build the panel to show the datatable
    createPanel({
        modal: true,
        closable: true,

        // Header
        title: "<b>" + model.namePlural + "</b>",
        icon: model.icon,
        headerBackgroundColor: model.color,

        // Size and layout
        display: "flex",
        layout: "vertical",
        align: "center",
        verticalAlign: "center",
        autoSize: true,
        ...responsiveOptions,

        items: [{
            id: tempDatatableId,
            flex: 1,
            layout: "vertical"
        }],

        // When closing the panel, we must destroy the datatable's temporary source collection
        events: {
            onclose: function () {
                tempCollection.destroy(useMemory)
            }
        },

        methods: {
            async _afterRender() {

                // To insert temp documents in offline mode, we need to build a temporary duplicate in-memory model with a different id,
                // otherwise, working with the temp collection alters the source NeDb collection
                if (records && kiss.session.isOffline()) {
                    Object.assign(tempModel, model)
                    tempModel.id = kiss.tools.uid()
                    tempModel = new kiss.data.Model(tempModel)
                }
                else {
                    tempModel = model
                }

                // Get the record holding the datatable config, or create a new one
                let viewRecord = kiss.app.collections.view.records.find(view => view.fieldId == fieldId)

                let filter = {}
                let sort = [{
                    [model.getPrimaryKeyField().id]: "asc" // Sort on the primary key field by default
                    // "createdAt": "desc" // Sort on the creation date by default
                }]

                if (viewRecord) {
                    if (viewRecord.sort) {
                        sort = viewRecord.sort
                    }
                    if (viewRecord.filter) {
                        filter = viewRecord.filter
                    }
                }

                // Build a temporary collection for the datatable
                tempCollection = new kiss.data.Collection({
                    id: "temp_" + uid(),
                    mode: (useMemory) ? "memory" : kiss.db.mode,
                    model: tempModel,
                    sort,
                    filter
                })
                
                if (records) await tempCollection.insertMany(records)
                
                // If the datatable doesn't have any "view" record to store its config, we create a new one
                if (!viewRecord) {
                    viewRecord = kiss.app.models.view.create({
                        id: kiss.tools.uid(),
                        type: "datatable",
                        fieldId, // <= This key is important to link the datatable to the field
                        modelId: model.id,
                        filter: {},
                        sort: [],
                        projection: {},
                        group: [],
                        config: {
                            columns: model.getFieldsAsColumns()
                        },
                        authenticatedCanRead: true
                    })
                    await viewRecord.save()
                }

                // Finally, build the datatable
                let config = {
                    id: "datatable-" + tempDatatableId,
                    fieldId,
                    type: "datatable",
                    collection: tempCollection,
                    record: viewRecord,
                    autoSize: true,

                    // Options
                    showHeader: true,
                    showToolbar: true,
                    showActions: false,
                    showLinks: false,
                    canEdit: false,
                    canAddField: false,
                    canEditField: false,
                    canCreateRecord: false,
                    color: model.color,

                    // Mobile options
                    canSelectFields: (isMobile) ? false : true,
                    canSort: (isMobile) ? false : true,
                    canFilter: (isMobile) ? false : true,
                    canGroup: (isMobile) ? false : true,
                    showGroupButtons: (isMobile) ? false : true,
                    showLayoutButton: (isMobile) ? false : true,
                    showScroller:  (isMobile) ? false : true,

                    // Override the method to select records
                    methods: {
                        selectRecord
                    }
                }

                if (datatableConfig) Object.assign(config, datatableConfig)
                const datatable = createDatatable(config)

                setTimeout(() => $(tempDatatableId).setItems([datatable]), 50)
            }
        }
    }).render()
}

;