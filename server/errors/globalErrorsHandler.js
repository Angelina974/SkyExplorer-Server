/**
 * 
 * Error handlers
 * 
 * The only purpose to this module is to manage errors caught in global space, as it shouldn't happen.
 * Try to send pending errors reports if process try to exit with a code that is not 0
 * 
 */
module.exports = {
	// used to force an application.stop on beforeExit, if the thing that trigger the exit is not a shutdown signal.
	application: null,

	/**
	 * Init the current global error handler
	 * 
	 * @param application
	 */
	init(application) {
		this.application = application
	},

	/**
	 * Lists all available global error handlers that must be used to monitor the server.
	 */
	handlers: {
		async uncaughtException(err) {
			log.err("kiss.errors.global - *** There was an uncaught error ***", err)

			try {
				await kiss.errors.reporting.report("Uncaught exception", err)
				
			} catch (err) {
				log.err("kiss.errors.global - Unable to report the the previous error", err)
			}
		},

		async unhandledRejection(err) {
			log.err("kiss.errors.global - *** There was an unhandled promise rejection ***", err)

			try {
				await kiss.errors.reporting.report("Unhandled promise rejection", err)

			} catch (err) {
				log.err("kiss.errors.global - Unable to report the the previous error", err)
			}
		},

		async beforeExit(code) {
			if (code === 0) return

			log.warn(`kiss.errors.global - Server exit with non 0 code ${code} !`)

			try {
				// Force sending all pending reports. If the current exit have been triggered by an error, it may have reported it.
				await kiss.errors.reporting.flush()

			} catch (err) {
				// At this stage... there is nothing more we can do
				if (kiss && kiss.errors && kiss.errors.reporting) {
					log.err("kiss.errors.reporting - Unable to flush pending error reports: ", {
						err,
						pendingReports: kiss.errors.reporting.queue
					})
				} else {
					log.err("kiss.errors.reporting - Process exited while reporting was not initialized")
				}
			}

			// If application has been set, we ask for a graceful shutdown to limit
			// as much as possible bug side effects (like interrupted transactions in DB,
			// pending authentication procedure, pending mail sending, etc.
			if (this.application) await this.application.stop()
		}
	}
}