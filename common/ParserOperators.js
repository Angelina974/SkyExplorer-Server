/**
 * @typedef {'binary' | 'unary.preModifier' | 'unary.postModifier'} ParserOperatorType
 * @description
 * - **binary**: takes two operands as argument in this order: left, right
 * - **unary.preModifier**: modifies what comes before the operator (ex: 4! is factorial 4 -> 24)
 * - **unary.postModifier**: modifies what comes after the operator (ex: !true is negate true -> false)
 * @ignore
 */

/**
 * @typedef ParserOperatorDefinition
 * @property {number} precedence - The higher, the most priority the operator will get over the others.
 * @property {Function} operation - The function to execute when the operator is being used.
 * @property {ParserOperatorType} type - The type of operator.
 * @ignore
 */

/**
 * List of operators available to a parser. Can be enriched by modifying this file, or just with constructor arguments at runtime.
 * 
 * @ignore
 */
kiss.lib.formula.ParserOperators = class ParserOperators{
    // region Default operators

    /**
     * Symbols are used for the parser to be able to make the difference between an operator and its string representation.
     *
     * Ex: Without symbol, the expression "'test' + '+'" would throw an error instead of printing 'test+',
     * because the last '+' char would have been interpreted as an operator.
     */
    symbols = {
        unary: {
            preModifier: {
                '!': Symbol('!')
            },
            postModifier: {
                '~': Symbol('~'),
                '!': Symbol('!'),
                '-': Symbol('-')
            }
        },
        binary: {
            '+': Symbol('+'),
            '-': Symbol('-'),
            '/': Symbol('/'),
            '%': Symbol('%'),
            '*': Symbol('*'),
            '|': Symbol('|'),
            '&': Symbol('&'),
            '^': Symbol('^'),
            '&&': Symbol('&&'),
            '||': Symbol('||'),
            '<': Symbol('<'),
            '<=': Symbol('<='),
            '>': Symbol('>'),
            '>=': Symbol('>='),
            '??': Symbol('??'),
            '==': Symbol('=='),
            '!=': Symbol('!='),
            '!==': Symbol('!=='),
            '===': Symbol('===')
        }
    }

    unary = {
        preModifier: {
            // Factorial
            [this.symbols.unary.preModifier['!']]: (operand) => {
                let isPositive = operand >= 0

                operand = Math.abs(operand)

                let result = operand

                if (operand === 0 || operand === 1){
                    return 1
                }

                while (operand > 1) {
                    operand--;
                    result *= operand;
                }

                return isPositive ? result : -result;
            }
        },

        // Modify what follows (as opposed to preModifiers that would modify what was before.
        postModifier: {
            [this.symbols.unary.postModifier['~']]: (operand) => {
                return ~operand
            },
            [this.symbols.unary.postModifier['!']]: (operand) => {
                return !operand
            },
            [this.symbols.unary.postModifier['-']]: (operand) => {
                return -operand
            }
        },
    }

    binary = {
        [this.symbols.binary['+']]: (leftOperand, rightOperand) => {
            return leftOperand + rightOperand
        },
        [this.symbols.binary['-']]: (leftOperand, rightOperand) => {
            return leftOperand - rightOperand
        },
        [this.symbols.binary['/']]: (leftOperand, rightOperand) => {
            return leftOperand / rightOperand
        },
        [this.symbols.binary['%']]: (leftOperand, rightOperand) => {
            return leftOperand % rightOperand
        },
        [this.symbols.binary['*']]: (leftOperand, rightOperand) => {
            return leftOperand * rightOperand
        },
        [this.symbols.binary['|']]: (leftOperand, rightOperand) => {
            return leftOperand | rightOperand
        },
        [this.symbols.binary['&']]: (leftOperand, rightOperand) => {
            return leftOperand & rightOperand
        },
        [this.symbols.binary['^']]: (leftOperand, rightOperand) => {
            return leftOperand ^ rightOperand
        },
        [this.symbols.binary['&&']]: (leftOperand, rightOperand) => {
            return leftOperand && rightOperand
        },
        [this.symbols.binary['||']]: (leftOperand, rightOperand) => {
            return leftOperand || rightOperand
        },
        [this.symbols.binary['<']]: (leftOperand, rightOperand) => {
            return leftOperand < rightOperand
        },
        [this.symbols.binary['<=']]: (leftOperand, rightOperand) => {
            return leftOperand <= rightOperand
        },
        [this.symbols.binary['>']]: (leftOperand, rightOperand) => {
            return leftOperand > rightOperand
        },
        [this.symbols.binary['>=']]: (leftOperand, rightOperand) => {
            return leftOperand >= rightOperand
        },
        [this.symbols.binary['??']]: (leftOperand, rightOperand) => {
            return leftOperand ?? rightOperand
        },
        [this.symbols.binary['==']]: (leftOperand, rightOperand) => {
            return leftOperand == rightOperand
        },
        [this.symbols.binary['!=']]: (leftOperand, rightOperand) => {
            return leftOperand != rightOperand
        },
        [this.symbols.binary['===']]: (leftOperand, rightOperand) => {
            return leftOperand === rightOperand
        },
        [this.symbols.binary['!==']]: (leftOperand, rightOperand) => {
            return leftOperand !== rightOperand
        }
    }

    precedence = {
        [this.symbols.binary['&&']]: 100, // Always applied in priority
        [this.symbols.binary['||']]: 50,
        [this.symbols.binary['/']]: 50,
        [this.symbols.binary['%']]: 50,
        [this.symbols.binary['*']]: 50,
        [this.symbols.binary['|']]: 20,
        [this.symbols.binary['+']]: 25,
        [this.symbols.binary['-']]: 25,
        [this.symbols.binary['&']]: 20,
        [this.symbols.binary['^']]: 20,

        // Comparison operators must have the lowest value
        [this.symbols.binary['<']]: 10,
        [this.symbols.binary['<=']]: 10,
        [this.symbols.binary['>']]: 10,
        [this.symbols.binary['>=']]: 10,
        [this.symbols.binary['??']]: 10,
        [this.symbols.binary['==']]: 10,
        [this.symbols.binary['!=']]: 10,
        [this.symbols.binary['===']]: 10,
        [this.symbols.binary['!==']]: 10,
    }

    /**
     * Will contain a list of all available operators and all their composition.
     *
     * @ignore
     * @example
     * '===', '>=', '>', '&&', operatorCandidates will contain keys '=', '==', '===', '>', '>=', '&', '&&'
     */
    operatorCandidates = {}

    // endregion

    /**
     * @ignore
     * @param {Object} [opts = {}] - Operators options
     * @param {Object<string, ParserOperatorDefinition>} [opts.operators = {}] - List of operators to add. The key is the operator name.
     */
    constructor(
        {
            operators = {}
        } = {}
    ) {
        Object.entries(operators).forEach(
            /**
             * @ignore
             * @param {string} operatorName - The key is the operator name
             * @param {ParserOperatorDefinition} operatorDefinition - The operator definition
             */
            ([operatorName, operatorDefinition]) => {
                const {
                    precedence = 10,
                    type = 'binary',
                    operation
                } = operatorDefinition

                const errorHeader = `Operator "${operatorName}" definition error: `

                if (!operatorName) {
                    throw new TypeError(`${errorHeader}An empty string is not a valid operator name`)
                }

                if (!Number.isInteger(precedence)) {
                    throw new TypeError(
                        `${errorHeader}Invalid preference for operator "${operatorName}". Expecting integer, got ${typeof precedence}`
                    )
                }

                if (!(typeof operation !== 'function')) {
                    throw new TypeError(
                        `${errorHeader}Operation must be a function`
                    )
                }

                const operatorSymbol = Symbol(operatorName)

                switch(type) {
                    case 'binary':
                        this.symbols.binary[operatorName] = operatorSymbol
                        this.binary[operatorSymbol] = operation
                        this.precedence[operatorSymbol] = precedence
                        break
                    case 'unary.postModifier':
                        this.symbols.unary.postModifier[operatorName] = operatorSymbol
                        this.unary.postModifier[operatorSymbol] = operation
                        this.precedence[operatorSymbol] = precedence
                        break
                    case 'unary.preModifier':
                        this.symbols.unary.preModifier[operatorName] = operatorSymbol
                        this.unary.preModifier[operatorSymbol] = operation
                        this.precedence[operatorSymbol] = precedence
                        break
                    default: throw new TypeError(
                        `Unsupported operator type ${type}. Allowed: 'binary', 'unary.preModifier', 'unary.postModifier'`
                    )
                }
            }
        )

        const operatorKeys = new Set([
            ...Object.keys(this.symbols.unary.preModifier),
            ...Object.keys(this.symbols.unary.postModifier),
            ...Object.keys(this.symbols.binary)
        ])

        for (const operatorKey of operatorKeys) {
            this.operatorCandidates[operatorKey] = true

            const split = operatorKey.split('')

            let derived = ''
            while (split.length) {
                derived += split.shift()

                this.operatorCandidates[derived] = true
            }
        }
    }

    /**
     * Transform an infix expression into a postfix expression.
     *
     * @ignore
     * @param {number[]|Symbol[]} infix - An infix expression as an array of operators and numbers
     * @returns {(number[]|Symbol[])}
     */
    _infixToPostfix(infix){
        const output = [];
        const operators = [];

        for (let token of infix) {
            if (this.isAnOperator(token)) {
                while (
                    operators.length
                    && this.precedence[operators[operators.length - 1]] >= this.precedence[token]
                ) {
                    output.push(operators.pop())
                }

                operators.push(token)
            } else {
                output.push(token)
            }
        }

        while (operators.length) {
            output.push(operators.pop())
        }

        return output;
    }

    /**
     * An identity operator is modeling a computation priorisation by parenthesis. It only returns its argument.
     * The computation inside it have already been done at this stage.
     *
     * @ignore
     * @param res - The result to return.
     * @param rest - Used to detect a possible defect in the parser. This should never happen.
     * @returns {*} - The provided first parameter as is.
     */
    identity(res, ...rest) {
        if (rest.length > 0) {
            console.error({res, rest})

            // This should never happen.
            throw new Error(
                'Formula execution error: an identity operator can`t accept more than one argument.'
            )
        }

        return res;
    }

    /**
     * Take an infix expression under the form of an array of operand and operators (note that
     * parenthesis must have already been resolved at this point).
     *
     * @ignore
     * @param {...(Symbol|number)} args
     * @returns {number}
     */
    expression(...args) {
        if (args.length === 1) {
            return args[0]
        }

        const postfix = this._infixToPostfix(args)
        const stack = []

        for (let token of postfix) {
            // Any operator from this point is a binary operator
            if (token in this.binary) {
                const b = stack.pop()
                const a = stack.pop()

                stack.push(this.binary[token](a, b))
            } else {
                stack.push(token)
            }
        }

        return stack[0]
    }

    /**
     * Return true if the given string is an operator
     *
     * @ignore
     * @param {Symbol} symbol - The symbol we're testing
     * @returns {boolean}
     */
    isAnOperator(symbol) {
        return symbol in this.unary.postModifier
            || symbol in this.unary.preModifier
            || symbol in this.binary
    }

    /**
     * Return true if the provided string is a potential operator. For multichars operators,
     * this method will return true even if the candidate is only a "partial" operator and
     * no complete operator is matching it.
     *
     * @ignore
     * @param {string} candidate - A string candidate for an operator
     * @returns {boolean}
     * 
     * @example
     * For operator "===", the following candidates will return true: "=", "==", "==="
     */
    isAnOperatorCandidate(candidate) {
        return candidate in this.operatorCandidates
    }

    /**
     * Return true if the given operator is a real operator. Only matches exact operators.
     *
     * @ignore
     * @param {string} operator - String representation of an operator
     * @returns {boolean} - True if this operator exists
     */
    isAnOperatorString(operator) {
        return operator in this.symbols.unary.postModifier
            || operator in this.symbols.unary.preModifier
            || operator in this.symbols.binary
    }

    /**
     * Parse an operator string representation into an operator symbol.
     *
     * @ignore
     * @param {ParserOperatorType} type - Operator type.
     * @param {string} candidate - The candidate to parse into an operator Symbol
     * @throws {TypeError} - If the candidate is not an operator candidate or if the operator type is not supported.
     * @returns {Symbol}
     */
    parseOperator(type, candidate) {
        if(!this.isAnOperatorCandidate(candidate)) {
            throw new TypeError(`${candidate} is not a valid operator!`)
        }

        switch(type) {
            case 'binary':
                return this.symbols.binary[candidate]
            case 'unary.preModifier':
                return this.symbols.unary.preModifier[candidate]
            case 'unary.postModifier':
                return this.symbols.unary.postModifier[candidate]
            default:
                throw new TypeError(
                    `Unsupported operator type ${
                        type
                    }. Allowed: 'binary', 'unary.preModifier', 'unary.postModifier`
                )
        }
    }
}

;