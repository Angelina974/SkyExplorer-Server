/**
 * A "link" record connects 2 records X and Y together, and they are structured like:
 * {
 *      mX: ..., // m: model id of record X
 *      rX: ..., // r: record id of record X
 *      fX: ..., // f: field id for record X
 *      mY: ...,
 *      rY: ...,
 *      fY: ...
 * }
 */
kiss.app.defineModel({
    id: "link",
    // splitBy: "account",

    name: "Link",
    namePlural: "Links",
    icon: "fas fa-link",
    color: "#00aaee",

    items: [
        {
            id: "mX",
            dataType: String
        },
        {
            id: "rX",
            dataType: String
        },
        {
            id: "fX",
            dataType: String
        },
        {
            id: "mY",
            dataType: String
        },
        {
            id: "rY",
            dataType: String
        },
        {
            id: "fY",
            dataType: String
        },
        {
            id: "auto",
            dataType: Boolean
        }
    ],

    acl: {
        permissions: {
            create: [
                {isCreator: true}
            ],
            update: [
                {isUpdater: true}
            ],
            delete: [
                {isDeleter: true}
            ]
        },

        /**
         * Note: creating or deleting a link is like performing an update on the linked record.
         * So, to allow the creation or deletion of a link, we check if the user is allowed to update the linked record.
         * We only check the record which is on the left side (mX / rX) of the link, because we assume the rights should be symetrical.
         */
        validators: {
            async isCreator({userACL, req, model, record}) {
                if (kiss.isServer) {
                    if (Array.isArray(req.body)) {
                        // insertMany links
                        req.path_0 = req.body[0].mX
                        req.path_1 = req.body[0].rX
                    }
                    else {
                        // insertOne link
                        req.path_0 = req.body.mX
                        req.path_1 = req.body.rX
                    }
                    return await kiss.acl.check({action: "update", req})
                }
                else {
                    const modelId = record.mX
                    const recordId = record.rX
                    const linkedRecord = await kiss.app.collections[modelId].findOne(recordId)
                    return await kiss.acl.check({action: "update", record: linkedRecord})
                }
            },

            async isUpdater() {
                // A link can't be modified
                return false
            },

            async isDeleter({userACL, req, model, record}) {
                if (kiss.isServer) {
                    req.path_0 = record.mX
                    req.path_1 = record.rX
                    return await kiss.acl.check({action: "update", req})
                }
                else {
                    const modelId = record.mX
                    const recordId = record.rX
                    const linkedRecord = await kiss.app.collections[modelId].findOne(recordId)
                    return await kiss.acl.check({action: "update", record: linkedRecord})
                }
            }
        }
    }
});