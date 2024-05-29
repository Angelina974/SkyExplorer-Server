/**
 * 
 * Default routes
 * 
 */
const wwwController = require("../controllers/www")
const defaultController = require("../controllers/default")
const authenticationController = require("../controllers/authentication")
const relationshipsController = require("../controllers/relationships")
const filesController = require("../controllers/files")
const commandController = require("../controllers/command")
const subscription = require("../controllers/stripeSubscription")

module.exports = {
    "notFound": (req, res) => res.status(404).end(),

    // Controller to get the server environment
    // Allows the client to know if the server is running in local, heroku, production, onpremise...
    "getEnvironment": (req, res) => res.json({
        environment: process.env.NODE_ENV
    }),

    // Tokens
    "checkTokenValidity": authenticationController.checkTokenValidity,
    "refreshToken": authenticationController.refreshToken,
    "createApiToken": authenticationController.createApiToken,
    "revokeApiToken": authenticationController.revokeApiToken,
    "getApiClients": authenticationController.getApiClients,

    // Registration
    "register": authenticationController.register,
    "activate": authenticationController.activate,
    "login": authenticationController.login,
    "logout": authenticationController.logout,

    // Password reset
    "requestPasswordReset": authenticationController.requestPasswordReset,
    "resetPassword": authenticationController.resetPassword,

    // Invitations
    "invite": authenticationController.invite,
    "resendInvite": authenticationController.resendInvite,
    "deleteInvite": authenticationController.deleteInvite,
    "join": authenticationController.join,

    // Users
    "getUsers": authenticationController.getUsers,
    "deleteUser": authenticationController.deleteUser,

    // Collaborators
    "switchAccount": authenticationController.switchAccount,
    "quitAccount": authenticationController.quitAccount,
    "acceptInvitationOf": authenticationController.acceptInvitationOf,
    "rejectInvitationOf": authenticationController.rejectInvitationOf,
    "getCollaborators": authenticationController.getCollaborators,

    // Stripe subscription
    "getSubscriptionPlans": subscription.getSubscriptionPlans,
    "subscribe": subscription.subscribe,
    "subscribeSuccess": subscription.subscribeSuccess,
    "subscribeError": subscription.subscribeError,
    "stripeWebhooks": subscription.stripeWebhooks,
    "stripeCreatePortal": subscription.stripeCreatePortal,
    "listInvoices": subscription.listInvoices,

    // File Uploads
    "updateFileACL": filesController.updateFileACL,
    "urlToBase64": filesController.urlToBase64,
    "boxConnect": filesController.boxConnect,
    "boxAccessToken": filesController.boxAccessToken,
    "boxFileDetail": filesController.boxFileDetail,
    "googleImageSearch": filesController.googleImageSearch,
    "multiUrlToBase64": filesController.multiUrlToBase64,

    // Amazon S3 custom setup
    "s3Setup": filesController.s3Setup,
    "resetS3Setup": filesController.resetS3Setup,
    "getS3Setup": filesController.getS3Setup,
    "getS3Buckets": filesController.getS3Buckets,
    "getS3BucketRegion": filesController.getS3BucketRegion,

    // Instagram auth and fetch user feed posts 
    "instagramOauth": filesController.instaAccessToken,
    "instagramMedia": filesController.getInstaFeeds,

    // Accounts, users, groups, API clients
    "account": defaultController.process,
    "user": defaultController.process,
    "group": defaultController.process,
    "apiClient": defaultController.process,

    // It's a generic controller for custom dynamic data models, and provides a "free json api" (schemaless)
    // The middleware "routeToController" will route all requests with RFC4122 format to this controller
    "data": defaultController.process,

    // Controller to save view parameters
    "view": defaultController.process,

    // Controller for bulk operations (which can impact multiple and mixed collections)
    "bulk": defaultController.process,

    // Store data deleted using soft deletion
    "trash": defaultController.process,

    // File records hold the file uploads informations (stored locally or externally on Amazon S3)
    "file": defaultController.process,

    // "Link" records hold all the relationships between records
    "link": defaultController.process,

    // Relationships controller
    "updateLink": relationshipsController.updateLink,
    "updateAllDeep": relationshipsController.updateAllDeep,
    "updateFieldsRelationships": relationshipsController.updateFieldsRelationships,

    // Generic command controller allows to send non-REST commands to the API
    // Examples: /command/workflow/start, /command/template/generate, /command/import/analyze
    "command": commandController.process,

    // Experimental controller for public pages
    // Work in progress: route to pre-generated static pages for SEO
    "www": wwwController.process
}