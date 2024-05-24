/**
 * 
 * ## Simple client logger
 * 
 * @namespace
 * 
 */
kiss.logger = {
    /**
     * History of all logged messages
     */
    history: [],

    /**
     * Maximum length of the history
     * (used to limit memory consumption)
     */
    maxLength: 200,

    /**
     * Message types:
     * - "*" means all accepted (default behavior)
     * - 0: messages
     * - 1: informations
     * - 2: acknowledges
     * - 3: warnings
     * - 4: errors
     */
    types: ["*"],

    /**
     * Message accepted categories
     * 
     * The logger will only log the messages of the accepted categories.
     * The category of the message is its first word, and can be anything.
     * It's up to you to decide your logging strategy.
     */
    categories: ["*"],

    /**
     * Defines if the logger logs data too.
     * false: only messages. true: messages and data
     */
    data: true,

    /**
     * Initialize the logger
     * 
     * @param {object} config
     * @param {boolean} [config.data] - false: only messages. true: messages and data (default)
     * @param {array} [config.types] - Log only the messages of these types, for example: [3,4]. Default to ["*"] (meaning everything is logged).
     * @param {string[]} [config.categories] - Log only the messages of these types, for example: ["db", "socket"]. Default to ["*"] (meaning everything is logged).
     * @param {number} [config.maxLength] - Maximum number of messages kept into looger's history
     * 
     * @example
     * // Will log the messages starting with the word "database" or the word "socket", like "db - find()", or "socket connected!"
     * kiss.logger.init({
     *  types: [0, 3, 4],
     *  categories: ["database", "socket"],
     *  maxLength: 20
     * })
     * 
     * // The category of this message is "database", and it will be logged.
     * // The error will be display too.
     * log("database access denied", 4, err)
     * 
     * // The category of this message is "database", but it will not be logged because of type 2:
     * log("database successfuly updated", 2)
     *
     * // The type of this message is 0 (default), but it will not be logged because its category is "view":
     * log("view - Sent to cache")
     */
    init(config) {
        kiss.logger.maxLength = config.maxLength || 200
        kiss.logger.types = config.types || []
        kiss.logger.categories = config.categories || []
        if (config.data === false) kiss.logger.data = false
    },

    /**
     * console.log wrapper
     * 
     * Sends a colored message in the console, and keeps the history in kiss.logger.history.
     * 
     * @param {string} msg - The msg to log
     * @param {integer} [type] - (default) 0=message (black), 1=info (blue), 2=acknowledge (green), 3=warning (orange), 4=error (red)
     * @param {*} [data] - Optional data to show in the console
     * 
     * @example
     * // Simple log
     * log("database - Trying to update...")
     * 
     * // Write the message in green (type 2) and also show the data:
     * const update = {lastName: "Wilson"}
     * log("database updated successfuly", 2, update)
     */
    log(msg, type = 0, data) {
        if (typeof msg != "string") return console.log(msg)
        
        const msgCategory = msg.split(" ")[0]
        if (!kiss.logger.categories.includes(msgCategory) && !kiss.logger.categories.includes("*")) return
        if (!kiss.logger.types.includes(type) && !kiss.logger.types.includes("*")) return

        let style
        switch (type) {
            case 0:
                // MESSAGE
                style = "color: black"
                break
            case 1:
                // INFO
                style = "color: blue"
                break
            case 2:
                // ACKNOWLEDGE (success, true, ok...)
                style = "color: green"
                break
            case 3:
                // WARNING
                style = "color: orange"
                break
            case 4:
                // ERROR
                style = "color: red"
                break
        }

        console.log("%c%s", style, msg)
        if (data && kiss.logger.data) console.log(data)

        kiss.logger.history.push({
            msg,
            type
        })

        if (kiss.logger.history.length > kiss.logger.maxLength) kiss.logger.history.splice(0, 1)
    },

    /**
     * Show the history of all logged messages
     */
    show() {
        console.log(kiss.logger.history)
    },

    /**
     * Replay the log history
     * 
     * @param {integer} count - Number of messages to replay
     */
    replay(count = 0) {
        if (!count) {
            kiss.logger.history.forEach(event => log(event.msg, event.type))
        }
        else {
            kiss.logger.history.slice(-count).forEach(event => log(event.msg, event.type))
        }
    }
}

// Shorthand
const log = kiss.logger.log
log.info = (msg, data) => log(msg, 1, data)
log.ack = (msg, data) => log(msg, 2, data)
log.warn = (msg, data) => log(msg, 3, data)
log.err = (msg, data) => log(msg, 4, data)


;