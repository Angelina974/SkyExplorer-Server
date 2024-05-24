/**
 *
 * kiss.tools
 * 
 */
const config = require("../config")
const fs = require("fs")
const os = require('os')
const crypto = require("crypto")
const {
    randomFillSync,
    randomBytes
} = crypto

module.exports = {

    /**
     * KissJS logo
     */
    showLogo() {
        console.log(global.KISSJS)
    },

    /**
     * As per RFC4122 DRAFT for UUID v7, the UUID bits layout :
     *
     *     0                   1                   2                   3
     *     0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
     *    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     *    |                           unix_ts_ms                          |
     *    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     *    |          unix_ts_ms           |  ver  |       rand_a          |
     *    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     *    |var|                        rand_b                             |
     *    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     *    |                            rand_b                             |
     *    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     * @see https://datatracker.ietf.org/doc/html/draft-peabody-dispatch-new-uuid-format#section-5.2
     * @returns {string} The GUID xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
     */
    uid() {
        const UUID_UNIX_TS_MS_BITS = 48
        const UUID_VAR = 0b10
        const UUID_VAR_BITS = 2
        const UUID_RAND_B_BITS = 62

        if (!kiss.tools.prevTimestamp) kiss.tools.prevTimestamp = -1

        // Negative system clock adjustments are ignored to keep monotonicity
        const timestamp = Math.max(Date.now(), kiss.tools.prevTimestamp)

        //We need two random bytes for rand_a
        const randA = randomBytes(2)
        //Adding the version (aka ver) to the first byte.
        randA[0] = (randA[0] & 0x0f) | 0x70

        //Prepare our 2x 32 bytes for rand_b
        const randB = new Uint32Array(2)
        randomFillSync(randB)

        //Positioning the UUID variant (aka var) into the first 32 bytes random number
        randB[0] = (UUID_VAR << (32 - UUID_VAR_BITS)) | (randB[0] >>> UUID_VAR_BITS)

        const rawV7 =
            /**
             * unix_ts_ms
             * We want a 48 bits timestamp in 6 bytes for the first 12 UUID characters.
             */
            timestamp.toString(16).padStart(UUID_UNIX_TS_MS_BITS / 4, "0") +
            /**
             * ver + rand_a
             * The version + first part of rand_a
             */
            randA[0].toString(16) +
            /**
             * rand_a
             * Second part of rand_a
             */
            randA[1].toString(16).padStart(2, "0") +
            /**
             * var + rand_b
             * First part of rand_b including the UUID variant on 2 bits
             */
            randB[0].toString(16).padStart((UUID_VAR_BITS + UUID_RAND_B_BITS) / 8, "0") +
            /**
             * rand_b
             * Last part of rand_b
             */
            randB[1].toString(16).padStart((UUID_VAR_BITS + UUID_RAND_B_BITS) / 8, "0")

        //Formatting
        return (
            rawV7.slice(0, 8) +
            "-" +
            rawV7.slice(8, 12) +
            "-" +
            rawV7.slice(12, 16) +
            "-" +
            rawV7.slice(16, 20) +
            "-" +
            rawV7.slice(20)
        )
    },

    /**
     * Timestamp a record
     * 
     * @param {object} record 
     * @param {string} userId
     * @param {boolean} isNewRecord
     */
    timeStamp(record, userId, isNewRecord) {
        const currentDateTime = new Date().toISOString()

        // record.updatedAt = currentDateTime
        // record.updatedBy = userId
        // if (!isNewRecord && !record.createdAt) return

        // record.createdAt = currentDateTime
        // record.createdBy = userId

        if (isNewRecord) {
            record.createdAt = currentDateTime
            record.createdBy = userId
        }
        else {
            record.updatedAt = currentDateTime
            record.updatedBy = userId
        }
    },

    /**
     * Create a sha256 hash
     * 
     * @param {string} str 
     * @returns hashed string
     */
    hash(str) {
        if (typeof (str) === "string" && str.length > 0) {
            let hash = crypto.createHmac("sha256", config.hashingSecret).update(str).digest("hex")
            return hash
        } else {
            return false
        }
    },

    /**
     * Encrypt a string
     * 
     * @param {string} utf8String 
     * @returns {string} Encrypted string
     */
    encrypt(utf8String) {
        const key = config.hashingSecret.padEnd(32, "*").slice(0, 32)
        const iv = Buffer.alloc(16, 0)
        cipher = crypto.createCipheriv("aes-256-cbc", key, iv)
        encryptedData = cipher.update(utf8String, "utf8", "hex")
        encryptedData += cipher.final("hex")
        return encryptedData
    },

    /**
     * Decrypted and encrypted string
     * 
     * @param {string} hexString 
     * @returns {string} Decrypted string
     */
    decrypt(hexString) {
        const key = config.hashingSecret.padEnd(32, "*").slice(0, 32)
        const iv = Buffer.alloc(16, 0)
        decipher = crypto.createDecipheriv("aes-256-cbc", key, iv)
        decryptedData = decipher.update(hexString, "hex", "utf8")
        decryptedData += decipher.final("utf8")
        return decryptedData
    },

    /**
     * Check if a user can (read) access a custom model.
     * Custom models belong to a specific Account, and the connected user must belong to the same account to access custom models data.
     * 
     * @param {object} token 
     * @param {string} modelId 
     * @returns {boolean}
     */
    async hasAccessToCustomModel(token, modelId) {
        const model = kiss.app.models[modelId]
        if (model && model.accountId == token.currentAccountId) return true
        return false
    },

    /**
     * Parse the JSON string to an object in all cases, without throwing
     * 
     * @param {string} str 
     * @returns {object}
     */
    parseJsonToObject(str) {
        try {
            let obj = JSON.parse(str)
            return obj
        } catch (err) {
            log(err)
            return {}
        }
    },

    /**
     * Get a .env configuration file as an object
     * 
     * @param {string} envFile 
     * @returns {object} The key/value pairs
     */
    getEnvironment(envFile) {
        const content = fs.readFileSync(envFile, 'utf8')
        const lines = content.split("\n")
        let config = {}

        lines.forEach(line => {
            if (line.startsWith("#")) return
            let [key, value] = line.split("=")
            if (key && value) {
                config[key.trim()] = value.trim()
            }
        })
        return config
    },

    /**
     * Update a .env configuration file from a new config object
     * 
     * @param {object} originalConfig - The key/value pairs
     * @param {object} newValue - The new key/values
     * @return {object} The updated config
     */
    updateEnvironmentContent(originalConfig, newValues) {
        const lines = originalConfig.split("\n")

        let updatedConfig = lines.map(line => {
            const [key, value] = line.split("=")
            if (newValues.hasOwnProperty(key)) return `${key}=${newValues[key]}`
            return line
        })

        return updatedConfig.join("\n")
    },

    /**
     * Show the server system info
     */
    showSystemInfos() {
        log(`kiss.server - Version ${config.release} - Running in environment <${process.env.NODE_ENV}>`)
        log(`    - ${os.cpus().length} CPU model ${os.cpus()[0].model} - Architecture ${os.arch()}`)
        log(`    - Total memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} Gb - Available memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(1)} Gb`)
        log(`    - Plaform: ${os.platform()} - Release: ${os.release()}`)
        log(`    - Hostname: ${os.hostname()} - System user: ${os.userInfo().username}`)
        kiss.tools.showNetworkInterfaces()
    },

    /**
     * Show the server network interfaces
     */
    showNetworkInterfaces() {
        log(`kiss.server - Network interfaces:`)
        const groups = os.networkInterfaces()
        Object.keys(groups).forEach(groupName => {
            const group = groups[groupName]
            Object.keys(group).forEach(interfaceName => {
                const interface = group[interfaceName]
                log(`    - ${groupName} - ${interface.family}: ${interface.address}`)
            })
        })
    },

    /**
     * Show the database informations
     */
    showDatabaseInfos() {
        log(`kiss.server - Database:`)
        log(`    - Type: ${config.db.type}`)
        log(`    - Host: ${config.db.host}`)
        log(`    - Port: ${config.db.port}`)
        log(`    - Name: ${config.db.name}`)
        log(`    - Path: ${config.db.path}`)
    },

    /**
     * Show the storage service informations
     */
    showStorageServiceInfos() {
        log(`kiss.server - Storage service:`)
        log(`    - destination: ${config.upload.destination}`)

        if (config.upload.destination != "local") {
            log(`    - Bucket name: ${config.api.aws.bucket}`)
            log(`    - Region: ${config.api.aws.region}`)
        }
    },

    showHTTPServerInfos() {
        log(`kiss.server - HTTP configuration`)
        log(`    - Mode: ${config.serverMode === 'both' ? 'secure + insecure' : config.serverMode}`)

        if (['insecure', 'both'].includes(config.serverMode)) {
            log(`    - HTTP port: ${config.httpPort}`)
        }

        if (['secure', 'both'].includes(config.serverMode)) {
            log(`    - HTTPS port: ${config.httpsPort}`)
        }
    },

    showWebsocketInfos() {
        log(`kiss.server - WebSocket configuration`)
        log(`    - Mode: ${config.serverMode === 'both' ? 'secure + insecure' : config.serverMode}`)
        log(`    - Engine: ${config.webSocketServer.server}`)

        if (config.webSocketServer.server === 'uWebSocket') {
            log(`    - Experimental express compatibility: ${config.webSocketServer.expressCompatibility}`)
        }

        if (['insecure', 'both'].includes(config.serverMode)) {
            log(`    - WS port: ${config.wsPort}`)
        }

        if (['secure', 'both'].includes(config.serverMode)) {
            log(`    - WSS port: ${config.wssPort}`)
        }
    }
}