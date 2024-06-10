/**
 *
 * Simple database controller:
 * - check ACL before allowing access to records
 * - sanitize data according to model definitions
 * - allow reactivity by broadcasting websocket messages to the connected clients
 * - dispatch data on the right collection depending on the model definition
 * (for example, some model have their data dispatched in one collection per tenant)
 *
 */
const config = require("../config")
const {
	API: {
		Forbidden,
		InternalServerError,
		BadRequest
	}
} = require("../core/errors")

// Get the upload controller to delete file uploads
const filesController = require("./files")

/**
 * Returns true if the current user has permission to perform his request on the current model(s).
 * 
 * @private
 * @async
 * @param res
 * @param req
 * @param action
 * @throws Forbidden
 * @returns {Promise<boolean>}
 */
async function permissionGrantedOnModel(
	req,
	res,
	action
) {
	// Apply the model's ACL
	if (!await kiss.acl.check({
			action,
			req
		})) {
		throw new Forbidden()
	}
}

/**
 * Filter records according to the model's ACL (if any)
 * 
 * @private
 * @async
 * @param req
 * @param records
 * @param model
 * @returns {Promise<Object[]>}
 */
async function filterRecordsByACL(req, records, model) {
	if (model && model.acl && model.acl.permissions && model.acl.permissions.read) {
		return await kiss.acl.filter({
			records,
			req
		})
	} else return records
}

