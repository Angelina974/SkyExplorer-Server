/**
 * Manage SESSID cookie based session, used to be able to display resources requested by the browser.
 * It also allows to download large files with the help of the browser despite the fact that user authentication
 * is done by JWT Tokens.
 */

const config = require("../config")

let cleanerHandle

/**
 * Cleanup outdated sessions
 * @private
 * @return {Promise<void>}
 */
async function sessionsCleanup() {
	try {
		const tokenLife = config.jsonWebToken.refreshTokenLife.slice(0, -1)
		const res = await kiss.db.deleteMany("session", {
			updatedAt: {
				$lt: (new Date(Date.now() - (tokenLife * 1000))).toISOString()
			}
		})

		if (res.deletedCount > 0) log.ack(`kiss.session - ${res.deletedCount} sessions cleaned up.`)
		else log.info("kiss.session - No session to cleanup.")
	} catch (err) {
		log.err("kiss.session - Cleanup failed:", err)
	}
}

module.exports = {
	init() {
		if (!cleanerHandle) {
			cleanerHandle = setInterval(sessionsCleanup, config.session.cleanEvery)
		}
	},

	/**
	 * Set sessid as COOKIE in an express response
	 * @param res
	 * @param {string} sessid
	 */
	setCookie(res, sessid) {
		const tokenLife = config.jsonWebToken.refreshTokenLife.slice(0, -1)
		const expireDate = new Date(Date.now() + (tokenLife * 1000))
		res.setHeader("Set-Cookie", `SESSID=${sessid}; Path=/; Expires=${expireDate.toUTCString()};`)
	},

	/**
	 * Delete the SESSID in an express response.
	 * @param res
	 */
	deleteCookie(res) {
		res.setHeader("Set-Cookie", `SESSID=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`)
	},

	/**
	 * Extract SESSID from an express request. Returns null if no SESSID cookie is found.
	 * @param req
	 * @return {string|null}
	 */
	extractSessid(req) {
		const cookieString = req.headers["cookie"] || ""
		let sessid = null

		cookieString.split(";").some(part => {
			const [key, value] = part.split("=")
			if (key.trim() === "SESSID") {
				sessid = decodeURIComponent(value).trim()
				return true
			}
		})

		return sessid
	},

	/**
	 * Return the session record associated to sessId, if sessId is a valid session id.
	 * @param {string} sessId
	 * @return {Promise<object|null>}
	 */
	async get(sessId) {
		return await kiss.db.findOne("session", {
			_id: sessId
		});
	},

	/**
	 * Create new session?
	 * @param {string} id session id (also called sessid)
	 * @param {string} token JWT token associated to the session
	 * @return {Promise<string>} The sessid
	 */
	async create(id, token) {
		if (!token) throw new Error("A jwt token must be provided!")

		const session = {
			id,
			token,
			updatedAt: (new Date()).toISOString()
		}

		await kiss.db.insertOne("session", session)

		return session.id
	},

	/**
	 * Update the session, either to just extending its lifetime or by updating the token
	 * it is associated to.
	 * @param {string} sessId Session to update
	 * @param {string|null} [token=null] The new token, if it must be updated
	 * @return {Promise<void>}
	 */
	async touch(sessId, token = null) {
		const session = await this.get(sessId)

		if (!session) {
			if (token) {
				await this.create(sessId, token)
			} else throw new Error("Session not found and no token provided to renew it!")
		} else {
			await kiss.db.updateOne("session", {
				_id: sessId
			}, {
				updatedAt: (new Date()).toISOString(),
				token: token || session.token
			})
		}
	},

	/**
	 * Destroy a session in database.
	 * @param {string} sessId
	 * @return {Promise<void>}
	 */
	async destroy(sessId) {
		await kiss.db.deleteOne("session", {
			_id: sessId
		})
	},

	stop() {
		clearInterval(cleanerHandle)
		cleanerHandle = null
	}
}