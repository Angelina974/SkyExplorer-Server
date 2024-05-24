/**
 * 
 * ## A simple screen size manager
 * 
 * - keeps track of screen size and ratio changes
 * - helper to compute a component dimensions based on other components: getHeightMinus(...), getWidthMinus(...)
 * - observe screen size changes and publish them to the PubSub on the EVT_WINDOW_RESIZED channel
 * - observe when container components (Block, Panel) are resized to propagate the change on children
 * 
 * @namespace
 * 
 */
kiss.screen = {
    isMobile: false,

    /**
     * Check if a screen is horizontal (= landscape)
     * 
     * @returns {boolean}
     */
    isHorizontal: () => kiss.screen.current.width > kiss.screen.current.height,

    /**
     * Check if a screen is vertical (= portrait)
     * 
     * @returns {boolean}
     */
    isVertical: () => kiss.screen.current.width < kiss.screen.current.height,

    /**
     * Check if a screen is a touch screen
     * 
     * @returns {boolean}
     */
    isTouch: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0,

    /**
     * Previous dimensions and ratio
     * 
     * @example
     * kiss.screen.previous.height
     * kiss.screen.previous.ratio
     */
    previous: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.innerWidth / window.innerHeight
    },

    /**
     * Current dimensions and ratio
     * 
     * @example
     * kiss.screen.current.width
     * kiss.screen.current.ratio
     */
    current: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.innerWidth / window.innerHeight
    },

    /**
     * Init the screen size observer
     */
    init() {
        // Startup test to check if it's a mobile environment
        if (kiss.tools.isMobile()) kiss.screen.isMobile = true

        // Init screen size listener
        kiss.screen.observe()
    },

    /**
     * Update the current screen size and cache the previous one
     * 
     * @private
     * @ignore
     */
    _update() {
        kiss.screen.previous = kiss.screen.current
        kiss.screen.current = {
            width: window.innerWidth,
            height: window.innerHeight,
            ratio: window.innerWidth / window.innerHeight
        }
    },

    /**
     * Compute the delta between previous and new screen size
     * 
     * @private
     * @ignore
     * @returns {object} For example: {width: 100, height: 50}
     */
    _delta() {
        let deltaWidth = kiss.screen.current.width - kiss.screen.previous.width
        let deltaHeight = kiss.screen.current.height - kiss.screen.previous.height
        let delta = {
            width: deltaWidth,
            height: deltaHeight
        }
        return delta
    },

    /**
     * Compute the remaining window's height in pixels (= window's height minus a computed delta)
     * 
     * @param {...*} something - Either a number, or a CSS height in pixels, or an array of ids of the items to consider while computing the remaining height
     * @returns {number} The remaining height, in pixels
     * 
     * @example
     * // With number:
     * kiss.screen.getHeightMinus(60)
     * 
     * // With a CSS size:
     * kiss.screen.getHeightMinus("60px")
     * 
     * // With a component id:
     * kiss.screen.getHeightMinus("top-bar")
     * 
     * // With multiple component ids:
     * kiss.screen.getHeightMinus("top-bar", "button-bar")
     * 
     * // With multiple numbers:
     * kiss.screen.getHeightMinus(60, 20, $("top-bar").offsetHeight)
     * 
     * // Mixed stuff:
     * kiss.screen.getHeightMinus("top-bar", 20, "60px")
     */
    getHeightMinus(...something) {
        let delta = 0
        something.forEach(function (item) {
            // Item given as a number: 60
            if (typeof item == "number") {
                delta += item
            } else {
                // Item given as CSS size: "60px"
                if (item.indexOf("px") != -1) {
                    delta += Number(item.substring(0, item.indexOf("px")))
                }
                // Item given as a DOM Element id
                else {
                    let node = $(item)
                    if (node) {
                        if (!node.offsetHeight) node = node.firstElementChild
                        delta += node.offsetHeight
                    }
                }
            }
        })

        return (window.innerHeight - delta)
    },

    /**
     * Compute the remaining window's width in pixels (= window's width minus a computed delta)
     * 
     * @param {...*} something - Either a number, or a CSS height in pixels, or an array of ids of the items to consider while computing the remaining width
     * @returns {number} The remaining height, in pixels
     * 
     * @example
     * // With number:
     * kiss.screen.getWidthMinus(60)
     * 
     * // With a CSS size:
     * kiss.screen.getWidthMinus("60px")
     * 
     * // With a component id:
     * kiss.screen.getWidthMinus("left-nav")
     * 
     * // With multiple component ids:
     * kiss.screen.getWidthMinus("left-nav", "left-nav-margin")
     * 
     * // With multiple numbers:
     * kiss.screen.getWidthMinus(60, 20, $("left-nav").offsetWidth)
     * 
     * // Mixed stuff:
     * kiss.screen.getWidthMinus("left-nav", 20, "60px")
     */
    getWidthMinus(...something) {
        let delta = 0
        something.forEach(function (item) {
            // Item given as a number: 60
            if (typeof item == "number") {
                delta += item
            } else {
                // Item given as CSS size: "60px"
                if (item.indexOf("px") != -1) {
                    delta += Number(item.substring(0, item.indexOf("px")))
                }
                // Item given as a DOM Element id
                else {
                    let node = $(item)
                    if (node) {
                        if (!node.offsetWidth) node = node.firstElementChild
                        delta += node.offsetWidth
                    }
                }
            }
        })

        return (window.innerWidth - delta)
    },

    /**
     * Get the screen orientation
     * 
     * @returns {string} "vertical" or "horizontal"
     */
    getOrientation() {
        return (kiss.screen.current.height > kiss.screen.current.width) ? "vertical" : "horizontal"
    },

    /**
     * Debounce a function which occurs at a high frequency, and force it to occur at a specific interval (in milliseconds)
     * 
     * @private
     * @ignore
     * @param {integer} interval - Interval in milliseconds used to call the debounced function
     * @param {function} fn - The function to debounce
     * @returns {function} A function calling the function to debounce, passing it the {event} that occured.
     * 
     * @example
     * window.addEventListener("resize", kiss.screen._debounce(function(event) { console.log(event) })
     */
    _debounce(interval, fn) {
        let timer
        return function (event) {
            if (timer) clearTimeout(timer)
            timer = setTimeout(fn, interval, event)
        }
    },

    /**
     * Observe the window resize event, and publish the changes in the EVT_WINDOW_RESIZED pubsub channel.
     * 
     * @example
     * kiss.screen.observe()
     */
    observe() {
        window.addEventListener("resize", kiss.screen._debounce(100, function () {
            kiss.screen._update()
            kiss.pubsub.publish("EVT_WINDOW_RESIZED", {
                previous: kiss.screen.previous,
                current: kiss.screen.current,
                delta: kiss.screen._delta()
            })
        }))
    },

    /**
     * Observe when container components (Block, Panel) are resized.
     * Propagate the event EVT_CONTAINERS_RESIZED with the list of ids of the resized containers
     * 
     * @ignore
     * @param {function} callback to execute when the observer is triggered
     */
    getResizeObserver() {
        if (kiss.screen.resize) return kiss.screen.resize

        kiss.screen.resize = new ResizeObserver(kiss.screen._debounce(100, function (entries) {
            let elements = Array.from(entries)
                .filter(entry => entry.borderBoxSize[0].blockSize != 0)
                .map(entry => entry.target.id)

            // Propagate the list of container ids
            if (elements.length > 0) kiss.pubsub.publish("EVT_CONTAINERS_RESIZED", elements)
        }))

        return kiss.screen.resize
    }
}

;