// Controller
module.exports = {
	/**
	 * INSERT ONE
	 */
	async insertOne(req, res) {
		const modelId = req.path_0
		const token = req.token
		const body = req.body

		// log("kiss.db.insertOne: " + modelId)
		await permissionGrantedOnModel(req, res, "create")

		// Sanitize object according to model
		const id = body.id || kiss.tools.uid()
		const sanitizedObject = kiss.databaseSanitizer.clean(body, modelId)
		sanitizedObject.id = id

		// All records must belong to an account
		sanitizedObject.accountId = token.currentAccountId

		// Timestamp
		kiss.tools.timeStamp(sanitizedObject, token.userId, true)

		// Insert to db
		const suffix = req.targetCollectionSuffix || ""

		try {
			await kiss.db.insertOne(modelId + suffix, sanitizedObject)
		} catch (err) {
			return res.status(400).send({
				error: err.message
			})
		}

		// Handle special cases to keep server cache updated for:
		// - models
		// - links
		// - groups
		if (modelId == "model") {
			await kiss.db.createCollection(id)
			kiss.app.defineModel(sanitizedObject)

		} else if (modelId == "link") {
			kiss.app.addLink(sanitizedObject, token.currentAccountId)

		} else if (modelId == "group") {
			kiss.directory.addGroup(sanitizedObject)
		}

		res.status(200).send(sanitizedObject)

		// Broadcast the event to all users of the active account
		kiss.websocket.publish(token.currentAccountId, "*", {
			channel: "EVT_DB_INSERT:" + modelId.toUpperCase(),
			accountId: token.currentAccountId,
			userId: token.userId,
			modelId: modelId,
			id,
			data: sanitizedObject
		})
	},

	/**
	 * INSERT MANY
	 */
	async insertMany(req, res) {
		const modelId = req.path_0
		const token = req.token
		const body = req.body

		// log("kiss.db.insertMany: " + modelId + " / " + body.length + " record(s)")

		if (!Array.isArray(body)) throw new BadRequest()
		if (body.length == 0) return res.status(200).send({
			success: true
		})

		await permissionGrantedOnModel(req, res, "create")

		// Timestamp
		const currentDateTime = new Date().toISOString()
		body.forEach(record => {
			// record.createdAt = record.updatedAt = currentDateTime
			// record.createdBy = record.updatedBy = token.userId
			record.createdAt = currentDateTime
			record.createdBy = token.userId
		})

		// Insert to db
		const suffix = req.targetCollectionSuffix || ""
		await kiss.db.insertMany(modelId + suffix, body)

		// Handle special cases to keep server cache updated for:
		// - links: only happens when importing a complete application with data
		if (modelId == "link") {
			body.forEach(record => kiss.app.addLink(record, token.currentAccountId))
		}

		res.status(200).send(body)

		// Broadcast the event to all users of the active account
		kiss.websocket.publish(token.currentAccountId, "*", {
			channel: "EVT_DB_INSERT_MANY:" + modelId.toUpperCase(),
			accountId: token.currentAccountId,
			userId: token.userId,
			modelId: modelId,
			data: body
		})
	},

	/**
	 * UPDATE ONE
	 */
	async updateOne(req, res) {
		const modelId = req.path_0
		const id = req.path_1
		const body = req.body
		const token = req.token

		// log("kiss.db.updateOne: " + modelId + " / " + id)
		await permissionGrantedOnModel(req, res, "update")

		// Sanitize object according to model
		const sanitizedObject = kiss.databaseSanitizer.clean(body, modelId)
		if (sanitizedObject.accountId) sanitizedObject.accountId = token.currentAccountId

		// Timestamp the update
		kiss.tools.timeStamp(sanitizedObject, token.userId, false)

		const query = {
			_id: id
		}

		console.log("#################################################################")
		console.log(body)
		console.log("--")
		console.log(sanitizedObject)

		// Update db
		const suffix = req.targetCollectionSuffix || ""
		await kiss.db.updateOne(modelId + suffix, query, sanitizedObject)

		// Handle special cases to keep server cache updated for:
		// - models
		// - groups
		// - users
		if (modelId == "model") {
			kiss.app.updateModel(id, sanitizedObject)

		} else if (modelId == "group") {
			kiss.directory.updateGroup(token.currentAccountId, id, sanitizedObject)

		} else if (modelId == "user") {
			let accountUsers = kiss.directory.users[token.currentAccountId]
			if (accountUsers) {
				let user = accountUsers[sanitizedObject.email]
				if (user) {
					user.type = sanitizedObject.type
				}
			}
		}

		res.status(200).send(sanitizedObject)

		// Broadcast the event to all users of the active account
		kiss.websocket.publish(token.currentAccountId, "*", {
			channel: "EVT_DB_UPDATE:" + modelId.toUpperCase(),
			accountId: token.currentAccountId,
			userId: token.userId,
			modelId: modelId,
			id,
			data: sanitizedObject
		})
	},

	/**
	 * UPDATE DEEP
	 */
	async updateOneDeep(req, res) {
		const token = req.token
		const modelId = req.path_0
		const id = req.path_1
		const suffix = req.targetCollectionSuffix || ""
		const update = req.body.update

		// log("kiss.db.updateOneDeep: " + modelId + " / " + id)
		await permissionGrantedOnModel(req, res, "update")

		// Prepare audit trail
		const auditTrail = {
			id: kiss.tools.uid(),
			createdAt: (new Date().toISOString()),
			userId: token.userId,
			recordId: id,
			update: {
				...update
			}
		}

		const record = await kiss.db.findOne(modelId + suffix, {
			_id: id
		})

		// The method will trigger a transaction that will broadcast the changes in the PubSub
		const model = kiss.app.models[modelId]
		const operations = await kiss.data.relations.updateOneDeep(model, record, update, token.userId)

		res.status(200).send({
			success: true
		})

		// Broadcast the operations
		if (operations.length == 1) {

			// Single operation: the transaction is downgraded to an updateOne
			const operation = operations[0]

			// !Important
			// Handle special cases to keep server cache updated for:
			// - models
			// - groups
			if (operation.modelId == "model") {
				kiss.app.updateModel(operation.recordId, operation.updates)

			} else if (operation.modelId == "group") {
				kiss.directory.updateGroup(token.currentAccountId, operation.recordId, operation.updates)
			}

			kiss.websocket.publish(token.currentAccountId, "*+", {
				channel: "EVT_DB_UPDATE:" + operation.modelId.toUpperCase(),
				accountId: token.currentAccountId,
				userId: token.userId,
				modelId: operation.modelId,
				id: operation.recordId,
				data: operation.updates
			})
		} else {
			// Multiple operations: the transaction is processed with an updateBulk
			kiss.websocket.publish(token.currentAccountId, "*+", {
				channel: "EVT_DB_UPDATE_BULK",
				accountId: token.currentAccountId,
				userId: token.userId,
				data: operations
			})
		}

		// Add audit trail entry, if required
		if (!kiss.tools.hasAuditTrail(modelId)) return

		kiss.db.insertOne("pluginAudit_" + token.currentAccountId, auditTrail)
	},

	/**
	 * UPDATE MANY
	 */
	async updateMany(req, res) {
		const modelId = req.path_0
		const body = req.body
		const token = req.token

		// log("kiss.db.updateMany: " + modelId)
		await permissionGrantedOnModel(req, res, "update")

		// Convert normalized filter to MongoDb syntax
		if (body.filterSyntax == "normalized") {
			body.filter = kiss.databaseFilters.convertFilterGroup(body.filter, req)
		}

		// Sanitize
		const sanitizedObject = kiss.databaseSanitizer.clean(body.update, modelId)
		if (sanitizedObject.accountId) sanitizedObject.accountId = token.currentAccountId

		// Timestamp the update
		kiss.tools.timeStamp(sanitizedObject, token.userId, false)

		// Update db
		const suffix = req.targetCollectionSuffix || ""
		await kiss.db.updateMany(modelId + suffix, body.filter, sanitizedObject)

		res.status(200).send(sanitizedObject)

		// Broadcast the event to all users of the active account
		kiss.websocket.publish(token.currentAccountId, "*", {
			channel: "EVT_DB_UPDATE_MANY:" + modelId.toUpperCase(),
			accountId: token.currentAccountId,
			userId: token.userId,
			modelId: modelId,
			data: sanitizedObject
		})
	},

	/**
	 * UPDATE BULK
	 *
	 * Update many records with different updates
	 */
	async updateBulk(req, res) {
		const operations = req.body
		const token = req.token
		const suffix = req.targetCollectionSuffix || ""

		// log("kiss.db.updateBulk: " + operations.length + " operations")

		// No operations to perform, exit
		if (operations.length == 0) return res.status(200).send({
			success: true
		})

		req.path_0 = operations[0].modelId
		req.path_1 = operations[0].recordId
		const originalModelId = req.path_0

		// When the request comes from a client and not from the server,
		// we must use "updateBulk" method with caution and check that all operations
		// are done on the SAME model to prevent a hack on ACL of other models.
		operations.every(operation => {
			if (operation.modelId != originalModelId) throw new Forbidden()
		})

		// Sanitize all operations according to model definitions
		operations.forEach(operation => {
			const sanitizedObject = kiss.databaseSanitizer.clean(operation.updates, operation.modelId)
			if (sanitizedObject.accountId) sanitizedObject.accountId = token.currentAccountId

			// Timestamp the update
			kiss.tools.timeStamp(sanitizedObject, token.userId, false)
			operation.updates = sanitizedObject

			// Adjust modelId to dispatch data depending on the model
			operation.modelId = operation.modelId + suffix
		})

		await permissionGrantedOnModel(req, res, "update")

		// Update db
		await kiss.db.updateBulk(operations)

		// Restore original modelId if it was modified for db operations
		if (suffix) {
			operations.forEach(operation => operation.modelId = originalModelId)
		}

		// Send the result back
		res.status(200).send(operations)

		// Broadcast the event to all users of the active account
		kiss.websocket.publish(token.currentAccountId, "*", {
			channel: "EVT_DB_UPDATE_BULK",
			accountId: token.currentAccountId,
			userId: token.userId,
			data: operations
		})
	},

	/**
	 * FIND BY ID
	 */
	async findOne(req, res) {
		const modelId = req.path_0
		const id = req.path_1

		// log("kiss.db.findOne: " + modelId + " / " + id)

		const suffix = req.targetCollectionSuffix || ""
		const record = await kiss.db.findOne(modelId + suffix, {
			_id: id
		})

		res.status(200).send(record || false)
	},

	/**
	 * FIND MANY BY ID
	 */
	async findById(req, res) {
		const suffix = req.targetCollectionSuffix || ""
		const modelId = req.path_0
		const ids = req.body.ids
		const sort = req.body.sort
		const sortSyntax = req.body.sortSyntax

		// log("kiss.db.findById: " + modelId + " / " + ids.join())

		const records = await kiss.db.findById(modelId + suffix, ids, sort, sortSyntax)

		res.status(200).send(records)
	},

	/**
	 * FIND
	 */
	async find(req, res) {
		const suffix = req.targetCollectionSuffix || ""
		const modelId = req.path_0
		const token = req.token
		let query = {}

		// log("kiss.db.find: " + modelId)

		// Static models are shared between accounts.
		// For this, data must be filtered by account, except when the server is in single tenant mode.
		// Dynamic models are not shared between accounts, no need to filter their data by account
		if (!kiss.tools.isUid(modelId) && !suffix && config.multiTenant !== "false") {
			query.accountId = token.currentAccountId
		}

		let records = await kiss.db.find(modelId + suffix, query)
		
		if (token.isOwner || token.isManager) {
			// Onwer and managers has no restrictions
			return res.status(200).send(records)

		} else {
			// Filter records according to the model's ACL (if any)
			records = await filterRecordsByACL(req, records, kiss.app.models[modelId])
			res.status(200).send(records)
		}
	},

	/**
	 * FIND AND SORT
	 */
	async findAndSort(req, res) {
		const suffix = req.targetCollectionSuffix || ""
		const modelId = req.path_0
		const token = req.token
		const body = req.body

		// log("kiss.db.findAndSort: " + modelId)

		// Convert "filter" and "sort" objects to MongoDb syntax
		if (body.filterSyntax == "normalized") {
			body.filter = kiss.databaseFilters.convertFilterGroup(body.filter, req)
		}

		if (body.sortSyntax == "normalized") {
			body.sort = kiss.databaseFilters.convertSort(body.sort, modelId)
		}

		// Static models are shared between accounts.
		// For this, data must be filtered by accountId, except when the server is in single tenant mode.
		// Dynamic models are not shared between accounts, no need to filter.
		if (!kiss.tools.isUid(modelId) && !suffix && config.multiTenant !== "false") {
			body.filter.accountId = token.currentAccountId
		}

		let records = await kiss.db.findAndSort(modelId + suffix, body.filter, body.sort, body.project, body.skip, body.limit)

		if (token.isOwner || token.isManager) {
			// Onwer and managers has no restrictions
			return res.status(200).send(records)

		} else {
			// Filter records according to the model's ACL (if any)
			records = await filterRecordsByACL(req, records, kiss.app.models[modelId])
			res.status(200).send(records)
		}
	},

	/**
	 * SOFT DELETE ONE
	 */
	async softDeleteOne(req, res) {
		const modelId = req.path_0
		const id = req.path_1
		const token = req.token

		// log("kiss.db.softDeleteOne: " + modelId + " / " + id)
		await permissionGrantedOnModel(req, res, "delete")

		let query = {
			_id: id
		}

		const suffix = req.targetCollectionSuffix || ""
		const success = await kiss.db.softDeleteOne(modelId + suffix, query, token)

		if (success) {
			res.status(200).send({
				success: true
			})

			// Broadcast the event to all users of the active account
			kiss.websocket.publish(token.currentAccountId, "*", {
				channel: "EVT_DB_DELETE:" + modelId.toUpperCase(),
				accountId: token.currentAccountId,
				userId: token.userId,
				modelId: modelId,
				id: id
			})

			// Deleting a dynamic record can trigger updates on its relations
			if (kiss.tools.isUid(modelId)) {
				const operations = await kiss.data.relations.updateForeignRecords(modelId, id)

				if (operations.length > 0) {
					kiss.websocket.publish(token.currentAccountId, "*+", {
						channel: "EVT_DB_UPDATE_BULK",
						accountId: token.currentAccountId,
						userId: token.userId,
						data: operations
					})
				}
			}

		} else {
			throw new InternalServerError()
		}
	},

	/**
	 * SOFT DELETE MANY
	 */
	async softDeleteMany(req, res) {
		const token = req.token
		const modelId = req.path_0
		const body = req.body

		// log("kiss.db.softDeleteMany: " + modelId)
		await permissionGrantedOnModel(req, res, "delete")

		// Convert normalized filter to MongoDb syntax
		if (body.filterSyntax == "normalized") {
			body.filter = kiss.databaseFilters.convertFilterGroup(body.filter, req)
		}

		const suffix = req.targetCollectionSuffix || ""
		const success = await kiss.db.softDeleteMany(modelId + suffix, body.filter, token)

		if (success) {
			// Broadcast the event to all users of the active account
			kiss.websocket.publish(token.currentAccountId, "*", {
				channel: "EVT_DB_DELETE_MANY:" + modelId.toUpperCase(),
				accountId: token.currentAccountId,
				userId: token.userId,
				modelId: modelId,
				data: body.filter
			})

			// Deleting a dynamic records can trigger updates on their relations
			if (kiss.tools.isUid(modelId)) {
				if (body.filter && body.filter._id && body.filter._id.$in) {
					const ids = body.filter._id.$in
					const operations = await kiss.data.relations.updateForeignRecordsForMultipleRecords(modelId, ids)

					if (operations.length > 0) {
						kiss.websocket.publish(token.currentAccountId, "*+", {
							channel: "EVT_DB_UPDATE_BULK",
							accountId: token.currentAccountId,
							userId: token.userId,
							data: operations
						})
					}
				}
			}
		}

		res.status(200).send({
			success: true
		})
	},

	/**
	 * HARD DELETE ONE
	 */
	async deleteOne(req, res) {
		const suffix = req.targetCollectionSuffix || ""
		const modelId = req.path_0
		const id = req.path_1
		const token = req.token

		// log("kiss.db.deleteOne: " + modelId + " / " + id)
		await permissionGrantedOnModel(req, res, "delete")

		// Handle special cases for "file" records
		if (modelId == "file") {
			// Physically remove the files from their storage (local or amazon_s3)
			await filesController.deleteFiles({
				req,
				modelId: modelId + suffix,
				ids: [id]
			})
		}

		// Delete the record
		await kiss.db.deleteOne(modelId + suffix, {
			_id: id
		})

		// Handle special cases to keep server cache updated for:
		// - links
		if (modelId == "link") {
			kiss.app.deleteLink(id, token.currentAccountId)
		}

		res.status(200).send({
			success: true
		})

		// Broadcast the event to all users of the active account
		kiss.websocket.publish(token.currentAccountId, "*", {
			channel: "EVT_DB_DELETE:" + modelId.toUpperCase(),
			accountId: token.currentAccountId,
			userId: token.userId,
			modelId: modelId,
			id: id
		})

		// Deleting a dynamic record can trigger updates on its relations
		if (kiss.tools.isUid(modelId)) {
			const operations = await kiss.data.relations.updateForeignRecords(modelId, id)

			if (operations.length > 0) {
				kiss.websocket.publish(token.currentAccountId, "*+", {
					channel: "EVT_DB_UPDATE_BULK",
					accountId: token.currentAccountId,
					userId: token.userId,
					data: operations
				})
			}
		}
	},

	/**
	 * HARD DELETE MANY
	 */
	async deleteMany(req, res) {
		const suffix = req.targetCollectionSuffix || ""
		const token = req.token
		const modelId = req.path_0
		const body = req.body

		// log("kiss.db.deleteMany: " + modelId)
		await permissionGrantedOnModel(req, res, "delete")

		// Convert normalized filter to MongoDb syntax
		if (body.filterSyntax == "normalized") {
			body.filter = kiss.databaseFilters.convertFilterGroup(body.filter, req)
		}

		if (modelId == "trash") {
			await this.deleteTrashDependencies(req, res)
		}

		const response = await kiss.db.deleteMany(modelId + suffix, body.filter)

		// Broadcast the event to all users of the active account
		kiss.websocket.publish(token.currentAccountId, "*", {
			channel: "EVT_DB_DELETE_MANY:" + modelId.toUpperCase(),
			accountId: token.currentAccountId,
			userId: token.userId,
			modelId: modelId,
			data: {
				deleted: response.deletedCount
			}
		})

		res.status(200).send(response)
	},

	/**
	 * Handle the special case of emptying the trash:
	 */
	async deleteTrashDependencies(req, res) {
		try {
			const suffix = req.targetCollectionSuffix || ""
			const body = req.body

			// Get the records to delete
			if (body.filterSyntax == "normalized") {
				body.filter = kiss.databaseFilters.convertFilterGroup(body.filter, req)
			}

			const records = await kiss.db.find("trash" + suffix, body.filter)
			const dynamicRecords = records.filter(record => kiss.tools.isUid(record.sourceModelId))
			const workspaceRecords = records.filter(record => record.sourceModelId == "workspace")

			// Handke dynamic records
			// - attached files must be physically deleted permanently
			// - 'link' records must be deleted to avoid empty relationships
			if (dynamicRecords.length > 0) {

				// Delete attached files
				// No need to await the request result
				filesController.deleteFilesFromRecords({
					req,
					records
				})

				// Delete relationships
				// No need to await the request result
				kiss.data.relations.deleteLinksFromRecords({
					req,
					records
				})

				// Delete comments associated to the records
				const recordIds = dynamicRecords.map(record => record.id)
				const response = await kiss.db.deleteMany("pluginComment" + suffix, {
					recordId: {
						$in: recordIds
					}
				})
				if (response.deletedCount > 0) {
					log.info(`kiss.database - ${req.token.userId } deleted ${response.deletedCount} comment(s)`)
				}
			}

			// Handle workspaces
			// - deleting a workspace must also delete its contained applications
			if (workspaceRecords.length > 0) {
				const workspaceIds = workspaceRecords.map(workspace => workspace.id)
				const applications = await kiss.db.find("application", {
					workspaceId: {
						$in: workspaceIds
					}
				})

				if (applications.length > 0) {
					const applicationIds = applications.map(app => app.id)
					await kiss.db.deleteMany("application", {
						_id: {
							$in: applicationIds
						}
					})
					log.info(`kiss.database - ${req.token.userId } deleted ${applications.length} application(s)`)
				}
			}
		} catch (err) {
			log.err("Could not process the deletion of dependencies while emptying the trash", err)
		}
	}
}