const { KissError } = require('../errors/errors')

class DBFailure extends KissError{}
class DBConnectionFailure extends DBFailure{}
class DBQueryFailure extends DBFailure{}


module.exports = {
	DBFailure,
	DBConnectionFailure,
	DBQueryFailure
}