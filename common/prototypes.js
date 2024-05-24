/**
 * 
 * #Prototypes extensions
 * (aka brute force monkey patching)
 * 
 * Careful with this: for some cases, I found it more convenient to extend the prototypes directly,
 * but it could break compatibility with other frameworks / libraries.
 * 
 */

/**
 * Check if a string contains HTML
 * 
 * @returns {boolean}
 */
String.prototype.containsHTML = function () {
    if (this.valueOf() === "<>") return false
    const regex = /<(?:.|\n)*?>/gm;
    return regex.test(this)
}

/**
 * Escape html chars to prenvent display problems when inserting dynamic page content
 * 
 * @returns {string} Escaped string
 */
String.prototype.escapeHtml = function () {
    return this.replace(/&/g, "&#38;")
        .replace(/"/g, "&#34;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&#60;")
}

/**
 * Check is a string contains only safe caracters
 * 
 * @returns {boolean}
 */
String.prototype.isSafe = function () {
    return /^[^<>]*$/.test(this) || /[\w\>\<]|[\d\>\<]|[\p{P}&&[^\>\<]]/.test(this)
}

/**
 * Reduce every extra spaces to a single space character
 * 
 * @returns {string} The string without extra space
 */
String.prototype.removeExtraSpaces = function () {
    return this.replace(/\s+/g, ' ')
}

/**
 * Capitilize the first letter
 * 
 * @returns {string} The string
 * 
 * @example
 * "employee".toTitleCase() // "Employee"
 */
String.prototype.toTitleCase = function () {
    return this.charAt(0).toUpperCase() + this.substring(1)
}

/**
 * Check if the string can be converted to a number
 * 
 * @returns {boolean}
 */
String.prototype.isNumeric = function () {
    return !isNaN(parseFloat(this)) && isFinite(this)
}

/**
 * Return a hash code of the string
 * 
 * @returns {integer} 32bits signed integer
 * 
 * @example
 * "hello".hashCode() // 99162322
 * "seriously?".hashCode() // -188581074
 */
String.prototype.hashCode = function () {
    let hash = 0
    let chr
    if (this.length === 0) return hash

    for (let i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i)
        hash = hash * 31 + chr
        hash |= 0 // Convert to 32bit integer
    }
    return hash
}

/**
 * Return the right part of a string, given a substring within the string
 * 
 * @param {string} substring 
 * @returns {string} The right part of the string
 */
String.prototype.rightString = function (substring) {
    let index = this.indexOf(substring)
    return index === -1 ? "" : this.slice(index + substring.length)
}

/**
 * Return the left part of a string, given a substring within the string
 * 
 * @param {string} substring 
 * @returns {string} The left part of the string
 */
String.prototype.leftString = function (substring) {
    let index = this.indexOf(substring)
    return index === -1 ? "" : this.slice(0, index)
}

/**
 * Return a Date in ISO format: YYYY-MM-DD
 * 
 * @returns {string} Date in ISO string format
 */
Date.prototype.toISO = function () {
    //return this.getFullYear().toString() + "-" + (this.getMonth() + 1).toString().padStart(2, 0) + "-" + this.getDate().toString().padStart(2, 0)
    return this.toISOString().split("T")[0]
}

/**
 * Return a Date/Time in ISO format: YYYY-MM-DD HH:MM:SS
 * 
 * @returns {string} Date and time in ISO string format
 */
Date.prototype.toISODateTime = function () {
    return this.toISO() + " " + this.toLocaleTimeString()
}

/**
 * Add N days to a date
 * 
 * @param {number} days 
 * @returns {date} The new date
 */
Date.prototype.addDays = function (days) {
    let date = new Date(this.valueOf())
    date.setDate(date.getDate() + days)
    return date
}

/**
 * Returns a rounded number
 * 
 * @param {number} precision
 * @returns The rounded number
 * 
 * @example
 * const floatingNumber = 123.456789
 * console.log(floatingNumber.round(2)) // => 123.46
 */
Number.prototype.round = function (precision) {
    return +(Math.round(this + "e+" + precision) + "e-" + precision)
}

/**
 * Return a formatted file size
 * 
 * @returns {string} File size
 * 
 * @example
 * (63).toFileSize() // => 63 B
 * (1024).toFileSize() // => 1 kB
 * (1048576).toFileSize() // => 1 MB
 */
Number.prototype.toFileSize = function () {
    // MB
    let fileSizeMb = Math.round(this / 1024 / 1024)
    if (fileSizeMb > 0) return fileSizeMb + " MB"

    // kB
    let fileSizeKb = Math.round(this / 1024)
    if (fileSizeKb > 0) return fileSizeKb + " kB"

    // B
    return this + " B"
}

/**
 * Formats a number as a string with a fixed number of digits.
 * Use it for display purpose only (not for calculations)
 * 
 * @param {number} precision
 * @returns {string}
 * 
 * @example
 * const floatingNumber = 123.4
 * console.log(floatingNumber.format(3)) // => "123.400"
 */
Number.prototype.format = function (precision) {
    return this.toLocaleString(undefined, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
    })
}

/**
 * Formats a number as a string with a fixed number of characters, leading zeros.
 * Use it for display purpose only (not for calculations)
 * 
 * @param {number} width
 * @returns {string}
 * 
 * @example
 * const myNumber = 9
 * console.log(myNumber.pad(4)) // => "0009"
 */
Number.prototype.pad = function (width) {
    if (typeof width !== "number") return this
    return String(this).padStart(width, "0")
}

