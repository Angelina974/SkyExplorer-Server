module.exports = {
    // Simple arithmetic
    "1": 1,
    "1 + 2": 3,
    "-1": -1,
    "1 + -3": -2,
    "2 + 4 < 4 * 6": true,
    "2 + 4 > 4 - 1": true,

    // Too many parenthesis
    "(((3)))": 3,
    "(2) + (4) * (5)": 22,
    "((2) + ((4) * (5)))": 22,
    "((2) + (4)) * (5)": 30,

    // Arithmetic with function calls
    "2 + (3 - (3 * 4)) + SUM(4, 4) * 4": 25,
    "10 / SUM(0.5, 1.5)": 5,
    "10 * PI()": Math.PI * 10,
    "PI()": Math.PI,
    "PI() * 10": Math.PI * 10,

    // Type coercion
    '"2" * "10"': 20,

    // unary postModifiers
    "!4": false,
    "!SUM(2, 4)": false,
    "!SUM(0, 0)": true,

    // Logical operators
    "true || false": true,
    "true && false": false,
    "true && !false": true,
    "!true && !false": false,

    // Comparisons
    "10 > 8": true,
    "{{ten}} > 8": [
        { ten: 10 },
        true
    ],
    "{{ten}}} > 8": [
        { ten: 10 },
        new Error(),
    ],
    "10 > 12": false,
    "{{ten}} > 12": [
        { ten: 10 },
        false
    ],
    "10 >= 10": true,
    "{{ten}} >= 10": [
        { ten: 10 },
        true
    ],
    "10 >= 12": false,
    "{{ten}} >= 12": [
        { ten: 10 },
        false
    ],
    "8 < 10": true,
    "{{eight}} < 10": [
        { eight: 8 },
        true
    ],
    "8 < 5": false,
    "{{eight}} < 5": [
        { eight: 8 },
        false
    ],
    "8 <= 10": true,
    "8 <= 5": false,
    "8 == 8": true,
    "8 == '8'": true,
    "true == 1": true,
    "true != 1": false,
    "true != 10": true,
    "true != false": true,
    "8 === 8": true,
    "{{eight}} === 8": [
        { eight: 8 },
        true
    ],
    "{{0}} === 8": [
        { eight: 8 },
        true
    ],
    "8 === '8'": false,
    "{{eight}} === '8'": [
        { eight: 8 },
        false
    ],
    "true === 1": false,
    "true !== 1": true,
    "true !== true": false,

    // With space in record property:
    "{{Montant TTC}} === 8": [
        { 'Montant TTC': 8 },
        true,
    ],

    // Double quotes string
    '"1 + 2"': "1 + 2",
    '"(1 + 2) + 8 * 4 + SUM(3, PI())"': "(1 + 2) + 8 * 4 + SUM(3, PI())",
    '"test"': "test",
    '"test" + "test"': "testtest",
    '"test" - "test"': NaN,

    // Single quotes string
    "'1 + 2'": "1 + 2",
    "'(1 + 2) + 8 * 4 + SUM(3, PI())'": "(1 + 2) + 8 * 4 + SUM(3, PI())",
    "'test'": "test",
    "'test' + 'test'": "testtest",
    "'test' + 'test' + 'test'": "testtesttest",
    "'test' - 'test'": NaN,

    // String concat
    "'The value is: ' + {{value}} + '!'": [
        { value: 42 },
        'The value is: 42!',
    ],

    'IF ({{Flag}} >= 5, {{Flag}} * 2, 0)': [
        { Flag: 10 },
        20
    ],
    'IF ({{Flag}} >= 7, {{Flag}}, 0)': [
        { Flag: 10 },
        10
    ],
    'IF ({{Flag}} >= 10, {{Flag}} * 2, 0)': [
        { Flag: 5 },
        0
    ],
    'IF ({{Flag}} >= 10, {{Flag}} * 2, {{Flag}} * 10)': [
        { Flag: 5 },
        50
    ],

    // Complex function calls
    'IF ( SUM( {{MontantHT}}, {{MontantTVA}} ) < {{MontantTTC}}, "ERREUR DE TVA !!!", "OK" )': [
        { MontantHT: 100, MontantTVA: 20, MontantTTC: 120 },
        "OK"
    ],
    'IF ( SUM( {{0}}, {{1}} ) < {{2}}, "ERREUR DE TVA !!!", "OK" )': [
        { MontantHT: 100, MontantTVA: 20, MontantTTC: 120 },
        "OK"
    ],
    'IF ( SUM( {{MontantHT}}, {{MontantTVA}} ) < {{MontantTTC}}, "ERREUR DE TVA !!!!", "OK" )': [
        { MontantHT: 100, MontantTVA: 20, MontantTTC: 240 },
        "ERREUR DE TVA !!!!"
    ],
    'IF ( SUM( {{0}}, {{1}} ) < {{2}}, "ERREUR DE TVA !!!!", "OK" )': [
        { MontantHT: 100, MontantTVA: 20, MontantTTC: 240 },
        "ERREUR DE TVA !!!!"
    ],

    [`
    if ({{Mettre en option}} == "Oui") {
        "0.00" }
        else {
        {{Quantité}} * {{P.U Net HT}}
        }
    `]: [
        {
            'Mettre en option': 'Oui',
            'Quantité': 10,
            'P.U Net HT': 100,
        },
        new Error(),
    ],
    '{{P.U HT}} - ({{P.U HT}}*({{% Marge commerciale}}/100))': [
        {
            'P.U HT': 100,
            '% Marge commerciale': 10,
        },
        90,
    ],
    '( ( {{Total HT Produits}} - ( {{Total HT Produits}} - {{Total HT Marge Produits}} ) ) / {{Total HT Produits}} ) * 100': [
        {
            'Total HT Produits': 100,
            'Total HT Marge Produits': 50,
        },
        50,
    ],

    // Parenthesis mix-up with binary operator an a lack of spaces when tags where involved is a tricky one :)
    // In this scenario, this passed without problem.
    '(({{Total HT Produits}}-({{Total HT Produits}}-{{Total HT Marge Produits}}))/ {{Total HT Produits}})*100': [
        {
            'Total HT Produits': 100,
            'Total HT Marge Produits': 50,
        },
        50,
    ],

    // But (related to the previous comment): this one wouldn't pass :)
    '(({{Total HT Produits}}-({{Total HT Produits}}-{{Total HT Marge Produits}}))/{{Total HT Produits}})*100': [
        {
            'Total HT Produits': 100,
            'Total HT Marge Produits': 50,
        },
        50,
    ],

    // Incompatibles with kiss.tools.sandbox
    // To run the formula.perf.test, you must comment every lines below:

    // unary preModifiers
    "4!": 24,
    "-4!": -24,
    "!4!": 1,
    "!(4!)": false,
    "SUM(2, 2)!": 24,
    "SUM(0, -4)!": -24,
    "-SUM(2, 2)": -4,
    "'test: ' + (4!)": 'test: 24',

    // Escaping
    '"\\""': '"',
    '"With escaped \\\\"': 'With escaped \\',

    // Octal, hexadecimal and binary numbers
    '\\x1 + \\x1': 2,
    '\\xA + \\xB': 21,
    '\\o1 + \\o1': 2,
    '\\o4 + \\o4': 8,
    '\\b101 + \\b101': 10,
}

;