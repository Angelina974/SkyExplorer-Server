// region Constants to make the parser more readable.
const CHAR_OPEN_PARENTHESIS = '('
const CHAR_CLOSING_PARENTHESIS = ')'
const CHAR_OPEN_CURLY_BRACKET = '{'
const CHAR_CLOSE_CURLY_BRACKET = '}'
const CHAR_NEWLINE = '\n'
const CHAR_CARRIAGE_RETURN = '\r'
const CHAR_TAB = '\t'
const CHAR_SPACE = ' '
const CHAR_BACKSLASH = '\\'
const CHAR_COMMA = ','
const CHAR_SINGLE_QUOTE = "'"
const CHAR_DOUBLE_QUOTE = '"'
// endregion

// region Types

/**
 * @ignore
 * @callback isUnary
 * @param {string} symbol - The symbol to test
 * @returns {boolean} - True if the given symbol is a valid unary.postModifier operator in the current expression context.
 */

/**
 * @ignore
 * @callback isPreModifier
 * @param {string} symbol - The symbol to test
 * @returns {boolean} - True if the given symbol is a valid unary.preModifier operator in the current expression context.
 */

/**
 * @typedef CallStackStep
 * @description A CallStack step is an object that is modeling a function to call with its arguments.
 *      Since we're parsing a string expression, we want to be able to populate the current function with the arguments we find later
 *      (delimited by comas) and eventually we want to store the current expression and some results.
 *
 * @ignore
 * @property {Function} functionToCall - The function to execute.
 * @property {Array} arguments - Arguments passed to the function when invoked.
 * @property {boolean} [customFunction] - If the current stack element is an external function to call (functions plugged to the parser to add new features).
 * @property {number} [maxArguments] - Optional. Max arguments supported by the function.
 * @property {boolean} [postModifier] - Optional. True if the current step is a postModifier.
 * @property {boolean} [operand] - Optional. True if the current step is an operand.
 * @property {boolean} [expression] - Optional. True if the current step is an expression.
 * @property {Object} [operators] - Optional. If the step is an expression, contains helpers to transform expression arguments with unary operators.
 * @property {Function|null} [operators.unaryToApply = null] - If set to a function, the function to apply when the next expression operand will be found (used for unary.postModifier operators).
 * @property {isUnary} [operators.isUnary] - An helper to know if we will have to deal with a postModifier operator on the next expression operand given the current expression state.
 * @property {isPreModifier} [operators.isPreModifier] - AN helper to know if we have to apply a preModifier operator on the last operand of the current expression given its state.
 */

// endregion

/**
 * The purpose of this class is to be used to parse arithmetic and functional expressions that can be contextualized
 * with a record (so, given some variables, it is able to execute functions and computations).
 *
 * Note: this class is a continuous parser. Before returning its result, it will reset itself.
 * 
 * @ignore
 */
