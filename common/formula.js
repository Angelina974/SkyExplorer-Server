/**
 * 
 * ## Formula module
 * 
 * **Handle specific formulae that can be used inside computed fields.**
 * 
 * @namespace
 */
kiss.formula = {
    //--------------------
    //
    // WORKING WITH TEXT
    //
    //--------------------

    /**
     * Returns the left part of a string
     * 
     * @param {string} text
     * @param {number} n
     * @returns {text}
     * 
     * @example
     * LEFT("San Francisco", 3) // San
     */         
    LEFT: (text, n) => (n > 0) ? text.slice(0, n) : "",
    LEFT_HELP:
        `LEFT( {{field}}, 3)
        The left part of a TEXT field`,

    /**
     * Returns the right part of a string
     * 
     * @param {string} text
     * @param {number} n
     * @returns {text}
     * 
     * @example
     * RIGHT("San Francisco", 9) // Francisco
     */        
    RIGHT: (text, n) => (n > 0) ? text.slice(-n) : "",
    RIGHT_HELP:
        `RIGHT( {{field}}, 3)
        The right part of a TEXT field`,

    /**
     * Returns the middle part of a string
     * 
     * @param {string} text
     * @param {number} n
     * @returns {text}
     * 
     * @example
     * MIDDLE("San Francisco", 4, 8) // Fran
     */      
    MIDDLE: (text, from, to) => text.slice(from, to),
    MIDDLE_HELP:
        `MIDDLE( {{field}}, 4, 8)
        The middle part of a TEXT field`,

    /**
     * Returns the left part of a string, given a separator
     * 
     * @param {string} text
     * @param {string} separator
     * @returns {text}
     * 
     * @example
     * STRLEFT("San Francisco", " ") // San
     */
    STRLEFT: (text, separator) => text.split(separator)[0],
    STRLEFT_HELP:
        `STRLEFT( {{field}}, "@")
        The part of a TEXT field at the left of a given string`,

    /**
     * Returns the right part of a string, given a separator
     * 
     * @param {string} text
     * @param {string} separator
     * @returns {text}
     * 
     * @example
     * STRRIGHT("San Francisco", " ") // Francisco
     */       
    STRRIGHT: (text, separator) => text.split(separator).pop(),
    STRRIGHT_HELP:
        `STRRIGHT( {{field}}, "@")
        The part of a TEXT field at the right of a given string`,

    /**
     * Convert a string to uppercase
     * 
     * @param {string} text
     * @returns {text}
     * 
     * @example
     * UPPERCASE("San Francisco") // SAN FRANCISCO
     */    
    UPPERCASE: (text) => text.toUpperCase(),
    UPPERCASE_HELP:
        `UPPERCASE( {{field}})
        Returns a TEXT field in uppercase`,

    /**
     * Convert a string to lowercase
     * 
     * @param {string} text
     * @returns {text}
     * 
     * @example
     * LOWERCASE("San Francisco") // san francisco
     */     
    LOWERCASE: (text) => text.toLowerCase(),
    LOWERCASE_HELP:
        `LOWERCASE( {{field}} )
        Returns a TEXT field in lowercase`,

    /**
     * Convert a string to titlecase
     * 
     * @param {string} text
     * @returns {text}
     * 
     * @example
     * TITLECASE("paris") // Paris
     */      
    TITLECASE: (text) => text.toTitleCase(),
    TITLECASE_HELP:
        `TITLECASE( {{field}} )
        Returns a TEXT field in titlecase`,

    /**
     * Replace a string inside another string
     * 
     * @param {string} text
     * @param {string} oldText
     * @param {string} newText
     * @returns {text}
     * 
     * @example
     * REPLACE("New York is great", "New York", "Paris") // Paris is great
     */    
    REPLACE: (text, oldText, newText) => text.replaceAll(oldText, newText),
    REPLACE_HELP:
        `REPLACE( {{field}}, "New York", "Paris")
        Replaces one string with another inside a TEXT field`,

    /**
     * Generates a slug from a plain title
     * 
     * @param {string} title 
     * @returns {string} The generated slug
     * 
     * @example
     * SLUG("My article about dogs") // Returns "my-article-about-dogs"
     */
    SLUG: (text) => kiss.tools.generateSlug(text),
    SLUG_HELP:
        `SLUG( {{field}} )
        Transforms a TEXT field into a slug. Ex: "my-article-about-this"`,

    /**
     * Concatenate any number of strings
     * 
     * @param  {...any} strings 
     * @returns {string}
     * 
     * @example
     * CONCATENATE("Bob", " ", "Wilson") // "Bob Wilson"
     */
    CONCATENATE: (...strings) => strings.join(""),
    CONCATENATE_HELP:
        `CONCATENATE( {{field1}}, " - ", {{field2}} )
        Concatenate multiple TEXT fields or texts together`,

    /**
     * Check if a string contains a value
     * 
     * @param {string} string 
     * @param {string} value 
     * @returns {boolean}
     * 
     * @example
     * CONTAINS("San Francisco", "San") // true
     * CONTAINS("Paris", "San") // false
     */
    CONTAINS: (string, value) => string.includes(value),
    CONTAINS_HELP:
        `CONTAINS( {{field}}, "San")
        Returns true if a TEXT field contains the given string`,

    //--------------------
    //
    // WORKING WITH NUMBERS
    //
    //--------------------

    /**
     * MIN
     * @param  {...any} numbers 
     * @returns {number}
     * 
     * @example
     * MIN(42, 666, 1515, 7) // 7
     */
    MIN: (...numbers) => Math.min(...numbers),
    MIN_HELP:
        `MIN( {{field1}}, {{field2}}, ... )
        The min value of multiple NUMBER fields`,

    /**
     * MAX
     * 
     * @param  {...any} numbers 
     * @returns {number}
     * 
     * @example
     * MAX(42, 666, 1515, 7) // 1515
     */
    MAX: (...numbers) => Math.max(...numbers),
    MAX_HELP:
        `MAX( {{field1}}, {{field2}}, ... )
        The max value of multiple NUMBER fields`,

    /**
     * AVERAGE
     * 
     * @param  {...any} numbers 
     * @returns {number}
     * 
     * @example
     * AVERAGE(10, 20, 30) // 20
     */
    AVERAGE: (...numbers) => kiss.formula.SUM(...numbers) / numbers.length,
    AVERAGE_HELP:
        `AVERAGE( {{field1}}, {{field2}}, ... )
        The average value of multiple NUMBER fields`,

    /**
     * ROUND
     * 
     * @param {number} number 
     * @param {number} precision 
     * @returns {number}
     * 
     * @example
     * ROUND(12.367891, 3) // 12.378
     */
    ROUND: (number, precision) => number.round(precision),
    ROUND_HELP:
        `ROUND( {{field}}, 3)
        The rounded value of a NUMBER field`,

    /**
     * Returns the square root of a number
     * 
     * @param {number} number 
     * @returns {number}
     * 
     * @example
     * SQRT(16) // 4
     */
    SQRT: (number) => Math.sqrt(number),
    SQRT_HELP:
        `SQRT( {{field}} )
        The square root of a NUMBER field`,

    /**
     * POW
     * 
     * @param  {number} number
     * @param  {number} power
     * @returns {number}
     * 
     * @example
     * POW(4, 2) // 16
     */
    POW: (number, power) => Math.pow(number ?? 0, power ?? 1),
    POW_HELP:
        `POW( {{field}}, 2)
        Raise a NUMBER field to the specified power`,

    /**
     * PI
     * 
     * @returns {number}
     * 
     * @example
     * PI() // 3.1415927...
     */    
    PI: () => Math.PI,
    PI_HELP:
        `PI()
        PI number: 3.1415927...`,

    /**
     * Returns the COSINUS of a number
     * 
     * @param {number} number 
     * @returns {number}
     * 
     * @example
     * COS(2 * PI()) // 1
     */    
    COS: (number) => Math.cos(number),
    COS_HELP:
        `COS( {{field}} )
        The cosinus of a NUMBER field`,

    /**
     * Returns the SINUS of a number
     * 
     * @param {number} number 
     * @returns {number}
     * 
     * @example
     * SIN(PI() / 2) // 1
     */      
    SIN: (number) => Math.sin(number),
    SIN_HELP:
        `SIN( {{field}} )
        The sinus of a NUMBER field`,

    /**
     * Returns the TANGENT of a number
     * 
     * @param {number} number 
     * @returns {number}
     * 
     * @example
     * TAN(PI() / 4) // 1
     */    
    TAN: (number) => Math.tan(number),
    TAN_HELP:
        `TAN( {{field}} )
        The tangent of a NUMBER field`,

    //--------------------
    //
    // WORKING WITH DATES
    //
    //--------------------

    /**
     * Get the YEAR of an ISO date
     * 
     * @param {string} strDateISO 
     * @returns {string}
     * 
     * @example
     * YEAR("2022-12-24") // "2022"
     */
    YEAR: (strDateISO) => strDateISO.substring(0, 4),
    YEAR_HELP:
        `YEAR( {{field}} )
        The year of a DATE field`,

    /**
     * Get the MONTH of an ISO date
     * 
     * @param {string} strDateISO 
     * @returns {string}
     * 
     * @example
     * MONTH("2022-12-24") // "12"
     */    
    MONTH: (strDateISO) => strDateISO.substring(5, 7),
    MONTH_HELP:
        `MONTH( {{field}} )
        The month of a DATE field`,

    /**
     * Get the DAY of an ISO date
     * 
     * @param {string} strDateISO 
     * @returns {string}
     * 
     * @example
     * DAY("2022-12-24") // "24"
     */    
    DAY: (strDateISO) => strDateISO.substring(8, 10),
    DAY_HELP:
        `DAY( {{field}} )
        The day of a DATE field`,

    /**
     * Get the YEAR and MONTH of an ISO date
     * 
     * @param {string} strDateISO 
     * @returns {string} The year
     * 
     * @example
     * YEAR_MONTH("2022-12-24") // "2022-12"
     */    
    YEAR_MONTH: (strDateISO) => strDateISO.substring(0, 7),
    YEAR_MONTH_HELP:
        `YEAR_MONTH( {{field}} )
        The year and month of a DATE field, like "2020-07"`,

    /**
     * Compute the time difference between 2 dates
     * 
     * @param {string} fromISODate - As an ISO date string like "2023-02-14T15:44:05.886Z" or "2023-02-14"
     * @param {string} toISODate - As an ISO date string like "2023-02-14T15:44:05.886Z" or "2023-02-14"
     * @param {string} unit - "d" for days, "h" for hours... "mn", "s", "ms"
     * @returns {integer} Time diffence in the required unit of time
     * 
     * @example
     * TIME_DIFFERENCE("2023-02-14T15:44:05.886Z", "2023-02-14T18:44:26.316Z", "h") // 3
     * TIME_DIFFERENCE("2023-02-10", "2023-02-20", "d") // 10
     */
    TIME_DIFFERENCE: (fromISODate, toISODate, unit = "d") => {
        try {
            const fromDate = new Date(fromISODate)
            const toDate = new Date(toISODate)

            let coef
            switch(unit) {
                case "d":
                    coef = 1000 * 60 * 60 * 24
                    break
                case "h":
                    coef = 1000 * 60 * 60
                    break
                case "mn":
                    coef = 1000 * 60
                    break
                case "s":
                    coef = 1000
                case "ms":
                    coef = 1
            }
            return Math.round((toDate.getTime() - fromDate.getTime()) / coef)
        } catch (err) {
            return 0
        }
    },
    TIME_DIFFERENCE_HELP:
        `TIME_DIFFERENCE( {{field1}}, {{field2}}, "h")
        The time difference between 2 DATE fields, using the given unit (d, h, mn, s, or ms)`,

    /**
     * Compute the number of days between 2 dates
     * 
     * @param {string} fromISODate - As an ISO date string like "2023-02-14T15:44:05.886Z" or "2023-02-14"
     * @param {string} toISODate - As an ISO date string like "2023-02-14T15:44:05.886Z" or "2023-02-14" 
     * @returns {integer} Number of days
     * 
     * @example
     * DAYS_DIFFERENCE("2023-01-01T15:44:05.886Z", "2023-01-15T18:44:26.316Z") // 14
     * DAYS_DIFFERENCE("2023-01-01", "2023-01-10") // 9
     */
    DAYS_DIFFERENCE: (fromISODate, toISODate) => {
        return kiss.formula.TIME_DIFFERENCE(fromISODate, toISODate, "d")
    },
    DAYS_DIFFERENCE_HELP:
        `DAYS_DIFFERENCE( {{field1}}, {{field2}} )
        The number of days between 2 DATE fields`,

    /**
     * Compute the number of hours between 2 dates
     * 
     * @param {string} fromISODate 
     * @param {string} toISODate 
     * @returns {integer} Number of hours
     * 
     * @example
     * HOURS_DIFFERENCE("2023-01-01T15:00:00.000Z", "2023-01-02T16:00:00.000Z") // 25
     */
    HOURS_DIFFERENCE: (fromISODate, toISODate) => {
        return kiss.formula.TIME_DIFFERENCE(fromISODate, toISODate, "h")
    },
    HOURS_DIFFERENCE_HELP:
        `HOURS_DIFFERENCE( {{field1}}, {{field2}} )
        The number of hours between 2 DATE fields`,

    /**
     * Adjust a date to a new date, passing the number of years, months, days, hours, minutes and seconds to add or subtract.
     * If the hours, minutes and seconds are not specified, they are set to 0.
     * 
     * @param {date|string} date - Date or ISO date string like "2023-12-01"
     * @param {number} [years]
     * @param {number} [months]
     * @param {number} [days]
     * @param {number} [hours]
     * @param {number} [minutes]
     * @param {number} [seconds]
     * @param {string} [format] - "string" (default) or "date" to return a date object
     * @returns {string} The adjusted date, as an ISO string like "2023-01-01"
     * 
     * @example
     * ADJUST_DATE("2023-01-01", 0, 1, 0) // "2023-02-01"
     * ADJUST_DATE("2023-01-01", 0, 0, 0, 48, 0, 0) // "2023-01-03"
     */
    ADJUST_DATE(date, years=0, months=0, days=0, hours=0, minutes=0, seconds=0, format = "ISO") {
        // Create a new date object by cloning the original date
        let newDate = (date) ? new Date(date) : new Date()
        
        // Add or subtract the specified number of years, months, and days
        newDate.setFullYear(newDate.getFullYear() + years)
        newDate.setMonth(newDate.getMonth() + months)
        newDate.setDate(newDate.getDate() + days)
        newDate.setHours(newDate.getHours() + hours)
        newDate.setMinutes(newDate.getMinutes() + minutes)
        newDate.setSeconds(newDate.getSeconds() + seconds)
        
        // Return the adjusted date
        if (format == "ISO") return newDate.toISO()
        return newDate

    },
    ADJUST_DATE_HELP:
        `ADJUST_DATE( {{field}}, 0, 1, 0, 0, 0, 0)
        Adjust a DATE field by the number of given years, months, days, hours, minutes and seconds, and output the result like "2023-01-01"`,

    /**
     * Adjust a date to a new date and time, passing the number of years, months, days, hours, minutes and seconds to add or subtract.
     * If the hours, minutes and seconds are not specified, they are set to 0.
     * 
     * @param {date|string} date - Date or ISO date string like "2023-12-01"
     * @param {number} [years]
     * @param {number} [months]
     * @param {number} [days]
     * @param {number} [hours]
     * @param {number} [minutes]
     * @param {number} [seconds]
     * @param {string} [format] - "string" (default) or "date" to return a date object
     * @returns {string|date} The adjusted date and time, as an ISO string like "2023-01-01 12:34:56" or a date object
     * 
     * @example
     * ADJUST_DATE_AND_TIME("2023-01-01", 0, 1, 0) // "2023-02-01 00:00:00"
     * ADJUST_DATE_AND_TIME("2023-01-01", 0, 1, 0, 3, 0, 0) // "2023-02-01 03:00:00"
     * ADJUST_DATE_AND_TIME("2023-01-01 03:45:00", 0, 1, 0, 3, 0, 0) // "2023-02-01 06:45:00"
     * ADJUST_DATE_AND_TIME(new Date(), 0, 1, 0, 3, 0, 0) // "2023-01-01 06:45:00"
     */
    ADJUST_DATE_AND_TIME(date, years=0, months=0, days=0, hours=0, minutes=0, seconds=0, format = "ISO") {
        // Create a new date object by cloning the original date
        let newDate = (date) ? new Date(date) : new Date()

        log(">>NEW DATE")
        log(newDate)
        
        // Add or subtract the specified number of years, months, and days
        newDate.setFullYear(newDate.getFullYear() + years)
        newDate.setMonth(newDate.getMonth() + months)
        newDate.setDate(newDate.getDate() + days)
        newDate.setHours(newDate.getHours() + hours)
        newDate.setMinutes(newDate.getMinutes() + minutes)
        newDate.setSeconds(newDate.getSeconds() + seconds)
        
        // Return the adjusted date and time
        if (format == "ISO") return newDate.toISODateTime()
        return newDate
    },
    ADJUST_DATE_AND_TIME_HELP:
        `ADJUST_DATE_AND_TIME( {{field}}, 0, 0, 1, 12, 30, 0)
        Adjust a DATE field by the number of given years, months, days, hours, minutes and seconds, and output the result like "2023-01-01 12:30:00"`,

    /**
     * Convert a date to a formatted string
     * 
     * @param {date|string} date - Date or ISO date string like "2023-12-01"
     * @param {string} format - Ex: "yyyy-mm-dd", "yyyy-mm-dd hh:MM:ss", "yyyy-mm-dd hh:MM", "yy-mm-dd hh:MM"
     * @returns {string}
     * 
     * @example
     * FORMAT_DATE(new Date(), "yyyy-mm-dd") // "2023-01-01"
     * FORMAT_DATE(new Date(), "yyyy-mm-dd hh:MM:ss") // "2023-01-01 00:00:00"
     * FORMAT_DATE("2023-12-31", "yy-mm-dd") // "23-12-31"
     */
    FORMAT_DATE: (date, format) => {
        try {
            if (!date) return ""
            if (typeof date == "string") date = new Date(date)

            const pad = (n) => n < 10 ? "0" + n : n

            let year = date.getFullYear()
            let month = pad(date.getMonth() + 1)
            let day = pad(date.getDate())
            let hour = pad(date.getHours())
            let minute = pad(date.getMinutes())
            let second = pad(date.getSeconds())
        
            return format.replace(/yyyy/g, year)
                .replace(/yy/g, year.toString().substring(2, 4))
                .replace(/mm/g, month)
                .replace(/dd/g, day)
                .replace(/hh/g, hour)
                .replace(/MM/g, minute)
                .replace(/ss/g, second)
        } catch (err) {
            return ""
        }
    },
    FORMAT_DATE_HELP:
        `FORMAT_DATE( DATE, "yyyy-mm-dd"), or FORMAT_DATE( DATE, "yyyy-mm-dd hh:MM")
        Convert a date to a formatted string. Usefull to display dates in a specific format, or to set another date field using ISO, like "2023-01-01"`,

    //--------------------
    //
    // WORKING WITH MULTI-VALUE FIELDS
    //
    //--------------------

    /**
     * SUM
     * 
     * @param  {...any} numbers 
     * @returns {number}
     * 
     * @example
     * SUM(1, 2, 3) // 6
     */
    SUM: (...numbers) => numbers.reduce((a, b) => Number(a||0) + Number(b||0), 0),
    SUM_HELP:
        `SUM( {{field1}}, {{field2}}, ... )
        The sum of multiple NUMBER fields`,

    /**
     * Returns the LENGTH of an array or a string
     * 
     * @param  {array|string} array
     * @returns {number}
     * 
     * @example
     * LENGTH([0, 1, 2, 3]) // 4
     * LENGTH("Satori") // 6
     */
    LENGTH: (array) => {
        if (!array) return 0
        if (!Array.isArray(array)) {
            if (typeof array == "string") return array.length
            else return 0
        }
        return array.length
    },
    LENGTH_HELP:
        `LENGTH( {{field}} )
        The length of a TEXT, or the number of elements in a MULTI-VALUE field`,

    /**
     * Returns the NTH element of an array or a string
     * 
     * @param  {array|string} array
     * @param  {number} index
     * @returns {*}
     * 
     * @example
     * NTH(["low", "medium", "high"], 1) // "medium"
     */
    NTH: (array, index) => {
        if (!array) return ""
        if (Array.isArray(array) || typeof array == "string") return array[index]
        return ""
    },
    NTH_HELP:
        `NTH( {{field}} )
        The nth element of a MULTI-VALUE field`,

    /**
     * Join an array of strings into a single string, given a separator
     * 
     * @param {string[]} array
     * @param {string} separator
     * @returns {string} The resulting string
     * 
     * @example
     * JOIN(["Paris", "San Diego", "Ajaccio"], " & ") // "Paris & San Diego & Ajaccio"
     */
    JOIN: (array, separator) => array.join(separator),
    JOIN_HELP:
        `JOIN( {{field}}, " & ")
        Transform a MULTI-VALUE field into a text with separators`,

    /**
     * Converts a list of values into an array, to feed MULTI-VALUE fields.
     * 
     * @param {*} values
     * @returns {string[]|number[]|date[]} The resulting array
     * 
     * @example
     * ARRAY( "a", "b", "c" ) // [ "a", "b", "c" ]
     */
    ARRAY: (...values) => values,
    ARRAY_HELP:
        `ARRAY( "a", "b", "c" )
        Transform a list of values into an array, to feed MULTI-VALUE fields`,

    //--------------------
    //
    // TESTING FIELD VALUE
    //
    //--------------------

    /**
     * Check if a field value is empty
     * 
     * @param  {*} value
     * @returns {boolean}
     * 
     * @example
     * IS_EMPTY([0, 1, 2, 3]) // false
     * IS_EMPTY([]) // true
     * IS_EMPTY("abc") // false
     * IS_EMPTY("") // true
     * IS_EMPTY(123) // false
     * IS_EMPTY(0) // false
     */
    IS_EMPTY: (value) => {
        if (value === 0) return false
        if (typeof value === "string" && value.trim() === "") return true
        if (!value) return true
        if (Array.isArray(value) && value.length == 0) return true
        return false
    },
    IS_EMPTY_HELP:
        `IS_EMPTY( {{field}} )
        Returns true if the field is empty`,

    /**
     * Check if a field value is not empty
     * 
     * @param  {*} value
     * @returns {boolean}
     * 
     * @example
     * IS_NOT_EMPTY([0, 1, 2, 3]) // true
     * IS_NOT_EMPTY([]) // false
     * IS_NOT_EMPTY("abc") // true
     * IS_NOT_EMPTY("") // false
     * IS_NOT_EMPTY(123) // true
     * IS_NOT_EMPTY(0) // true
     */
    IS_NOT_EMPTY: (value) => {
        return !kiss.formula.IS_EMPTY(value)
    },
    IS_NOT_EMPTY_HELP:
        `IS_NOT_EMPTY( {{field}} )
        Returns true if the field is not empty`,

    /**
     * Test a set of conditions, and returns the value of the first expression that matches the test.
     * If no condition matches, returns the value of the last (default) expression.
     * Always has an odd number of parameters:
     * 
     * ```
     *  IF(<condition 1>, <expression 1>, ..., ..., <condition N>, <expression N>, <expression Else>)
     * ```
     * 
     * @param  {...any} params 
     * @returns {any} Value of the first expression that matches the condition
     * 
     * @example
     * // Returns "Good" if the field "amount" = 65, or "Poor" if the field "amout" = 20
     * IF({{amount}} > 80, "Great", {{amount}} > 60, "Good", {{amount}} > 40, "Not bad", "Poor")
     */
    IF: (...params) => {
        try {
            if (params.length < 3 || params.length % 2 == 0) return false
            for (let i = 0; i <= params.length - 2; i = i + 2) {
                if (params[i] == true) return params[i + 1]
            }
            return params[params.length - 1]
        } catch (err) {
            return false
        }
    },
    IF_HELP:
        `IF( {{field}} == 100, "Good", {{field}} > 50, "OK", "Poor" )
        Returns the value where the test is true, or defaults to the last value`,
    
    //--------------------
    //
    // TESTING WORKFLOW STATE
    //
    //--------------------

    /**
     * Check the current workflow step
     * 
     * IMPORTANT: only valid on the client, for "hideWhen" formulae
     * 
     * @param {string} stepName
     * @returns {boolean} true if the given step name is the current step
     */
    IS_WORKFLOW_STEP: (stepName) => {
        const stepId = kiss.context.record["workflow-stepId"]
        if (!stepId) return false
        const step = kiss.global.workflowSteps[stepId]
        if (!step) return false
        return step.name == stepName
    },
    IS_WORKFLOW_STEP_HELP:
        `IS_WORKFLOW_STEP("Analysis")
        Returns true if the given workflow step name is the active one. Useful to show/hide form fields or sections depending on the workflow step.`,
    
    /**
     * Check if a workflow has started
     * 
     * IMPORTANT: only valid on the client, for "hideWhen" formulae
     * 
     * @param {string} stepName
     * @returns {boolean} true if the given step name is the current step
     */
    IS_WORKFLOW_STARTED: () => {
        const stepId = kiss.context.record["workflow-stepId"]
        return !!stepId
    },
    IS_WORKFLOW_STARTED_HELP:
        `IS_WORKFLOW_STARTED()
        Returns true if a workflow has started. Useful to show/hide form fields or sections depending on the workflow status.`,
    
    //--------------------
    //
    // MISC TOOLS
    //
    //--------------------

    /**
     * Generates a unique id
     * 
     * @returns {string}
     * 
     * @example
     * UID() // "01844399-988f-7974-a68f-92d35fc702cc"
     */    
    UID: () => kiss.tools.uid(),
    UID_HELP:
        `UID()
        A unique ID like "01844399-988f-7974-a68f-92d35fc702cc"`,

    /**
     * Generates a short id
     * 
     * @returns {string}
     * 
     * @example
     * SHORT_ID() // "A84F007X"
     */    
    SHORT_ID: () => kiss.tools.shortUid().toUpperCase(),
    SHORT_ID_HELP:
        `SHORT_ID()
        A short ID like "A84F007X"`,
        
    /**
     * List of formulae which are not available for the user
     * 
     * @ignore
     */
    system: [
        "system",
        "hideWhen",
        "execute",
        "_parser",
        "COUNT",
        "COUNT_EMPTY",
        "COUNT_NON_EMPTY",
        "LIST",
        "LIST_NAMES",
        "SPLIT",
        "TODAY",
        "TIME",
        "NOW"
    ],

    /**
     * List of formulae which are only valid for "hideWhen" context
     * 
     * @ignore
     */
    hideWhen: [
        "IS_WORKFLOW_STEP",
        "IS_WORKFLOW_STARTED"
    ],

    /**
     * COUNT the number of items passed as parameters
     * 
     * @param  {...any} items
     * @returns {number}
     * 
     * @example
     * COUNT(1, "B", "C", 7) // 4
     */
    COUNT: (...items) => {
        return items.length
    },

    /**
     * COUNT the number of empty items passed as parameters
     * 
     * @param  {...any} items
     * @returns {number}
     * 
     * @example
     * COUNT_EMPTY(1, "B", "C", 7, "", []) // 2
     */
    COUNT_EMPTY: (...items) => {
        const empty = items.filter(item => {
            return (item === undefined) || (item === "") || (Array.isArray(item) && item.length == 0)
        })
        return empty.length
    },
    
    /**
     * COUNT the number of non-empty items passed as parameters
     * 
     * @param  {...any} items
     * @returns {number}
     * 
     * @example
     * COUNT_NON_EMPTY(1, "B", "C", 7, "", []) // 4
     */
    COUNT_NON_EMPTY: (...items) => {
        const nonEmpty = items.filter(item => {
            return (item !== undefined) && (item !== "") || (Array.isArray(item) && item.length != 0)
        })
        return nonEmpty.length
    },

    /**
     * Concatenate any number of strings as a comma separated text
     * 
     * @param  {...any} strings 
     * @returns {string}
     * 
     * @example
     * LIST("A", "B", "C") // "A, B, C"
     */    
    LIST: (...strings) => strings.filter(string => string !== undefined && string != "").unique().join(", "),

    /**
     * Merge a list of names into an array of names
     * 
     * @param  {...string} names
     * @returns {string[]}
     * 
     * @example
     * LIST_NAMES("John", "Bob", "Steve") // ["John, Bob, Steve"]
     */    
    LIST_NAMES: (...names) => {
        return names.filter(name => name !== undefined && name != "").flat().unique()
    },

    /**
     * Split a string into an array of strings, given a separator
     * 
     * @param {string} text 
     * @param {string} separator
     * @returns {string[]} The resulting array of strings
     * 
     * @example
     * SPLIT("Paris,San Diego,Ajaccio", ",") // ["Paris", "San Diego", "Ajaccio"]
     */
    SPLIT: (text, separator) => text.split(separator),

    /**
     * Get the current date as an ISO date string
     * 
     * @param {string} strDateISO 
     * @returns {string}
     * 
     * @example
     * TODAY() // "2022-12-24"
     */    
    TODAY: () => (new Date()).toISO(),

    /**
     * Get the current time as an ISO string (without time shift)
     * 
     * @returns {string}
     * 
     * @example
     * TIME() // "14:53:28"
     */    
    TIME: () => (new Date()).toISOString().substring(11,16),

    /**
     * Get the current date and time as a simple readable string (without time shift)
     * 
     * @returns {string}
     * 
     * @example
     * NOW() // "2022-12-24 14:53:28"
     */    
    NOW: () => (new Date()).toISOString().substring(0,19).replace("T", " "),

    /**
     * Execute a formula that is an arithmetic expression mixed or not with functions calls and return the result
     *
     * @param {string} formula - The formula to parse and execute
     * @param {Object} record - A record object. Each object property will be available in the formula with the following syntax: "{{property_name}}" if the corresponding entry is listed in fields.
     * @param {Array<{label: string, id: string}>} fields - A list of record properties sorted in a way such as {{index}} will be resolved as a record property.
     * @returns {*} - The formula result
     * 
     * @example
     * kiss.formula.execute("SUM(4, 6)") // returns 10
     * kiss.formula.execute("'Test: ' + (2 * SUM(3, 4))") // returns "Test: 14"
     * kiss.formula.execute("true && !false") // returns true
     * kiss.formula.execute("{{amount}} + {{vat}}") // returns 12 with record `{ amount: 10, vat: 2 }`
     */
    execute(formula, record, fields = undefined) {
        if (!this._parser) {
            // We must create the parser here, doing it in the upper scope, it would lose the reference to kiss.formula for somewhat reason.
            this._parser = new kiss.lib.formula.Parser({ availableFunctions: this })
        }

        const normalizedRecord = {}
        const propertiesList = fields.map(({ id, label }) => {
            normalizedRecord[label] = record[id]
            return label
        })
        
        // log("-------------------- FORMULA ------------------------")
        // log(formula)
        return this._parser.parse(formula, normalizedRecord, propertiesList)
    }        
}

;