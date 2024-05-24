/**
 * 
 * kiss.errors
 * 
 */
const { KissError } = require("../errors/errors")

/**
 * API error response
 */
class APIError extends KissError{
	statusCode = 500

	constructor(message, statusCode, code) {
		super(message, `API_${code ?? statusCode}`)
		this.statusCode = statusCode
	}
}

// 4XX
class BadRequest extends APIError{
	constructor(message, code) {
		super(message ?? "Bad Request", 400, code)
	}
}

class Unauthorized extends APIError{
	constructor(message, code) {
		super(message ?? "Unauthorized", 401, code)
	}
}

class Forbidden extends APIError{
	constructor(message, code) {
		super(message ?? "Forbidden", 403, code)
	}
}

class NotFound extends APIError{
	constructor(message, code) {
		super(message ?? "Not Found", 404, code)
	}
}

class MethodNotAllowed extends APIError{
	constructor(message, code) {
		super(message ?? "Method not allowed", 405, code)
	}
}

class InvalidToken extends APIError{
	constructor(message, code) {
		super(message ?? "Invalid token", 401, code)
	}
}

class TokenExpired extends APIError{
	constructor(message, code) {
		super(message ?? "Token expired", 498, code)
	}
}

// 5xx
class InternalServerError extends APIError{
	constructor(message, code) {
		super(message ?? "Internal Server Error", 500, code)
	}
}

module.exports = {
	API : {
		APIError,

		// 4xx
		BadRequest,
		Forbidden,
		Unauthorized,
		NotFound,
		MethodNotAllowed,
		InvalidToken,
		TokenExpired,

		// 5xx
		InternalServerError
	}
}