/**
 * 
 * ## Online database wrapper for KissJS server
 * 
 * Standard REST requests are performed for basic CRUD operations, except for:
 * - find(modelId, query)
 * - findById(modelId, ids, sort, sortSyntax)
 * - updateOneDeep(modelId, recordId, update)
 * - updateBulk(operations)
 * - deleteOne(modelId, recordId, sendToTrash)
 * - deleteMany(modelId, query, sendToTrash)
 * 
 * **Remember: these custom methods are design for KissJS server, and will not behave the same if used on another REST endpoint.**
 * 
 * The **find** method provides a rich and expressive way of querying the database with a **query** parameter.
 * The query can be an object with complex filters (multi-level AND / OR) and multi-field sorting, so, we need a way to send that (eventually big) object to the server.
 * As the HTTP GET method has some limitations about the amount of data that can be sent, KissJS uses a POST instead (despite it's a READ operation).
 * 
 * The **updateOneDeep** method performs a deep update of the record and its relationships.
 * This is the main method used to perform the updates of foreign records in a NoSQL environment.
 * 
 * The **updateBulk** method offers a convenient way to perform multiple updates in multiple collections at once.
 * The operations parameter is an array of operations, where each operation contains:
 * - the target modelId
 * - the target recordId
 * - the updates to apply to the target record
 * 
 * The **deleteOne** and **deleteMany** operations have an extra "sendToTrash" parameter which is useful to implement soft-deletion.
 * 
 * Below is a table of correspondance between the API and how it is converted to HTTP requests:
 *  
 * kiss.db.online | HTTP | HTTP body
 * --- | --- | ---
 * insertOne(modelId, record) | POST /modelId | record
 * insertMany(modelId, records) | POST /modelId | records
 * updateOne(modelId, recordId, update) | PATCH /modelId/recordId | update
 * updateOneDeep(modelId, recordId, update) | PATCH /modelId/recordId | {operation: "updateOneDeep", update} => update the record and its relationships
 * updateMany(modelId, query, update) | PATCH /modelId | query+update
 * updateBulk(operations) | PATCH /data | operations
 * findOne(modelId, recordId) | GET /modelId/recordId | <none>
 * findById(modelId, ids, sort, sortSyntax) | POST /modelId | Array of ids
 * find(modelId) | GET /modelId | <none>
 * find(modelId, query) | POST /modelId | query
 * deleteOne(modelId, recordId, sendToTrash) | DELETE /modelId/recordId | {sendToTrash: true/false}
 * deleteMany(modelId, query, sendToTrash) | POST /modelId | {operation: "delete", sendToTrash: true/false}
 * 
 * @namespace kiss.db.online
 * 
 */
