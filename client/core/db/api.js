/**
 * 
 * ## NoSQL database wrapper API
 * 
 * - built to work seamlessly in memory, offline, or online
 * - if connected to KissJS server:
 *      - online mode pushes updates dynamically over all connected clients through WebSocket
 *      - field updates handle relationships with foreign records, and compute the required updates to keep data coherent
 * 
 * @namespace
 * @param {object} kiss.db.memory - In-memory database wrapper
 * @param {object} kiss.db.offline - Offline database wrapper
 * @param {object} kiss.db.online - Online database wrapper
 * 
 */
kiss.db = {

    // Reserved namespaces for database
    memory: {},
    offline: {},
    online: {},
    faker: {},

    /**
     * Database mode:
     * - online: persist data on the server - requires a connection
     * - offline: persist data on the client - no connection required
     * - memory: no persistence at all - a browser refresh flushes the data
     */
    mode: "online",

    /**
     * Init database 
     * - set the datatabase mode: memory | offline | online
     * 
     * @param {object} setup - Object containing the setup
     * @param {string} setup.mode - memory | offline | online
     * 
     * @example
     * // Setting offline mode
     * kiss.db.init({mode: "offline"})
     */
    init(setup = {}) {
        if (setup.mode) kiss.db.mode = setup.mode
    },

    /**
     * Insert one record in a collection
     * 
     * @async
     * @param {string} modelId
     * @param {object} record - A single record
     * @returns {object} The inserted record data
     * 
     * @example
     * let newUser = await kiss.db.insertOne("user", {firstName: "Bob", lastName: "Wilson"})
     * console.log(newUser) // returns {firstName: "Bob", lastName: "Wilson"}
     */
    async insertOne(modelId, record) {
        return await kiss.db[this.mode].insertOne(modelId, record)
    },

    /**
     * Insert many records in a collection
     * 
     * @async
     * @param {string} modelId
     * @param {object[]} records - An array of records [{...}, {...}] for bulk insert
     * @returns {object[]} The array of inserted records data
     * 
     * @example
     * let newUsers = await kiss.db.insertMany("user", [
     *      {firstName: "Will", lastName: "Smith"},
     *      {firstName: "Joe", lastName: "Dalton"},
     *      {firstName: "Albert", lastName: "Einstein"}
     * ])
     */
    async insertMany(modelId, records) {
        return await kiss.db[this.mode].insertMany(modelId, records)
    },

    /**
     * Insert some fake records in a collection, for testing purpose.
     * 
     * See [db.faker](kiss.db.faker.html) documentation for more details.
     * 
     * @async
     * @param {string} modelId - The target collection
     * @param {object[]} fields - Array of fields that defines the model
     * @param {integer} numberOfRecords - Number of fake records to insert
     * @returns {object[]} The array of inserted records data
     * 
     * @example
     * // Insert 100 products into the collection
     * await kiss.db.insertFakeRecords("product", [
     *  {primary: true, label: "Title", type: "text"},
     *  {label: "Release date", type: "date"}
     *  {label: "Category", type: "select", multiple: true, options: [{value: "Adventure", color: "#00aaee"}, {value: "Action", color: "#00eeaa"}]}
     *  {label: "Life time", type: "integer", min: 0, max: 5}
     * ], 100)
     */
    async insertFakeRecords(modelId, fields, numberOfRecords) {
        let records = kiss.db.faker.generate(fields, numberOfRecords)
        return await kiss.db[this.mode].insertMany(modelId, records)
    },

    /**
     * Delete all the fake records inserted using the method insertFakeRecords.
     * Other records remain untouched.
     * 
     * @async
     * @param {string} modelId - The target collection
     * 
     * @example
     * await kiss.db.deleteFakeRecords()
     */
    async deleteFakeRecords(modelId) {
        return await kiss.db[this.mode].deleteMany(modelId, {
            isFake: true
        })
    },

    /**
     * Update a single record in a collection
     * 
     * @async
     * @param {string} modelId
     * @param {string} recordId
     * @param {object} update
     * @returns {object} The request's result
     * 
     * @example
     * let updatedUser = await kiss.db.updateOne("user", "f07xF008d", {lastName: "Smith"})
     * console.log(updatedUser) // returns {firstName: "Bob", lastName: "Smith"}
     */
    async updateOne(modelId, recordId, update) {
        return await kiss.db[this.mode].updateOne(modelId, recordId, update)
    },

    /**
     * Update a record then propagate the mutation to foreign records
     * 
     * @async
     * @param {string} modelId
     * @param {string} recordId
     * @param {string} [update] - If not specified, re-compute all the computed fields
     * @returns The request's result
     * 
     * @example
     * await kiss.db.updateOneDeep("company", "f07xF008d", {name: "pickaform"})
     */
    async updateOneDeep(modelId, recordId, update) {
        return await kiss.db[this.mode].updateOneDeep(modelId, recordId, update)
    },

    /**
     * Update the 2 records connected by a link
     * 
     * @param {object} link 
     * @returns The transaction result
     */    
    async updateLink(link) {
        return await kiss.db[this.mode].updateLink(link)
    },

    /**
     * Update many records in a single collection
     * 
     * @async
     * @param {string} modelId
     * @param {object} query
     * @param {object} update
     * @returns The request's result
     * 
     */
    async updateMany(modelId, query, update) {
        return await kiss.db[this.mode].updateMany(modelId, query, update)
    },

    /**
     * Update multiple records in multiple collections
     * 
     * @async
     * @param {object[]} operations - The list of updates to perform
     * @returns The request's result
     * 
     * @example
     * kiss.db.updateBulk(
     *  [{
     *		modelId: "project",
     *		recordId: "6ab2f4fd-e6f3-4fc3-998f-96629e7ef109",
     *		updates: {
     *			projectName: "Yet another Javascript project"
     *		}
     *	}, {
     *		modelId: "task",
     *		recordId: "5eb85fe3-2634-466c-839f-08423fc1cac1",
     *		updates: {
     *			taskName: "Task 1"
     *		}
     *	}, {
     *		modelId: "task",
     *		recordId: "5ae68056-f099-473b-8f5f-af9eeec9ddff",
     *		updates: {
     *			taskName: "Task 2",
                status: "done"
     *		}
     *	}, {
     *		modelId: "task",
     *		recordId: "1f7f9d6a-2cbc-42f1-80c4-8ad795141493",
     *		updates: {
     *			status: "pending"
     *		}
     *	}]
     * )
     */
    async updateBulk(operations = []) {
        if (operations.length == 0) return false
        return await kiss.db[this.mode].updateBulk(operations)
    },

    /**
     * Find a single record by id
     * 
     * @async
     * @param {string} modelId 
     * @param {string} recordId
     * @returns {object} The found record
     * 
     * @example
     * let Bob = await kiss.db.findOne("user", "fa7f9d6a-2cbc-42f1-80c4-dad795141eee")
     */
    async findOne(modelId, recordId) {
        return await kiss.db[this.mode].findOne(modelId, recordId)
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
     * 
     * @example
     * let users = await kiss.db.findById("user", ["fa7f9d6a-2cbc-42f1-80c4-dad795141eee", "0e7f9d6a-2cbc-42f1-80c4-dad795141547"])
     * let sortedUsers = await kiss.db.findById("user", ["fa7f9d6a-2cbc-42f1-80c4-dad795141eee", "0e7f9d6a-2cbc-42f1-80c4-dad795141547"], [{lastName: "asc"}, {age: "desc"}])
     * let mongoSortedUsers = await kiss.db.findById("user", ["fa7f9d6a-2cbc-42f1-80c4-dad795141eee", "0e7f9d6a-2cbc-42f1-80c4-dad795141547"], {lastName: 1, age: -1}, "mongo")
     */
    async findById(modelId, ids, sort = [], sortSyntax = "normalized") {
        return await kiss.db[this.mode].findById(modelId, ids, sort, sortSyntax)
    },

    /**
     * Find records applying:
     * - filter
     * - sort
     * - group
     * - project
     * - skip
     * - limit
     * 
     * The query can be a normalized object, easier to serialize / deserialize.
     * 
     * Without a filter parameter, it returns all the records of the collection.
     * The filter can be a **group** of filters, where each **filter** can be:
     * - a field condition (example: country = "France")
     * - another group of filters. Check the example below.
     * 
     * Important: KissJS doesn't use server-side grouping and paging (using skip/limit) at the moment because:
     * - KissJS must work offline
     * - it's faster in memory for small / medium datasets
     * We'll see how it evolves in the future with the project requirements.
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
     * @returns {object[]} An array containing the records data
     * 
     * @example
     * // Sample filter: "Get all people born in France within years 2000 and 2020, which last name is Dupont or Dupond"
     * const filter = {
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
     * 
     * let users = await kiss.db.find("user", {
     *      filter: filter,
     *      sort: [{lastName: "asc"}, {birthDate: "desc"}],
     *      projection: {password: 0},
     *      skip: 100,
     *      limit: 50
     * })
     */
    async find(modelId, query) {
        if (!query) return await kiss.db[this.mode].find(modelId)

        // Sanitize the query
        let search = {
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
        return await kiss.db[this.mode].find(modelId, search)
    },

    /**
     * Delete a record from a collection
     * 
     * @async
     * @param {string} modelId
     * @param {string} recordId
     * @param {boolean} [sendToTrash] - If true, keeps the original record in a "trash" collection. Default = false
     * @returns The request's result
     * 
     * @example
     * await kiss.db.deleteOne("user", "007f9d6a-2cbc-42f1-80c4-dad7951414af")
     */
    async deleteOne(modelId, recordId, sendToTrash) {
        return await kiss.db[this.mode].deleteOne(modelId, recordId, sendToTrash)
    },

    /**
     * Delete many records from a collection
     * 
     * @async
     * @param {string} modelId 
     * @param {object} query
     * @param {boolean} [sendToTrash] - If true, keeps the original record in a "trash" collection
     * @returns The request's result
     */
    async deleteMany(modelId, query, sendToTrash) {
        return await kiss.db[this.mode].deleteMany(modelId, query, sendToTrash)
    },

    /**
     * Count the number of records that match a query
     * 
     * @async
     * @param {string} modelId
     * @param {object} query - Use same query format as for find() method
     * @returns {number} The number of records
     */
    async count(modelId, query) {
        return await kiss.db[this.mode].count(modelId, query)
    },

    /**
     * Helper functions to convert filter and sort options to MongoDb syntax
     * 
     * @namespace
     */
    mongo: {
        /**
         * Convert an array of sort options to Mongo style
         * 
         * @param {object[]} sortArray - The array to format to Mongo style
         * @returns {object} - A single object with sort options
         * 
         * @example
         * // input:
         * [{birthDate: "asc"}, {lastName: "desc"}]
         * 
         * // output:
         * {birthDate: 1, lastName: -1}
         */
        convertSort(sortArray) {
            let mongoSort = {}
            for (let i = 0, length = sortArray.length; i < length; i++) {
                let sortOption = sortArray[i]
                let sortField = Object.keys(sortOption)[0]
                let sortDirection = sortOption[sortField]
                mongoSort[sortField] = ((sortDirection == "asc") ? 1 : -1)
            }

            return mongoSort
        },

        /**
         * Convert a filter config into a Mongo query expression
         * 
         * @param {array} filter - The filter config to convert to Mongo syntax
         * @returns {object} The Mongo query expression
         * 
         * @example
         * // If the filter config is:
         * {
         *   type: "filter",
         *   fieldId: "firstName",
         *   operator: "contains",
         *   value: "wilson"
         * }
         * 
         * // It will return:
         * {firstName: /wilson/}
         * 
         */
        convertFilter(filterConfig) {
            let query = {}

            // Copy the filter config to not alter the original
            let filter = {}
            Object.assign(filter, filterConfig)

            // Convert dynamic values:
            let isUserTest
            if (filter.value == "$userId") {
                isUserTest = true
                filter.value = kiss.session.getACL() // Connected user

            } else if (filter.value == "$today") {
                filter.value = kiss.formula.TODAY()

            } else if (filter.fieldType == "date") {
                if (filter.dateOperator == "today") {
                    filter.value = kiss.formula.TODAY()
                }
                else if (filter.dateOperator == "days from now") {
                    const today = new Date()
                    const adjustedDate = kiss.formula.ADJUST_DATE(today, 0, 0, filter.value)
                    filter.value = adjustedDate
                }
                else if (filter.dateOperator == "days ago") {
                    const today = new Date()
                    const adjustedDate = kiss.formula.ADJUST_DATE(today, 0, 0, -filter.value)
                    filter.value = adjustedDate
                }                
            }

            switch (filter.operator) {
                case "=":
                    if (!isUserTest) {
                        query[filter.fieldId] = filter.value
                    } else {
                        query[filter.fieldId] = {
                            "$in": filter.value
                        }
                    }
                    break

                case "<>":
                    if (!isUserTest) {
                        query[filter.fieldId] = {
                            $ne: filter.value
                        }
                    } else {
                        query[filter.fieldId] = {
                            "$nin": filter.value
                        }
                    }
                    break

                case "<":
                    query[filter.fieldId] = {
                        $lt: filter.value
                    }
                    break

                case ">":
                    query[filter.fieldId] = {
                        $gt: filter.value
                    }
                    break

                case "<=":
                    query[filter.fieldId] = {
                        $lte: filter.value
                    }
                    break

                case ">=":
                    query[filter.fieldId] = {
                        $gte: filter.value
                    }
                    break

                case "contains":
                    if (!isUserTest) {
                        query[filter.fieldId] = new RegExp(filter.value, "i")
                    } else {
                        query[filter.fieldId] = {
                            "$in": filter.value
                        }
                    }
                    break

                case "does not contain":
                    if (!isUserTest) {
                        query = {
                            [filter.fieldId]: {
                                $not: new RegExp(filter.value, "i")
                            }
                        }
                    } else {
                        query[filter.fieldId] = {
                            "$nin": filter.value
                        }
                    }
                    break
    
                case "is empty":
                    query = {
                        $or: [{
                                [filter.fieldId]: ""
                            },
                            {
                                [filter.fieldId]: []
                            },
                            {
                                [filter.fieldId]: {
                                    $exists: false
                                }
                            }
                        ]
                    }
                    break

                case "is not empty":
                    query = {
                        $and: [{
                                [filter.fieldId]: {
                                    $ne: ""
                                }
                            },
                            {
                                [filter.fieldId]: {
                                    $ne: []
                                }
                            },
                            {
                                [filter.fieldId]: {
                                    $exists: true
                                }
                            }
                        ]
                    }
                    break
            }

            return query
        },

        /**
         * Convert a filter config into a Mongo query expression
         * 
         * @param {array} filterGroup - The filter config to convert to Mongo syntax
         * @returns {object} The Mongo query expression
         * 
         * @example
         * // If the filter config is:
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
         * 
         * // It will return:
         * {$and: [
         *      {firstName: /wilson/},
         *      {birthDate: {$gt: "2000-01-01"}}
         * ]}
         */
        convertFilterGroup(filterGroup) {
            if (filterGroup.type != "group") return kiss.db.mongo.convertFilter(filterGroup)

            let filters = []

            filterGroup.filters.forEach(filter => {
                if (filter) {
                    if (filter.type == "group") {
                        // If it's a filter group, then we get the filters of the group recursively
                        filters.push(kiss.db.mongo.convertFilterGroup(filter))
                    } else {
                        // If it's a single filter, we directly get the filter values
                        filters.push(kiss.db.mongo.convertFilter(filter))
                    }
                }
            })

            let mongoFilter = {}
            mongoFilter["$" + filterGroup.operator] = filters
            return mongoFilter
        },

        /**
         * Get all the fields involved in a filter
         * 
         * @param {object} filter 
         * @returns {string[]} The list of field ids
         */
        getFilterFields(filter) {
            if (!filter) return []
            
            let fields = []
            if (filter.type == "filter") {
                fields.push(filter.fieldId)
            } else if (filter.type == "group") {
                filter.filters.forEach(filter => {
                    fields = fields.concat(kiss.db.mongo.getFilterFields(filter))
                })
            }
            return fields.unique()
        }
    }
}

;