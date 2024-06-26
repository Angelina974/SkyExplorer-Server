
/**
 * As per IANA, 4000 - 4999 codes are reserved to private use. As convention,
 * we will use HTTP response code for meaningful standardised code.
 * So an HTTP 403 will become a 4403 code.
 * If no HTTP like code is suitable, use range 4000 - 4099.
 * 
 * @see https://www.iana.org/assignments/websocket/websocket.xhtml
 */
const SOCKET_CLOSE_CODE = {
	GONE_AWAY: 1001,

	// Errors - HTTP like
	UNSUPPORTED_MEDIA_TYPE : 4415,
	TOO_MANY_MESSAGES : 4429,

	NOT_IMPLEMENTED : 4501,

	// Errors - Proprietary
	SERVER_NOT_RESPONDING : 4000,
	TOO_SLOW : 4001,
	TOO_MANY_USER_SOCKETS : 4002,

	// No reconnection will be triggered.
	DEFINITIVE_CLOSE : 4003
}

/**
 * Closing messages to be more explicit about close code.
 */
const SOCKET_CLOSE_REASONS = {
	LOGGED_OUT : 'LOGGED_OUT',
	GONE_AWAY : 'GONE_AWAY',

	RATE_LIMIT_REACHED : 'RATE_LIMIT_REACHED',
	CONNECTION_TOO_SLOW : 'CONNECTION_TOO_SLOW',

	BINARY_NOT_SUPPORTED : 'BINARY_NOT_SUPPORTED',
	UNSUPPORTED_MESSAGE : 'UNSUPPORTED_MESSAGE',
	MAX_SOCKET_BY_USER_REACHED : 'MAX_SOCKET_BY_USER_REACHED'
}

/**
 * Pre-constructed arguments for socket.end(), for convenience and easy maintenance
 */
const SOCKET_CLOSE = {
	// The server stops
	GONE_AWAY : [
		SOCKET_CLOSE_CODE.GONE_AWAY,
		SOCKET_CLOSE_REASONS.GONE_AWAY
	],

	LOGGED_OUT : [
		SOCKET_CLOSE_CODE.DEFINITIVE_CLOSE,
		SOCKET_CLOSE_REASONS.LOGGED_OUT
	],

	// Infrastructure protections
	TOO_SLOW : [
		SOCKET_CLOSE_CODE.TOO_SLOW,
		SOCKET_CLOSE_REASONS.CONNECTION_TOO_SLOW
	],

	TOO_MANY_USER_SOCKETS: [
		SOCKET_CLOSE_CODE.TOO_MANY_USER_SOCKETS,
		SOCKET_CLOSE_REASONS.MAX_SOCKET_BY_USER_REACHED
	],
	RATE_LIMIT_REACHED : [
		SOCKET_CLOSE_CODE.TOO_MANY_MESSAGES,
		SOCKET_CLOSE_REASONS.RATE_LIMIT_REACHED
	],

	// Messages related errors
	BINARY_NOT_SUPPORTED : [
		SOCKET_CLOSE_CODE.UNSUPPORTED_MEDIA_TYPE,
		SOCKET_CLOSE_REASONS.BINARY_NOT_SUPPORTED
	],
	UNSUPPORTED_MESSAGE: [
		SOCKET_CLOSE_CODE.NOT_IMPLEMENTED,
		SOCKET_CLOSE_REASONS.UNSUPPORTED_MESSAGE
	]
}

module.exports = {
	SOCKET_CLOSE,
	SOCKET_CLOSE_CODE,
	SOCKET_CLOSE_REASONS
}