const config = require("../config")

/**
 * This should NEVER be called.
 * If it is, something have been screwed up by messing up the global state of kiss.websocket.clients.
 * If it happens, it will cause a memory leak.
 * 
 * @private
 */
function logPotentialMemoryLeak() {
	log.warn(
		`kiss.websocket - Potential memory leak alert : unable to identify the current socket, ` +
		`and thus to clean it up.`
	)
}

/**
 * Get the list of connected clients
 * 
 * @returns {object} Object with connected clients grouped by account
 * 
 * @example
 * {
 * 	account1: [user1, user2, user3],
 * 	account2: [user4n user5, user6]
 * }
 */
function getConnectedClients() {
	let connectedClients = {}
	Object.keys(kiss.websocket.clients).forEach(accountId => {
		const account = kiss.directory.accounts[accountId]
		if (!account) return
		
		const accountOwner = account.owner
		connectedClients[accountOwner] = []
		
		const accountSockets = kiss.websocket.clients[accountId]
		Object.keys(accountSockets).forEach(userId => connectedClients[accountOwner].push(userId))
	})
	return connectedClients
}

/**
 * Add socket to kiss.websocket.clients, auto create indexes if needed
 * 
 * @param socket
 * @param {string} accountId
 * @param {string} userId
 */
function addSocketToClients(socket, accountId, userId) {
	if (!kiss.websocket.clients[accountId]) kiss.websocket.clients[accountId] = {}
	if (!kiss.websocket.clients[accountId][userId]) kiss.websocket.clients[accountId][userId] = []
	kiss.websocket.clients[accountId][userId].push(socket)
}

/**
 * Switch users sockets to another account
 * 
 * @param {string} fromAccountId
 * @param {string} toAccountId
 * @param {string} userId
 */
function switchAccount(fromAccountId, toAccountId, userId) {
	// If the given user is present in fromAccountId
	if (fromAccountId in kiss.websocket.clients && userId in kiss.websocket.clients[fromAccountId]) {
		if (!kiss.websocket.clients[toAccountId]) kiss.websocket.clients[toAccountId] = {}
		if (!kiss.websocket.clients[toAccountId][userId]) kiss.websocket.clients[toAccountId][userId] = []

		// We add sockets to toAccountId clients to finalize the switch
		kiss.websocket.clients[toAccountId][userId].push(...kiss.websocket.clients[fromAccountId][userId].map(socket => {
			socket.identity.accountId = toAccountId
			return socket
		}))
		delete kiss.websocket.clients[fromAccountId][userId]
	}
}

/**
 * Remove a socket from kiss.websocket.clients. Auto cleanup indexes if needed and warn for
 * potential memory leak
 * 
 * @param socket
 * @param {string} accountId
 * @param {string} userId
 */
function removeSocketFromClients(socket, accountId, userId) {
	if (accountId in kiss.websocket.clients && userId in kiss.websocket.clients[accountId]) {
		const sockets = kiss.websocket.clients[accountId][userId]
		const socketIndex = sockets.indexOf(socket)

		// unable to find the socket in the user array, something went badly wrong
		if (sockets.indexOf(socket) < 0) {
			logPotentialMemoryLeak()
			return
		}

		sockets.splice(socketIndex, 1)

		// We don't want ou kiss.websocket.clients[accountId] to keep user object if he has no direct connection
		// to the account.
		if (Object.keys(kiss.websocket.clients[accountId][userId]).length === 0) {
			// Remove user from the list of connected clients
			delete kiss.websocket.clients[accountId][userId]
		}

		// We don't want ou kiss.websocket.clients to keep accounts if no one is connected to it.
		if (Object.keys(kiss.websocket.clients[accountId]).length === 0) {
			delete kiss.websocket.clients[accountId]
		}
	} else {
		logPotentialMemoryLeak()
	}
}

// We don't want to bother cleaning it up. We don't need to iterate over it anyway,
// so a WeakMap is perfect.
const RECEIVE_RATE = new WeakMap()

/**
 * Check if this current socket exceed the configured websocket receiving rate.
 * 
 * @param socket
 * @param {string} accountId
 * @param {string} userId
 * @return {boolean} True if the current socket exceed the receiving rate
 */
function exceedReceiveRate(socket, accountId, userId) {
	// Client message rate limiter
	if (config.webSocketServer.maxMessagesPerSecond > 0) {
		if (!RECEIVE_RATE.has(socket)) RECEIVE_RATE.set(
			socket, {
				last: Date.now(),
				hits: 0
			}
		)

		const socketRate = RECEIVE_RATE.get(socket)
		// Checking the interval between two messages instead of real number of messages sent each second is better
		// It avoids a client to open several sockets to coordinate a "send max messages per second"
		// in the shortest period of time from every socket to DDOS the server.
		const allowedRateInterval = 1000 / config.webSocketServer.maxMessagesPerSecond

		if (RECEIVE_RATE.get(socket).last > (Date.now() - allowedRateInterval)) {
			// In some circumstances, the client may actually send several events close to each other without
			// trying to be malicious (especially with the recurrent automatic ping)
			if (socketRate.hits >= config.webSocketServer.maxRateLimiterHits) {
				log.warn(
					`kiss.websocket - Potential attempt to DOS the server have been detected.` +
					` Peer connection dropped for ${userId} on account ${accountId}.` +
					` WS_MAX_RATE_LIMITER_HITS reached.`
				)

				return true
			}

			socketRate.hits++
		} else {
			socketRate.hits = 0
		}

		socketRate.last = Date.now()
	}

	return false
}

/**
 * Check if a user would exceed WS_MAX_SOCKETS_BY_USER if a new connection was made
 * 
 * @param {string} accountId
 * @param {string} userId
 * @return {boolean}
 */
function maxSocketsByUserReached(accountId, userId) {
	if (accountId in kiss.websocket.clients && userId in kiss.websocket.clients[accountId]) {
		// If it is reached
		if (kiss.websocket.clients[accountId][userId].length >= config.webSocketServer.maxSocketsByUser) {
			return true
		}
	}

	return false
}

module.exports = {
	getConnectedClients,
	switchAccount,
	addSocketToClients,
	removeSocketFromClients,
	exceedReceiveRate,
	maxSocketsByUserReached
}