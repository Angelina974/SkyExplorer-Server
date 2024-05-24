/**
 * 
 * Authentication for LinkedIn
 * 
 */
const config = require("../../config")
const authentication = require("../authentication")
const passport = require("passport")
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy

// Passport needs to be able to serialize users into, and deserialize users out of the session
authentication.initPassportSerializer(passport)

// Use the LinkedInStrategy within Passport
passport.use(new LinkedInStrategy({
		clientID: config.authentication.linkedin.clientID,
		clientSecret: config.authentication.linkedin.clientSecret,
		callbackURL: `https://${config.host}` + config.authentication.linkedin.callbackURL,
		scope: ["r_emailaddress", "r_liteprofile"],
		state: config.authentication.linkedin.verificationURL
	},

	async function (accessToken, refreshToken, profile, done) {
		log("kiss.server.authentication - LinkedIn - User:", profile)

		// Create User Profile Data 
		const userData = {
			_id: kiss.tools.uid(),
			firstName: profile.name.givenName,
			lastName: profile.name.familyName,
			email: profile.emails[0].value,
			socialId: profile.id,
			loginType: "linkedin",
			active: true,
		}

		try {
			await authentication.loginOrRegisterFromExternalService(userData, profile, "linkedin", done)
		} catch (err) {
			log.err("kiss.server.authentication - LinkedIn - Failed:", err)
		}
	}
))