/**
 * 
 * KissError
 * 
 * Create an Error object that can rethrow by keeping the stack trace.
 * This is also the base Error for all KissJS specific errors, to be able
 * to differentiate them from external libraries errors in the future.
 * 
 */
class KissError extends Error {
	code = null
	originalError = null

	constructor(message, code = null) {
		super(message)

		if (message instanceof Error) {
			if (code === null && "code" in message) this.code = message.code
			this.originalError = message
			this.stack = this.stack.split("\n").slice(0).join("\n") + "\n" + "Original error (re-thrown) : " + message.stack
		} else {
			this.code = code
			Error.captureStackTrace(this, this.constructor)
		}

		this.name = this.constructor.name
	}
}

module.exports = {
	KissError
}