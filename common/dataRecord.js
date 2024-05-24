kiss.data.RecordFactory = function (modelId) {
    /**
     * To see how a **Record** relates to models, fields and collections, please refer to the [Model documentation](kiss.data.Model.html).
     * 
     * A Record can't be instanciated directly.
     * You have to use the Model's **create** method:
     * ```
     * let myUser = userModel.create({
     *      firstName: "Bob",
     *      lastName: "Wilson"
     * })
     * ```
     * A record automatically has default methods for CRUD operations:
     * - save
     * - read
     * - update
     * - delete
     * 
     * @class
     * @param {object} [recordData] - Optional data used to create the record
     * @param {boolean} [inherit] - If true, create a blank record then assign recordData to it
     * @returns {object} Record
     * 
     * @example
     * // Get the "user" model
     * const userModel = kiss.app.models.user
     * 
     * // Create a new user instance
     * const myUser = userModel.create({
     *  firstName: "Bob",
     *  lastName: "Wilson",
     *  email: "bob.wilson@gmail.com"
     * })
     * 
     * // Save the new record
     * await myUser.save()
     * 
     * // Call custom model's method
     * myUser.sendEmail({
     *  subject: "Hello ${myContact.firstName}",
     *  message: "How are you?"
     * })
     * 
     * // Update the record
     * await myUser.update({
     *  firstName: "Bobby"
     * })
     * 
     * // Delete the record
     * await myUser.delete()
     * 
     */
    const Record = class {

        constructor(recordData, inherit) {
            this.model = kiss.app.models[modelId]
            this.db = this.model.db

            if (!recordData || inherit) {
                this.id = uid()
                this.createdAt = new Date().toISOString()
                this.createdBy = kiss.session.getUserId()

                this._initDefaultValues()
                this._computeFields()
            } else {
                this.id = recordData.id || uid()
                Object.assign(this, recordData)
            }

            if (inherit) Object.assign(this, recordData)

            return this
        }

        /**
         * Set or restore the model's default values
         * 
         * Default values can be predefined values like:
         * - username
         * - today
         * - now
         * - unid
         * 
         * @private
         * @ignore
         * @returns this
         */
        _initDefaultValues() {
            const primaryKeyField = this.model.getPrimaryKeyField()

            this.model.getFields().forEach(field => {
                let defaultValue = field.value

                if (defaultValue === 0) {
                    this[field.id] = defaultValue
                    return
                }

                if (defaultValue && typeof defaultValue == "string") {

                    // Process special date formatting like:
                    // today+10, today-5
                    if ((defaultValue.includes("today+") || defaultValue.includes("today-"))) {
                        const daysFromNow = Number(field.value.split("today")[1])
                        if (!isNaN(daysFromNow)) {
                            let newDate = (new Date()).addDays(daysFromNow)
                            defaultValue = newDate.toISO()
                        }
                    }

                    if (defaultValue.includes("username")) defaultValue = defaultValue.replace("username", kiss.session.getUserId())
                    else if (defaultValue.includes("today")) defaultValue = defaultValue.replace("today", new Date().toISO())
                    else if (defaultValue.includes("now")) defaultValue = defaultValue.replace("now", kiss.tools.getTime())
                    else if (defaultValue.includes("unid")) defaultValue = defaultValue.replace("unid", kiss.tools.shortUid().toUpperCase())
                    else {
                        if (defaultValue.includes("{YYYY}")) defaultValue = defaultValue.replace("{YYYY}", new Date().getFullYear())
                        if (defaultValue.includes("{MM}")) defaultValue = defaultValue.replace("{MM}", (new Date().getMonth() + 1).toString().padStart(2, "0"))
                        if (defaultValue.includes("{DD}")) defaultValue = defaultValue.replace("{DD}", (new Date().getDate()).toString().padStart(2, "0"))
                        if (defaultValue.includes("{hh}")) defaultValue = defaultValue.replace("{hh}", (new Date().getHours()).toString().padStart(2, "0"))
                        if (defaultValue.includes("{mm}")) defaultValue = defaultValue.replace("{mm}", (new Date().getMinutes()).toString().padStart(2, "0"))
                        if (defaultValue.includes("{ss}")) defaultValue = defaultValue.replace("{ss}", (new Date().getSeconds()).toString().padStart(2, "0"))
                        if (defaultValue.includes("{XX}")) defaultValue = defaultValue.replace("{XX}", kiss.tools.shortUid().toUpperCase().slice(0, 2))
                        if (defaultValue.includes("{NN}")) defaultValue = defaultValue.replace("{NN}", (Math.floor(Math.random() * 100) + "").padStart(2, "0"))
                    }

                    this[field.id] = defaultValue

                } else if (defaultValue) {

                    this[field.id] = defaultValue

                }
            })
            return this
        }

        /**
         * Check the permission (client-side) to perform an action on the record.
         * 
         * @param {string} action - "update" | "delete"
         * @returns {boolean} true if the permission is granted
         */
        async checkPermission(action) {
            const hasPermission = await kiss.acl.check({
                action,
                record: this
            })

            if (!hasPermission) {
                createNotification(txtTitleCase("#not authorized"))
                return false
            }

            return true
        }

        /**
         * Check if the record has changed since its last state
         * 
         * @param {object} [data] - Optional data to compare
         * @returns {boolean}
         */
        hasChanged(data) {
            if (!data) data = this.getSanitizedData()

            const currentState = JSON.stringify(data)
            if (currentState == this.lastState) return false

            this.lastState = currentState
            return true
        }

        /**
         * Get the record's sanitized data to keep only the model's fields
         * 
         * @returns {object} The sanitized data
         */
        getSanitizedData() {
            const data = {
                id: this.id
            }

            // this.model.getFields().forEach(field => {
            //     data[field.id] = this[field.id]
            // })

            // Include revision fields
            // const revisionFields = ["createdAt", "createdBy", "updatedAt", "updatedBy", "deletedAt", "deletedBy"]
            // revisionFields.forEach(fieldId => {
            //     data[fieldId] = this[fieldId]
            // })

            this.model.fields.forEach(field => {
                data[field.id] = this[field.id]
            })

            return data
        }

        /**
         * Save a record in the database
         * 
         * @async
         * @returns {boolean} true if successfuly created, false otherwise
         * 
         * @example
         * let newUser = userModel.create({firstName: "Bob", lastName: "Wilson"})
         * await newUser.save() // Insert the record into the database
         * newUser.lastName = "SMITH" // Update a property
         * await newUser.update() // Update the existing record according to the new data
         * await newUser.update({lastName: "JONES"}) // Explicit update of the lastName (same as above)
         */
        async save() {
            let loadingId

            try {
                log("kiss.data.Record - save " + this.id)
                const data = this.getSanitizedData()

                // Check permission to create
                const permission = await this.checkPermission("create")
                if (!permission) return false

                // Update db, wherever it is: in memory, offline or online
                loadingId = kiss.loadingSpinner.show()
                const response = await this.db.insertOne(this.model.id, data)
                kiss.loadingSpinner.hide(loadingId)

                if (response.error) {
                    log("kiss.data.Record - Error: " + response.error, 4)
                    return false
                }
                return true

            } catch (err) {
                log("kiss.data.Record - save - Error:", 4, err)
                kiss.loadingSpinner.hide(loadingId)
            }
        }

        /**
         * Get the record's data from the database and update the record's instance.
         * It guaranties to get the last version of the record locally in case it was updated remotely.
         * 
         * @async
         * @returns this
         * 
         * @example
         * console.log(user) // Bob Wilson
         * await user.read()
         * console.log(user) // Bob WILSON JR
         */
        async read() {
            let record = await this.db.findOne(this.model.id, this.id)
            Object.assign(this, record)
            return this
        }

        /**
         * Update the record in the database
         * TODO: apply data validation
         * 
         * @async
         * @param {object} [update] - Optional update. If not specified, updates all the fields.
         * @param {boolean} [silent] - Set to true to hide the loading spinner (update in the background)
         * @returns {boolean} true if updated successfuly
         * 
         * @example
         * await myTask.update({status: "done"})
         * 
         * // Will work too but not optimal because it will save the whole record
         * myTask.status = "done"
         * await myTask.update() 
         */
        async update(update, silent) {
            let loadingId

            try {
                log("kiss.data.Record - update " + this.id, 0, update)
                if (!silent) loadingId = kiss.loadingSpinner.show()

                // Exit if no changes
                if (!this.hasChanged(update)) {
                    log("kiss.data.Record - update - Record didn't change, exit!")
                    if (!silent) kiss.loadingSpinner.hide(loadingId)
                    return true
                }

                const permission = await this.checkPermission("update")
                if (!permission) {
                    kiss.loadingSpinner.hide(loadingId)
                    return false
                }

                if (!update) update = this.getSanitizedData()

                Object.assign(this, update)

                const response = await this.db.updateOne(this.model.id, this.id, update)
                if (!silent) kiss.loadingSpinner.hide(loadingId)
                return response

            } catch (err) {
                log("kiss.data.Record - update - Error:", 4, err)
                if (!silent) kiss.loadingSpinner.hide(loadingId)
                return false
            }
        }

        /**
         * Update multiple fields
         * 
         * This update propagates other mutations inside the same record and also in foreign records
         * 
         * @async
         * @param {string} fieldId
         * @param {*} value
         * @param {object} transaction - The global Transaction object that contains all the database mutations to perform at once
         * @returns {boolean} true if the field was updated successfuly
         * 
         * @example
         * await user.updateDeep({
         *  fistName: "Bob",
         *  lastName: "Wilson"
         * })
         */
        async updateDeep(update) {
            let loadingId

            try {
                log(`kiss.data.Record - updateDeep ${this.id} / ${update}`)
                loadingId = kiss.loadingSpinner.show()

                const permission = await this.checkPermission("update")
                if (!permission) {
                    kiss.loadingSpinner.hide(loadingId)
                    return false
                }

                // Update the field and propagate the change
                const response = await this.db.updateOneDeep(this.model.id, this.id, update)

                kiss.loadingSpinner.hide(loadingId)

                if (response) return true

            } catch (err) {
                log("kiss.data.Record - updateDeep - Error:", 4, err)
                kiss.loadingSpinner.hide(loadingId)
                return false
            }
        }

        /**
         * Update a single field of the record
         * 
         * This update propagates other mutations inside the same record and also in foreign records
         * 
         * @async
         * @param {string} fieldId
         * @param {*} value
         * @returns {boolean} true if the field was updated successfuly
         * 
         * @example
         * await user.updateFieldDeep("lastName", "Wilson")
         */
        async updateFieldDeep(fieldId, value) {
            let loadingId

            try {
                log(`kiss.data.Record - updateFieldDeep ${this.id} / ${fieldId} / ${value}`)
                loadingId = kiss.loadingSpinner.show()

                const permission = await this.checkPermission("update")
                if (!permission) {
                    kiss.loadingSpinner.hide(loadingId)
                    return false
                }

                // Update the field and propagate the change
                const response = await this.db.updateOneDeep(this.model.id, this.id, {
                    [fieldId]: value
                })

                kiss.loadingSpinner.hide(loadingId)

                if (response) return true

            } catch (err) {
                log("kiss.data.Record - updateFieldDeep - Error:", 4, err)
                kiss.loadingSpinner.hide(loadingId)
                return false
            }
        }

        /**
         * Delete the record from the database
         * 
         * @async
         * @param {boolean} [sendToTrash] - If true, keeps the original record in a "trash" collection. Default = false
         * @returns {boolean} true if deleted successfuly
         * 
         * @example
         * await myTask.delete()
         */
        async delete(sendToTrash) {
            let loadingId

            try {
                log("kiss.data.Record - delete " + this.id)
                loadingId = kiss.loadingSpinner.show()

                const permission = await this.checkPermission("delete")
                if (!permission) {
                    kiss.loadingSpinner.hide(loadingId)
                    return false
                }

                const response = await this.db.deleteOne(this.model.id, this.id, sendToTrash)
                kiss.loadingSpinner.hide(loadingId)

                return response

            } catch (err) {
                log("kiss.data.Record - update - Error:", 4, err)
                kiss.loadingSpinner.hide(loadingId)
                return false
            }
        }

        /**
         * Create a new record in the join table to link the 2 records
         * 
         * @ignore
         * @param {object} foreignRecord 
         * @param {string} localLinkFieldId 
         * @param {string} foreignLinkFieldId
         */
        async linkTo(foreignRecord, localLinkFieldId, foreignLinkFieldId) {
            let loadingId

            try {
                log(`kiss.data.Record - linkTo ${this.id} / ${foreignRecord.id}`)
                loadingId = kiss.loadingSpinner.show()

                const linkModel = kiss.app.models.link
                const linkInfos = {
                    id: kiss.tools.uid(),
                    mX: this.model.id,
                    rX: this.id,
                    fX: localLinkFieldId,
                    mY: foreignRecord.model.id,
                    rY: foreignRecord.id,
                    fY: foreignLinkFieldId // Never used
                }
                const newLink = linkModel.create(linkInfos)
                await newLink.save()

                // Re-compute all fields of both records with the new link
                await this.db.updateLink(linkInfos)

                kiss.loadingSpinner.hide(loadingId)
            } catch (err) {
                log("kiss.data.Record - linkTo - Error:", 4, err)
                kiss.loadingSpinner.hide(loadingId)
            }
        }

        /**
         * Delete a link between 2 records.
         * 
         * @ignore
         * @param {string} linkId - id of the record in the join table
         */
        async deleteLink(linkId) {
            let loadingId

            try {
                log(`kiss.data.Record - deleteLink ${this.id} / ${linkId}`)
                loadingId = kiss.loadingSpinner.show()

                const linkModel = kiss.app.models.link
                const linkRecord = await linkModel.collection.findOne(linkId)
                const linkInfos = await linkRecord.getData()

                const result = await linkRecord.delete()
                if (!result) {
                    kiss.loadingSpinner.hide(loadingId)
                    return false
                }

                // Re-compute all fields of both records without the link
                await this.db.updateLink(linkInfos)

                kiss.loadingSpinner.hide(loadingId)
                return result

            } catch (err) {
                log("kiss.data.Record - linkTo - Error:", 4, err)
                kiss.loadingSpinner.hide(loadingId)
            }
        }

        /**
         * Get the data and populate the fields linked to foreign records.
         * 
         * The function is recursive and explore all the records connections.
         * To avoid endless loops, each model that has already been explored is "skipped" from inner exploration.
         * In a future evolution, we may also allow exploration of the same model in inner exploration, but limiting it to a predefined depth.
         * 
         * @param {pbject} config
         * @param {boolean} [config.useLabels] - If true, use labels as exported keys. Default to false
         * @param {boolean} [config.convertNames] - If true, convert emails and groups ids to directory names
         * @param {boolean} [config.numberAsText] - If true, convert numbers to text with fixed number of digits according to the defined precision. Default to false
         * @param {boolean} [config.includeLinks] - If true, explore links and includes them as nested data. Default to false
         * @param {number} [config.linksDepth] - Maximum depth when exploring the links. Default to 1, meaning it only gets the direct relationships.
         * @param {boolean} [config.sortLinks] - If true, check if the links have been sorted by the user. Default to false
         * @param {string[]} [config.projection] - Keep only the fields specified in this array. All fields by default.
         * @param {string[]} [skipIds] - Model ids to skip in the exploration of nested data
         * @param {string} [accountId] - For server only: accountId allows to retrieve the right directory to merge directory fields
         * @returns {object} Record's data, like: {a: 1, b: 2}
         * 
         * @example
         * myRecord.getData() // {"aEf32x": "Bob", "e07d58": "Wilson"}
         * myRecord.getData({useLabels: true}) // {"First name": "Bob", "Last name": "Wilson"}
         * 
         */
        async getData(config = {}, skipIds, accountId) {
            const recordData = {
                id: this.id
            }

            // Update the list of models that must be skipped when "link" fields are populated
            const modelId = this.model.id
            const skipModelIds = (Array.isArray(skipIds)) ? skipIds : []
            skipModelIds.push(modelId)

            // Update the current depth
            config.linksDepth = (config.linksDepth != undefined) ? config.linksDepth : 1
            const depth = config.linksDepth - 1
            const newConfig = Object.assign({}, config, {
                linksDepth: depth
            })
            
            let fields = this.model.fields.filter(field => !field.deleted)
            if (config.projection) {
                fields = fields.filter(field => config.projection.includes(field.id) || config.projection.includes(field.label))
            }

            for (let field of fields) {
                const fieldLabel = (config.useLabels == true) ? field.label : (field.id || field.label)

                // Link fields are populated with the linked records values
                if (field.type == "link") {

                    // Exploration of the relationships is limited to the defined depth
                    if (config.includeLinks == true && depth >= 0) {
                        const linkedModelId = field.link.modelId

                        // To avoid endless loop, We can't explore the same model twice
                        if (!skipModelIds.includes(linkedModelId)) {
                            let sort
                            if (config.sortLinks) sort = await this._getLinkFieldSortConfig(linkedModelId, field.id)
                            const links = await kiss.data.relations.getLinksAndRecords(modelId, this.id, field.id, sort)
                            const linkedRecords = links.map(link => link.record)
                            const connectedRecords = []

                            // For each linked record, try to get data recursively
                            for (let linkData of linkedRecords) {
                                const linkedRecord = kiss.app.models[linkedModelId].create(linkData)
                                const linkedRecordData = await linkedRecord.getData(newConfig, skipModelIds, accountId)
                                connectedRecords.push(linkedRecordData)
                            }
                            recordData[fieldLabel] = connectedRecords
                        }
                    } else {
                        recordData[fieldLabel] = []
                    }
                } else {
                    let value = this[field.id]

                    if (config.numberAsText && (field.type == "number" || (field.type == "lookup" && field.lookup.type == "number") || (field.type == "summary" && field.summary.type == "number"))) {
                        // Cast number to text with fixed precision
                        const precision = (field.precision != undefined) ? field.precision : 2
                        value = Number(value).round(precision).toFixed(precision)

                    } else if (config.convertNames && field.type == "directory") {
                        // Cast user id fields to directory names
                        if (kiss.isClient) {
                            value = (!value) ? [] : kiss.directory.getEntryNames([].concat(value))
                        } else {
                            value = (!value) ? [] : kiss.directory.getEntryNames(accountId, [].concat(value))
                        }

                    } else if (field.exporter && typeof field.exporter === "function") {
                        // If a plugin field has a special exporter, we use it
                        value = field.exporter(value)
                    }

                    if (value == undefined) value = ""
                    recordData[fieldLabel] = value
                }
            }

            return recordData
        }

        /**
         * Get the view configuration associated to a link field, if any
         * 
         * @private
         * @ignore
         * @param {string} modelId 
         * @param {string} fieldId 
         * @returns {object[]} The sort configuration (normalized), or null
         */
        async _getLinkFieldSortConfig(modelId, fieldId) {
            const viewRecord = await kiss.db.findOne("view", {
                modelId,
                fieldId
            })
            if (viewRecord && viewRecord.sort) return viewRecord.sort
            return null
        }        

        /**
         * Get the files attached to the record
         * 
         * @returns {object[]} The list of file objects
         * 
         * @example
         * [
         *     {
         *         "id": "dbba41cc-6ec6-4bb9-981a-4e27eafb20b9",
         *         "filename": "logo 8.png",
         *         "path": "https://pickaform-europe.s3.eu-west-3.amazonaws.com/files/a50616e1-8cce-4788-ae4e-7ee10d35b5f2/2022/06/17/logo%208.png",
         *         "size": 7092,
         *         "type": "amazon_s3",
         *         "mimeType": "image/png",
         *         "thumbnails": {
         *              // Thumbnails infos
         *         },
         *         "createdAt": "2022-06-16T20:49:29.349Z",
         *         "createdBy": "john.doe@pickaform.com"
         *     },
         *     {
         *          "id": "0185c4f3-e3ff-7933-a1f2-e06459111665",
         *          "filename": "France invest.PNG",
         *          "path": "uploads\\01847546-a751-7a6e-9e6a-42b8b8e37570\\2023\\01\\18\\France invest.PNG",
         *          "size": 75999,
         *          "type": "local",
         *          "mimeType": "image/png",
         *          "thumbnails": {
         *              // Thumbnails infos
         *          },
         *          "createdAt": "2023-01-18T12:56:36.095Z",
         *          "createdBy": "georges.lucas@pickaform.com"
         *      }
         * ]
         */
        getFiles() {
            const attachmentFields = this.model.getFieldsByType("attachment").filter(field => !field.deleted)
            return attachmentFields.filter(field => this[field.id] !== undefined).map(field => this[field.id]).flat()
        }

        /**
         * Get record's raw data.
         * 
         * @returns {object}
         */
        getRawData() {
            return kiss.tools.snapshot(this)
        }

        /**
         * Compute the local computed fields when initializing a record.
         * lookup and summary fields are excluded because they are necessarily empty for a blank record.
         * 
         * @private
         * @ignore
         * @param {string} updatedFieldId 
         * @param {number} depth 
         */
        _computeFields(updatedFieldId, depth = 0) {
            if (depth > 10) return
            depth++

            for (let computedFieldId of this.model.computedFields) {
                const computedField = this.model.getField(computedFieldId)
                const computedFieldCurrentValue = this[computedField.id]

                if (computedFieldId != updatedFieldId // Don't recompute the same record 
                    &&
                    computedField.type != "lookup" // New records have no links => no lookups
                    &&
                    computedField.type != "summary" // New records have no links => no summary
                    &&
                    (!updatedFieldId || computedField.formulaSourceFieldIds.includes(updatedFieldId))
                ) {
                    let newComputedFieldValue = this._computeField(computedField)
                    if (newComputedFieldValue !== undefined && newComputedFieldValue !== computedFieldCurrentValue) {
                        // If the field's value changed, we propagate it to all form fields (except the field itself)
                        this[computedField.id] = newComputedFieldValue
                        this._computeFields(computedField.id, depth)
                    }
                }
            }
        }

        /**
         * Compute a single computed field
         * 
         * @private
         * @ignore
         * @param {object} field 
         * @returns The computed value, or "" in case of error
         */
        _computeField(field) {
            try {
                let newValue = kiss.formula.execute(field.formula, this, this.model.getActiveFields())
                return newValue
            } catch (err) {
                log.err("kiss.data - Record.computeField - Error:", err)
                return ""
            }
        }
    }

    // Attach the Model's method to the Record's prototype.
    // This allows to use model's methods on every record instanciated from this Record class.
    const model = kiss.app.models[modelId]
    Object.keys(model.methods).forEach(methodName => {
        Record.prototype[methodName] = model.methods[methodName]
    })

    return Record
}

;