kiss.db.online = {
    // Database endpoint, which defaults to the server root path url
    url: "",

    /**
     * Insert one record in a collection. See [db.insertOne](kiss.db.html#.insertOne)
     * 
     * @async
     * @param {string} modelId
     * @param {object} record - A single record
     * @returns {object} The server response
     */
    async insertOne(modelId, record) {
        log("kiss.db - online - insertOne - Model " + modelId, 0, record)

        const response = await kiss.ajax.request({
            url: "/" + modelId,
            method: "post",
            body: JSON.stringify(record)
        })

        // Broadcast
        const channel = "EVT_DB_INSERT:" + modelId.toUpperCase()
        kiss.pubsub.publish(channel, {
            channel,
            dbMode: "online",
            accountId: kiss.session.getCurrentAccountId(),
            userId: kiss.session.getUserId(),
            modelId,
            id: record.id,
            data: record
        })

        return response
    },

    /**
     * Insert many records in a collection. See [db.insertMany](kiss.db.html#.insertMany)
     * 
     * @async
     * @param {string} modelId
     * @param {object[]} records - An array of records [{...}, {...}] for bulk insert
     * @returns {object} The server response
     */
    async insertMany(modelId, records) {
        log("kiss.db - online - insertMany - Model" + modelId + " / " + records.length + " record(s)", 0, records)

        const response = await kiss.ajax.request({
            url: "/" + modelId,
            method: "post",
            body: JSON.stringify(records)
        })

        // Broadcast
        const channel = "EVT_DB_INSERT_MANY:" + modelId.toUpperCase()
        kiss.pubsub.publish(channel, {
            channel,
            dbMode: "online",
            accountId: kiss.session.getCurrentAccountId(),
            userId: kiss.session.getUserId(),
            modelId,
            data: records
        })

        return response
    },

    /**
     * Update a record in a collection. See [db.updateOne](kiss.db.html#.update)
     * 
     * @async
     * @param {string} modelId
     * @param {string} recordId
     * @param {string} update - Update to apply to the record. Ex: {firstName: "Bob"}
     * @returns {object} The server response
     */
    async updateOne(modelId, recordId, update) {
        log("kiss.db - online - updateOne - Model " + modelId + " / Record " + recordId, 0, update)

        const response = await kiss.ajax.request({
            url: "/" + modelId + "/" + recordId,
            method: "patch",
            body: JSON.stringify(update)
        })

        // Broadcast
        const channel = "EVT_DB_UPDATE:" + modelId.toUpperCase()
        kiss.pubsub.publish(channel, {
            channel,
            dbMode: "online",
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
     * @returns {object} The server response
     * 
     * TODO: NOT TESTED YET
     */
    async updateMany(modelId, query, update) {
        log("kiss.db - online - updateMany - Model " + modelId, 0, update)

        const response = await kiss.ajax.request({
            url: "/" + modelId,
            method: "patch",
            body: JSON.stringify({
                query: query,
                update: update
            })
        })

        // Broadcast
        const channel = "EVT_DB_UPDATE_MANY:" + modelId.toUpperCase()
        kiss.pubsub.publish(channel, {
            channel,
            dbMode: "online",
            accountId: kiss.session.getCurrentAccountId(),
            userId: kiss.session.getUserId(),
            modelId,
            data: update
        })

        return response
    },

    /**
     * Update a single field of a record then propagate the triggered mutations to foreign records
     * 
     * IMPORTANT: this method does not broadcast to the active user because
     * all relationships computations are done server-side
     * 
     * @async
     * @param {string} modelId
     * @param {string} recordId
     * @param {string} [update] - If not specified, re-compute all the computed fields
     * @returns {boolean} true if the update is successful
     * 
     * @example
     * await kiss.db.updateOneDeep("company", "f07xF008d", {"name": "pickaform"})
     */
    async updateOneDeep(modelId, recordId, update) {
        log("kiss.db - online - updateOneDeep - Model " + modelId + " / Record " + recordId, 0, update)

        const response = await kiss.ajax.request({
            url: "/" + modelId + "/" + recordId,
            method: "patch",
            body: JSON.stringify({
                operation: "updateOneDeep",
                update
            })
        })

        // Broadcast
        const channel = "EVT_DB_UPDATE_ONE_DEEP:" + modelId.toUpperCase()
        kiss.pubsub.publish(channel, {
            channel,
            dbMode: "online",
            accountId: kiss.session.getCurrentAccountId(),
            userId: kiss.session.getUserId(),
            modelId,
            id: recordId,
            data: update
        })

        return response
    },

    /**
     * Update the 2 records connected by a link
     * 
     * @param {object} link 
     * @returns The transaction result
     */
    async updateLink(link) {
        log("kiss.db - online - updateLink: ", 0, link)

        const response = await kiss.ajax.request({
            url: "/updateLink",
            method: "post",
            body: JSON.stringify(link)
        })

        return response
    },

    /**
     * Update multiple records in multiple collections. See [db.updateBulk](kiss.db.html#.updateBulk)
     * 
     * @async
     * @param {object[]} operations - The list of updates to perform
     * @returns {object} The server response
     */
    async updateBulk(operations) {
        log("kiss.db - online - updateBulk", 0, operations)

        const response = await kiss.ajax.request({
            url: "/bulk",
            method: "patch",
            body: JSON.stringify(operations)
        })

        // Broadcast
        const channel = "EVT_DB_UPDATE_BULK"
        kiss.pubsub.publish(channel, {
            channel,
            dbMode: "online",
            accountId: kiss.session.getCurrentAccountId(),
            userId: kiss.session.getUserId(),
            data: operations
        })

        return response
    },

    /**
     * Find a single record by id. See [db.findOne](kiss.db.html#.findOne)
     * 
     * @async
     * @param {string} modelId 
     * @param {string} recordId
     * @returns {object} The server response
     */
    async findOne(modelId, recordId) {
        log("kiss.db - online - findOne - Model " + modelId + " / Record " + recordId)

        return await kiss.ajax.request({
            url: "/" + modelId + "/" + recordId,
            method: "get"
        })
    },

    /**
     * Find multiple records by id
     * 
     * @async
     * @param {string} modelId 
     * @param {string[]} ids - ids of the records to retrieve
     * @param {object[]|object} [sort] - Sort options, as a normalized array or a Mongo object. Normalized example: [{fieldA: "asc"}, {fieldB: "desc"}]. Mongo example: {fieldA: 1, fieldB: -1}
     * @param {string} [sortSyntax] - Sort syntax: "nomalized" | "mongo". Default is normalized
     * @returns {object[]} The found records
     */
     async findById(modelId, ids, sort = [], sortSyntax = "normalized") {
        log("kiss.db - online - findById - Model " + modelId + " / Records: " + ids.join())

        const search = {
            operation: "search",
            ids,
            sort,
            sortSyntax
        }

        return await kiss.ajax.request({
            url: "/" + modelId,
            method: "post",
            body: JSON.stringify(search)
        })
    },

    /**
     * Find documents in a collection. See [db.find](kiss.db.html#.find)
     * 
     * Important:
     * - without query params, it uses standard GET
     * - with query params, the only way is to "POST" the request to the server
     * In effet, the HTTP GET query parameters are limited in size, which is blocking to handle complex queries.
     * 
     * @async
     * @param {string} modelId
     * @param {object} [query] - Optional query object
     * @returns {object[]} An array containing the records data
     */
    async find(modelId, query) {
        log("kiss.db - online - find - Model " + modelId + " / Query:", 0, query)

        // No query: we return all records with a find()
        if (!query) {
            return await kiss.ajax.request({
                url: "/" + modelId,
                method: "get"
            })
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

        return await kiss.ajax.request({
            url: "/" + modelId,
            method: "post", // Only way to post the query object properly
            body: JSON.stringify(search)
        })
    },

    /**
     * Delete an element from a collection. See [db.delete](kiss.db.html#.delete)
     * 
     * @async
     * @param {string} modelId
     * @param {string} recordId
     * @param {boolean} [sendToTrash] - If true, keeps the original record in a "trash" collection
     * @returns {boolean}
     */
    async deleteOne(modelId, recordId, sendToTrash) {
        log("kiss.db - online - deleteOne - Model " + modelId + " / Record " + recordId)

        const response = await kiss.ajax.request({
            url: "/" + modelId + "/" + recordId,
            method: "delete",
            body: JSON.stringify({
                sendToTrash: !!sendToTrash
            })
        })

        // Broadcast
        const channel = "EVT_DB_DELETE:" + modelId.toUpperCase()
        kiss.pubsub.publish(channel, {
            channel,
            dbMode: "online",
            accountId: kiss.session.getCurrentAccountId(),
            userId: kiss.session.getUserId(),
            modelId,
            id: recordId
        })

        return !!response.success
    },

    /**
     * Delete many records from a collection
     * 
     * Note: REST doesn't have any standard way to perform a bulk delete.
     * For this, we use a custom POST operation, as suggested in the Google API Design Guide
     * 
     * @param {string} modelId 
     * @param {object} query
     * @param {boolean} [sendToTrash] - If true, keeps the original record in a "trash" collection
     * @returns {object} The server response
     */
    async deleteMany(modelId, query, sendToTrash) {
        log("kiss.db - online - deleteMany - Model " + modelId, 0, query)

        const params = {
            operation: "delete",
            filter: query || {},
            sendToTrash: !!sendToTrash
        }

        const response = await kiss.ajax.request({
            url: "/" + modelId,
            method: "post", // Only way to post the query object properly
            body: JSON.stringify(params),
            showLoading: true
        })

        // Broadcast
        const channel = "EVT_DB_DELETE_MANY:" + modelId.toUpperCase()
        kiss.pubsub.publish(channel, {
            channel,
            dbMode: "online",
            accountId: kiss.session.getCurrentAccountId(),
            userId: kiss.session.getUserId(),
            modelId,
            data: query
        })

        return response
    },

    /**
     * Count the number of records that match a query
     * 
     * @async
     * @param {string} modelId
     * @param {object} query - Use same query format as for find() method
     * @returns {number} The number of records
     */
    count(modelId, query) {
        log("kiss.db - online - count - Model " + modelId, 0, query)

        // TODO
        return 42
    }
}

;