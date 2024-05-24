/**
 * 
 * ## Simple tools shared between client and server
 * 
 */
kiss.addToModule("tools", {
    /**
     * Short ID generator
     * 
     * Use carefully: because of the use of Math.random, the collision risk is high compared to uid().
     * It should be used only on small set of independant objects (for example: field names in a form)
     * 
     * @ignore
     * @param {integer} [size] - Desired size for the uid. Default to 8.
     * @returns {string}
     */
    shortUid(size = 8) {
        size--
        const alphabet = "aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ0123456789"
        let id = alphabet[(Math.random() * 52) | 0] // Can't start with a number
        while (size--) id += alphabet[(Math.random() * 62) | 0]
        return id
    },

    /**
     * Shorter non-RFC4122 GUID generator
     * 
     * @ignore
     * @param {number} t - Id length. Defaults to 21 to have a collision risk similar to uid()
     * @returns {string}
     */
    nanoId(t = 21) {
        return crypto.getRandomValues(new Uint8Array(t)).reduce(((t, e) => t += (e &= 63) < 36 ? e.toString(36) : e < 62 ? (e - 26).toString(36).toUpperCase() : e < 63 ? "_" : "-"), "")
    },

    /**
     * Check if a string matches RFC4122 format
     * 
     * @ignore
     * @param {string} str
     * @returns {boolean}
     */
    isUid(str) {
        const RFC4122 = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/;
        if (str.match(RFC4122)) return true
        return false
    },

    /**
     * Check if a model is a pre-defined static model or a custom model generated from the free api.
     * Custom models have their name starting with "plugin" or following the RFC4122 id format.
     * 
     * @ignore
     * @param {string} modelId 
     * @returns {bollean}
     */
    isCustomModel(modelId) {
        if (kiss.tools.isUid(modelId)) return true
        return false
    },

    /**
     * Check if a model has "Audit trail" feature enabled.
     * 
     * @ignore
     * @param {string} modelId 
     * @returns {boolean}
     */
    hasAuditTrail(modelId) {
        const model = kiss.app.models[modelId]
        
        if (!model.features) return false
        if (!model.features["form-feature-audit"]) return false
        if (model.features["form-feature-audit"].active == true) return true
        return false
    },

    /**
     * Check if a model's field is numeric.
     * A field is numeric if:
     * - its type is numeric
     * - it's a lookup or summary field that points to a numeric field
     * 
     * @ignore
     * @param {object} field - Model's field
     * @returns {boolean}
     */
    isNumericField(field) {
        const fieldType = field.type
        return  ["number", "rating", "slider"].includes(fieldType)
        || (fieldType == "lookup" && field.lookup.type == "number")
        || (fieldType == "summary" && field.summary.type == "number")
    },

    /**
     * Check if a variable is a number
     * 
     * @ignore
     * @param {number} n 
     * @returns {boolean} true if the variable is a number
     */
    isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n)
    },

    /**
     * Check if a text is an ISO date
     * 
     * @ignore
     * @param {string} text
     * @param {boolean} [dateOnly] - If true, check only the date part
     * @returns {boolean} true if the variable is an ISO date
     */
    isISODate(text, dateOnly = false) {
        const isoRegex = (dateOnly) ? /^\d{4}-\d{2}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
        return isoRegex.test(text)
    },

    /**
     * Check if 2 arrays intersect
     * 
     * @ignore
     * @param {array} array1 
     * @param {array} array2 
     * @returns {boolean}
     */
    intersects(array1, array2) {
        const intersection = kiss.tools.intersection(array1, array2)
        return (intersection.length > 0)
    },

    /**
     * Returns the intersection of 2 arrays
     * 
     * @ignore
     * @param {array} array1 
     * @param {array} array2 
     * @returns {array}
     */
    intersection(array1, array2) {
        if (!array1 || !array2) return []
        return array1.filter(item => array2.includes(item))
    },

    /**
     * Calculate the number of days between 2 dates
     * 
     * @ignore
     * @param {date} dateA
     * @param {date} dateB
     */
    daysBetweenDates(dateA, dateB) {
        const timeDifference = Math.abs(dateA.getTime() - dateB.getTime())
        return Math.floor(timeDifference / (3600 * 24 * 1000))
    },

    /**
     * Parse a text and find all the tags within double curly brackets
     * 
     * @ignore
     * @param {string} sourceText - The text to parse
     * @returns {string[]} - Array of tags found in the source text
     * 
     * @example
     * kiss.tools.findTags(" {{A}} * 2 + {{B}} * 3 + {{C}} * 4 ") // ["A", "B", "C"]
     */
    findTags(sourceText) {
        let regex = new RegExp("{{(.*?)}}", "g")
        let text, tags = []
        while (text = regex.exec(sourceText)) tags.push(text[0].substring(2, text[0].length - 2))
        return tags.unique()
    },

    /**
     * Get the current time
     * 
     * @ignore
     * @param {boolean} displaySseconds - true to display the seconds
     * @returns {string} ISO time
     * 
     * @example
     * kiss.tools.getTime() // 15:28
     * kiss.tools.getTime(true) // 15:28:33
     */
    getTime(displaySseconds) {
        const now = new Date()
        const hours = now.getHours().pad(2)
        const minutes = now.getMinutes().pad(2)
        const seconds = now.getSeconds().pad(2)
        return hours + ":" + minutes + ((displaySseconds) ? ":" + seconds : "")
    },

    /**
     * Wrap the setTimout function into a Promise
     * 
     * @ignore
     * @param {integer} [ms] - The number of milliseconds to wait before resolving
     * @returns {function} The promise to execute a function after a given delay
     * 
     * @example
     * kiss.tools.wait(2 * 1000).then(() => console.log("Hello!"))
     */
    wait(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms))
    },

    /**
     * Throttle a function so that it can't be executed too many times per second
     * 
     * @ignore
     * @param {number} delay - In milliseconds
     * @param {function} fn - The function to throttle
     * @returns The throttled function
     */
    throttle(delay, fn) {
        let lastCall = 0
        return function (...args) {
            const now = (new Date).getTime()
            if (now - lastCall < delay) return
            lastCall = now
            return fn(...args)
        }
    },

    /**
     * Memoization helper to cache the result of expensive functions that are called multiple times
     * 
     * Return the value if it exists in the cache
     * otherwise, compute the input with the passed in function,
     * update the collection object with the input as the key,
     * and compute result as the value to that key
     * End result will be key-value pairs stored inside cache
     * 
     * @ignore
     * @param (function) func - Function to memoize
     * @returns {*} The result of the passed function, whatever it is
     * 
     * @example
     * kiss.tools.memoize((a) => 2 * a)
     */
    memoize(func) {
        const cache = {}
        return (input) => {
            log("MEMOIZED:" + input)
            if (cache[input]) log("!MEMOIZED: sent cached result!")
            return cache[input] || (cache[input] = func(input))
        }
    },


    /**
     * Compute the distance in km between 2 geolocation points using Haversine formula
     * 
     * @ignore
     * @param {number} lat1 
     * @param {number} lon1 
     * @param {number} lat2 
     * @param {number} lon2 
     * @returns {number} Distance in km
     */
    distanceInKm(lat1, lon1, lat2, lon2) {
        const earthRadius = 6371
        const dLat = kiss.tools.degToRad(lat2 - lat1)
        const dLon = kiss.tools.degToRad(lon2 - lon1)

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(kiss.tools.degToRad(lat1)) * Math.cos(kiss.tools.degToRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = earthRadius * c
        return distance
    },

    /**
     * Convert degrees to radians
     * 
     * @ignore
     * @param {number} degrees 
     * @returns {number} radians
     */
    degToRad(degrees) {
        return degrees * Math.PI / 180
    },

    /**
     * Check if 2 geolocation points are in a given range of kilometers
     * 
     * @ignore
     * @param {object} geolocationA - Example {latitude: X, longitude: Y}
     * @param {object} geolocationB 
     * @param {number} rangeInKm
     * @returns {boolean} true if the 2 geolocations are in the given range of kilometers
     */
    isInRange(geolocationA, geolocationB, rangeInKm) {
        const distance = kiss.tools.distanceInKm(geolocationA.latitude, geolocationA.longitude, geolocationB.latitude, geolocationB.longitude)
        return distance <= rangeInKm
    },

    /**
     * Valie a field value against validation rules
     * 
     * @ignore
     * @param {object} config 
     * @param {*} value 
     * @returns {boolean}
     */
    validateValue(dataType, config, value) {
        // Skip validation if field is readOnly
        if (config.readOnly) return true

        // Required
        if (config.required && (value == "" || value == undefined)) return false
        if (dataType == "rating" && config.required && value === 0) return false

        // Don't try to validate empty fields if they are not required
        if (value == "") return true

        switch (dataType) {
            case "text":
            case "textarea":
            case "password":
                return kiss.tools.validateText(config, value)

            case "number":
                return kiss.tools.validateNumber(config, value)
        }

        // All validation rules passed
        return true
    },

    /**
     * Validate a number field value against validation rules
     * 
     * @ignore
     * @param {object} config
     * @param {number} [config.min]
     * @param {number} [config.max]
     * @param {number} [config.precision]
     * @param {*} value 
     * @returns {boolean}
     */
    validateNumber(config, value) {
        value = Number(value)
        if (
            (
                config.hasOwnProperty("min") &&
                (config.min !== undefined) &&
                (config.min !== 0) &&
                (value < config.min)
            ) ||
            (
                config.hasOwnProperty("max") &&
                (config.max !== undefined) &&
                (config.max !== 0) &&
                (value > config.max)
            )
        ) {
            return false
        }

        if (config.precision == 0 && !Number.isInteger(value)) {
            return false
        }

        return true
    },

    /**
     * Valite a text field value against validation rules
     * 
     * @ignore
     * @param {object} config 
     * @param {number} [config.minLength]
     * @param {number} [config.maxLength]
     * @param {string} [config.validationType] - alpha|alphanumeric|email|url|ip|regex
     * @param {string} [config.validationRegex] - if validation type = "regex"
     * @param {*} value
     * @returns {boolean}
     */
    validateText(config, value) {
        // Text length
        if (kiss.tools.validateTextLength(config, value) == false) return false

        // Regex
        let regex
        switch (config.validationType) {
            case "alpha":
                if (!value.match(kiss.tools.regex.alpha)) return false
                break
            case "alphanumeric":
                if (!value.match(kiss.tools.regex.alphanumeric)) return false
                break
            case "email":
                if (!value.match(kiss.tools.regex.email)) return false
                break
            case "url":
                if (!value.match(kiss.tools.regex.url)) return false
                break
            case "ip":
                if (!value.match(kiss.tools.regex.ip)) return false
                break
            case "regex":
                console.log("The field has to pass the regex: " + regex)
                if (!config.validationRegex) return true
                if (!value.match(config.validationRegex)) return false
        }

        // Excludes HTML
        if (value.containsHTML()) return false

        // All validation rules passed
        return true
    },

    /**
     * Valite text field length against validation rules
     * 
     * @ignore
     * @param {object} config 
     * @param {number} [config.minLength]
     * @param {number} [config.maxLength]
     * @param {*} value
     * @returns {boolean}
     */
    validateTextLength(config, value) {
        if (
            (
                config.hasOwnProperty("minLength") &&
                (value.length < config.minLength)
            ) ||
            (
                config.hasOwnProperty("maxLength") &&
                (config.maxLength > 0) &&
                (value.length > config.maxLength)
            )
        ) {
            return false
        }

        return true
    },

    /**
     * Define regex for common fields validation
     * 
     * @ignore
     */
    regex: {
        alpha: new RegExp(`^[a-zA-Z_]+$`),
        alphanumeric: new RegExp(`^[a-zA-Z0-9]([a-zA-Z0-9_])+$`),
        email: new RegExp(`\\S+@\\S+\\.\\S+`),
        url: new RegExp(`^(http(s?):\\/)?\\/(.)+$`),
        ip: new RegExp(`^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$`)
    },

    /**
     * Generates a slug from a plain title
     * 
     * @ignore
     * @param {string} text 
     * @returns {string} The generated slug
     * 
     * @example
     * kiss.tools.generateSlug("My article about dogs") // Returns "my-article-about-dogs"
     */
    generateSlug(text) {
        return text.toString().toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9\-]/g, "")
            .replace(/\-\-+/g, "-")
            .replace(/^-+/, "")
            .replace(/-+$/, "");
    },

    /**
     * Generates an SEO friendly breadcrumb from a list of links
     * 
     * @ignore
     * @param {object[]} items - Each breadcrumb item should be a object like: {label: "Home", url: "https://domain/home"}
     */
    generateBreadcrumb(items) {
        let breadcrumb = '<nav aria-label="breadcrumb"><div itemscope="itemscope" itemtype="http://schema.org/BreadcrumbList" class="breadcrumb"><div class="container">'
        for (let i = 0; i < items.length; i++) {
            let item = items[i]
            let li = `<span itemprop="itemListElement" itemscope="itemscope" itemtype="http://schema.org/ListItem" class="breadcrumb-item${i === items.length - 1 ? ' active' : ''}">`
            if (item.url) {
                li += `<a href="${item.url}" itemprop="item"><span itemprop="name">${item.label}</span> <meta itemprop="position" content="${i + 1}"></a>`
            } else {
                li += `<span itemprop="name">${item.label}</span> <meta itemprop="position" content="${i + 1}">`
            }
            li += '</span>'
            breadcrumb += li
        }
        breadcrumb += '</div></div></nav>'
    }
})


;