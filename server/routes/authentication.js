/**
 *
 * Authentication routes for external service providers:
 * - Google
 * - Microsoft Azure Active Directory
 * - Microsoft 365
 * - LinkedIn
 * - Facebook (and indirectly Instagram)
 *
 * - Roadmap:
 * - Instagram
 * - Twitter
 *
 * For all those controllers:
 * - use passport.authenticate() as route middleware to authenticate the request
 * - if authentication fails, the user will be redirected back to the login page
 * - otherwise, the primary route function will be called, which, in this example, will redirect the user to the home page
 *
 */
const express = require("express")
const router = express.Router()
const passport = require("passport")
const config = require("../config")

const {
	API: {
		NotFound
	}
} = require('../core/errors')

/**
 * Common callback for all authentication strategies
 */
function authCallback(req, res) {
	const jwtToken = req.user && req.user.jwtToken

	let { state } = req.query || {}
	state = state
		? JSON.parse(Buffer.from(state, 'base64').toString('utf8'))
		: {}

	let { acceptInvitationOf } = state

	if (acceptInvitationOf) acceptInvitationOf = `&acceptInvitationOf=${acceptInvitationOf}`
	else acceptInvitationOf = ''

	if (jwtToken) {
		// Registration or authentication success: redirect to login page
		// which will automatically handle the provided token and navigate to the home page
        res.redirect(config.authentication.redirectTo.login + "&token=" + jwtToken + acceptInvitationOf)
    } else {
        // Registration failure: user already exists
        res.redirect(config.authentication.redirectTo.userAlreadyExists)
    }
}

/**
 * Default route
 */
router.get("/", (req, res) => {
    res.redirect(config.authentication.redirectTo.home)
})

const AUTH_SERVICES = {
	google: {
		options: {
			scope: [
				"https://www.googleapis.com/auth/userinfo.profile",
				"https://www.googleapis.com/auth/userinfo.email"
			],
			paramId: 123456
		}
	},
	azureAd: {
		passportName: "azuread-openidconnect",
		options: {}
	},
	linkedin: {
		options: {}
	},
	facebook: {
		options: {
			scope: ["public_profile", "email"]
		}
	},
	twitter: {
		options: {}
	}
}
const FAILURE_REDIRECTION = "//" + config.host + config.authentication.redirectTo.error

// We create all callback handlers
for (let service in AUTH_SERVICES) {
	AUTH_SERVICES[service].callbackAuthenticator = passport.authenticate(
		AUTH_SERVICES[service].passportName || service,
		{
			failureRedirect: FAILURE_REDIRECTION
		}
	)
}

// General handler for the /auth route.
router.all('/auth/*', (req, res, next) => {

	let provider = (
		req.url.split('?')?.shift()
			   ?.split('/')[2]
		|| ''
	)

	if (provider in AUTH_SERVICES){
		// The client requests a 3rd party authentication
		const state = req.query
			? Buffer.from(JSON.stringify(req.query)).toString('base64')
			: undefined

		passport.authenticate(
			AUTH_SERVICES[provider].passportName ?? provider,
			Object.assign({}, AUTH_SERVICES[provider].options, { state })
		)(req, res, next)

	} else {

		// It may be a 3rd party service that calls a callback url
		if(!provider.match(/Callback$/)) return next(new NotFound())

		provider = provider.replace(/Callback$/, '')
		if(!(provider in AUTH_SERVICES)) return next(new NotFound())

		AUTH_SERVICES[provider].callbackAuthenticator(req, res, next)
	}
}, authCallback)

module.exports = router