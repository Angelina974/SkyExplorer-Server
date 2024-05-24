/**
 * 
 * Authentication for Facebook (and indrectly Instagram)
 * 
 */
const config = require("../../config")
const authentication = require("../authentication")
const passport = require("passport")
const FacebookStrategy = require("passport-facebook").Strategy

// Passport needs to be able to serialize users into, and deserialize users out of the session
authentication.initPassportSerializer(passport)

// Use the FacebookStrategy within Passport
passport.use(new FacebookStrategy({
        clientID: config.authentication.facebook.clientID,
        clientSecret: config.authentication.facebook.clientSecret,
        callbackURL: `https://${config.host}` + config.authentication.facebook.callbackURL,
        profileFields: ["id", "displayName", "photos", "email"],
    },

    async function (accessToken, refreshToken, profile, done) {
        const userProfile = profile._json

        log("kiss.server.authentication - Facebook - User:", userProfile)

        // Create User Profile Data 
        const userData = {
            _id: kiss.tools.uid(),
            firstName: userProfile.name,
            lastName: "",
            email: userProfile.email,
            socialId: userProfile.id,
            loginType: "facebook",
            active: true
        }

        try {
            await authentication.loginOrRegisterFromExternalService(userData, profile, "facebook", done)
        } catch (err) {
            log.err("kiss.server.authentication - Facebook - Failed: ", err)
        }
    }
))