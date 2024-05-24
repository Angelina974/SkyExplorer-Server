/**
 * 
 * Display a notification that disapears automatically (after 1 second by default)
 * 
 * @param {object} config
 * @param {string} config.message
 * @param {number} [config.top] - Top position. Default = 100
 * @param {string} [config.width]
 * @param {string} [config.height]
 * @param {string} [config.padding] - Default 10px
 * @param {number} [config.duration] - Duration in milliseconds. Default = 1000
 * @returns this
 */
kiss.ui.Notification = class Notification {
    /**
     * You can create a Notification using the class or using the shorthand:
     * ```
     * // Using kiss namespace
     * new kiss.ui.Notification(config)
     * 
     * // Using the class
     * new Notification(config)
     * 
     * // Using the shorthand
     * createNotification(config)
     * ```
     * 
     * @param {object} config 
     * @returns this
     * 
     * @example
     * // Text with options
     * createNotification({
     *  message: "You've completed your task!",
     *  top: 500,
     *  duration: 2000
     * })
     * 
     * // Simple text
     * createNotification("Hello world")
     */
    constructor(config) {

        let message = (typeof config == "string") ? config : config.message || ""
        message = message.replaceAll("\n", "<br>")

        const notificationConfig = {
            top: (config.top === undefined) ? 100 : config.top,
            width: config.width,
            height: config.height,
            padding: config.padding,
            position: "fixed",
            header: false,
            class: "a-notification",
            animation: {
                name: config.setAnimation || "slideInDown",
                speed: "faster"
            },
            items: [{
                type: "html",
                width: "100%",
                html: message
            }]
        }

        // Horizontal alignement
        if (config.hasOwnProperty("left")) {
            notificationConfig.left = config.left
        }
        else {
            notificationConfig.align = "center"
        }
        
        const notification = createPanel(notificationConfig).render()

        setTimeout(() => {
            notification.setAnimation({
                name: "fadeOut",
                speed: "faster",
                callback: () => {
                    if (notification) notification.close()
                }
            })
        }, (config.duration || 2000))

        // Keep history of messages
        // kiss.global.notifications = (kiss.global.notifications || []).concat({
        //     createdAt: new Date().toISOString(),
        //     message
        // })

        return notification
    }
}

/**
 * Shorthand to create a new Notification. See [kiss.ui.Notification](kiss.ui.Notification.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createNotification = (config) => new kiss.ui.Notification(config)

;