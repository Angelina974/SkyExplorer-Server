/**
 * 
 * ## A simple PubSub
 * 
 * 1. subscribe a function to a channel:
 * ```
 * let subscriptionId = kiss.pubsub.subscribe("MY_CHANNEL_NAME", (messageData) => { console.log(messageData) })
 * ```
 * 
 * 2. publish a message on a channel:
 * ```
 * kiss.pubsub.publish("MY_CHANNEL_NAME", {foo: "bar"})
 * ```
 * 
 * 3. unsubscribe a function:
 * ```
 * kiss.pubsub.unsubscribe(subscriptionId)
 * ```
 * 
 * 4. list all active subscriptions
 * ```
 * kiss.pubsub.list()
 * ```
 * 
 * @namespace
 * 
 */
kiss.pubsub = {
    subscriptions: {},

    channelsNotLogged: ["EVT_ROUTE_UPDATED", "EVT_CONTAINERS_RESIZED"],

    /**
     * Publish a message on a specific channel
     * 
     * @param {string} channel - The channel name
     * @param {object} [messageData] - The data published into the channel
     */
    publish(channel, messageData) {
        let targetChannel = kiss.pubsub.subscriptions[channel]
        if (!targetChannel) return

        if (!kiss.pubsub.channelsNotLogged.includes(channel.toUpperCase())) {
            log("kiss.pubsub - publish on channel: " + channel, 1, messageData)
        }
        
        // Browse all the subscriptions of kiss.pubsub channel
        Object.keys(targetChannel).forEach(subscriptionId => {
            // Get the function to execute
            let fn = targetChannel[subscriptionId]
            
            try {
                // Pass the message data to the function
                fn(messageData)
            }
            catch(err) {
                log("kiss.pubsub - publish - Error with subscription id: " + subscriptionId, 4, err)
            }
        })
    },

    /**
     * Subscribe a function to a channel
     * 
     * @param {string} channel - The channel name
     * @param {function} fn - The function to subscribe to the channel
     * @param {string} [description] - Optional description of the subscription
     * @returns {string} The subscription id
     */
    subscribe(channel, fn, description) {
        let subscriptionId = kiss.tools.shortUid()

        // If the channel doesn't exist yet, we create it
        if (!kiss.pubsub.subscriptions[channel]) kiss.pubsub.subscriptions[channel] = {}

        // Subscribe the function to the channel
        kiss.pubsub.subscriptions[channel][subscriptionId] = fn
        kiss.pubsub.subscriptions[channel][subscriptionId].description = description

        // Return the subscription id so we can use it to unsubscribe the function later
        return subscriptionId
    },

    /**
     * Unsubscribe a function from the pubsub
     * 
     * @param {string} subscriptionId - The id of the subscription to remove
     */
    unsubscribe(subscriptionId) {
        // Scan all the channels
        Object.keys(kiss.pubsub.subscriptions).forEach(channel => {
            let channelSubscriptions = kiss.pubsub.subscriptions[channel]

            // For each channel, scan all the subscriptions
            Object.keys(channelSubscriptions).forEach(channelSubscriptionId => {
                // If the subscription is found, we delete it
                if (channelSubscriptionId == subscriptionId) {
                    delete kiss.pubsub.subscriptions[channel][subscriptionId]
                    return
                }
            })
        })
    },

    /**
     * Return the number of subscriptions.
     * 
     * Mainly used for debugging (useful to track memory leaks).
     * 
     * @returns {number}
     */
    getCount() {
        let count = 0
        Object.keys(kiss.pubsub.subscriptions).forEach(channel => {
            let channelSubscriptions = kiss.pubsub.subscriptions[channel]
            Object.keys(channelSubscriptions).forEach(() => count++)
        })
        return count
    },

    /**
     * Get a subscription by id.
     * 
     * Mainly used for debug purpose, when you need to check which function is registered in the pubsub.
     * 
     * @param {string} subscriptionId - The id of the subscription to retrieve
     * @return {function} The subscribed function
     */
    get(subscriptionId) {
        let subscription

        // Scan all the channels
        Object.keys(kiss.pubsub.subscriptions).forEach(channel => {
            let channelSubscriptions = kiss.pubsub.subscriptions[channel]

            // For each channel, scan all the subscriptions
            Object.keys(channelSubscriptions).forEach(channelSubscriptionId => {
                // If the subscription is found, we return it
                if (channelSubscriptionId == subscriptionId) {
                    subscription = kiss.pubsub.subscriptions[channel][subscriptionId]
                }
            })
        })
        return subscription
    },

    /**
     * List all the subscriptions in the console.
     * 
     * Mainly used for debug purpose, when you need an overview of subscriptions.
     * 
     * @param {boolean} [showFunction] - If true, show the subscribed function
     */    
    list(showFunction) {
        let counter = 0

        // Scan all the channels
        Object.keys(kiss.pubsub.subscriptions).forEach(channel => {
            let channelSubscriptions = kiss.pubsub.subscriptions[channel]

            // For each channel, scan all the subscriptions
            Object.keys(channelSubscriptions).forEach(channelSubscriptionId => {
                let subscription = kiss.pubsub.subscriptions[channel][channelSubscriptionId]
                let description = kiss.pubsub.subscriptions[channel][channelSubscriptionId].description

                log("-----------------------------------------------------------------")
                log("Subscription " + counter.pad(5) + " - subscription id: " + channelSubscriptionId, 1)
                if (description) log("Description: ", 2, description)
                if (showFunction) log("Function: ", 2, subscription)
                counter++
            })
        })
        log("Total number of subscriptions: " + counter)  
    }
};

// Shortcuts
const publish = kiss.pubsub.publish
const subscribe = kiss.pubsub.subscribe
const unsubscribe = kiss.pubsub.unsubscribe;