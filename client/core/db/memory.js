/**
 * 
 * ## In-memory database wrapper
 * 
 * It has the exact same api as [kiss.db.offline](kiss.db.offline.html) database, but it doesn't persist the records.
 * It means a browser refresh will flush the data.
 * 
 * @namespace
 * 
 */
kiss.db.memory = {
    mode: "memory",
    collections: {},
    deleteCollection: async (modelId) => await kiss.db.offline.deleteCollection(modelId, "memory"),
    insertOne: async (modelId, record) => await kiss.db.offline.insertOne(modelId, record, "memory"),
    insertMany: async (modelId, records) => await kiss.db.offline.insertMany(modelId, records, "memory"),
    updateOne: async(modelId, recordId, update) => await kiss.db.offline.updateOne(modelId, recordId, update, "memory"),
    updateOneDeep: async(modelId, recordId, update) => await kiss.db.offline.updateOneDeep(modelId, recordId, update, "memory"),
    updateLink: async(link) => await kiss.db.offline.updateLink(link, "memory"),    
    updateMany: async(modelId, query, update) => await kiss.db.offline.updateMany(modelId, query, update, "memory"),
    updateBulk: async(operations) => await kiss.db.offline.updateBulk(operations, "memory"),
    findOne: async (modelId, recordId) => await kiss.db.offline.findOne(modelId, recordId, "memory"),
    findById: async (modelId, ids, sort, sortSyntax) => await kiss.db.offline.findById(modelId, ids, sort, sortSyntax, "memory"),
    find: async (modelId, query = {}) => await kiss.db.offline.find(modelId, query, "memory"),
    deleteOne: async (modelId, recordId, sendToTrash) => await kiss.db.offline.deleteOne(modelId, recordId, sendToTrash, "memory"),
    deleteMany: async (modelId, query, sendToTrash) => await kiss.db.offline.deleteMany(modelId, query, sendToTrash, "memory"),
    count: async (modelId, query) => await kiss.db.offline.count(modelId, query, "memory")
}

;