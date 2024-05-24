const dbController = require('./database')
const {
	API : {
		MethodNotAllowed,
		Forbidden
	}
} = require('../core/errors')

/**
 * 
 * Default controller for basic CRUD operations
 * 
 * The default controller handles all HTTP verbs (GET, POST, PACTH, PUT, DELETE) and translate the HTTP requests into database requests.
 * 
 * Standard requests:
 * - GET /modelId => db.find
 * - GET /modelId/recordId => db.findOne
 * - POST /modelId with simple object {} => db.insertOne
 * - POST /modelId with Array [] => db.insertMany
 * - PATCH /modelId with simple object {} => db.updateOne
 * 
 * Non standard requests:
 * - POST /modelId with "operation = search" and "filter" in the request body => performs a findAndSort() using db.find(query).sort(sort)
 * - POST /modelId with "operation = search" and "ids" in the request body => performs a findById() using db.findById(ids)
 * - POST /modelId with "operation = delete" in the request body => performs a deleteMany
 * - DELETE /modelId/recordId => performs a soft delete (not a hard delete) using db.softDeleteOne
 * - PATCH with an Array in the request body => bulk operations using db.updateBulk
 * - PATCH with "operation = updateOneDeep" in the request body => performs a deep update with relationships
 * 
 * The process() method route the request to the right controller method.
 * 
 */
const defaultController = {

    /**
     * Process a request according to the requested HTTP verb
     */
    async process(req, res, next) {
        // Define controller accepted methods
        if (["get", "post", "put", "patch", "delete", "options"].indexOf(req.method) > -1) {

            if (req.body.operation == "updateOneDeep") {
                // Deep update with relationships
                await dbController.updateOneDeep(req, res, next)

            } else if (req.body.operation == "search") {
                
                if (req.body.filter) {
                    // If the payload has a "search" and "filter" properties, it's a "findAndSort" request
                    await dbController.findAndSort(req, res, next)
                }
                else if (req.body.ids) {
                    // If the payload has a "search" and "ids" properties, it's a "findById" request
                    await dbController.findById(req, res, next)
                }

            } else if (req.body.operation == "delete") {

                // If the payload has a delete operation, it's a "deleteMany" request
                // Note: REST doesn't have any standard way to perform a bulk delete.
                // For this, we use a custom POST operation, as suggested in the Google API Design Guide.
                if (req.body.sendToTrash == true) {

                    // Soft deletion happens if the request has a body like {sendToTrash: true}
                    // It's a KissJS server special feature
                    await dbController.softDeleteMany(req, res, next)

                } else {
                    await dbController.deleteMany(req, res, next)
                }
            } else {
                // Otherwise it's a standard request
                await defaultController[req.method](req, res, next)
            }
        } else {
			throw new MethodNotAllowed()
        }
    },

    /**
     * OPTIONS (PRE-FLIGHT)
     */
    options(req, res) {
        res.status(200).end()
    },

    /**
     * GET: redirects to find or findOne depending on the URL parameters
     */
    async get(req, res, next) {
        if (!req.path_1) {
            // GET /modelId => find
            await dbController.find(req, res, next)
        } else {
            // GET /modelId/id => findOne
            await dbController.findOne(req, res, next)
        }
    },

    /**
     * POST: redirect to insert or insertMany (if body content is an Array)
     */
    async post(req, res, next) {
        if (req.body instanceof Array) {
            // POST data => insertOne
            await dbController.insertMany(req, res, next)
        } else {
            // POST data[] => insertMany
            await dbController.insertOne(req, res, next)
        }
    },

    /**
     * PATCH: redirect to updateOne or updateBulk (if body content is an Array with multiple updates)
     */
    async patch(req, res, next) {
        // If the payload is an Array, it's a transaction
        if (req.body instanceof Array) {

            if (req.body.length == 1) {
                // If the transaction has a single update, we downgrade it to an updateOne
                const transaction = req.body[0]
                req.path_0 = transaction.modelId
                req.path_1 = transaction.recordId
                req.body = transaction.updates

                await dbController.updateOne(req, res, next)
            } else {
                // Otherwise we perform a bulk update
                await dbController.updateBulk(req, res, next)
            }
        } else {
            await dbController.updateOne(req, res, next)
        }
    },

    /**
     * DELETE: performs a deletion or soft deletion
     * 
     * Soft deletion happens if the request has a body like {sendToTrash: true}
     * It's a KissJS server special feature
     */
    async delete(req, res, next) {
        if (req.body && req.body.sendToTrash == true) {
            await dbController.softDeleteOne(req, res, next)
        } else {
            await dbController.deleteOne(req, res, next)
        }
    }
}

module.exports = defaultController