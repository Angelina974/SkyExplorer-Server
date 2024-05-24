const ResultTests = require('./formula.dictionnary.test')
process.env.NODE_ENV = 'local';

require('../../server/kiss.js');
require('../../common/formula.js');
require('../../common/tools.js');

const { performance } = require('perf_hooks')
const NB_ITERATIONS = 1000
const NB_OPERATIONS = NB_ITERATIONS * Object.keys(ResultTests).length
const entries = Object.entries(ResultTests);

console.log('-------------------- Parser');

let start = performance.now()

for (let i = 0; i < NB_OPERATIONS; i++ ) {
    for(let [ formule, result ] of entries) {
        kiss.formula.execute(formule, Array.isArray(result) ? result[0] : {})
    }
}

let end = performance.now()
console.log(`${NB_OPERATIONS} in ${end - start}ms (${NB_OPERATIONS / ( (end - start) / 1000 )}op/s)`)

console.log('------------------- kiss sandbox');

kiss.tools = {
    /**
     * Scoped evaluation
     *
     * @ignore
     * @param {object} thisObj - 'this' object passed to evaluated code (the original 'this' is overwritten)
     * @param {object} scriptsScope - scope to share some restricted functions
     * @param {string} script - code to execute
     */
    scopedEval(thisObj, scriptsScope, script) {
        const context = {
            ...scriptsScope
        }

        // Create new Function with keys from context as parameters, 'script' is the last parameter.
        const evaluator = Function.apply(null, [...Object.keys(context), "script", '"use strict";return eval(`' + script + "`)"])

        // Call the function with values from context and 'script' as arguments
        return evaluator.apply(thisObj, [...Object.values(context), script])
    },

    /**
     * Sandbox a script by stripping dangerous strings
     *
     * @ignore
     * @param {string} script
     * @param {object} record
     * @returns Last evaluated expression in the script, or undefined in case of error
     */
    sandbox(script, record) {
        // Exit if the script is not valid
        if (!script || typeof script != "string") return

        try {
            // Blacklist access to dangerous methods
            [
                // Lock code obfuscation using unicode
                "\\u",

                // Lock access to all global objects ("this" is overwritten by the scope by default)
                "kiss",
                "alert",
                "eval",
                "top",
                "self",
                "window",
                "globalThis",
                "script",
                "link",

                // Prevent from writing functions
                "function",
                "Function",
                "=>",

                // Block access to external resources
                "fetch",
                "XMLHttpRequest",
                "RTCPeerConnection",
                "WebSocket",
                "document",
                "location",
                "href",
                "src",
                "url",
                "write",

                // Prevent loops
                "for(",
                "for (",
                "while",
                "localStorage",
                "process",
                "Buffer",
                "cluster",
                "import",
                "require",
                "setTimeout",
                "setInterval"
            ].forEach(strip => script = script.replaceAll(strip, "").replaceAll(strip, ""))

            // Execute code restricting access to the global scope and giving access to kiss.formula
            return kiss.tools.scopedEval(record, kiss.formula, script)

        } catch (err) {
            log(err)
            return ""
        }
    },
}

const preCompiled = entries.map(([ formulas, result ]) => {
    return [
        formulas.replace(/{{(\w+)}}/g, (match, token) => `this['${token}']`),
        result
    ]
});

start = performance.now()

for (let i = 0; i < NB_OPERATIONS; i++ ) {
    for(let [ formule, result ] of preCompiled) {
        kiss.tools.sandbox(formule, Array.isArray(result) ? result[0] : {})
    }
}

end = performance.now()
console.log(`${NB_OPERATIONS} in ${end - start}ms (${NB_OPERATIONS / ( (end - start) / 1000 )}op/s)`)

;