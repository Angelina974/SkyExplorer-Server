/**
 *
 * kiss.websocket / using websocket-node
 *
 */
const webSocketServer = require("websocket").server
const jwt = require("jsonwebtoken")
const config = require("../config")

const {
	API: {
		InvalidToken
	}
} = require("../core/errors")

const {
	SOCKET_CLOSE
} = require("./constants")

const {
	addSocketToClients,
	removeSocketFromClients,
	exceedReceiveRate,
	maxSocketsByUserReached,
	getConnectedClients
} = require("./common")

const {
	WebSocketServer
} = require("ws")

/**
 * Send a message through a socket. Auto translate message to JSON
 * @private
 * @param socket
 * @param {*} message A JSON serializable value
 */
function send(socket, message) {
	message = JSON.stringify(message)

	socket.sendUTF(message)
}

module.exports = {

	// Cache clients
	clients: {},

	/**
	 * Init the websocket server
	 */
	init() {
		const serverOptions = {
			perMessageDeflate: false,
			maxReceivedMessageSize: config.webSocketServer.maxPayloadLength,
			keepaliveInterval: config.webSocketServer.idleTimeout
		}

		if (["insecure", "both"].includes(config.serverMode)) {
			// Build the websocket server from the http server
			kiss.websocket.ws = new webSocketServer(
				Object.assign({
						httpServer: kiss.server.httpServer
					},
					serverOptions
				)
			)

			kiss.websocket.ws.on("request", kiss.websocket.onRequest)
			log.ack(`kiss.websocket - WS server listening on port ${config.httpPort} in ${config.envName} environment`)
		}

		if (["secure", "both"].includes(config.serverMode)) {
			// Build the secure websocket server from the https server
			kiss.websocket.wss = new webSocketServer(
				Object.assign({
						httpServer: kiss.server.httpsServer
					},
					serverOptions
				)
			)

			kiss.websocket.wss.on("request", kiss.websocket.onRequest)
			log.ack(`kiss.websocket - WSS server listening on port ${config.httpsPort} in ${config.envName} environment`)
		}

		// log.warn(`kiss.websocket - WS_SERVER: websocket-node has no support for backpressure. Consider switching to uWebSocket if your network restrictions upon open ports allows it.`)
	},

	/**
	 * Get websocket request
	 *
	 * Note:
	 * Each client connection is stored in kiss.websocket.clients, and organized per account, per user.
	 * To get a connection, use: kiss.websocket.clients[accountId][userId]
	 *
	 * @param {object} request
	 */
	onRequest(request) {
		try {
			log("kiss.websocket - Connection from origin: " + request.origin)

			// Get the token and verify it
			let token = request.resourceURL.query.token

			let payload

			try {
				payload = jwt.verify(token, config.jsonWebToken.accessTokenSecret)
			} catch (err) {
				throw new InvalidToken()
			}

			// Reject if the token was not issued by this server
			let {
				currentAccountId: accountId,
				userId
			} = payload

			if (token != kiss.global.tokens[userId]) {
				log.err(`kiss.websocket - Couldn't find user's token for ${userId}`)
				request.reject()
				return
			}

			if (maxSocketsByUserReached(accountId, userId)) {
				kiss.websocket.clients[accountId][userId][0].close(...SOCKET_CLOSE.TOO_MANY_USER_SOCKETS)
			}

			// Accept connection
			// TODO: check 'request.origin' to make sure that client is connecting from our website
			let connection = request.accept(null, request.origin)
			log("kiss.websocket - Peer connected: " + userId)

			addSocketToClients(connection, accountId, userId)

			// Make it updatable when user switch from one account to another
			connection.identity = {
				accountId,
				userId
			}

			// INCOMING MESSAGE EVENT
			connection.on("message", function (message) {
				const {
					accountId,
					userId
				} = connection.identity

				if (exceedReceiveRate(connection, accountId, userId)) {
					// TODO: we may want to do something with this information to take a decision
					// Ban user, ban ip, restrict access for x time, suing the user and sending him in jail forever...
					// So many options :)

					connection.close(...SOCKET_CLOSE.RATE_LIMIT_REACHED)
					return
				}

				// Binary messages are not supported. Trying to send one is suspect.
				if (message.type === "binary") connection.close(...SOCKET_CLOSE.BINARY_NOT_SUPPORTED)

				if (message.utf8Data === "ping") connection.sendUTF("pong")
				// We do not support websocket up appart ping for now. Again, trying to send one is suspect.
				else connection.close(...SOCKET_CLOSE.UNSUPPORTED_MESSAGE)
			})

			// CLOSE EVENT (a user disconnected)
			connection.on("close", function () {
				const {
					accountId,
					userId
				} = connection.identity

				log("kiss.websocket - Peer disconnected: " + userId)

				removeSocketFromClients(connection, accountId, userId)
			})

			// ERROR
			connection.on("error", function (err) {
				log.err("kiss.websocket - Error with client: " + userId)
			})

		} catch (err) {
			// log.err("kiss.websocket - Could not accept client's connection - Invalid token")
			request.reject()
		}
	},

	/**
	 * Close a single client's connection
	 *
	 * @param {string} accountId
	 * @param {string} userId
	 */
	closeConnection(accountId, userId) {
		if (kiss.websocket.clients[accountId]) {
			const sockets = kiss.websocket.clients[accountId][userId]
			if (sockets) {
				log(`kiss.websocket - Closing connections for user ${userId}`)

				for (let socket of sockets) {
					socket.close(...SOCKET_CLOSE.LOGGED_OUT)
				}
			}
		} else {
			log.warn(`kiss.websocket - Couldn't find any connection for client ${userId}`)
		}
	},

	/**
	 * Publish a message to one or multiple users
	 *
	 * The target parameter allows to define who will receive the message:
	 * - Use a userId (= email) to target a specific user
	 * - Use "*" to broacast to all users (of the same account), except the sender
	 * - Use "*+" to broacast to all users (of the same account), including the sender
	 *
	 * @param {string} accountId
	 * @param {string} target - A specific user id, or *, or *+
	 * @param {object} message - JSON
	 */
	publish(accountId, target, message) {

		// Tag the message so that client's pubsub knows the message is coming fron the network
		Object.assign(message, {
			dbMode: "online"
		})

		log.info(`kiss.websocket.publish - Target: ${target} - Message:`, message)

		// Case 1: the target user is specified and not "*" or "*+"
		// => send message to a single user
		if (target && !target.includes("*")) {
			let searchUser = true

			Object.keys(kiss.websocket.clients).every(accountId => {
				const accountClients = kiss.websocket.clients[accountId]
				if (!accountClients) return false

				Object.keys(accountClients).every(clientId => {
					if (clientId == target) {
						const sockets = accountClients[clientId]

						for (let socket of sockets) {
							send(socket, message)
						}

						searchUser = false
						return false
					}
					return true
				})

				return searchUser
			})
		}

		// Case 2: the user is not specified or not specific
		// Send message to multiple users:
		// - * means all users of the account, except the sender
		// - *+ means all users of the account + the sender
		else {

			const accountClients = kiss.websocket.clients[accountId]
			if (!accountClients) return

			Object.keys(accountClients).forEach(userId => {
				// log("kiss.websocket.publish - UserId: " + userId)

				// Excludes the sender
				if (userId == message.userId && target != "*+") return

				const sockets = accountClients[userId]
				for (let socket of sockets) {
					send(socket, message)
				}
			})
		}
	},

	/**
	 * Broadcast a message to all connected clients (no filter)
	 *
	 * @param {object} message - JSON
	 */
	broadcast(message) {
		Object.keys(kiss.websocket.clients).forEach(accountId => {
			const accountClients = kiss.websocket.clients[accountId]

			Object.keys(accountClients).forEach(userId => {
				const sockets = accountClients[userId]
				for (let socket of sockets) {
					send(socket, message)
				}
			})
		})
	},

	/**
	 * Broadcast a message to a list of users, independantly from their account
	 * 
	 * @param {string[]} users 
	 * @param {object} message - json
	 */
	broadcastTo(users, message) {
		Object.keys(kiss.websocket.clients).forEach(accountId => {
			const accountClients = kiss.websocket.clients[accountId]

			Object.keys(accountClients).forEach(userId => {
				if (!users.includes(userId)) return

				const sockets = accountClients[userId]
				for (let socket of sockets) {
					send(socket, message)
				}
			})
		})
	},

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
	getClients() {
		return getConnectedClients()
	},

	/**
	 * Stop all websocket servers and close all clients connections.
	 * @return {Promise<void>}
	 */
	async stop() {
		if (kiss.websocket.ws instanceof WebSocketServer) kiss.websocket.ws.unmount()
		if (kiss.websocket.wss instanceof WebSocketServer) kiss.websocket.wss.unmount()
		log.ack("kiss.websocket - WebSocket server(s) closed.")

		Object.keys(kiss.websocket.clients).forEach(accountId => {
			const accountClients = kiss.websocket.clients[accountId]

			Object.keys(accountClients).forEach(userId => {
				const sockets = accountClients[userId]
				for (let socket of sockets) {
					socket.close(...SOCKET_CLOSE.GONE_AWAY)
				}
			})
		})
		log.ack("kiss.websocket - All peer connections have been closed")
	}
}