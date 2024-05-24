/**
 * 
 * Background workers skeletton
 * 
 */
module.exports = {
    /**
     * Init the worker
     * 
     * @param {number} period - Interval to execute the worker, in seconds. Default = 60
     */
    init(period = 60) {
        this._doStuff()
        this._loop(period)
    },

    /**
     * Timer to execute the worker process periodically (default = once per minute)
     * 
     * @param {number} [period] - Interval to execute the worker, in seconds. Default = 60
     */
    _loop(period = 60) {
        this._handle = setInterval(() => {
            this._doStuff()
        }, 1000 * period)
    },

    /**
     * Do stuff
     */
    _doStuff() {
        // log.ack("kiss.workers - check!")
    },

	/**
	 * Stop the worker
	 */
	stop(){
		clearTimeout(this._handle)
	}
};