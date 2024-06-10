/**
 * 
 * kiss.acl (Access Control List)
 * 
 * KissJS ACL is isomorphic: it works both on the server and on the client side.
 * This allows to pre-check security on the client side, and to avoid unnecessary requests to the server.
 * If bypassed on the client side, the server will still check the permissions.
 * 
 * See ACL on the client side to check how it works.
 * 
 */
module.exports = {
    fields: [],

    addFields(model, fields) {
        kiss.acl.fields.push({
            modelId: model.id,
            fields: fields.map(field => field.id)
        })
    },

    /**
     * Check a permission to perform an action on a record,
     * assuming the request is a standard get/post/patch/ with the path like:
     * /{modelId}/{recordId}
     * 
     * @async
     * @param {object} config
     * @param {string} config.action - Ex: "create", "update", "read", "paintCar", "setCharacterName"
     * @param {object} config.req - Server request
     * @returns {boolean} true if permission is granted
     */
    async check({action, req}) {
        let modelId
        let validator
        
        try {
            modelId = req.path_0
            const id = req.path_1
            const userACL = req.token.userACL

            // Select the right model
            let model = kiss.app.models[modelId]

            // The model does not exist in cache: error
            if (!model) {
                log(`kiss.acl.check (server) - Error: the model ${modelId} was not found`)
                return false
            }
            
            const acl = (kiss.tools.isUid(modelId)) ? kiss.app.models.dynamicModel.acl : model.acl

            // No acl defined = everyone has access
            log.info("Model is: " + modelId)
            log.info("ACL is:")
            log(acl)

            if (!acl) return true

            // No permissions defined = everyone has access
            const permissions = acl.permissions
            if (!permissions) return true

            const permissionRules = permissions[action]
            if (!permissionRules) return true

            // Get the requested record
            let record = {}
            
            if (req.method == "post") {
                // For post method, the record is the body
                record = req.body
                record.accountId = req.token.currentAccountId
            }
            else if ((req.method == "patch" || req.method == "delete") && id) {
                // For patch and delete methods, we get the existing record
                let suffix = req.targetCollectionSuffix || ""
                if (kiss.tools.isUid(modelId)) suffix = ""

                record = await kiss.db.findOne(modelId + suffix, {
                    _id: id
                })
            }

            // The user must be connected to the account owning the record
            // if (!kiss.tools.isUid(modelId) && record.accountId != req.token.currentAccountId) {
            //     log.warn(`kiss.acl.check (server) - Error: the record ${modelId} / ${record.id} is accessed by a user (${req.token.userId}) not connected to the account owning the record.`)
            //     return false
            // }

            // Check every rule
            for (let rule of permissionRules) {
                let hasPermission = true
                const validators = Object.keys(rule)

                for (let validator of validators) {
                    const ruleTestValue = rule[validator]
                    const ruleFunction = model.acl.validators[validator]

                    if (ruleFunction) {
                        const permissionCheck = await ruleFunction({
                            userACL,
                            model,
                            record,
                            req
                        })

                        // Flag if a condition fails
                        if (permissionCheck != ruleTestValue) hasPermission = false

                        log(`kiss.acl.check (server) for ${req.token.userId} - ${action} - Model: ${model.name} - Permission: ${validator} = ${permissionCheck} - Access ${(hasPermission) ? "granted" :  "denied"}`)

                    } else {
                        log(`kiss.acl.check (server) - Error: validator function <${validator}> is not defined for model ${modelId}`)
                    }
                }

                // All conditions passed
                if (hasPermission) return true
            }

            return false

        } catch (err) {
            log(`kiss.acl.check (server) - Validator error - Model: ${modelId} / Validator: ${validator}`)
            log(err)
            return false
        }
    },

    /**
     * Filter data for READ operations (find, findAndSort)
     * 
     * The rules defined in the configuration are evaluated against EACH record.
     * For this reason, this ACL system must only be applied to small sets of records (ex: workspaces, applications...)
     * but not on big sets of records (like dynamic tables with thousands of records).
     * 
     * For big sets of records, the ACL is not record-based (per record), but model-based (per table/collection)
     * 
     * @async
     * @param {object} config
     * @param {object[]} config.records - records to filter
     * @param {object} config.req - Server request
     * @returns {object[]} filtered data, or false if an error occured
     */
    async filter({records, req}) {
        const userACL = req.token.userACL
        const modelId = req.path_0
        const model = kiss.app.models[modelId]

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

            for (let record of records) {

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
                                record,
                                req
                            })

                            // log(`${record.name} - kiss.acl (server) for ${req.token.userId}  - Permission: ${validator} / ${permissionCheck}`)

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
            // log(`kiss.acl (server) - Validator error - Model: ${model.id}`)
            // log(err)
            return false
        }
    }
}