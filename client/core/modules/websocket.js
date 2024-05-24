(function () {

	// Avoids collision in websocket config
	const RECONNECTION_SYMBOL = Symbol("reconnection")
	let reconnecting = false,
		closing = false

	/**
	 *
	 * ## A simple client WebSocket wrapper
	 *
	 * **This module is 100% specific and only works in combination with KissJS server.**
	 * The websocket wrapper uses [kiss.session](kiss.session.html) to authenticate the user with the server.
	 *
	 * @namespace
	 *
	 */
	kiss.websocket = {
		// The connection object
		connection: {},

		/**
		 * Init the WebSocket connection
		 *
		 * @async
		 * @param {object} config
		 * @param {string} [config.socketUrl] - optional socket url to use
		 * @param {string} [config.port] - optional socket non-secure port to use
		 * @param {string} [config.sslPort] - optional socket secure port to use
		 * @param {object} [config.reconnection] - optional reconnection config
		 * @param {boolean} [config.reconnection.enabled=true] - optional enable/disable reconnection
		 * @param {number} [config.reconnection.delay=5000] - optional reconnection delay in ms
		 * @param {number} [config.reconnection.delta=2] - optional reconnection delta to avoid DDOS on server reboot
		 * @param {number} [config.reconnection.maxAttempts=10] - optional max reconnection in a row. Reset each time the connection is established.
		 * @param {object} [config.heartbeat] - optional heartbeat config
		 * @param {boolean} [config.heartbeat.enabled=true] - optional enable/disable heartbeat
		 * @param {number} [config.heartbeat.delay=10000] - optional heartbeat frequency in ms
		 * @param {number} [config.heartbeat.timeout=35000] - optional heartbeat timeout before considering the socket as
		 *                                                    closed. Should be set several time greater than heartbeat delay
		 *                                                    to be sure pings are not answered by the server, because it may be
		 *                                                    busy or may forget to send the pong response.
		 * @param {function} [config.onopen] - Hook to the onopen event
		 * @param {function} [config.onmessage] - Hook to the onmessage event
		 * @param {function} [config.onclose] - Hook to the onclose event
		 *
		 * @example
		 * await kiss.websocket.init()
		 * kiss.websocket.send("something")
		 *
		 * // More complex case:
		 * await kiss.websocket.init({
		 * 	socketUrl: "wss://api.valr.com/ws/trade",
		 *
		 * 	onopen: () => {
		 * 		kiss.websocket.send({
		 * 			type: "SUBSCRIBE",
		 * 			subscriptions: [{
		 * 				event: "AGGREGATED_ORDERBOOK_UPDATE",
		 * 				pairs: ["BTCZAR"]
		 * 			}]
		 * 		})
		 * 	},
		 *
		 * 	onmessage: (message) => {
		 * 		console.log("Message received: ", message)
		 *  },
		 *
		 * 	onclose: () => {
		 * 		console.log("Socket closed!")
		 * 	}
		 * })
		 *
		 */
		async init(config = {}) {
			// If a socket is already open, we return immediately as we don't want several connection opened at the same time
			if (
				// Check if the connection have been initialised first
				(
					this.connection.readyState !== undefined
					&& this.connection.readyState !== WebSocket.CLOSED
				) || closing
				  || kiss.context.ws === 'no'

			) {
				return
			}

			// Race conditions may occur, and they are hard to track down if not id is used
			const logPrefix = `kiss.websocket - ${kiss.tools.uid()}`

			let socketUrl = config.socketUrl

			const {
				port = 80,
				sslPort = 443,
				reconnection: {
					enabled: autoReconnect = true,
					delay: reconnectionDelay = 5000,
					delta: reconnectionDelta = 2,
					maxAttempts = 10
				} = {},
				heartbeat: {
					enabled: heartbeatEnabled = true,
					delay: heartbeatDelay = 10000,
					timeout: heartbeatTimeout = 35000
				} = {}
			} = config

			const ws = window.WebSocket || window.MozWebSocket

			// Connect to WS or WSS depending on the current protocol
			if (!socketUrl) {
				const isHttps = (window.location.protocol == "https:")
				const socketProtocol = (isHttps) ? "wss://" : "ws://"
				const socketPort = (isHttps) ? `:${sslPort || 443}` : `:${port || 80}`
				socketUrl = socketProtocol + window.location.host + socketPort + "/?token="
			}

			log(`${logPrefix} - Connecting to ${socketUrl}`)
			const connection = new ws(socketUrl + kiss.session.getToken())

			// Will allow us to leverage the current function asynchronicity despite WebSocket callbacks nature
			const connectionResolver = {}

			connectionResolver.promise = new Promise((resolve, reject) => {
				Object.assign(connectionResolver, {
					resolve,
					reject
				})
			})
				.then(() => connectionResolver.succeeded = true)
				.catch(() => connectionResolver.succeeded = false)

			let heartbeatHandle, heartbeatResponseHandle

			//
			// OPEN
			//
			connection.addEventListener("open", e => {

				log(`${logPrefix} - Connected`)
				connectionResolver.resolve()

				if (RECONNECTION_SYMBOL in config || reconnecting) {
					if(!(RECONNECTION_SYMBOL in config)){
						config[RECONNECTION_SYMBOL] = {
							attempt: 0
						}
					} else {
						config[RECONNECTION_SYMBOL].attempt = 0
					}

					kiss.pubsub.publish("EVT_RECONNECTED")
				} else {
					kiss.pubsub.publish("EVT_CONNECTED")
				}

				// Hook
				if (typeof config.onopen === "function") {
					try {
						config.onopen()
					} catch (err) {
						log(`${logPrefix} - Could not execute 'onopen' hook properly - Error:`, 4, err)
					}
				}

				if (!heartbeatEnabled) return

				heartbeatHandle = setInterval(() => {
					// We only set the timeout if it is not defined or have been reset.
					// If we are already waiting for a ping response, we just resend it.
					// The server may have been busy or may have missed the first one, we want to be
					// certain that it is not reachable by sending several pings.
					if (!heartbeatResponseHandle) {
						heartbeatResponseHandle = setTimeout(() => {
							connection.close(4000, "SERVER_NOT_RESPONDING")
						}, heartbeatTimeout)
					}

					connection.send("ping")
				}, heartbeatDelay)
			})

			//
			// CLOSE
			//

			connection.addEventListener("close", async e => {
				// We check errors there, since the close event is ALWAYS emitted, even on connection error.
				// In fact, we do not need websocket error handler at all.
				log(`${logPrefix} - Closed ${e.reason} (${e.code})`)

				// We enter closing state. No external code must try a reconnection during this process.
				closing = true

				// Do not need the heartbeat anymore
				clearInterval(heartbeatHandle)

				// Hook
				if (typeof config.onclose === "function") {
					try {
						config.onclose()
					} catch (err) {
						log(`${logPrefix} - Could not execute 'onclose' hook properly - Error:`, 4, err)
					}
				}

				if (e.code === 4002) {
					// To many user sockets, we actually WANT to block the UI. And we REALLY don't want to reconnect.
					// Consequence would be to indefinitely loop from disconnection to reconnection across all tabs... not very fun for the user.
					log(`${logPrefix} - Connection locked by server (too many sockets have been opened by this user).`)

					// TODO : since there we want to do something special, EVT_CONNECTION_LOCK may be more accurate ?
					kiss.pubsub.publish("EVT_CONNECTION_LOST")
					return

				} else if (e.code === 4003) {
					// We have a definitive close. We will not try to reconnect.
					log(`${logPrefix} - Connection definitively closed.`)
					kiss.pubsub.publish("EVT_CONNECTION_CLOSED")
					return

				} else if (!e.reason && e.code === 1006) {
					// The websocket specification forbid the client to check the status code.
					// If the socket is rejected because invalid token, it will send the 1006 code. With no message.
					// So... if we want this reconnection algorithm to stop stupidly trying to reconnect with a wrong JWT,
					// we need to force the client to logout and to reauthenticate.
					// @see https://websockets.spec.whatwg.org//#feedback-from-the-protocol

					if(!await kiss.session.checkTokenValidity(true)){
						log(`${logPrefix} - Can't reconnect. No valid token available, and current token can't be renewed !`)
						kiss.pubsub.publish("EVT_UNUSABLE_TOKEN")
						return kiss.session.logout()
					}
				} else if (e.code === 1001) {
					// TODO : Server goes away (restart/shutdown)
					// we may want to display a maintenance screen, and increase the reconnection time
					log(`${logPrefix} - Server gone.`)
					kiss.pubsub.publish("EVT_SERVER_GONE")
					return
				}

				// Configuring the reconnection process. May or may not be used
				if (!config[RECONNECTION_SYMBOL]) {
					config[RECONNECTION_SYMBOL] = {
						attempt: 1
					}
				} else {
					config[RECONNECTION_SYMBOL].attempt++
				}

				// A real disconnection, since we were connected, so the pub/sub must be informed
				if (connectionResolver.succeeded) {
					kiss.pubsub.publish("EVT_DISCONNECTED")
				} else {
					connectionResolver.reject()
				}

				// Socket closed, from there no matter who tries to reconnect, it's ok.
				closing = false

				if (!autoReconnect) return

				if (config[RECONNECTION_SYMBOL].attempt <= maxAttempts) {
					let delay = reconnectionDelay || 5000

					// 1006 is the code for abnormal closure
					// 1001 is the code for Going Away
					// If the serveur is brutally stopped or restarted, we don't want all clients
					// to reconnect at the exact same millisecond.
					// It would be a disaster, as it may become an auto DDOS :(. Not very glorious way to die again and again.
					// So we delay randomly each reconnection in a window between the configured reconnection delay
					// and N times the reconnection delay, N being an arbitrary factor called reconnectionDelta
					if ([1001, 1006].includes(e.code) && reconnectionDelta) {
						// Draw a number between 0 and delay * reconnectionDelta
						delay += Math.floor(Math.random() * ((delay * reconnectionDelta) + 1))
					}

					log(`${logPrefix} - Will try to reconnect to the server in ${delay} ms...`)

					setTimeout(async () => {
						// This one is tricky. When the first connection attempt fails because session token must
						// be regenerated, a reconnection procedure starts.
						// But as soon as the token is automatically regenerated by kiss, init() is called a second
						// time, resulting in the opening of two connections as a result of a race condition.
						// If a connection is open, opening or closing, we abort the current call to avoid this.
						if (
							"readyState" in kiss.websocket.connection &&
							kiss.websocket.connection.readyState !== WebSocket.CLOSED
						) {
							log(`${logPrefix} - Reconnection aborted`)
							return
						}

						log(
							`${logPrefix} - Trying to reconnect (attempt ${
								config[RECONNECTION_SYMBOL].attempt
							}/${maxAttempts})`
						)

						try{
							// One may want to await the reconnection process to succeed or ack its error, so we carry along the init promise.
							const promise = kiss.websocket.init(config)
							kiss.pubsub.publish(
								"EVT_RECONNECTING",
								promise
							)

							reconnecting = true;
						}catch(err){
							reconnecting = false
							log(`${logPrefix} - Unable to reconnect: `, 4, err)
						}
					}, delay)
				} else {
					log(`${logPrefix} - Connection lost (max attempts (${maxAttempts}) reached !)`)
					kiss.pubsub.publish("EVT_CONNECTION_LOST")
				}
			})

			//
			// MESSAGE
			//
			connection.addEventListener("message", message => {
				if (message.data === "pong") {
					// Received in time, we have to clean the timeout
					clearTimeout(heartbeatResponseHandle)
					heartbeatResponseHandle = null
					return
				}

				try {
					log(`${logPrefix} - onmessage - Data:`, 1, message.data)

					let json = JSON.parse(message.data)
					
					// Mark the message as coming from a websocket
					json.websocket = true 
					kiss.pubsub.publish(json.channel, json)

					// Hook
					if (typeof config.onmessage === "function") {
						try {
							config.onmessage(message)
						} catch (err) {
							log(`${logPrefix} - Could not execute 'onmessage' hook properly - Error:`, 4, err)
						}
					}
				} catch (err) {
					log(`${logPrefix} - onmessage - Error:`, 4, err)
				}
			})

			kiss.websocket.connection = connection

			return connectionResolver.promise
		},

		close() {
			// Check if the connection have been initialised
			if (typeof this.connection.close === "function") {
				this.connection.close(4003, 'DEFINITIVE_CLOSE')
			} else throw new Error("No connection to close: kiss.websocket.init has not been called.")
		},

		/**
		 * Send a message to the server via WebSocket
		 *
		 * @param {object} jsonData - Any valid JSON
		 *
		 * @example
		 * kiss.data.send({
		 *  userId: "john.doe@pickaform.com",
		 *  text: "Hello, how are you?"
		 * })
		 */
		send(jsonData) {
			// Check if the connection have been initialised
			if (typeof this.connection.send === "function") {
				const message = JSON.stringify(jsonData)
				this.connection.send(message)
			} else throw new Error("No connection to opened: kiss.websocket.init has not been called.")
		}
	}

})()


;