/**
 *
 * kiss.websocket / using uWebSocket
 *
 */

const uWS = require("uWebSockets.js")
const {
	createCompatibleUWSServer
} = require("uws-compat-layer")(uWS)

const {
	App: webSocketServer,
	SSLApp: sslWebSocketServer,
	us_listen_socket_close: closeWebSocketServer
} = uWS

const TextDecoder = new(require("util").TextDecoder)()

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

// #region Private utility functions

/**
 * Decode the uWebSocket request object to expose an easier to work-with structure
 * Not very useful for now, as we mainly need query string, but since we may want to apply
 * defenses on URL and remote IP later, it will ease the process.
 * @private
 */
function decodeRequest(req, res) {
	const decoded = {
		headers: {},
		cookies: {},
		query: {},
		client: {}
	}

	req.forEach((k, v) => {
		decoded.headers[k] = v
	})
	decoded.url = req.getUrl()
	decoded.method = req.getMethod()
	decoded.query = {}
	decodeURIComponent(req.getQuery()).split("&").forEach(arg => {
		const split = arg.split("=")

		if (split.length === 0) return

		let currentObj = decoded.query
		let lastKey = split[0]

		if (split[0].match(/\[/)) {
			// we have an array or a multi-dimensional array
			split[0].split("[").forEach((k, i, arr) => {
				const cleanKey = lastKey = k.replace(/]$/, "")

				if (i !== arr.length - 1) {
					if (!(cleanKey in currentObj)) currentObj = currentObj[cleanKey] = {}
					else currentObj = currentObj[cleanKey]
				}
			})
		}

		currentObj[lastKey] = split.length > 1 ? split[1] : null
	})

	decoded.client.remoteAddress = decoded.headers["x-forwarded-for"] ||
		TextDecoder.decode(res.getRemoteAddressAsText())

	decoded.client.proxiedRemoteAddress = TextDecoder.decode(res.getProxiedRemoteAddressAsText())

	if (decoded.client.proxiedRemoteAddress.length === 0)
		decoded.client.proxiedRemoteAddress = null

	return decoded
}

const SEND_QUEUE = new Map()

/**
 * Send a message to the given socket. Take backpressure into consideration.
 * @param socket uWebSocket.js socket
 * @param {*} message Will be automatically serialized in JSON.
 * @private
 */
function send(socket, message) {
	message = JSON.stringify(message)

	let ok = socket.getBufferedAmount() < config.webSocketServer.backpressureThreshold
	if (ok) ok = socket.send(message)

	// Message have been successfully sent.
	if (ok) return

	// Message haven't been sent because of backpressure.
	// Seems the socket is too slow. We will buffer it for the drain to retry later.
	if (!SEND_QUEUE.has(socket)) SEND_QUEUE.set(socket, [])

	const socketQueue = SEND_QUEUE.get(socket)

	// If we reach the maxBufferedMessages threshold, we drop the socket and all buffered messages.
	if (socketQueue.length >= config.webSocketServer.maxBufferedMessages) {
		const {
			accountId,
			userId
		} = socket.identity

		SEND_QUEUE.delete(socket)
		socket.end(...SOCKET_CLOSE.TOO_SLOW)

		log.warn(
			`kiss.websocket - Slow peer connection dropped for ${userId} on account ${accountId}.` +
			` WS_MAX_BUFFERED_MESSAGES reached.`
		)
	} else socketQueue.push(message)
}

// #endregion

// #region WebSocket handlers

/**
 * Handlers for uWebSocket servers.
 * @private
 */
