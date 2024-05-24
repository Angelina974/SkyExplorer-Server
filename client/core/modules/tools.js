/**
 * 
 * ## Misc tools & helpers
 * 
 * @namespace
 * 
 */
kiss.tools = {
    /**
     * Returns a DOM node from a simple and basic *id* selector.
     * Just work with ids because everything *useful* should be uniquely identified to get things simpler.
     * 
     * @param {string} id - id of the target node
     * @param {HTMLElement} parentNode - Root node to start lookup from
     * @returns {HTMLElement} The element found
     */
    $(id, parentNode) {
        if (parentNode) {
            return parentNode.querySelector("#" + id)
        } else {
            return document.getElementById(id)
        }
    },

    /**
     * As per RFC4122 DRAFT for UUID v7, the UUID bits layout:
     *
     * ```
     *     0                   1                   2                   3
     *     0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
     *    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     *    |                           unix_ts_ms                          |
     *    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     *    |          unix_ts_ms           |  ver  |       rand_a          |
     *    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     *    |var|                        rand_b                             |
     *    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     *    |                            rand_b                             |
     *    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     * ```
     * 
     * @see https://datatracker.ietf.org/doc/html/draft-peabody-dispatch-new-uuid-format#section-5.2
     * @returns {string} The GUID xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
     */
    uid() {
        const UUID_UNIX_TS_MS_BITS = 48
        const UUID_VAR = 0b10
        const UUID_VAR_BITS = 2
        const UUID_RAND_B_BITS = 62

        if (!kiss.tools.prevTimestamp) kiss.tools.prevTimestamp = -1

        // Negative system clock adjustments are ignored to keep monotonicity
        const timestamp = Math.max(Date.now(), kiss.tools.prevTimestamp)

        // We need two random bytes for rand_a
        const randA = crypto.getRandomValues(new Uint8Array(2))

        // Adding the version (aka ver) to the first byte.
        randA[0] = (randA[0] & 0x0f) | 0x70

        // Prepare our 2x 32 bytes for rand_b
        const randB = crypto.getRandomValues(new Uint32Array(2))

        // Positioning the UUID variant (aka var) into the first 32 bytes random number
        randB[0] = (UUID_VAR << (32 - UUID_VAR_BITS)) | (randB[0] >>> UUID_VAR_BITS)

        const rawV7 =

            // unix_ts_ms
            // We want a 48 bits timestamp in 6 bytes for the first 12 UUID characters.
            timestamp.toString(16).padStart(UUID_UNIX_TS_MS_BITS / 4, "0") +
            // ver + rand_a
            // The version + first part of rand_a
            randA[0].toString(16) +
            // rand_a
            // Second part of rand_a
            randA[1].toString(16).padStart(2, "0") +
            // var + rand_b
            //First part of rand_b including the UUID variant on 2 bits
            randB[0].toString(16).padStart((UUID_VAR_BITS + UUID_RAND_B_BITS) / 8, "0") +
            // rand_b
            // Last part of rand_b
            randB[1].toString(16).padStart((UUID_VAR_BITS + UUID_RAND_B_BITS) / 8, "0")

        // Formatting
        return (
            rawV7.slice(0, 8) +
            "-" +
            rawV7.slice(8, 12) +
            "-" +
            rawV7.slice(12, 16) +
            "-" +
            rawV7.slice(16, 20) +
            "-" +
            rawV7.slice(20)
        )
    },

    /**
     * Get an URL parameter
     * 
     * @param {string} name 
     * @param {string} url 
     * @returns {string}
     */
    getUrlParameter(name, url = window.location.href) {
        name = name.replace(/[\[\]]/g, "\\$&")
        const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)")
        const results = regex.exec(url)
        if (!results) return null
        if (!results[2]) return ""
        return decodeURIComponent(results[2].replace(/\+/g, " "))
    },

    /**
     * Copy a text to the clipboard
     * 
     * @param {string} text 
     */
    async copyTextToClipboard(text) {
        await navigator.clipboard.writeText(text)
    },

    /**
     * Given a file, return the required thumbnail.
     * If thumbCode is not found, returns the original file
     * 
     * @param {Object} file
     * @param {string|null} thumbCode
     * @return {Object}
     */
    getThumbnail(file, thumbCode = null) {
        if (thumbCode && file.thumbnails && thumbCode in file.thumbnails) {
            return file.thumbnails[thumbCode]
        }
        return file
    },

    /**
     * Return the URL to access a file object on Amazon S3.
     * The file can be either public or private.
     * 
     * @param {Object} file
     * @param {string|null} [thumb=null]
     * @return {string}
     */
    createFileURL(file, thumb = null) {
        let {
            path,
            size
        } = thumb ? kiss.tools.getThumbnail(file, thumb) : file

        path = path.replaceAll("\\", "/")

        if (
            Array.isArray(file.accessReaders) &&
            file.accessReaders.includes("$authenticated") &&
            !file.accessReaders.includes("*")
        ) {
            // The file is private
            return `/file?path=${encodeURIComponent(path)}&mimeType=${encodeURIComponent(file.mimeType)}&size=${size}`
        } else {
            // The file is public
            return (path.match(/^uploads\//) || path.match(/^file\//)) ? `/${path}` : path
        }
    },

    /**
     * Given some text content, generates a download window for this content
     * 
     * @param {string} config.content 
     * @param {string} [config.mimeType] - Defaults to "application/json"
     * @param {string} [config.title] - Defaults to "Download"
     * @param {string} [config.filename] - Defaults to "file.json"
     */
    downloadFile(config) {
        const blob = new Blob([config.content], {
            type: config.mimeType || "application/json"
        })
        const url = URL.createObjectURL(blob)
        const message =
            /*html*/`<center>
                        ${txtTitleCase("#click to download")}
                        <a href="${url}" download="${config.filename || "file.json"}">
                            ${txtTitleCase("download file")}
                        </a>
                    </center>`

        createDialog({
            type: "message",
            title: config.title || "Download file",
            message,
            buttonOKText: txtTitleCase("validate"),
            noOK: true
        })            
    },

    /**
     * Async function that waits for an Element to be rendered in the DOM
     * 
     * @param {string} selector - The selector
     * @returns {HTMLElement} The found element
     * 
     * @example
     * kiss.tools.waitForElement("#my-element-id").then(() => doSomething())
     */
    async waitForElement(selector) {
        function rafAsync() {
            return new Promise(resolve => {
                requestAnimationFrame(resolve)
            })
        }

        let retry = 0

        while ((document.body.querySelector(selector) === null) && (retry < 20)) {
            await rafAsync()
            retry++
        }
        return document.body.querySelector(selector)
    },

    /**
     * Check whether an event occurred inside an element
     * 
     * @param {Event} event - Event to check
     * @param {Node} element - Element to check
     * @param {number} delta - Tolerance in pixels
     */
    isEventInElement(event, element, delta = 0) {
        const rect = element.getBoundingClientRect()

        const x = event.clientX
        if (x < (rect.left - delta) || x >= (rect.right + delta)) return false

        const y = event.clientY
        if (y < (rect.top - delta) || y >= (rect.bottom + delta)) return false

        return true
    },

    /**
     * Move an element inside the viewport
     * 
     * It's useful to recenter an element like a dropdown list or a menu when it's not completely visible inside the viewport
     * 
     * @param {HTMLElement} element - The element to move
     * @returns {HTMLElement} element
     */
    moveToViewport(element) {
        const horizontalDiff = kiss.screen.current.width - (element.offsetLeft + element.clientWidth)
        const verticalDiff = kiss.screen.current.height - (element.offsetTop + element.clientHeight)

        if (horizontalDiff < 0) element.style.left = Math.max(10, element.offsetLeft + horizontalDiff - 10) + "px"
        if (verticalDiff < 0) element.style.top = Math.max(10, element.offsetTop + verticalDiff - 10) + "px"

        return element
    },

    /**
     * Close all the panels and menus at once, except the login window
     * 
     * @param {string[]} [exceptions] - Don't close winddows which id is in the list of exceptions
     */
    closeAllWindows(exceptions = []) {
        Array.from(document.querySelectorAll(".a-panel"))
            .filter(panel => !exceptions.includes(panel.id))
            .forEach(panel => panel.close(true))
        document.querySelectorAll(".a-menu").forEach(panel => panel.close(true))
    },

    /**
     * Benchmark the creation of Fields
     * 
     * @param {integer} numberOfFields - The number of fields to insert in the DOM
     * @param {string} [fieldType] - The field type: "string" | "number" | "date" | "textarea"...
     * @param {string} [targetDomElementId] - The id of the node where the components must be inserted
     * @returns {integer} The number of milliseconds taken
     */
    benchmark(numberOfFields, fieldType, targetDomElementId) {
        kiss.tools.timer.start()

        // Build a dummy field config
        const setConfig = function (i) {
            return {
                id: "cmp-" + i,
                type: fieldType || "text",
                target: targetDomElementId || null,
                display: "inline-block",
                placeholder: "Enter a value... (" + i.toString() + ")",
                label: "Label nr " + i.toString() + " : ",
                labelPosition: "top",
                height: "32px",
                width: "200px",
                margin: "10px",
                labelWidth: "200px",
                events: {
                    onchange: function (event) {
                        publish("EVT_BENCH_UPDATE_FIELD", {
                            fieldId: this.id,
                            value: event.target.value
                        })
                    }
                },
                subscriptions: {
                    EVT_BENCH_UPDATE_FIELD: function (msgData) {
                        if (msgData.fieldId != ("cmp-" + i)) $("cmp-" + i).setValue(msgData.value)
                    }
                }
            }
        }

        for (let i = 0; i < numberOfFields; i++) {
            createField(setConfig(i)).render()
        }

        kiss.tools.timer.show("Components built!")
    },

    /**
     * Convert a flat array of objects into a tree structure
     * 
     * @param {object[]} list - The flat array to transform into a tree structure
     * @param {string} idAttr - Name of the id attribute
     * @param {string} parentAttr - Name of the parent attribute
     * @param {string} childrenAttr - Name of the children attribute
     * @returns {object} The tree structure
     * 
     * @example
     * flat input:  [ { id: "123", parent: "456" }, { id: "456", parent: "" } ]
     * tree output: [ { id: "456", parent: "", children: [ { id: "123", parent: "456" } ] } ]
     */
    treeify(list, idAttr = "id", parentAttr = "parent", childrenAttr = "children") {
        let treeList = []
        let lookup = {}

        list.forEach(function (obj) {
            lookup[obj[idAttr]] = obj
            obj[childrenAttr] = []
        })

        list.forEach(function (obj) {
            if ((obj[parentAttr] != null) && (obj[parentAttr] != "")) {
                lookup[obj[parentAttr]][childrenAttr].push(obj)
            } else {
                treeList.push(obj)
            }
        })
        return treeList
    },

    /**
     * Adjust the luminance of an RGB color and output a new RGB
     * 
     * @param {string} hex - Color in hexa RGB: #00aaee
     * @param {number} lum - luminance adjustment, from -1 to 1
     * @returns {string} - The output color in hexa RGB
     * 
     * @example
     * kiss.tools.adjustColor("#69c", 0)        // returns "#6699cc"
     * kiss.tools.adjustColor("6699CC", 0.2)    // "#7ab8f5" - 20% lighter
     * kiss.tools.adjustColor("69C", -0.5)      // "#334d66" - 50% darker
     * kiss.tools.adjustColor("000", 1)         // "#000000" - true black cannot be made lighter
     */
    adjustColor(hex, lum) {
        // Validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '')
        if (hex.length < 6) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
        }
        lum = lum || 0

        // Convert to decimal and change luminance
        let rgb = "#",
            c, i;

        for (let i = 0; i < 3; i++) {
            c = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16)
            rgb += ("00" + c).substring(c.length)
        }

        return rgb
    },

    /**
     * Generate a CSS gradient (for backgrounds)
     * 
     * @param {string} hexColor - Color in hexa RGB: #00aaee
     * @param {number} angle - Gradient orientation in degrees (0-360)
     * @param {number} lum - luminance adjustment, from -1 to 1
     * @returns {string} - The CSS gradient
     * 
     * @example
     * kiss.tools.CSSGradient("#6699cc", 90, -0.5) // returns "linear-gradient(90deg, #6699cc 0%, #334d66 100%)"
     */    
    CSSGradient(hexColor, angle = 90, lum = -0.2) {
        const secondaryColor = kiss.tools.adjustColor(hexColor, lum)
        return `linear-gradient(${angle}deg, ${hexColor} 0%, ${secondaryColor}  100%)`
    },

    /**
     * Get a random color from the global palette
     * 
     * @param {number} [fromColorIndex] - Restrict the palette from this color index
     * @param {number} [toColorIndex] - Restrict the palette up to this color index
     * @returns {string} A random color in hexa RGG. Ex: "#00aaee"
     */
    getRandomColor(fromColorIndex = 0, toColorIndex) {
        const randomIndex = fromColorIndex + Math.round(Math.random() * ((toColorIndex - fromColorIndex) || kiss.global.palette.length))
        return "#" + kiss.global.palette[randomIndex]
    },

    /**
     * Return the icon and color of a file type
     * 
     * @param {string} fileType 
     * @returns {object} The icon and color for the file type
     * 
     * @example
     * kiss.tools.fileToIcon("xls") // => {icon: "fas fa-file-excel", color: "#09c60B"}
     */
    fileToIcon(fileType) {
        const associations = [
            // Images
            {
                extensions: ["jpg", "jpeg", "png", "gif", "webp", "psd"],
                icon: "fas fa-file",
                color: "#000000"
            },
            // Word-like
            {
                extensions: ["doc", "docx", "odt"],
                icon: "fas fa-file-word",
                color: "#00aaee"
            },
            // Excel-like
            {
                extensions: ["csv", "xls", "xlsx", "ods"],
                icon: "fas fa-file-excel",
                color: "#09c60B"
            },
            // Powerpoint-like
            {
                extensions: ["ppt", "pptx", "odp"],
                icon: "fas fa-file-powerpoint",
                color: "#ba6044"
            },
            // Acrobat
            {
                extensions: ["pdf"],
                icon: "fas fa-file-pdf",
                color: "#dd0000"
            },
            // Web code
            {
                extensions: ["html", "css", "js", "jsx"],
                icon: "fas fa-file-code",
                color: "#5fabbb"
            }
        ]

        for (let association of associations) {
            if (association.extensions.indexOf(fileType) != -1) return {
                icon: association.icon,
                color: association.color
            }
        }

        // Default
        return {
            icon: "fas fa-file-alt",
            color: "#556677"
        }
    },

    /**
     * Return the same object with only the properties which type is:
     * - string
     * - number
     * - boolean
     * - Array
     * 
     * @param {object} object - Object to convert
     * @returns {object} The converted object
     */
    snapshot(object) {
        let snapshot = {}
        Object.keys(object).forEach(key => {
            const type = typeof object[key]
            const safeKey = (key.startsWith("$")) ? key.substring(1) : key
            if (type == "string" || type == "number" || type == "boolean" || Array.isArray(object[key])) snapshot[safeKey] = object[key]
        })
        return snapshot
    },

    /**
     * 
     * A simple benchmarking tool.
     * 
     * @property {Date} timer.time - The current status in milliseconds
     * @method {function} timer.start - Init the timer
     * @method {function} timer.show - Show the timer status
     * 
     * @example
     * kiss.tools.timer.start()
     * kiss.tools.timer.show("Component rendered!")
     * 
     */
    timer: {
        time: new Date(),
        current: 0,

        /**
         * Start the timer
         * @param {string} msg - The message to display at initialization
         */
        start(msg) {
            kiss.tools.timer.time = performance.now()
            if (msg) console.log(msg)
        },

        /**
         * Show the timer status
         * @param {string} msg - The message to display when reporting
         */
        show(msg) {
            // setTimeout puts the code at the end of the browser's event queue, which ensures that DOM is fully rendered
            setTimeout(function () {
                kiss.tools.timer.current = performance.now() - kiss.tools.timer.time
                //log((kiss.tools.timer.current).toString() + "ms" + ((!msg) ? "" : (" - " + msg)), 1)
                console.log(`${msg || ""} - ${kiss.tools.timer.current + " ms"}`)
            }, 0)
        }
    },

    /**
     * Get an approximate geolocation from the IP address
     * 
     * @async
     * @returns {object} Geolocation: {latitude: X, longitude: Y}
     */
    async getGeolocationByIP() {
        const response = await fetch('https://ipapi.co/json/')
        if (!response.ok) {
            throw new Error("Impossible to get the geolocation from the IP address")
        }
        const data = await response.json()
        return {
            latitude: data.latitude,
            longitude: data.longitude
        };
    },

    /**
     * Get the current geolocation.
     * Try with the native browser geolocation, and if not available, use an external service
     * to get an approximate location from the IP address.
     * 
     * @async
     * @returns {object} Geolocation: {latitude: X, longitude: Y}
     */
    async getGeolocation() {
        return new Promise(async (resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const latitude = position.coords.latitude
                        const longitude = position.coords.longitude
                        resolve({
                            latitude,
                            longitude
                        })
                    },
                    error => {
                        kiss.tools.getGeolocationByIP()
                            .then(geolocation => {
                                resolve(geolocation)
                            })
                            .catch(error => {
                                reject(error)
                            })
                    }
                )
            } else {
                kiss.tools.getGeolocationByIP()
                    .then(geolocation => {
                        resolve(geolocation)
                    })
                    .catch(error => {
                        reject(error)
                    })
            }
        })
    },

    /**
     * Check if the page is visited by a mobile device
     * 
     * @returns {boolean}
     */
    isMobile() {
        const agent = navigator.userAgent
        const mobiles = ["Android", "iPhone", "Windows Phone", "iPod"]
      
        for (let mobile of mobiles) {
            if (agent.indexOf(mobile) !== -1) {
                return true
            }
        }
        return false
    },

    /**
     * Outline all DOM elements in the page, mainly to debug the layout
     * 
     * @param {boolean} state - true to display, false to hide
     */
    outlineDOM(state) {
        [].forEach.call($$("*"),function(a){a.style.outline=`${(state) ? "1" : "0"}px solid #`+(~~(Math.random()*(1<<24))).toString(16)})
    },

    /**
     * Highlight an element buy building an overlay around it and a legend under it.
     * 
     * @param {string} element - HTMLElement to highlight
     * @param {string} text - The legend
     */
    highlight(element, text) {
        const elementRect = element.getBoundingClientRect()
        const overlay = document.createElement("div")
        overlay.style.position = "fixed"
        overlay.style.top = 0
        overlay.style.left = 0
        overlay.style.width = "100vw"
        overlay.style.height = "100vh"
        overlay.style.zIndex = 9999

        const rects = [
            {
                top: 0,
                left: 0,
                width: "100vw",
                height: elementRect.top + "px"
            },
            {
                top: elementRect.top + "px",
                left: 0,
                width: elementRect.left + "px",
                height: elementRect.height + "px"
            },
            {
                top: elementRect.top + "px",
                left: elementRect.right + "px",
                width: "calc(100vw - " + elementRect.right + "px)",
                height: elementRect.height + "px"
            },
            {
                top: elementRect.bottom + "px",
                left: 0,
                width: "100vw",
                height: "calc(100vh - " + elementRect.bottom + "px)"
            }
        ]
            
        rects.forEach((rect, index) => {
            const div = document.createElement("div")
            div.style.top = rect.top
            div.style.left = rect.left
            div.style.width = rect.width
            div.style.height = rect.height
            div.classList.add("highlight-overlay")

            if (index === 3) {
                const arrow = document.createElement("div")
                arrow.style.left = elementRect.left + elementRect.width / 2 - 15 + "px"
                arrow.classList.add("highlight-arrow")
                div.appendChild(arrow)
            
                const label = document.createElement("div")
                label.style.left = (elementRect.left + elementRect.width / 2 - 150) + "px"
                label.innerHTML = text
                label.classList.add("highlight-label")
                div.appendChild(label)
            }
            overlay.appendChild(div)
        })

        document.body.appendChild(overlay)
        overlay.onclick = () => {
            overlay.remove()
            kiss.pubsub.publish("EVT_NEXT_TIP")
        }
    },

    /**
     * Highlight a sequence of elements.
     * Useful to create a quick tutorial.
     * 
     * @param {object[]} elements - Array of elements to highlight sequentially, and corresponding legend
     * @param {function} callback - Function executed when the list of elements to highlight is done
     * 
     * @example
     * kiss.tools.highlightElements([
     *  {
     *      element: document.querySelector("#A"),
     *      text: "Help for element A"
     *  },
     *  {
     *      element: document.querySelector("#B"),
     *      text: "Help for element B"
     *  }
     * ])
     */
    highlightElements(elements, callback) {
        const tip = elements.shift()
        kiss.tools.highlight(tip.element, tip.text.replaceAll("\n", "<br>"))
        
        const subscriptionId = kiss.pubsub.subscribe("EVT_NEXT_TIP", () => {
            if (elements.length == 0) {
                kiss.pubsub.unsubscribe(subscriptionId)
                if (callback) callback()
            }
            else {
                const tip = elements.shift()
                kiss.tools.highlight(tip.element, tip.text)
            }
        })
    },

    /**
     * Animate an element with a sequence of animations
     * 
     * @param {string} id - The id of the element to animate
     * @param {string} animation - The animation name to apply (check Component available animations)
     * @param {number} delay - The delay between each animation, in milliseconds
     * @returns {number} The interval id
     */
    animateElement(id, animation, delay) {
        return setInterval(() => {
            const element = $(id)
            if (!element) return
            element.setAnimation(animation)
        }, delay)
    },

    /**
     * Message display when a KissJS feature is not available in the current context
     * 
     * @private
     * @ignore
     * @param {string} title 
     * @param {string} message 
     */
    featureNotAvailable(title, message) {
        if (!title) title = (kiss.global.mode == "demo") ? "demo" : "offline"
        if (!message) message = (kiss.global.mode == "demo") ? "#not available in demo" : "#not available offline"

        createDialog({
            title: txtTitleCase(title),
            message: txtTitleCase(message),
            icon: "fas fa-exclamation-triangle",
            noCancel: true
        })
    },

    /**
     * Show the list of formulae available for computed fields, inside a selectable textarea.
     * Just used to build the Markdown documentation that feeds our AI assistant :)
     */
    showFormulae() {
        const formulae = Object.keys(kiss.formula).filter(formula => formula.includes("HELP")).map(key => kiss.formula[key]).join("\n\n")
        createPanel({
            modal: true,
            closable: true,
            width: () => kiss.screen.current.width - 20,
            height: () => kiss.screen.current.height - 20,
            align: "center",
            verticalAlign: "center",
            layout: "vertical",
            items: [{
                id: "formulae",
                type: "textarea",
                width: "100%",
                fieldWidth: "100%",
                height: "100%",
                value: formulae
            }, {
                type: "button",
                text: "Copy to clipboard",
                action: () => {
                    kiss.tools.copyTextToClipboard($("formulae").getValue())
                    createNotification("Copied to clipboard")
                }
            }]
        }).render()
    }    
}

// Shorthands
const {
    $,
    uid
} = kiss.tools

;