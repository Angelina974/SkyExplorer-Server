const assert = require('assert');

process.env.NODE_ENV = 'local';

require('../../server/kiss.js');
require('../../common/formula.js');
require('../../common/Parser.js');
require('../../common/ParserOperators.js');

const ResultTests = require('./formula.dictionnary.test')

describe('Kiss.formula', ( ) => {
	describe('parse', () => {
		Object.entries(ResultTests).forEach(([ formule, result ]) => {
            let record = {}

            if (Array.isArray(result)) {
                record = result[0]
                result = result[1]
            }

            if (result instanceof Error) {
                it(`Should throw an error for "${formule}"`, () => {
                    assert.throws(
                        () =>  kiss.formula.execute(
                            formule,
                            record,
                            // Little hack to conform to the expected integration and add support for numeric indexes.
                            Object.keys(record)
                                .map(key => ({label: key, id: key}))),
                    );
                });
            } else {
                it(`Should return ${result} for "${formule}"`, () => {
                    assert.strictEqual(
                        kiss.formula.execute(
                            formule,
                            record,
                            // Little hack to conform to the expected integration and add support for numeric indexes.
                            Object.keys(record)
                                .map(key => ({label: key, id: key}))),
                        result
                    );
                });
            }
		});
	});
})

;