const WS_HANDLERS = {
	/**
	 * Handle the upgrade process, since every WebSocket creation starts by a standard http request.
	 * Once upgraded, will call the WS_HANDLERS.open method.
	 *
	 * @param res uWebSocket response object
	 * @param request uWebSocket request object
	 * @param context uWebSocket context object
	 */
	upgrade(res, request, context) {
		const upgradeAborted = {
			aborted: false
		}

		res.onAborted(() => {
			upgradeAborted.aborted = true
		})

		//When uWebSocket will give us a socket, all socketContext properties will be added to it.
		const socketContext = decodeRequest(request, res)
		socketContext.id = kiss.tools.uid()

		const secWebSocketKey = request.getHeader("sec-websocket-key")
		const secWebSocketProtocol = request.getHeader("sec-websocket-protocol")
		const secWebSocketExtensions = request.getHeader("sec-websocket-extensions")

		try {
			log("kiss.websocket - Connection from origin: " + socketContext.headers.origin)

			// Get the token and verify it
			const token = socketContext.query.token

			let payload
			try {
				payload = jwt.verify(token, config.jsonWebToken.accessTokenSecret)
			} catch (err) {
				throw new InvalidToken()
			}

			// Reject if the token was not issued by this server
			const {
				currentAccountId: accountId,
				userId
			} = payload

			if (token != kiss.global.tokens[userId]) {
				throw new Error(`kiss.websocket - Couldn't find user's token for ${userId}`)
			}

			// We have a max connection by user to check before upgrading
			if (maxSocketsByUserReached(accountId, userId)) {
				// We close the first one as per FILO policy
				kiss.websocket.clients[accountId][userId][0].end(...SOCKET_CLOSE.TOO_MANY_USER_SOCKETS)
			}

			socketContext.identity = {
				accountId,
				userId
			}

			//TODO : be more restrictive upon origin !

			res.upgrade(
				socketContext,
				secWebSocketKey,
				secWebSocketProtocol,
				secWebSocketExtensions,
				context
			)
		} catch (err) {
			log.err("kiss.websocket - Could not accept client's connection: ", err)

			res.writeStatus("401 Unauthorized")
			res.end()
		}
	},

	/**
	 * Initial http request have been successfully upgraded, we now have a new peer connected.
	 *
	 * Note:
	 * Each client connection is stored in kiss.websocket.clients, and organized per account, per user.
	 * To get all user connections, use the user sockets map : kiss.websocket.clients[accountId][userId]
	 *
	 * @param socket uWebSocket socket
	 */
	open(socket) {
		const {
			userId,
			accountId
		} = socket.identity

		log(
			"kiss.websocket - Peer socket connected: " + userId +
			` (socket : ${socket.id})`
		)

		addSocketToClients(socket, accountId, userId)
	},

	/**
	 * A socket have been closed and can't be used anymore.
	 * @param socket uWebSocket.js socket
	 */
	close(socket) {
		const {
			userId,
			accountId
		} = socket.identity

		log(
			"kiss.websocket - Peer socket disconnected: " + userId +
			` (socket : ${socket.id})`
		)

		removeSocketFromClients(socket, accountId, userId)
	},

	/**
	 * Handle received messages. For now, the only supported message is 'ping'. The server will auto answer 'pong'.
	 * Any other message received will close the socket, as it is not supposed to happen for now.
	 * Implements a rate limiter.
	 *
	 * @param socket uWebSocket socket
	 * @param {ArrayBuffer} message
	 * @param {boolean} isBinary
	 */
	message(socket, message, isBinary) {
		const {
			accountId,
			userId
		} = socket.identity

		if (exceedReceiveRate(socket, accountId, userId)) {
			// TODO : we may want to do something with this information to take a decision
			//  Ban user, ban ip, restrict access for x time, suing the user and sending him in jail forever...
			//  So many options :)

			socket.end(...SOCKET_CLOSE.RATE_LIMIT_REACHED)
			return
		}

		// Binary messages are not supported. Trying to send one is suspect.
		if (isBinary) socket.end(...SOCKET_CLOSE.BINARY_NOT_SUPPORTED)

		const decodedMsg = TextDecoder.decode(message)

		if (decodedMsg === "ping") socket.send("pong")
		// We do not support websocket up appart ping for now. Again, trying to send one is suspect.
		else socket.end(...SOCKET_CLOSE.UNSUPPORTED_MESSAGE)
	},

	/**
	 * Will be called if a socket experience backpressure and is now available to receive more data.
	 * Allow us to send messages buffered in SEND_QUEUE
	 * @param socket uWebSocket socket
	 */
	drain(socket) {
		if (!SEND_QUEUE.has(socket)) return

		// We send as much as we can at once
		while (socket.getBufferedAmount() < config.webSocketServer.backpressureThreshold) {
			// We send with a FIFO policy
			const message = SEND_QUEUE.get(socket).slice(0, 1).shift()
			const ok = socket.send(message)

			// Sent, we can remove the message from the buffer.
			if (ok) SEND_QUEUE.get(socket).splice(0, 1)
		}
	}
}

