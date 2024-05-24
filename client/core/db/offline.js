/**
 * 
 * ## Offline database wrapper with Nedb
 * 
 * @namespace
 * 
 */
kiss.db.offline = {
    mode: "offline",

    // Store the various offline collections
    collections: {},

    // Convert id to _id
    toId(record) {
        record.id = record._id
        delete record._id
        return record
    },

    toIds(records) {
        records.forEach(record => {
            record.id = record._id
            delete record._id
        })
        return records
    },

    toMongoId(record) {
        record._id = record.id
        delete record.id
        return record
    },

    toMongoIds(records) {
        records.forEach(record => {
            record._id = record.id
            delete record.id
        })
        return records
    },

    /**
     * Creates a new collection
     * 
     * Does not do anything if the collection already exists.
     * This method should not be called directly: collections are created automatically by requesting them.
     * 
     * @ignore
     * @async
     * @param {string} modelId
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * @returns {promise} Promise to have a collection created if it doesn't exist yet
     */
    async createCollection(modelId, dbMode = "offline") {
        log(`kiss.db.offline - createCollection <${modelId}> in mode <${(dbMode == "memory") ? "memory" : "offline"}>`)

        const newCollection = new Nedb({
            filename: modelId,
            autoload: true,
            timestampData: true,
            inMemoryOnly: (dbMode === "memory")
        })

        const collection = this.collections[modelId] = this.nedbWrapper.fromInstance(newCollection)
        await collection.loadDatabase()

        return collection
    },

    /**
     * Get a collection
     * 
     * This method should not be called directly: NeDb collections are retrieved automatically when requesting them.
     * 
     * @ignore
     * @async
     * @param {string} modelId
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * @returns {promise} Promise to have a collection
     */
    async getCollection(modelId, dbMode = "offline") {
        if (!this.collections[modelId]) await this.createCollection(modelId, dbMode)
        return this.collections[modelId]
    },

    /**
     * Delete the local NeDb collection (memory or offline)
     * 
     * @async
     * @param {string} modelId
     * @returns {promise} Promise to have a the collection deleted
     */
    async deleteCollection(modelId) {
        const collection = this.collections[modelId]
        if (!collection) return

        collection.remove({}, {
            multi: true
        }, function (err, numRemoved) {
            if (err) {
                log("kiss.db.offline - deleteCollection - Error:", 4, err)
            } else {
                log("kiss.db.offline - deleteCollection - Num removed: " + numRemoved, 2)
            }
        })

        this.collections[modelId] = null
    },

    /**
     * Create an index for a collection
     * 
     * According to NeDb, this can give a significant performance boost when reading data.
     * 
     * @async
     * @param {string} modelId 
     * @param {string} fieldName
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * @returns {promise} Promise to have a collection index created
     * 
     * @example
     * await db.offline.createCollectionIndex("users", {fieldName: "firstName"})
     */
    async createCollectionIndex(modelId, fieldName, dbMode = "offline") {
        const collection = await this.getCollection(modelId, dbMode)
        collection.ensureIndex({
            fieldName: fieldName
        })
    },

    /**
     * Insert one record in a collection. See [db.insertOne](kiss.db.html#.insertOne)
     * 
     * @async
     * @param {string} modelId
     * @param {object} record - A single record
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * @returns {object} The inserted record data
     */
    async insertOne(modelId, record, dbMode = "offline") {
        log("kiss.db - " + dbMode + " - insertOne - Model " + modelId, 0, record)

        const collection = await this.getCollection(modelId, dbMode)
        record.createdBy = kiss.session.getUserId()

        this.toMongoId(record)
        const insertedRecord = await collection.insert(record)
        this.toId(record)

        // Broadcast
        const channel = "EVT_DB_INSERT:" + modelId.toUpperCase()
        kiss.pubsub.publish(channel, {
            channel,
            dbMode,
            accountId: kiss.session.getCurrentAccountId(),
            userId: kiss.session.getUserId(),
            modelId,
            id: record.id,
            data: record
        })

        return insertedRecord
    },

    /**
     * Insert many records in a collection. See [db.insertMany](kiss.db.html#.insertMany)
     * 
     * @async
     * @param {string} modelId
     * @param {object[]} records - An array of records [{...}, {...}] for bulk insert
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * @returns {object[]} The array of inserted records data
     */
    async insertMany(modelId, records, dbMode = "offline") {
        log("kiss.db - " + dbMode + " - insertMany - Model" + modelId + " / " + records.length + " record(s)", 0, records)

        const collection = await this.getCollection(modelId, dbMode)
        const createdBy = kiss.session.getUserId()
        records.forEach(record => record.createdBy = createdBy)

        this.toMongoIds(records)
        const insertedRecords = await collection.insert(records)
        this.toIds(records)

        // Broadcast
        const channel = "EVT_DB_INSERT_MANY:" + modelId.toUpperCase()
        kiss.pubsub.publish(channel, {
            channel,
            dbMode,
            accountId: kiss.session.getCurrentAccountId(),
            userId: kiss.session.getUserId(),
            modelId,
            data: records
        })

        return insertedRecords
    },

    /**
     * Update a record then propagate the mutation to foreign records.
     * Note: it will generate a transaction processed with kiss.db.updateBulk
     * 
     * @async
     * @param {string} modelId
     * @param {string} recordId
     * @param {string} [update] - If not specified, re-compute all the computed fields
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * @returns {boolean} true if the update is successful
     * 
     * @example
     * await kiss.db.updateOneDeep("company", "f07xF008d", {"name": "pickaform"})
     */    
    async updateOneDeep(modelId, recordId, update, dbMode = "offline") {
        log("kiss.db - " + dbMode + " - updateOneDeep - Model " + modelId + " / Record " + recordId, 0, update)

        const model = kiss.app.models[modelId]
        const record = await model.collection.findOne(recordId)

        return await kiss.data.relations.updateOneDeep(model, record, update)
    },

    /**
     * Update the 2 records connected by a link
     * 
     * @param {object} linkRecord
     * @returns The transaction result
     */    
     async updateLink(linkRecord) {
        log("kiss.db - offline - updateLink: ", 0, linkRecord)

        return await kiss.data.relations.updateLink(linkRecord)
    },

    /**
     * Update a single record in a collection. See [db.updateOne](kiss.db.html#.update)
     * 
     * @async
     * @param {string} modelId
     * @param {string} recordId
     * @param {string} update - Specifies how the record should be updated
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * @returns {object} The updated record
     */
    async updateOne(modelId, recordId, update, dbMode = "offline") {
        log("kiss.db - " + dbMode + " - updateOne - Model " + modelId + " / Record " + recordId, 0, update)

        const collection = await this.getCollection(modelId, dbMode)
        update.updatedBy = kiss.session.getUserId()

        const response = await collection.update({
            _id: recordId
        }, {
            $set: update
        }, {
            upsert: false
        })

        // Broadcast
        const channel = "EVT_DB_UPDATE:" + modelId.toUpperCase()
        kiss.pubsub.publish(channel, {
            channel,
            dbMode,
            accountId: kiss.session.getCurrentAccountId(),
            userId: kiss.session.getUserId(),
            modelId,
            id: recordId,
            data: update
        })

        return response
    },

    /**
     * Update many records in a single collection. See [db.updateMany](kiss.db.html#.updateMany)
     * 
     * @async
     * @param {string} modelId
     * @param {object} query
     * @param {object} update
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * 
     * TODO: NOT USED / NOT TESTED YET
     */
    async updateMany(modelId, query, update, dbMode = "offline") {
        log("kiss.db - " + dbMode + " - updateMany - Model " + modelId, 0, update)

        const collection = await this.getCollection(modelId, dbMode)
        update.updatedBy = kiss.session.getUserId()

        const response = await collection.update(query, {
            $set: update
        }, {
            multi: true
        })

        // Broadcast
        const channel = "EVT_DB_UPDATE_MANY:" + modelId.toUpperCase()
        kiss.pubsub.publish(channel, {
            channel,
            dbMode,
            accountId: kiss.session.getCurrentAccountId(),
            userId: kiss.session.getUserId(),
            modelId,
            data: update
        })

        return response
    },

    /**
     * Update many records in multiple collections. See [db.updateBulk](kiss.db.html#.updateBulk)
     * TODO: group operations by collection to avoid reseting the collection in the loop
     * TODO: use PromiseAll to parallelize update operations
     * 
     * @async
     * @param {object[]} operations - The list of updates to perform
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * @returns {object} response - Empty object for offline/memory database
     */
    async updateBulk(operations, dbMode = "offline") {
        log("kiss.db - " + dbMode + " - updateBulk", 0, operations)

        const updatedBy = kiss.session.getUserId()

        for (let operation of operations) {

            const collection = await this.getCollection(operation.modelId, dbMode)
            operation.updates.updatedBy = updatedBy

            await collection.update({
                _id: operation.recordId
            }, {
                $set: operation.updates
            }, {
                upsert: false
            })
        }

        // Broadcast
        const channel = "EVT_DB_UPDATE_BULK"
        kiss.pubsub.publish(channel, {
            channel,
            dbMode,
            accountId: kiss.session.getCurrentAccountId(),
            userId: kiss.session.getUserId(),
            data: operations
        })

        return {}
    },

    /**
     * Find a single record in a collection. See [db.findOne](kiss.db.html#.findOne)
     * 
     * @async
     * @param {string} modelId 
     * @param {string} recordId
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * @returns {object} The found record
     */
    async findOne(modelId, recordId, dbMode = "offline") {
        log("kiss.db - " + dbMode + " - findOne - Model " + modelId + " / Record " + recordId)

        const collection = await this.getCollection(modelId, dbMode)
        const record = await collection.findOne({
            _id: recordId
        })

        if (record) this.toId(record)
        return record
    },

    /**
     * Find multiple records by id
     * 
     * @async
     * @param {string} modelId 
     * @param {string[]} ids - ids of the records to retrieve
     * @param {object[]|object} [sort] - Sort options, as a normalized array or a Mongo object. Normalized example: [{fieldA: "asc"}, {fieldB: "desc"}]. Mongo example: {fieldA: 1, fieldB: -1}
     * @param {string} [sortSyntax] - Sort syntax: "nomalized" | "mongo". Default is normalized
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * @returns {object[]} The found records
     */
    async findById(modelId, ids, sort = [], sortSyntax = "normalized", dbMode = "offline") {
        log("kiss.db - " + dbMode + " - findById - Model " + modelId + " / Records: " + ids.join())

        const collection = await this.getCollection(modelId, dbMode)
        let records

        if (sortSyntax.length == 0) {
            records = await collection.find({
                _id: {
                    "$in": ids
                }
            })
        }
        else {
            const sortObject = (sortSyntax == "normalized") ? kiss.db.mongo.convertSort(sort) : sort
            records = await collection.cfind({
                _id: {
                    "$in": ids
                }
            }).sort(sortObject).exec()
        }

        return this.toIds(records)
    },

    /**
     * Find documents in a collection. See [db.find](kiss.db.html#.find)
     * 
     * @async
     * @param {string} modelId
     * @param {object} [query] - Query object
     * @param {*} [query.filter] - The query
     * @param {string} [query.filterSyntax] - The query syntax. By default, passed as a normalized object
     * @param {*} [query.sort] - Sort fields
     * @param {string} [query.sortSyntax] - The sort syntax. By default, passed as a normalized array
     * @param {string[]} [query.group] - Array of fields to group by: ["country", "city"]
     * @param {boolean} [query.groupUnwind] - true to unwind the fields for records that belongs to multiple groups
     * @param {object} [query.projection] - {firstName: 1, lastName: 1, password: 0}
     * @param {object} [query.skip] - Number of records to skip
     * @param {object} [query.limit] - Number of records to return
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * @returns {object[]} An array containing the records data
     */
    async find(modelId, query, dbMode = "offline") {
        log("kiss.db - " + dbMode + " - find - Model " + modelId + " / Query:", 0, query)

        let records
        const collection = await this.getCollection(modelId, dbMode)

        if (!query) {
            records = await collection.find({})
            return this.toIds(records)
        }

        // Sanitize the query
        const search = {
            operation: "search",
            filter: query.filter || {},
            filterSyntax: query.filterSyntax || "normalized",
            sort: query.sort || {},
            sortSyntax: query.sortSyntax || "normalized",
            group: query.group || [],
            projection: query.projection || {},
            skip: query.skip,
            limit: query.limit,
            groupUnwind: query.groupUnwind
        }

        // If sort or filter are normalized, we convert them to mongo syntax beforing sending request to database
        if (search.filterSyntax == "normalized") {
            search.filter = kiss.db.mongo.convertFilterGroup(search.filter)
        }

        if (search.sortSyntax == "normalized") {
            search.sort = kiss.db.mongo.convertSort(search.sort)
        }

        if (search.limit && search.limit > 0) {
            records = await collection.cfind(search.filter, search.projection).limit(search.limit).sort(search.sort).exec()
        }
        else {
            records = await collection.cfind(search.filter, search.projection).sort(search.sort).exec()
        }
        
        return this.toIds(records)
    },

    /**
     * Delete an element from a collection. See [db.delete](kiss.db.html#.delete)
     * 
     * @async
     * @param {string} modelId
     * @param {string} recordId
     * @param {boolean} [sendToTrash] - If true, keeps the original record in a "trash" collection
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * @returns {boolean}
     */
    async deleteOne(modelId, recordId, sendToTrash, dbMode = "offline") {
        log("kiss.db - " + dbMode + " - deleteOne - Model " + modelId + " / Record " + recordId)

        const collection = await this.getCollection(modelId, dbMode)

        // Copying record to trash collection prior to deletion
        if (sendToTrash) {
            await this.copyOneToTrash(modelId, recordId, dbMode)
        }

        await collection.remove({
            _id: recordId
        })

        // Broadcast
        const channel = "EVT_DB_DELETE:" + modelId.toUpperCase()
        kiss.pubsub.publish(channel, {
            channel,
            dbMode,
            accountId: kiss.session.getCurrentAccountId(),
            userId: kiss.session.getUserId(),
            modelId,
            id: recordId
        })

        // Deleting a dynamic record can trigger updates on its relations
        if (kiss.tools.isUid(modelId)) {
            const operations = await kiss.data.relations.updateForeignRecords(modelId, recordId)
            
            if (operations.length > 0) {
                const channel = "EVT_DB_UPDATE_BULK"
                kiss.pubsub.publish(channel, {
                    channel,
                    dbMode,
                    accountId: kiss.session.getAccountId(),
                    userId: kiss.session.getUserId(),
                    data: operations
                })				
            }
        }
        else if (modelId.startsWith("file")) {
            // TODO: remove file from local drive or Amazon S3
            
        }

        return true
    },

    /**
     * Delete many records from a collection
     * 
     * @param {string} modelId 
     * @param {object} query
     * @param {boolean} [sendToTrash] - If true, keeps the original records in a "trash" collection
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * 
     * TODO: NOT TESTED YET
     */
    async deleteMany(modelId, query, sendToTrash, dbMode = "offline") {
        log("kiss.db - " + dbMode + " - deleteMany - Model " + modelId, 0, query)

        const collection = await this.getCollection(modelId, dbMode)

        // Copying records to trash collection prior to deletion
        if (sendToTrash) {
            await this.copyManyToTrash(modelId, query, dbMode)
        }

        const response = await collection.remove(
            query, {
                multi: true
            }
        )

        // Broadcast
        const channel = "EVT_DB_DELETE_MANY:" + modelId.toUpperCase()
        kiss.pubsub.publish(channel, {
            channel,
            dbMode,
            accountId: kiss.session.getCurrentAccountId(),
            userId: kiss.session.getUserId(),
            modelId,
            data: query
        })

        return response
    },

    /**
     * Count the number of records that match a query.
     * 
     * @async
     * @param {string} modelId
     * @param {object} query - Use same query format as for find() method
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection
     * @returns {number} The number of records
     */
    async count(modelId, query, dbMode) {
        log("kiss.db - " + dbMode + " - count - Model " + modelId, 0, query)

        const collection = await this.getCollection(modelId, dbMode)
        return await collection.count(query)
    },

    /**
     * Copy a record to the "trash" collection (recycle bin)
     * 
     * This is useful if you want to implement soft deletion
     * 
     * @async
     * @param {string} modelId 
     * @param {string} recordId 
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection 
     * @returns {object} The record copied to the trash with extra informations
     */
    async copyOneToTrash(modelId, recordId, dbMode = "offline") {
        // Get the record to move
        const record = await this.findOne(modelId, recordId, dbMode)

        // The record is associated to the account
        record.accountId = "anonymous"

        // Set the source collection to be able to restore at the right place later
        record.sourceModelId = modelId

        // Timestamp the deletion
        record.deletedAt = new Date().toISOString()
        record.deletedBy = "anonymous"

        await this.insertOne("trash", record, dbMode)
        return record
    },

    /**
     * Copy many records to the "trash" collection (recycle bin)
     * 
     * This is useful if you want to implement soft deletion
     * 
     * @async
     * @param {string} modelId 
     * @param {string} query 
     * @param {string} [dbMode] - Use "memory" to work with an in-memory collection 
     * @returns {object} The records copied to the trash with extra informations
     */
    async copyManyToTrash(modelId, query, dbMode = "offline") {
        // Get the records to move
        const records = await this.find(modelId, query, dbMode)
        const data = []

        for (record of records) {
            // The record is associated to the account
            record.accountId = "anonymous"

            // Set the source collection to be able to restore at the right place later
            record.sourceModelId = modelId

            // Timestamp the deletion
            record.deletedAt = new Date().toISOString()
            record.deletedBy = "anonymous"

            data.push(record)
        }

        await this.insertMany("trash", data, dbMode)

        return records
    },

    /**
     * 
     * Node.js Embedded Database (Nedb) wrapper
     * 
     * Nedb is a local / offline database developped by Louis Chatriot, both in-memory and persistent with IndexedDb or WebSQL or localStorage (or file-based storage for Node).
     * Nedb is the only accepted dependency for KissJS, because Nedb code is absolutely brilliant.
     * 
     * Nedb has the fastest and easiest api compared to:
     * - PouchDb: problems => can't update fields, but have to update full records + versioning high complexity
     * - Dixie: problems => boring static schema and schema versionning system
     * - LokiJS: problems => the localCollection must be integraly serialized to persist (ouch!)
     * 
     * The only small inconvenient of Nedb is that it only uses callbacks, hence, this wrapper to use it with Promises :)
     * 
     * @ignore
     */
    nedbWrapper: {

        /**
         * Transform a Nedb instance into a promisified (aka "thenified") version
         * 
         * @param {*} nedbInstance 
         */
        fromInstance(nedbInstance) {
            const newCollection = {
                nedb: nedbInstance // Keep the original Nedb in case we still want callbacks in some situations
            }

            // Convert main methods
            const methods = ['loadDatabase', 'insert', 'find', 'findOne', 'count', 'update', 'remove', 'ensureIndex', 'removeIndex']
            for (let i = 0; i < methods.length; ++i) {
                const method = methods[i]
                newCollection[method] = kiss.db.offline.nedbWrapper.thenify(nedbInstance[method].bind(nedbInstance))
            }

            // Convert cursor find
            newCollection.cfind = function (query, projections) {
                const cursor = nedbInstance.find(query, projections)
                cursor.exec = kiss.db.offline.nedbWrapper.thenify(cursor.exec.bind(cursor))
                return cursor
            }

            // Convert cursor findOne
            newCollection.cfindOne = function (query, projections) {
                const cursor = nedbInstance.findOne(query, projections)
                cursor.exec = kiss.db.offline.nedbWrapper.thenify(cursor.exec.bind(cursor))
                return cursor
            }

            // Convert cursor count
            newCollection.ccount = function (query) {
                const cursor = nedbInstance.count(query)
                cursor.exec = kiss.db.offline.nedbWrapper.thenify(cursor.exec.bind(cursor))
                return cursor
            }

            return newCollection
        },

        /**
         * Create the wrapper to transform a function with callbaks into a Promise.
         * 
         * @param {string} name - Method name
         * @param {object} options - {withCallback: true|false, multiArgs: true|false}
         * @returns {string} - The string representation of the "thenified" function, ready to be evaluated
         */
        create: function (name, options) {
            name = (name || '').replace(/\s|bound(?!$)/g, '')
            options = options || {}

            var multiArgs = options.multiArgs !== undefined ? options.multiArgs : true
            multiArgs = 'var multiArgs = ' + JSON.stringify(multiArgs) + '\n'

            var withCallback = options.withCallback ?
                'var lastType = typeof arguments[len - 1]\n' +
                'if (lastType === "function") return $$__fn__$$.apply(self, arguments)\n' :
                ''

            return '(function ' + name + '() {\n' +
                'var self = this\n' +
                'var len = arguments.length\n' +
                multiArgs +
                withCallback +
                'var args = new Array(len + 1)\n' +
                'for (var i = 0; i < len; ++i) args[i] = arguments[i]\n' +
                'var lastIndex = i\n' +
                'return new Promise(function (resolve, reject) {\n' +
                'args[lastIndex] = kiss.db.offline.nedbWrapper.createCallback(resolve, reject, multiArgs)\n' +
                '$$__fn__$$.apply(self, args)\n' +
                '})\n' +
                '})'
        },

        /**
         * Turn async functions into promises
         *
         * @param {function} $$__fn__$$ - Function to thenify
         * @param {object} options - {withCallback: true|false, multiArgs: true|false}
         * @returns {function} - The wrapped function
         */
        thenify: function ($$__fn__$$, options) {
            return eval(this.create($$__fn__$$.name, options))
        },

        /**
         * Generates the callback for the "thenified" function
         * 
         * @param {function} resolve 
         * @param {function} reject 
         * @param {boolean} multiArgs
         */
        createCallback: function (resolve, reject, multiArgs) {
            return function (err, value) {
                if (err) return reject(err)
                const length = arguments.length

                if (length <= 2 || !multiArgs) return resolve(value)

                if (Array.isArray(multiArgs)) {
                    let values = {}
                    for (let i = 1; i < length; i++) values[multiArgs[i - 1]] = arguments[i]
                    return resolve(values)
                }

                let values = new Array(length - 1)
                for (let i = 1; i < length; ++i) values[i - 1] = arguments[i]
                resolve(values)
            }
        }
    }
};

/**
 * Turn async functions into promises and backward compatible with callback
 *
 * @param {function} $$__fn__$$ - Function to thenify
 * @param {object} options - {withCallback: true|false, multiArgs: true|false}
 * @returns {function} - The wrapped function
 */
kiss.db.offline.nedbWrapper.thenify.withCallback = function ($$__fn__$$, options) {
    options = options || {}
    options.withCallback = true
    if (options.multiArgs === undefined) options.multiArgs = true
    return eval(kiss.db.offline.nedbWrapper.create($$__fn__$$.name, options))
}

;