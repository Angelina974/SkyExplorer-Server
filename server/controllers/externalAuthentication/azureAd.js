/**
 *
 * Authentication for Microsoft 365
 *
 */
const config = require("../../config")
const authentication = require("../authentication")
const passport = require("passport")
const {
	OIDCStrategy
} = require("passport-azure-ad")

// Passport needs to be able to serialize users into, and deserialize users out of the session
authentication.initPassportSerializer(passport)

// Use the MicrosoftStrategy within Passport
passport.use(new OIDCStrategy({
		identityMetadata: "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
		clientID: config.authentication.AzureAd.clientID,
		clientSecret: config.authentication.AzureAd.clientSecret,
		redirectUrl: `https://${config.host}` + config.authentication.AzureAd.callbackURL,
		scope: ["email", "profile", "openid"],
		responseType: "code id_token",
		responseMode: "form_post",
		useCookieInsteadOfSession: true,
		cookieEncryptionKeys: [{
				"key": "d7c470fc-d242-47be-a32e-f75bddb2",
				"iv": "65240fc2a86e"
			},
			{
				"key": "de93d123-f3ce-4f70-ad53-1e6f0e72",
				"iv": "f3cd919609b4"
			}
		],
		validateIssuer: false,
		issuer: null
	},

	async function (accessToken, refreshToken, profile, done) {
		const userProfile = profile._json

		log("kiss.server.authentication - Microsoft - User:", userProfile)

		const firstName = userProfile.name.leftString(" ")
		const lastName = userProfile.name.rightString(" ")

		// Create User Profile Data
		const userData = {
			_id: kiss.tools.uid(),
			firstName,
			lastName,
			email: userProfile.email,
			socialId: userProfile.oid,
			loginType: "microsoft",
			active: true,
		}

		try {
			await authentication.loginOrRegisterFromExternalService(userData, profile, "microsoft", done)
		} catch (err) {
			log.err("kiss.server.authentication - Microsoft - Failed:", err)
		}
	}
))