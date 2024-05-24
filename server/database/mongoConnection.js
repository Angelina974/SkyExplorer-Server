/**
 * 
 * MongoDb native driver initialization
 * 
 */
const config = require("../config")

const {
	MongoClient: mongoClient
} = require("mongodb")

const {
	DBConnectionFailure,
	DBQueryFailure
} = require('./errors')

module.exports = {

	/**
	 * Init mongo connection
	 * @throws DBConnectionFailure
	 */
	init: async function () {
		const dbName = config.db.name
		const dbPath = config.db.path

		let client
		try {
			client = await mongoClient.connect(dbPath, {
				// useNewUrlParser: true,
				// useUnifiedTopology: true
				// connectTimeoutMS: config.db.connectionTimeout,
				// Disable buffering to be able to retry indefinitely
				// bufferMaxEntries: 0,
				// reconnectTries: Number.MAX_SAFE_INTEGER,
				// reconnectInterval: 1000
			})

			this.client = client
			this.db = client.db(dbName)

		} catch (err) {
			log.err("kiss.database - MongoDb connection error: server is unreachable or not ready yet")
			throw new DBConnectionFailure(err)
		}
	},

	/**
	 * Creates a new collection
	 * 
	 * Also creates a wildcard index for it: this allows Azure Cosmos Db
	 * to behave properly when requesting the collection
	 * 
	 * @param {string} modelId
	 * @throws DBQueryFailure
	 * @returns The new collection
	 */
	async createCollection(modelId) {
		try {
			const newCollection = await this.db.createCollection(modelId)

			// Create a wildcard index on every fields
			await newCollection.createIndex({
				"$**": 1
			})

			return newCollection
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	/**
	 * Get a collection
	 * 
	 * @throws DBQueryFailure
	 * @param {string} modelId 
	 */
	collection(modelId) {
		try {
			if (!this.db) return false
			return this.db.collection(modelId)
		} catch (err) {
			throw new DBQueryFailure(err)
		}
	},

	/**
	 * Close the current connection pool
	 */
	async stop() {
		if (!this.client) return
		await this.client.close()
	}
}