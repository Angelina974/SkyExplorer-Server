/**
 * 
 * Authentication for Google
 * 
 */
const config = require("../../config")
const authentication = require("../authentication")
const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth2").Strategy

// Passport needs to be able to serialize users into, and deserialize users out of the session
authentication.initPassportSerializer(passport)

// Use the GoogleStrategy within Passport
passport.use(new GoogleStrategy({
        clientID: config.authentication.google.clientID,
        clientSecret: config.authentication.google.clientSecret,
        callbackURL: `https://${config.host}` + config.authentication.google.callbackURL,
        passReqToCallback: true,
    },

    async function (request, accessToken, refreshToken, profile, done) {
        const userProfile = profile._json

        log("kiss.server.authentication - Google - User:", userProfile)

        // Create User Profile Data 
        const userData = {
            _id: kiss.tools.uid(),
            firstName: userProfile.given_name,
            lastName: userProfile.family_name,
            name: userProfile.name,
            email: userProfile.email.toLowerCase(),
            socialId: userProfile.sub,
            loginType: "google",
            active: true
        }

        try {
            await authentication.loginOrRegisterFromExternalService(userData, profile, "google", done)
        } catch (err) {
            log.err("kiss.server.authentication - Google - Failed:", err)
        }
    }
))