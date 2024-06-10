/**
 * 
 * ## A simple ACL manager
 * 
 * This small module provides an isomorphic record-based ACL.
 * 
 * The ACL ensures that a user has the PERMISSION to perform an ACTION.
 * To check this, the ACL configuration consists of RULES and VALIDATOR functions (aka "validators"):
 * 
 * ```
 *    acl: {
 *       permissions: {
 *           create: [
 *               { isOwner: true } // <= RULE
 *           ],
 *           read: [
 *               { authenticatedCanRead: true }, // RULE 1
 *               { isReader: true } // RULE 2 (evaluated only if RULE 1 is false)
 *           ],
 *           update: [
 *               { isOwner: true, isBanned: false }, // <= RULE with 2 conditions to fulfill
 *               { isDesigner: true }
 *           ],
 *           delete: [
 *               { isOwner: true }
 *           ],
 *           paintCar: [ // <= any arbitrary ACTION can be evaluated, not only CRUD operations
 *               { isOwner : true}
 *           ]
 *       },
 *   
 *       validators: {
 *           async isOwner({req}) { // <= VALIDATOR function
 *               if (kiss.isClient) return kiss.session.isOwner // <= ACL can be checked on the client or the server
 *               else return req.token.isOwner
 *           },
 *   
 *           async isDesigner({userACL, record}) {
 *               return kiss.tools.intersects(userACL, record.accessUpdate)
 *           },
 *   
 *           async authenticatedCanRead({record}) {
 *               return !!record.authenticatedCanRead
 *           },
 *   
 *           async isReader({userACL, record}) {
 *               if (record.accessRead && kiss.tools.intersects(userACL, record.accessRead)) return true
 *           },
 * 
 *           async isBanned({userACL, record}) {
 *               return (userACL.indexOf("banned") != -1)
 *           }
 *       }
 *    }
 * ```
 * 
 * This way, it's very straightforward to read the permissions, even with complex business cases.
 * 
 * In the example above, the PERMISSION to UPDATE requires the user:
 * - to be an owner AND not to be banned
 * OR
 * - to be a designer
 * 
 * The validator functions are called to evaluate those rules.
 * 
 * The rules are evaluated sequentially, and it stops if a rule is fulfilled.
 * A single rule can have multiple validators, for example:
 * { isOwner: false, isDesigner: true }
 * 
 * All the validators of a rule must pass to consider the rule fulfilled.
 * 
 * Inside a validator, we can use kiss.isClient and kiss.isServer to check where the code is executed.
 * This allows to have specific code depending on the execution context.
 * 
 * Validator functions used for creation and mutations (create, patch, delete) receive an object with 4 properties:
 * - req: the server request object
 * - userACL: an array of string containing all the names that identify a user, including groups.
 * - record: the database record we're trying to access
 * - model: the record's model
 * 
 * A validator function used for the "read" action receives an object with 3 properties:
 * - req: the server request object
 * - userACL
 * - record: the database record to evaluate. The validator returns true if the record matches the requirements.
 * 
 * For the "read" operation, the validators are evaluated against **each** record to filter data according to the user's permissions.
 * 
 * When executed on the CLIENT, the req property is not sent (the request doesn't exist here).
 * Validators are asynchronous because they sometimes need to retrieve database objects.
 * 
 * @namespace
 * 
 */