/**
 * Swap 2 elements of an array
 * 
 * @param {number} idx1 
 * @param {number} idx2 
 * @returns {array} The array with swapped items
 */
Array.prototype.swap = function (idx1, idx2) {
    const tmp = this[idx1]
    this[idx1] = this[idx2]
    this[idx2] = tmp
    return this
}

/**
 * Array.unique
 * 
 * Remove all the duplicate elements.
 * Note it only works for primitives types: undefined, null, boolean, string and number
 * 
 * @returns {array} The array without duplicates
 */
Array.prototype.unique = function () {
    // Most elegant solution which unfortunately only works with primitive types:
    //return [...new Set[this]]

    // Brute force implementation
    let arr = []
    for (let i = 0; i < this.length; i++) {
        if (!arr.includes(this[i])) arr.push(this[i])
    }
    return arr
}

/**
 * Array.uniqueObjectId
 * 
 * In an array of objects, remove all the objects with a duplicate id.
 * 
 * @returns {object[]} The array without duplicates
 */
Array.prototype.uniqueObjectId = function () {
    const ids = this.map(o => o.id)
    return this.filter(({
        id
    }, index) => !ids.includes(id, index + 1))
}

/**
 * Array.uniqueObject
 * 
 * In an array of objects, remove all the objects with a duplicate property.
 * 
 * @param {string} propertyName - Name of the property used as reference to check if the object is a duplicate entry
 * @returns {object[]} The array without duplicates
 */
Array.prototype.uniqueObject = function (propertyName) {
    return this.filter((item, index, self) =>
        index === self.findIndex((element) => (
            element[propertyName] === item[propertyName]
        ))
    )
}

/**
 * Return the intersection of 2 arrays
 * 
 * @param {Array} otherArray 
 * @returns {Array} The items in common with the 2 arrays
 */
Array.prototype.intersect = function (otherArray) {
    return this.filter(item => otherArray.includes(item))
}

/**
 * Array.remove
 * 
 * Remove a specific item
 * @returns {array} The new array
 */
Array.prototype.remove = function (item) {
    let index = this.indexOf(item)
    if (index != -1) this.splice(index, 1)
    return this
}

/**
 * Array.get
 * 
 * In an array of objects that have an id, return the object with the resquested id
 * 
 * @param {string} itemId - Id of the item to retrieve
 * @returns {*} - The found object, or undefined if not found
 */
Array.prototype.get = function (itemId) {
    return this.find(item => item.id === itemId)
}

/**
 * Array.sortBy
 * 
 * In an array of objects, return the array sorted by property name
 * 
 * @param {string} propertyName - Id of the item to retrieve
 * @returns {object[]} - The sorted array
 */
Array.prototype.sortBy = function (propertyName) {
    return this.sort(function (a, b) {
        if (a[propertyName] <= b[propertyName]) return -1
        return 1
    })
}

/**
 * Array.sortAlpha
 * 
 * In an array of strings, return the array sorted alphabetically
 * 
 * @returns {string[]} - The sorted array of strings
 */
Array.prototype.sortAlpha = function () {
    return this.sort((a, b) => a.localeCompare(b))
}

/**
 * Array.removeById
 * 
 * In an array of objects that have ids, remove the object with the resquested id
 * 
 * @param {string} itemId - Id of the item to remove
 * @returns this - The resulting array
 */
Array.prototype.removeById = function (itemId) {
    const index = this.findIndex(item => item.id == itemId)
    if (index > -1) this.splice(index, 1)
    return this
}

/**
 * Array.includesObject
 * 
 * - Check if an array of objects contains a specific object
 * - Does a shallow comparison (not deep)
 * 
 * @param {object} object - The object to search inside the array of objects
 */
Array.prototype.includesObject = function (object) {
    return (JSON.stringify(this).indexOf(JSON.stringify(object)) != -1)
}

/**
 * Event.stop
 * 
 * Shorthand to stop both the propagation of an event, and also prevent its default behavior
 */
Event.prototype.stop = function () {
    this.stopPropagation()
    this.preventDefault()
}

/**
 * Element.deepDelete
 * 
 * - delete an Element and all its children
 * - unsubscribe the elements from the PubSub event bus
 * - remove (unobserve) the container elements from the resizeObserver
 * 
 * This prevents memory leaks from detached DOM nodes which are still referenced in the PubSub.
 * 
 * @param {boolean} deleteRoot - Delete or preserve the root node (default to true). If preserved, it only deletes the children
 * 
 * @example:
 * node.deepDelete(): delete the node and its children
 * node.deepDelete(false): only delete the node's children
 */
if (kiss.isClient) {
    Element.prototype.deepDelete = function (deleteRoot) {
        while (this.firstElementChild) this.lastElementChild.deepDelete()

        if (deleteRoot !== false) {
            // Unsubscribe from PubSub
            if ((this.subscriptions) && (this.subscriptions.length != 0)) this.subscriptions.forEach(subscriptionId => kiss.pubsub.unsubscribe(subscriptionId))

            // Unobserve resize events if it's a container
            if (this.isContainer) kiss.screen.getResizeObserver().unobserve(this)

            // Remove masks if any
            if (this.mask) this.mask.deepDelete()

            // Trigger the _beforeDelete method of the component
            if (this._beforeDelete) this._beforeDelete()

            // Delete node
            if (this.parentNode) this.parentNode.removeChild(this)
        }
    }
}

;