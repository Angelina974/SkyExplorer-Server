/**
 * 
 * Error codes
 * 
 * There is no standard on this subject, its application specific. So we define one:
 * 1 - 24: Startup failures
 * 25 - 49: Missing required ressource
 * 50 - 99: Configuration errors
 * 100 - 150: Network errors
 * 151 - 200: IO errors on files, pipes, cache...
 * 201 - 240: IPC errors
 * 241 - 255: Fatal errors
 * 
 */
const EXIT_CODES = {
	SUCCESS: 0,

	// Startup failures
	STARTUP_FAILURE: 1,
	DB_CONNECTION_FAILURE: 2,
	HTTP_INIT_FAILURE: 3,
	WEBSOCKET_INIT_FAILURE: 4,
	STATIC_RESSOURCE_LOADING_FAILURE: 25,
	DYNAMIC_RESSOURCE_LOADING_FAILURE: 26,

	// Configuration failures
	WRONG_CONFIG: 50,
	UNSUPPORTED_CONFIG_VALUE: 51,

	// IO errors on files, pipes, cache...
	CACHE_BUILDING_FAILURE: 151,

	// Fatal errors
	ERROR_REPORTING_FAILURE: 241,
	FATAL_ERROR: 255
}

module.exports = {
	EXIT_CODES
}