// #endregion

// Holds uWebSocket listening sockets to allow us to close them when we want the server to stop.
const WEBSOCKET_SERVER_HANDLES = new Map()

module.exports = {

	// Cache clients
	clients: {},

	/**
	 * Init the websocket server
	 */
	init() {
		const webSocketServerOptions = Object.assign({
				idleTimeout: config.webSocketServer.idleTimeout,
				compression: uWS.SHARED_COMPRESSOR,
				maxPayloadLength: config.webSocketServer.maxPayloadLength,
			},
			WS_HANDLERS
		)

		if (["insecure", "both"].includes(config.serverMode)) {
			kiss.websocket.ws = webSocketServer()
			kiss.websocket.ws.ws("/*", webSocketServerOptions)

			if (config.webSocketServer.server === "uWebSocket" && config.webSocketServer.expressCompatibility) {
				createCompatibleUWSServer(
					kiss.server.httpServer, {
						server: kiss.websocket.ws,
						port: config.wsPort
					}, {
						on: {
							listen: () => {
								log.ack(`kiss.server - The HTTP server is listening on port ${config.httpPort}`)
							}
						}
					}
				)
			}

			kiss.websocket.ws.listen(config.isBehindProxy ? "127.0.0.1" : "0.0.0.0", config.wsPort, async listening => {
				if (listening) {
					WEBSOCKET_SERVER_HANDLES.set(kiss.websocket.ws, listening)
					log.ack(`kiss.websocket - WS server listening on port ${config.wsPort} in ${config.envName} environment`)
				} else {
					log.err(`kiss.websocket - Unable to listen on port ${config.wsPort} in ${config.envName} environment for WS server.`)
				}
			})
		}

		if (["secure", "both"].includes(config.serverMode)) {
			kiss.websocket.wss = sslWebSocketServer({
				key_file_name: config.ssl.key,
				cert_file_name: config.ssl.cert
			})

			kiss.websocket.wss.ws("/*", webSocketServerOptions)

			if (config.webSocketServer.server === "uWebSocket" && config.webSocketServer.expressCompatibility) {
				createCompatibleUWSServer(
					kiss.server.httpsServer, {
						server: kiss.websocket.wss,
						ssl: true,
						port: config.wssPort
					}, {
						port: 35975,
						on: {
							listen: () => {
								log.ack(`kiss.server - The HTTPS server is listening on port ${config.httpsPort}`)
							}
						}
					}
				)
			}

			kiss.websocket.wss.listen(config.isBehindProxy ? "127.0.0.1" : "0.0.0.0", config.wssPort, async listening => {
				if (listening) {
					WEBSOCKET_SERVER_HANDLES.set(kiss.websocket.wss, listening)
					log.ack(`kiss.websocket - WSS server listening on port ${config.wssPort} in ${config.envName} environment`)
				} else {
					log.err(`kiss.websocket - Unable to listen on port ${config.wssPort} in ${config.envName} environment for WSS server.`)
				}
			})
		}
	},

	/**
	 * Close all connections that belongs to a specific user.
	 *
	 * @warning It may not be the intended behavior, but multiple connections from the same user case
	 *          have not been taken into consideration until now. May need to reflect this new behavior
	 *          somewhere else.
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
					socket.end(...SOCKET_CLOSE.LOGGED_OUT)
				}
			}
		} else {
			log(`kiss.websocket - Couldn't find any connection for client ${userId}`)
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

		// log.info(`kiss.websocket.publish - Target: ${target} - Message:`, message)

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
				// log.info("kiss.websocket.publish - UserId: " + userId)

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
				for(let socket of sockets){
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
		for (let [server, handle] of WEBSOCKET_SERVER_HANDLES) {
			closeWebSocketServer(handle)
			WEBSOCKET_SERVER_HANDLES.delete(server)
		}
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