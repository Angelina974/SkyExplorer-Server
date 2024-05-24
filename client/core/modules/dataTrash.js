/**
 * 
 * ## Trash / Recycle bin
 * 
 * This module manage the deletion and restoration of records.
 * It provides a default UI (a datatable) to see the deleted records and restore them.
 * 
 * @namespace
 * 
 */
kiss.data.trash = {
    /**
     * Get the records that have been sent to trash
     * 
     * @param {string} [modelId] - Optional modelId to filter the deleted records of a single model
     * @returns {object[]} The deleted records
     */
    async getRecords(modelId) {
        const query = {
            sort: [{
                deleteAt: "desc"
            }]
        }

        if (modelId) {
            query.filter = {
                sourceModelId: this.modelId
            }
            query.filterSyntax = "mongo"
        }

        return await kiss.app.collections.trash.find(query, true)
    },

    /**
     * Show the deleted records for a given model
     * 
     * @param {object} config
     * @param {string} config.modelId - Mandatory model id
     * @param {object} [config.filter] - Optional filter
     * @param {object} [config.filterSyntax] - "mongo" (default) | "normalized"
     * @param {object} [config.sort] - Optional sort
     * @param {object} [config.sortSyntax] - "mongo" | "normalized" (default)
     */
    async showRecords(config) {
        // Build the panel to show the datatable
        if (!config || !config.modelId) return
        const model = kiss.app.models[config.modelId]
        if (!model) return

        const temporaryCollection = new kiss.data.Collection({
            id: "temp_" + uid(),
            model: kiss.app.models.trash
        })

        Object.assign(temporaryCollection, {
            filter: config.filter || {
                type: "filter",
                fieldId: "sourceModelId",
                operator: "=",
                value: config.modelId
            },
            sort: config.sort || [{
                deletedAt: "desc"
            }],

            filterSyntax: config.filterSyntax || "normalized",
            sortSyntax: config.sortSyntax || "normalized"
        })
        
        // Force the table to display the deletion event
        const columns = [{
            id: "deletedAt",
            title: txtTitleCase("#deletedAt"),
            type: "date"
        },
        {
            id: "deletedBy",
            title: txtTitleCase("#deletedBy"),
            type: "directory"
        }]

        //model.getFieldsAsColumns().slice(0, 10)
        const tempPanelId = kiss.tools.shortUid()

        const datatable = createDatatable({
            type: "datatable",
            model: model,
            collection: temporaryCollection,
            columns,
            canFilter: false,
            canGroup: false,

            // Options
            color: model.color,
            showHeader: true,
            showToolbar: true,
            showActions: false,
            canSelect: false,
            canEdit: false,
            canAddField: false,
            canEditField: false,
            canCreateRecord: false,
            iconAction: "fas fa-recycle",

            buttons: [
                {
                    position: 1,
                    text: txtTitleCase("empty the trash"),
                    icon: "fas fa-trash",
                    iconColor: "var(--red)",
                    action: async () => {
                        if (temporaryCollection.records.length == 0) {
                            return createNotification(txtTitleCase("#warning trash empty"))
                        }
                        
                        const firstRecord = temporaryCollection.records[0]
                        const canDelete = await kiss.acl.check({
                            action: "delete",
                            record: firstRecord
                        })
                        
                        if (!canDelete) {
                            return createNotification(txtTitleCase("#not authorized"))
                        }

                        kiss.data.trash.empty(model.id)
                    }
                }
            ],

            subscriptions: {
                "EVT_DB_DELETE_MANY:TRASH": function() {
                    this.reload()
                }
            },

            methods: {
                selectRecord: async (record) => {
                    createDialog({
                        title: txtTitleCase("#restore"),
                        icon: "fas fa-recycle",
                        message: txtTitleCase("#restore confirm"),
                        action: async () => {
                            const success = await kiss.data.trash.restoreRecord(record.id)
                            if (!success) createNotification(txtTitleCase("#restore error"))

                            $(tempPanelId).close()
                        }
                    })
                }
            }
        })

        createPanel({
            id: tempPanelId,
            modal: true,
            draggable: true,
            closable: true,
            expandable: true,

            // Header
            title: txtTitleCase("#deleted records") + " <b>" + model.namePlural + "</b>",
            icon: model.icon,
            headerBackgroundColor: model.color,

            // Size and layout
            display: "flex",
            layout: "vertical",
            width: () => kiss.screen.current.width - 200,
            height: () => kiss.screen.current.height - 200,
            align: "center",
            verticalAlign: "center",
            autoSize: true,
            items: [{
                flex: 1,
                layout: "vertical",
                items: [datatable]
            }],

            // When closing the panel, we must destroy the datatable temporary source collection
            events: {
                onclose: () => temporaryCollection.destroy()
            }
        }).render()
    },

    /**
     * Restore a given record to its original collection
     * 
     * @param {string} recordId 
     * @returns {boolean} true if the record could be restored
     */
    async restoreRecord(recordId) {
        log("kiss.data.trash - Restore record " + recordId)
        
        const record = await kiss.app.collections.trash.findOne(recordId, true)
        const recordData = record.getRawData()
        const model = kiss.app.models[recordData.sourceModelId]

        // Re-creates the record in the collection
        delete recordData.sourceModelId
        const newRecord = model.create(recordData)
        const success = await newRecord.save()

        // Delete the record from the trash collection
        if (success) {
            await record.delete()
            return true
        }
        
        return false
    },

    /**
     * Empty the trash
     * 
     * @param {string} modelId 
     */
    empty(modelId) {
        createDialog({
            type: "danger",
            title: txtTitleCase("empty the trash"),
            message: txtTitleCase("#warning empty trash"),
            buttonOKPosition: "left",
            action: async () => {
                await kiss.app.collections.trash.deleteMany({
                    sourceModelId: modelId
                })
            }
        })
    }
}

;