kiss.acl = {
    /**
     * Check a permission to perform an action on a record
     * 
     * @async
     * @param {object} config
     * @param {string} config.action - Ex: "create", "update", "read", "paintCar", "setCharacterName"
     * @param {object} config.record - CLIENT ONLY - record which we want to check the access rights
     * @param {object} config.req - SERVER ONLY - Server request object
     * @returns {boolean} true if permission is granted
     * 
     * @example
     * const record = await kiss.db.findOne("opportunity", {
     *  _id: "01890143-81ba-71bb-a1e9-155872656bdf"
     * })
     * 
     * const canUpdate = await kiss.acl.check({
     *  action: "update",
     *  record
     * })
     * console.log(canUpdate) // true or false
     */
    async check({action, record}) {
        const userACL = kiss.session.getACL()
        let model = record.model

        try {
            const acl = (kiss.tools.isUid(model.id)) ? kiss.app.models.dynamicModel.acl : model.acl
            
            // No acl defined = everyone has access
            if (!acl) return true

            // No permissions defined = everyone has access
            const permissions = acl.permissions
            if (!permissions) return true
    
            const permissionRules = permissions[action]
            if (!permissionRules) return true

            // Check every rule
            for (let rule of permissionRules) {
    
                let hasPermission = true
                const validators = Object.keys(rule)
    
                for (let validator of validators) {
                    const ruleTestValue = rule[validator]
                    const ruleFunction = acl.validators[validator]

                    if (ruleFunction) {
                        const permissionCheck = await ruleFunction({
                            userACL,
                            model,
                            record
                        })
                        
                        // Flag if a condition fails
                        if (permissionCheck != ruleTestValue) hasPermission = false
                        
                        log(`kiss.acl - check (client) - ${action} - Model: ${model.name} ${record.id.slice(0, 7)}... Permission: ${validator} = ${permissionCheck} - Access ${(hasPermission) ? "granted" :  "denied"}`, (hasPermission) ? 2 : 4)
                    }
                    else {
                        log(`kiss.acl - check (client) - Error: validator function <${validator}> is not defined for model ${model.id}`, 4)
                    }
                }
    
                // All conditions passed
                if (hasPermission) return true
            }
    
            return false

        } catch(err) {
            log(`kiss.acl - check (client) - Validator error - Model: ${model.id}`, 4, err)
            return false
        }
    },

    /**
     * Filter records for "read"" operations (find, findAndSort)
     * 
     * The rules defined in the "read" configuration of the acl object are evaluated against **each** record.
     * For this reason, this ACL system should be applied only to small sets of records (ex: workspaces, applications...)
     * but not on big sets of records (like dynamic tables with thousands of records).
     * 
     * For big sets of records, the ACL should not be record-based (per record), but model-based (per table/collection)
     * 
     * @async
     * @param {object} config
     * @param {object[]} config.records - records to filter
     * @param {object} config.req - SERVER ONLY - Server request
     * @returns {object[]} filtered records
     * 
     * @example
     * // Inside a NodeJS controller
     * const records = await kiss.db.find("opportunity", {}) // Retrieve all the opportunities
     * 
     * const authorizedRecords = await kiss.acl.filter({
     *  records,
     *  req
     * })
     * console.log(authorizedRecords) // Show only the records where the user has a read access
     * 
     */
    async filter({records}) {

        log("######################################################################")
        log("######################################################################")
        log("######################################################################")
        log("######################################################################")
        
        const userACL = kiss.session.getACL()
        const firstRecord = records[0]
        const model = firstRecord.model

        try {
            // No acl defined = everyone has access
            const acl = model.acl
            if (!acl) return true

            // No permissions defined = everyone has access
            const permissions = acl.permissions
            if (!permissions) return true

            const permissionRules = permissions.read
            if (!permissionRules) return true

            let hasPermission
            let result = []

            for (record of records) {

                // Check every rule
                for (let rule of permissionRules) {
                    const validators = Object.keys(rule)
                    hasPermission = true

                    // Check every validator of the rule
                    // The must ALL be fulfilled to validate the rule
                    for (let validator of validators) {
                        const ruleTestValue = rule[validator]
                        const ruleFunction = acl.validators[validator]

                        if (ruleFunction) {
                            const permissionCheck = await ruleFunction({
                                userACL,
                                record
                            })
                            
                            log("kiss.acl - filter (client) - Permission: " + validator + " / " + permissionCheck, (permissionCheck) ? 2 : 4)

                            // If a validator fails, the rule is not fulfilled => we skip to the next rule
                            if (permissionCheck != ruleTestValue) {
                                hasPermission = false
                                break
                            }
                        }
                    }

                    if (hasPermission) break
                }

                // All conditions passed
                if (hasPermission) result.push(record)
            }

            return result

        } catch (err) {
            log(`kiss.acl - filter (client) - Validator error - Model: ${model.id} / Validator: ${validator}`, 4, err)
            return false
        }
    }
}

;