/**
 * 
 * kiss.data.Transaction
 * 
 * By default, KissJS is built to work with MongoDb, which is a NoSQL databases.
 * NoSQL are often denormalized.
 * What does it mean?
 * 
 * It means that when there are relationships between Models, some data is voluntarily duplicated accross documents to avoid joints.
 * For example, imagine a **Project** document which is connected to many **Tasks** documents.
 * 
 * In that situation, a common practice is to duplicate the **project name** within all its connected tasks.
 * But then, what happens if you change the project name afterwards? That's exactly where the complex stuff begins!
 * 
 * You will have to update all the connected documents by yourself.
 * But instead of requesting the server for each update, you can batch your updates into a single **Transaction**.
 * 
 * This is the purpose of this class.
 * 
 * @param {object} [config]
 * @param {object} [config.id] - Optional transaction id
 * @param {object} [config.operations] - List of operations to perform in the transaction (can be added later with addOperation method)
 * @param {object} [config.userId] - User who triggered the transaction, in case we need to timestamp the updated records
 * @returns {object} this
 * 
 * @example
 * // A transaction looks like this.
 * // Each operation contains the target model, target record, and updates to perform on the record
 * {
 *	"id": "98650fb1-9288-4be9-a611-394211e9fff9",
 *	"operations": [{
 *      "action": "update",
 *		"modelId": "d620b995-89a1-4f1b-a4c6-a4a11949de94",
 *		"recordId": "6ab2f4fd-e6f3-4fc3-998f-96629e7ef109",
 *		"updates": {
 *			"SJg2oX@w": "New project name"
 *		}
 *	}, {
 *      "action": "update",
 *		"modelId": "01f6c940-e247-4d85-9f35-e3d59ea49289",
 *		"recordId": "5eb85fe3-2634-466c-839f-08423fc1cac1",
 *		"updates": {
 *			"yUbNrXw9": "New project name"
 *		}
 *	}, {
 *      "action": "update",
 *		"modelId": "01f6c940-e247-4d85-9f35-e3d59ea49289",
 *		"recordId": "5ae68056-f099-473b-8f5f-af9eeec9ddff",
 *		"updates": {
 *			"yUbNrXw9": "New project name"
 *		}
 *	}, {
 *      "action": "update",
 *		"modelId": "01f6c940-e247-4d85-9f35-e3d59ea49289",
 *		"recordId": "1f7f9d6a-2cbc-42f1-80c4-8ad795141493",
 *		"updates": {
 *			"yUbNrXw9": "New project name"
 *		}
 *	}]
 * }
 */
kiss.data.Transaction = class {
    constructor(config = {}) {
        this.id = config.id || kiss.tools.uid()
        this.operations = config.operations || []
        this.dbMode = config.dbMode
        this.userId = config.userId
        return this
    }

    /**
     * Add an operation to the Transaction.
     * A single operation can contain multiple field updates.
     * 
     * @param {object} operation
     * @param {string} operation.action - Only "update" at the moment. Will support "insert" and "delete" in the future.
     * @param {string} operation.modelId -  The target model (allow to batch the operations by database table)
     * @param {string} operation.recordId - The record to update
     * @param {object} operation.updates - The update to apply to the record
     * @returns {object} The transaction itself (makes the method chainable)
     * 
     * @example
     * myTransaction.add({
     *  action: "update",
     *  modelId: "project",
     *  recordId: "5eb85fe3-2634-466c-839f-08423fc1cac1",
     *  updates: {
     *      name: "New project name",
     *      status: "pending"
     *  }
     * })
     */
    addOperation(operation) {
        this.operations.push(operation)
        return this
    }

    /**
     * Process a transaction
     * 
     * @async
     * @returns {object[]} Array of operations in case of success, empty Array otherwise
     */
    async process() {
        // Exit if no operations to process        
        if (this.operations.length == 0) {
            return []
        }

        // Merge operations by model and record
        let groupedOperations = {}

        this.operations.forEach(operation => {
            const modelId = operation.modelId
            const recordId = operation.recordId
            groupedOperations[modelId] = groupedOperations[modelId] || {}
            groupedOperations[modelId][recordId] = groupedOperations[modelId][recordId] || {}
            Object.assign(groupedOperations[modelId][recordId], operation.updates)
        })

        // Flatten the list of operations
        let flatOperations = []
        Object.keys(groupedOperations).forEach(modelId => {
            const modelOperations = groupedOperations[modelId]

            Object.keys(modelOperations).forEach(recordId => {
                const recordOperations = modelOperations[recordId]
                if (Object.keys(recordOperations).length == 0) return // Skip objects without any mutations

                // If a userId is provided, we timestamp the record
                if (this.userId) {
                    recordOperations.updatedAt = new Date().toISOString()
                    recordOperations.updatedBy = this.userId
                }

                flatOperations.push({
                    modelId,
                    recordId,
                    updates: recordOperations
                })
            })
        })

        // Process all the operations in bulk.
        // If the transaction only contains a single operation, then we downgrade it to a simple updateOne operation
        let success

        if (flatOperations.length == 1) {

            // Single operation: the transaction is downgraded to an updateOne
            // log(`kiss.data.Transaction - Processed as updateOne`)
            const operation = flatOperations[0]

            if (kiss.isClient) {
                success = await kiss.db.updateOne(operation.modelId, operation.recordId, operation.updates)

            } else {
                success = await kiss.db.updateOne(operation.modelId, {
                    _id: operation.recordId
                }, operation.updates)
            }
        } else {

            // Multiple operations: the transaction is processed with an updateBulk
            // log(`kiss.data.Transaction - Processed as updateBulk`)
            success = await kiss.db.updateBulk(flatOperations)
        }

        if (!success) {
            log(`kiss.data.Transaction - Could not process the operations`)
            this._rollback()
            return []
        } else {
            log(`kiss.data.Transaction - Processed ${flatOperations.length} operation(s)`)
            this._commit()
            return flatOperations
        }
    }

    /**
     * Commit a transaction
     * 
     * @private
     * @ignore
     */
    _commit() {
        // TODO
    }

    /**
     * Rollback a transaction
     * 
     * @private
     * @ignore
     */
    _rollback() {
        // TODO
    }
}

;