/**
 * 
 * MongoDb operations
 * 
 * - createCollection
 * - findOne
 * - findById
 * - find
 * - findAndSort
 * - insertOne
 * - insertMany
 * - updateOne
 * - updateMany
 * - updateBulk - Non standard method
 * - deleteOne
 * - deleteMany
 * - softDeleteOne - Non standard method
 * 
 */
const db = require("./mongoConnection")

const {
	DBQueryFailure
} = require('./errors')

module.exports = {
	// Creates a new collection (+ wildcard index)
	createCollection(modelId) {
		return db.createCollection(modelId)
	},

	// Convert id to _id
	toId(record) {
		record.id = record._id
		delete record._id
		return record
	},

	toIds(records) {
		records.forEach(this.toId)
		return records
	},

	toMongoId(record) {
		record._id = record.id
		delete record.id
		return record
	},

	toMongoIds(records) {
		records.forEach(this.toMongoId)
		return records
	},

	// Insert a single record
	async insertOne(modelId, data) {
		try {
			this.toMongoId(data)
			await db.collection(modelId).insertOne(data)
			return this.toId(data)
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	// Insert multiple records
	async insertMany(modelId, data) {
		try {
			this.toMongoIds(data)
			await db.collection(modelId).insertMany(data)
			return this.toIds(data)
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	// Update a single record matching a query
	async updateOne(modelId, query, data) {
		try {
			return await db.collection(modelId).updateOne(query, {
				$set: data
			})
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	// Update multiple records matching a query
	async updateMany(modelId, query, data) {
		try {
			return await db.collection(modelId).updateMany(query, {
				$set: data
			})
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	/**
	 * Update multiple records, from multiple collections, with different updates
	 * 
	 * @param {Map} operations - Map where eash key is a modelId, and entries are an array of update operations for multiple records using this model
	 * @returns {boolean} true when the bulk operation is done
	 */
	async updateBulk(flatOperations) {

		// Group operations by collection in a Map
		const operationsByModelId = flatOperations.reduce((map, operation) => map.set(operation.modelId, [...map.get(operation.modelId) || [], operation]), new Map())

		try {
			for (let operations of operationsByModelId) {
				const [modelId, modelOperations] = operations
				const bulkTransaction = db.collection(modelId).initializeUnorderedBulkOp()

				// Add operations to the bulk update
				for (let operation of modelOperations) {
					bulkTransaction.find({
						_id: operation.recordId
					}).updateOne({
						$set: operation.updates
					})
				}

				// Process the bulk for this collection
				await bulkTransaction.execute()
			}

			return true
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	// Find a single record using query 
	async findOne(modelId, query) {
		try {
			const record = await db.collection(modelId).findOne(query)
			if (record) this.toId(record)
			return record
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	// Find many records matching a set of ids
	async findById(modelId, ids, sort, sortSyntax = "normalized") {
		let records = []
		
		const query = {
			_id: {
				"$in": ids
			}
		}
		
		try {
			if (sort && sortSyntax == "normalized" && Array.isArray(sort) && sort.length > 0) {
				// Normalized sort
				// [{field: "name", order: "asc"}, {field: "age", order: "desc"}]
				sort = kiss.databaseFilters.convertSort(sort, modelId)
				records = await db.collection(modelId).find(query).sort(sort).toArray()
			}
			else if (sort && sortSyntax == "mongo" && Object.keys(sort).length > 0) {
				// Mongo sort
				// {name: 1, age: -1}
				records = await db.collection(modelId).find(query).sort(sort).toArray()
			}
			else {
				// No sort
				records = await db.collection(modelId).find(query).toArray()
			}
	
			if (records && Array.isArray(records)) this.toIds(records)
			return records
			
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	// Find records matching a query
	async find(modelId, query) {
		try {
			const records = await db.collection(modelId).find(query).toArray()
			if (records && Array.isArray(records)) this.toIds(records)
			return records
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	// Find and sort records matching a query
	async findAndSort(modelId, query, sort, project, skip = 0, limit = 0) {
		try {
			// TODO / WORK IN PROGRESS: sorting Arrays using the aggregation pipeline
			// const model = kiss.app.models[modelId]
			//
			// if (sort && model) {
			// 	const modelFields = model.fields
			// 	const virtualSortFields = {
			// 		"ZOB": 123
			// 	}

			// 	Object.keys(sort).forEach(fieldId => {
			// 		const field = modelFields.find(field => field.id == fieldId)

			// 		if (field.type == "select") {
			// 			const virtualSortFieldId = "sort_" + fieldId
			// 			virtualSortFields[virtualSortFieldId] = {
			// 				$first: "$" + fieldId
			// 			}

			// 			sort[virtualSortFieldId] = sort[fieldId]
			// 			delete sort[fieldId]
			// 		}
			// 	})

			// 	return db.collection(modelId)
			// 		.aggregate([{
			// 				$addFields: virtualSortFields
			// 			},
			// 			{
			// 				$match: query
			// 			},
			// 			{
			// 				$sort: sort
			// 			}
			// 		])
			// 		.toArray()
			// }

			let records
			if (project) {
				records = await db.collection(modelId)
					.find(query)
					.project(project)
					.sort(sort)
					.limit(limit)
					.skip(skip)
					.toArray()
			} else {
				records = await db.collection(modelId)
					.find(query)
					.sort(sort)
					.limit(limit)
					.skip(skip)
					.toArray()
			}

			if (records && Array.isArray(records)) this.toIds(records)
			return records
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	// Delete a single record
	async deleteOne(modelId, query) {
		try {
			return await db.collection(modelId).deleteOne(query)
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	// Delete the records matching a query
	async deleteMany(modelId, query) {
		try {
			return await db.collection(modelId).deleteMany(query)
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	// Soft delete a single record (= move it to the "deletion" collection)
	async softDeleteOne(modelId, query, token) {
		try {
			const record = await db.collection(modelId).findOne(query)
			if (!record) return false

			// The record is associated to the account
			record.accountId = token.currentAccountId

			// Set the source collection to be able to restore at the right place later
			record.sourceModelId = modelId

			// Timestamp the deletion
			record.deletedAt = new Date().toISOString()
			record.deletedBy = token.userId

			// Push the record to delete into the "soft-deletion" collection called "trash_{accountId}"
			// There is a single trash collection per account
			await db.collection("trash_" + token.currentAccountId).insertOne(record)

			// Delete the record from the original collection
			await db.collection(modelId).deleteOne(query)
			return true
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	// Soft delete the records matching a query
	async softDeleteMany(modelId, query, token) {
		try {
			let records = await db.collection(modelId).find(query).toArray()
			if (!records || !Array.isArray(records) || records.length == 0) return false
			
			records.forEach(record => {
				// The record is associated to the account
				record.accountId = token.currentAccountId

				// Set the source collection to be able to restore at the right place later
				record.sourceModelId = modelId

				// Timestamp the deletion
				record.deletedAt = new Date().toISOString()
				record.deletedBy = token.userId
			})

			// Push the records to delete into the "soft-deletion" collection called "trash_{accountId}"
			// There is a single trash collection per account
			await db.collection("trash_" + token.currentAccountId).insertMany(records)

			// Delete the records from the original collection
			await db.collection(modelId).deleteMany(query)
			return true
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	// Return the collection stats
	async getCollectionStats(modelId) {
		const stats = await db.collection(modelId).stats()
		return {
			name: stats.ns,
			count: stats.count,
			size: stats.size,
			storageSize: stats.storageSize,
			totalSize: stats.totalSize,
			
			// Indexes
			indexes: stats.nindexes,
			indexSizes: stats.indexSizes,
			totalIndexSize: stats.totalIndexSize
		}
	},

	// Count the number of records that match a query
	async countDocuments(modelId, query) {
		try {
			return await db.collection(modelId).countDocuments(query)
		}
		catch(err) {
			throw new DBQueryFailure(err)
		}
	},

	// Return the collection count
	async count(modelId) {
		return await db.collection(modelId).count()
	},

	// Close the connection
	async stop() {
		await db.stop()
	}
}