/**
 * 
 * Define a command interface for all non standard operations.
 * 
 * Each command URL stars with /command and is composed of:
 * - a domain
 * - an action
 * 
 * Examples:
 * /command/workflow/start
 * /command/mail/send
 * 
 * Required: the action name can't start with an underscore ( _ )
 * to prevent using private methods of the called module
 */
 const  {
	API : {
		BadRequest,
	}
} = require('../core/errors')


const commandController = {
    async process(req, res, next){
        const domain = req.path_1
        const command = req.path_2

        // log("kiss.commands - DOMAIN: /" + domain)
        // log("kiss.commands - ACTION: /" + command)

        const controller = kiss.routes.commands[domain]
        if (!controller) throw new BadRequest(
			"kiss.commands - Couldn't find the DOMAIN called <" + domain + ">"
        )

        const method = controller[command]
        if (!method || command[0] == "_") throw new BadRequest(
			"kiss.commands - Couldn't find the ACTION <" + command + "> for DOMAIN <" + domain + ">"
        )

        await method(req, res, next)
    }
}

module.exports = commandController