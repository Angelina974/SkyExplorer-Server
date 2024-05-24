/**
 * 
 * kiss.logger
 *
 * This module use this keyword because it needs to be agnostic of kiss global, as it must
 * be initialized before kiss is even declared.
 * 
 */
const logController = {
	LOG_LEVELS: {
		default: 0,
		info: 1,
		ack: 2,
		warn: 3,
		err: 4
	},

	// The escape character to trigger console color change
	ESC: "\x1B",

	// Console instruction to reset the style to default
	STYLE_RESET: "[0m",

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
	 * @param {object} config Logger config
	 * @return {function} A function that can be assigned to a global variable.
	 */
	init(config = {}) {
		const levels = Object.keys(this.LOG_LEVELS).filter(level => level !== "default")

		// We need to ensure this is bound to the logger. Otherwise, this will reference
		// the global nodejs object when the logger will be assigned to a global function
		// javascript contexts are resolved when the function is called, not declared.
		const bound = this.log.bind(this)

		for (let level of levels) {
			this.log[level] = function(msg, data){
				return this.writeLog(msg, this.LOG_LEVELS[level], data)
			}.bind(this)

			// Also need to add it to the bound function
			bound[level] = this.log[level]
		}

		this.types = config.types || []
		this.categories = config.categories || []
		if (config.data === false) this.data = false

		// This and ONLY this MUST be used as a global log function
		return bound
	},

	/**
	 * Formate the current date
	 * @returns {string}
	 */
	now() {
		return `[${(new Date()).toISOString()}]`
	},

	/**
	 * Write a formatted message to the console
	 * 
	 * @private
	 * @param {string} msg Message to log.
	 * @param {int} level Log level (see LOG_LEVELS)
	 * @param {*} [data] Data to log along with the message
	 */
	writeLog(msg, level, data) {
		if (typeof msg != "string") return console.log(msg)

		const msgCategory = msg.split(" ")[0]
		if (!this.categories.includes(msgCategory) && !this.categories.includes("*")) return
		if (!this.types.includes(level) && !this.types.includes("*")) return

		let style
		switch (level) {
			case this.LOG_LEVELS.default:
				// MESSAGE (default console color)
				style = this.STYLE_RESET
				break
			case this.LOG_LEVELS.info:
				// INFO (blue)
				style = "[0;36m"
				break
			case this.LOG_LEVELS.ack:
				// ACKNOWLEDGE (success, true, ok...) (green)
				style = "[0;32m"
				break
			case this.LOG_LEVELS.warn:
				// WARNING (bold orange)
				style = "[1;33m"
				break
			case this.LOG_LEVELS.err:
				// ERROR (bold red)
				style = "[1;31m"
				break
		}

		console.log(`${this.ESC}${style}${this.now()} ${msg}${this.ESC}${this.STYLE_RESET}`)

		if (
			data && this.data
			// We always want to print errors.
			|| data instanceof Error
			// We Want to print Arrays of errors too (kiss.errors.reporting can flush them in console)
			|| Array.isArray(data) && data[0] instanceof Error
		) console.log(data)
	},

	/**
	 * Log a message in the console
	 *
	 * /!\ NEVER ASSIGN THIS FUNCTION TO A VARIABLE, IT WILL NOT WORK
	 *     To use it in a global scope, use the result returned by the init()
	 *     function.
	 *
	 * @property {function} info Log an info to the console
	 * @property {function} ack  Log an ack to the console
	 * @property {function} warn Log a warning to the console
	 * @property {function} err  Log an error to the console
	 * @param {string} msg  Log message
	 * @param {*} [data] (optional) Log data
	 */
	log(msg, data) {
		logController.writeLog(
			msg,
			// Workaround for forgotten ones or log() misusage. Maybe useless.
			data instanceof Error ? logController.LOG_LEVELS.err : logController.LOG_LEVELS.default,
			data
		)
	}
}

module.exports = logController