/**
 * 
 * MySQL operations: TO BE DONE
 * 
 * - findOne
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
const db = require("./mysqlConnection")

module.exports = {

    // Find a single record using query 
    findOne: function (modelId, query) {},

    // Find records matching a query
    find: function (modelId, query) {},

    // Find and sort records matching a query
    findAndSort: function (modelId, query, sort) {},

    // Insert a single record
    insertOne: function (modelId, data) {},

    // Insert multiple records
    insertMany: function (modelId, data) {},

    // Update a single record matching a query
    updateOne: function (modelId, query, data) {},

    // Update multiple records matching a query
    updateMany: function (modelId, query, data) {},

    // Update multiple records, from multiple collections, with different updates
    updateBulk: async function (data) {},

    // Delete a single record
    deleteOne: function (modelId, query) {},

    // Delete the records matching a query
    deleteMany: function (modelId, query) {},

    // Soft delete a single record (= move it to the "deletion" collection)
    softDeleteOne: function (modelId, query, token) {}
}