kiss.lib.formula.Parser = class Parser {

    /** @type {ParserOperators} */
    _operators

    /** @type {Object<string, Function>} */
    _functions

    /** @type {Array<CallStackStep>} **/
    _callStack

    /** @type {string} */
    _lastChar

    /** @type {string} */
    _currentChar

    /** @type {string} */
    _currentSymbol

    /** @type {string} */
    _currentPosition

    /** @type {string} */
    _currentOperator

    /** @type {Object} */
    _currentRecord

    /** @type {Array<string>} */
    _currentRecordPropertiesList

    /** @type {number} */
    _chainedBackslashes

    _openString = {
        singleQuote: false,
        doubleQuote: false
    }

    /** @type {number} */
    _openCurlyBracket = 0

    /** @type {any} */
    _finalResult

    /**
     * @param {Object} [opts = {}] - Parser options
     * @param {Object<string, Function>} [opts.availableFunctions = {}] - Available functions in formulas.
     * @param {ParserOperators} [opts.operators = {}] - Operators used by the parser to compute the result.
     */
    constructor(
        {
            availableFunctions = {},
            operators = null,
        } = {}
    ) {
        this._functions = availableFunctions ?? {}
        this._operators = operators || new kiss.lib.formula.ParserOperators()
        this._reset()
    }

    /**
     * Throw a parse error, printing the currentPosition in the formula to display a meaningful error message after a full parser reset.
     *
     * @param {string} message - Message to display
     * @private
     */
    _parseError(message) {
        const currentPosition = this._currentPosition
        this._reset()
        throw new Error(`Formula parsing error: ${currentPosition}<- ${message}`)
    }

    /**
     * Return the last element in the callStack
     *
     * @returns {CallStackStep}
     */
    _peekCallStack() {
        return this._callStack[this._callStack.length - 1]
    }

    /**
     * Parse a symbol to its real type.
     *
     * @param {string} symbol - THe symbol to parse
     * @returns {*}
     */
    _parseSymbol(symbol) {
        const record = this._currentRecord
        const propertiesList = this._currentRecordPropertiesList ?? Object.keys(record)

        // We start by the most straightforward tests first.
        switch(symbol.toLowerCase()) {
            case 'null':
                return null
            case 'true':
                return true
            case 'false':
                return false
            case 'undefined':
                return undefined
            case 'nan':
                return NaN
            case 'positive_infinity':
                return Number.POSITIVE_INFINITY
            case 'negative_infinity':
                return Number.NEGATIVE_INFINITY
        }

        // Then we check for tags
        if (symbol.startsWith('{{') && symbol.endsWith('}}')) {
            // We have a tag. A tag is reference to a record property.
            const tag = symbol.slice(2, -2)
            
            if (tag in record) {
                return record[tag]
            } else {
                const tagToInt = Number.parseInt(tag)

                if (!Number.isNaN(tagToInt) && propertiesList[tagToInt] in record) {
                    return record[propertiesList[tagToInt]]
                } else {
                    this._reset()
                    throw new Error(`Field '${tag}' not found in the provided record.`)
                }
            }
        }

        // Since strings are handled by the parser, and all other primitive types & tags have been handled, the only remaining type is Numbers.
        if(symbol.match(/\./)) {
            return Number.parseFloat(symbol)
        } else if(symbol.match(/,/)) {
            return Number.parseFloat(symbol.replaceAll(',', '.'))
        } else if(symbol.match(/[0-9.]+n$/)) {
            return BigInt(symbol.slice(0, -1))
        } else if(symbol.startsWith('\\x')) {
            return Number.parseInt(symbol.slice(2), 16)
        } else if(symbol.startsWith('\\b')) {
            return Number.parseInt(symbol.slice(2), 2)
        } else if(symbol.startsWith('\\o')) {
            return Number.parseInt(symbol.slice(2), 8)
        } return Number(symbol)
    }

    /**
     * Push a new value to the current stack:
     * - If the last element in the stack is an expression, add the value to the expression members (can be an operand or an operator)
     * - If the current step is a function, push the value to the function's arguments.
     * - Otherwise, add a new operand to the stack that will be used later as a function argument.
     *
     * @param {*} value - the value to push.
     */
    _pushValueToStack(value) {
        const lastStep = this._peekCallStack()

        if (lastStep && lastStep.expression) {
            if (typeof lastStep.operators.unaryToApply === 'function') {
                lastStep.arguments.push(lastStep.operators.unaryToApply(value))
                lastStep.operators.unaryToApply = null
            } else {
                lastStep.arguments.push(value)
            }

        } else if(lastStep && lastStep.maxArguments < lastStep.arguments.length) {
            lastStep.arguments.push(value)

        } else {
            this._callStack.push({
                operand: true,
                functionToCall: this._operators.identity,
                maxArguments: 1,
                arguments: [value]
            })
        }
    }

    /**
     * If a currentSymbol have been collected in the current formula, we add it to the stack (after conversion by _parseSymbol)
     */
    _addCurrentSymbolToStack() {
        if (!this._currentSymbol) {
            return
        }

        this._pushValueToStack(this._parseSymbol(this._currentSymbol))
        this._currentSymbol = ''
    }

    /**
     * If a currentOperator have been collected in the current formula, we try to add it to the existing expression it belongs to.
     * If no expression is found, or if no currentOperator have been collected, will just silently fail.
     */
    _addCurrentOperatorToExpression() {
        if (!this._currentOperator) {
            return
        }

        const lastStep = this._peekCallStack()
        if (lastStep?.expression) {
            // We must apply unary operators before pushing them into the expression
            if (lastStep.operators.isPreModifier(this._currentOperator)) {
                const operator = this._operators.parseOperator(
                    'unary.preModifier',
                    this._currentOperator
                )

                // Since preModifiers applies to the previous operand, we can compute it now
                const lastOperand = lastStep.arguments.pop()

                lastStep.arguments.push(this._operators.unary.preModifier[operator](lastOperand))
                this._currentOperator = ''
                return
            } else if (lastStep.operators.isUnary(this._currentOperator)) {
                const operator = this._operators.parseOperator(
                    'unary.postModifier',
                    this._currentOperator
                )

                // Will be applied to the next operand
                lastStep.operators.unaryToApply = this._operators.unary.postModifier[operator]
                this._currentOperator = ''
                return
            }

            lastStep.arguments.push(
                this._operators.parseOperator(
                    'binary',
                    this._currentOperator
                )
            )

            this._currentOperator = ''
        }
    }

    /**
     * Execute the current expression by popping the stack if the last element on the callStack is an expression.
     *
     * @returns {boolean} - True if the stack have been popped.
     */
    _closeCurrentExpression() {
        const lastStep = this._peekCallStack()

        if (lastStep?.expression) {
            this._popStack()
            return true
        }
    }

    /**
     * Apply a postModifier (if any) at the end of the stack.
     */
    _applyPostModifier() {
        const lastStep = this._peekCallStack()

        if (lastStep?.postModifier) {
            this._popStack()
        }
    }

    /**
     * Pop the current stack until encountering a step to stop to. If, for example, the stack is:
     * function(no argument) - operand - operand - expression
     * 
     * After popStack you'll function(no argument) operand, operand, expressionResult
     *
     * Pop again and you'll get _finalResult = function(operand, operand, expressionResult)
     */
    _popStack() {
        /** @type {CallStackStep | undefined} */
        let step
        let argumentsToInject = []

        // No need to check maxArguments here, because it would have been spotted when an eventual comma would have been found.
        this._addCurrentSymbolToStack()

        // We remove all waiting operands.
        while ((step = this._callStack.pop())?.operand) {
            argumentsToInject.push(step.functionToCall(...step.arguments))
        }

        if (this._callStack.length === 0) {
            if (argumentsToInject.length === 1) {
                this._finalResult = argumentsToInject.pop()
                return
            } else if(step?.expression) {
                this._finalResult = step.functionToCall(...step.arguments)
                return
            }
        }

        if (!step) {
            return
        }

        const { functionToCall, arguments: functionArguments } = step

        const intermediateResult = functionToCall(
            ...functionArguments,
            ...argumentsToInject.reverse()
        )

        step = this._peekCallStack()

        if (this._callStack.length === 0) {
            this._finalResult = intermediateResult
        } else if(step) {
            if (step.expression) {
                this._pushValueToStack(intermediateResult)
            } else {
                this._callStack.push({
                    operand: true,
                    functionToCall: this._operators.identity,
                    maxArguments: 1,
                    arguments: [intermediateResult]
                })
            }
        } else {
            // Unmatching parenthesis number found.
            this._parseError('Unexpected closing parenthesis (have it been properly opened?)')
        }
    }

    /**
     * Loop over the callStack to find the first function (if any) to execute, ignoring operands and expressions
     *
     * @returns {CallStackStep|null}
     */
    _getLastFunctionStep() {
        let i = this._callStack.length - 1

        while (this._callStack[i].operand || this._callStack[i].expression) {
            i--
        }

        if (i < 0) {
            return null
        }

        return this._callStack[i]
    }

    /**
     * Create an expression object used to represent an arithmetic expression to parse.
     *
     * @param {...*} startingExpressionMembers - Will be used as expression members at the beginning of the expression.
     * @returns {CallStackStep} - The expression.
     */
    _createExpression(...startingExpressionMembers) {
        const expression = {
            expression: true,
            functionToCall: this._operators.expression.bind(this._operators),
            arguments: startingExpressionMembers,
            operators: {
                unaryToApply: null,

                /** @type {isUnary} */
                isUnary: (symbol) => {
                    const lastElement = expression.arguments[expression.arguments.length - 1]

                    return this._operators.isAnOperatorString(symbol)
                        && (
                            expression.arguments.length === 0
                            || this._operators.isAnOperator(lastElement)
                        )
                },

                /** @type {isPreModifier} */
                isPreModifier: (symbol) => {
                    const lastExpressionMember = expression.arguments[expression.arguments.length -1]

                    return expression.arguments.length > 0
                        && symbol in this._operators.symbols.unary.preModifier
                        && !this._operators.isAnOperator(lastExpressionMember)
                }
            }
        }

        return expression
    }

    /**
     * Apply the current operator if any by adding it to the current expression
     *
     * @param {string|null} char - Optional. If provided, will try to find a valid operator by combining it with the currentOperator. If found, will add this character to the currentOperator.
     */
    _applyCurrentOperator(char = null) {
        if (!this._currentOperator) {
            return
        }

        if (char && this._operators.isAnOperatorCandidate(this._currentOperator + char)) {
            this._currentOperator += char
        }

        const lastStep = this._peekCallStack()
        if (!lastStep?.expression) {

            // If the previousStep is an identity function, add it to the current expression?
            if (lastStep?.operand) {
                this._callStack.splice(this._callStack.length - 1, 1)
                this._callStack.push(this._createExpression(...lastStep.arguments))
            } else {
                this._callStack.push(this._createExpression())
            }
        }

        this._addCurrentSymbolToStack()
        this._addCurrentOperatorToExpression()
    }

    /**
     * Parse and execute the formula, then return the result.
     *
     * @param {string} formula - An arithmetic formula. For supported operators and functions, see the constructor.
     * @param {Object | undefined} record - A record. Required if any {{token}} can be found in the formula
     * @param {Array<string> | undefined} propertiesList - A list of record properties sorted in a way such as {{index}} will be resolved as a record property.
     * @returns {*} - The result
     */
    _parse(formula, record, propertiesList) {
        formula = `(${formula})`

        this._currentRecord = record
        this._currentRecordPropertiesList = propertiesList

        for(const char of formula){
            this._currentChar = char
            this._currentPosition += char

            if (char !== CHAR_BACKSLASH) {
                if (this._lastChar === CHAR_BACKSLASH && this._chainedBackslashes %2 !== 0){
                    if (char === CHAR_DOUBLE_QUOTE || char === CHAR_SINGLE_QUOTE) {
                        this._currentSymbol += char
                        this._lastChar = char
                        this._chainedBackslashes = 0
                        continue
                    }
                }

                this._chainedBackslashes = 0
            }

            if ((this._openString.singleQuote || this._openString.doubleQuote) && char !== CHAR_BACKSLASH) {
                // Strings just swallows all chars (excepted backslashes) until closed.
                if (
                    (this._openString.singleQuote && char !== CHAR_SINGLE_QUOTE)
                    ||
                    (this._openString.doubleQuote && char !== CHAR_DOUBLE_QUOTE)
                ) {
                    this._currentSymbol += char
                    this._lastChar = char
                    continue
                }
            }

            if ((this._openCurlyBracket === 2) && char !== CHAR_CLOSE_CURLY_BRACKET) {
                this._currentSymbol += char
                this._lastChar = char
                continue
            } else if (this._openCurlyBracket === 1 && char !== CHAR_OPEN_CURLY_BRACKET && char !== CHAR_CLOSE_CURLY_BRACKET) {
                this._parseError(
                    'Invalid character here. An opened curly bracket must be immediately'
                    + ' followed by another one to get a valid tag !'
                )
            }

            switch(char){
                case CHAR_OPEN_PARENTHESIS:
                    this._applyCurrentOperator()

                    if (this._currentSymbol){
                        let funcName = this._currentSymbol.toUpperCase()

                        if (funcName in this._functions) {
                            this._callStack.push({
                                functionToCall: this._functions[funcName],
                                arguments: [],
                                customFunction: true,
                            })
                        } else {
                            this._parseError(`Unknown function ${funcName}`)
                        }

                        this._currentSymbol = ''
                    } else {
                        // A parenthesis used for priority in computation is nothing else than
                        // a function that returns its only parameter (the result of the expression
                        // the parenthesis contains)

                        const lastStep = this._peekCallStack()
                        if (lastStep?.expression) {
                            const previousStep = this._callStack[this._callStack.length - 2]

                            // If the previousStep is an identity function, add it to the current expression?
                            if (previousStep && previousStep.maxArguments === 1) {
                                this._callStack.splice(this._callStack.length - 2, 1)
                                this._callStack.push(this._createExpression(...previousStep.arguments))
                            } else {
                                this._callStack.push(this._createExpression())
                            }
                        } else {
                            this._callStack.push({
                                maxArguments: 1,
                                functionToCall: this._operators.identity,
                                arguments: [],
                            })
                        }
                    }

                    break

                case CHAR_CLOSING_PARENTHESIS:
                    this._applyPostModifier()
                    this._applyCurrentOperator()
                    this._addCurrentSymbolToStack()

                    if (!this._closeCurrentExpression()) { //TODO: error detection with + and - parenthesis.
                        this._popStack()
                    }

                    break

                case CHAR_COMMA:
                    this._applyPostModifier()

                    // We start by checking if a coma is allowed where we are.
                    // We determine that with the actual last element in the callstack, since it's
                    // this one that would receive the argument after the comma (or not)
                    const callStackStep = this._getLastFunctionStep()

                    if (
                        'maxArguments' in callStackStep
                        && callStackStep.arguments.length + 1 > callStackStep.maxArguments
                    ) {
                        this._parseError(`Expected ')' but found ','`)
                    }

                    this._applyCurrentOperator(null, true)
                    this._addCurrentSymbolToStack()
                    this._closeCurrentExpression()

                    // When we have to compute several arguments for a given function, we need to ensure the next
                    // created expression will not use the last operand on the stack. To do this consistently,
                    // we add the last operand to the last function arguments if the lastStep is an operand, and the lastFunction a custom function.
                    const lastStep = this._peekCallStack()
                    if (lastStep?.operand) {
                        const lastFunction = this._getLastFunctionStep();

                        if (lastFunction?.customFunction) {
                            lastFunction.arguments.push(...lastStep.arguments);
                            this._callStack.pop();
                        }
                    }

                    break

                case CHAR_TAB:
                case CHAR_NEWLINE:
                case CHAR_CARRIAGE_RETURN:
                case CHAR_SPACE:
                    // white spaces have no computation meaning, but when we encounter them, we may have an operator to add to an expression
                    this._applyCurrentOperator()
                    break

                case CHAR_BACKSLASH:
                    this._applyCurrentOperator()

                    this._chainedBackslashes++

                    if (this._openString.singleQuote || this._openString.doubleQuote) {
                        if (this._lastChar === CHAR_BACKSLASH) {
                            if (this._chainedBackslashes % 2 === 0) {
                                this._currentSymbol += char
                            }
                        }
                    } else {
                        if (this._lastChar !== CHAR_BACKSLASH) {
                            this._currentSymbol += char
                        } else {
                            this._parseError(
                                'Unexpected character \\: outside strings, double backslashes are forbidden.'
                            )
                        }
                    }

                    break

                case CHAR_SINGLE_QUOTE:
                case CHAR_DOUBLE_QUOTE:
                    let stringClosed = false

                    if (char === CHAR_DOUBLE_QUOTE) {
                        if (this._openString.doubleQuote) {
                            if (this._lastChar !== CHAR_BACKSLASH) {
                                this._openString.doubleQuote = false
                            } else {
                                if (this._chainedBackslashes % 2 === 0) {
                                    this._openString.doubleQuote = false
                                } else {
                                    this._currentSymbol += char
                                }
                            }

                            stringClosed = !this._openString.doubleQuote
                        } else {
                            this._openString.doubleQuote = true
                        }
                    } else {
                        if (this._openString.singleQuote) {
                            if (this._lastChar !== CHAR_BACKSLASH) {
                                this._openString.singleQuote = false
                            } else {
                                if (this._chainedBackslashes % 2 === 0) {
                                    this._openString.singleQuote = false
                                } else {
                                    this._currentSymbol += char
                                }
                            }

                            stringClosed = !this._openString.singleQuote
                        } else {
                            this._openString.singleQuote = true
                        }
                    }

                    if (stringClosed) {
                        this._pushValueToStack(this._currentSymbol)
                        this._currentSymbol = ''
                    }
                    
                    break

                case CHAR_OPEN_CURLY_BRACKET:
                    if (this._openCurlyBracket === 0) {
                        this._addCurrentSymbolToStack()
                    }

                    this._currentSymbol += char
                    this._openCurlyBracket++
                    
                    break

                case CHAR_CLOSE_CURLY_BRACKET:
                    this._currentSymbol += char

                    if (this._openCurlyBracket === 0) {
                        this._parseError('Unexpected closing bracket !')
                    }

                    this._openCurlyBracket--

                    if (this._openCurlyBracket % 2 === 0) {
                        this._applyCurrentOperator()
                    }
                    
                    break

                default:
                    this._applyPostModifier()

                    if (this._currentOperator) {
                        if (this._operators.isAnOperatorCandidate(this._currentOperator + char)) {
                            this._currentOperator += char
                            break

                        } else if(this._operators.isAnOperatorCandidate(char)) {
                            this._addCurrentOperatorToExpression()
                            this._currentOperator = char
                            break
                        }
                    } else if(this._operators.isAnOperatorCandidate(char)) {
                        this._currentOperator = char
                        break
                    }

                    this._applyCurrentOperator()
                    this._currentSymbol += char

                    break
            }

            this._lastChar = char
        }

        this._applyCurrentOperator()

        if (this._currentSymbol) {
            this._addCurrentSymbolToStack()
            this._popStack()
        }

        while (this._callStack.length > 0) {
            this._popStack()
        }

        const finalResult = this._finalResult
        this._reset()

        return finalResult
    }

    /**
     * Parse and execute the formula, then return the result.
     * 
     * @param {string} formula - An arithmetic formula. For supported operators and functions, see the constructor.
     * @param {Object | undefined} record - A record. Required if any {{token}} can be found in the formula
     * @param {Array<string> | undefined} propertiesList - A list of record properties sorted in a way such as {{index}} will be resolved as a record property.
     * @returns {*} - The result
     */
    parse(formula, record, propertiesList = undefined) {
        try {
            return this._parse(formula, record, propertiesList)
        } catch(err) {
            this._reset()

            throw err
        }
    }

    /**
     * Completely resets the parser state
     */
    _reset() {
        this._callStack = []
        this._lastChar = ''
        this._currentChar = ''
        this._currentRecord = {}
        this._currentSymbol = ''
        this._currentPosition = ''
        this._currentOperator = ''
        this._openCurlyBracket = 0
        this._currentRecordPropertiesList = []
        this._chainedBackslashes = 0
        this._openString = {
            singleQuote: false,
            doubleQuote: false
        }
        this._finalResult = undefined
    }
}

;