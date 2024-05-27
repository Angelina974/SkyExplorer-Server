/**
 *
 * Environment variables
 *
 * You can select the executing environment using the command: npm run <env>
 *
 * @example
 * npm run local
 * npm run remote
 * npm run heroku
 * npm run production
 * npm run production-docx2pdf
 *
 */
const path = require("path")
const fs = require("fs")


//
// ENVIRONMENT ----------------------------------------
//
const envFileName = `.env${process.env.NODE_ENV && `.${process.env.NODE_ENV}`}`
const pathToEnvFile = path.resolve(__dirname, "config", envFileName)
require("dotenv").config({
	path: pathToEnvFile
})
const env = process.env


//
// LOGGER ----------------------------------------
//
const logger = require("./core/logger")
let logTypes = ["*"]
if (env.LOG_TYPES) {
	logTypes = env.LOG_TYPES.split(",").map(str => {
		return str === "*" ? str : Number.parseInt(str)
	})
}

let logCategories = ["*"]
if (env.LOG_CATEGS) {
	logCategories = env.LOG_CATEGS.split(",").map(str => str.trim())
}

const logs = {
	data: !!Number.parseInt(env.LOG_DATA ?? 1),
	types: logTypes,
	categories: logCategories
}

log = logger.init(logs)


//
// EXIT CODES ----------------------------------------
//
const {
	EXIT_CODES
} = require("./errors/constants")


//
// HTTP & WEBSOCKET SERVERS ----------------------------------------
//
const serverMode = env.SERVER_MODE || "both"

// We need a well known value, since server behaviour depends on it.
if (!["secure", "insecure", "both"].includes(serverMode)) {
	log.err(`kiss.server.config - Unknown server mode "${serverMode}"`, 4)
	process.exit(EXIT_CODES.UNSUPPORTED_CONFIG_VALUE)
}

// Http
const httpPort = Number.parseInt(env.PORT)
const httpsPort = Number.parseInt(env.HTTPS_PORT)

// Websocket
const websocketServer = env.WS_SERVER || "websocket-node"
const expressCompatibility = !!Number.parseInt(env.WS_EXPRESS_COMPAT)

let wsPort = env.WS_SERVER === "websocket-node" ? env.PORT : Number.parseInt(env.WS_PORT)
let wssPort = env.WS_SERVER === "websocket-node" ? env.HTTPS_PORT : Number.parseInt(env.WSS_PORT)

// If experimental compatibility with express is enabled for uWebSocket, we overwrite ports to unify them
if (websocketServer === "uWebSocket" && expressCompatibility) {
	if (["secure", "both"].includes(serverMode)) {
		wssPort = httpsPort
	}

	if (["insecure", "both"].includes(serverMode)) {
		wsPort = httpPort
	}
} else if (expressCompatibility) {
	log.warn("kiss.server.config - WS_EXPRESS_COMPAT is enabled, but WS_SERVER is not uWebSocket")
}

const isBehindProxy = !!Number.parseInt(env.PROXY)
if (isBehindProxy && ["secure", "both"].includes(serverMode)) {
	log.err(`kiss.server.config - Inconsistent configuration detected. You can't run secure endpoints behind a proxy! You must either pass SERVER_MODE to 'insecure' or WS_PROXY to 0!`)
	process.exit(EXIT_CODES.WRONG_CONFIG)
}


//
// ERROR REPORTING ----------------------------------------
//
const ERR_REPORTING_MODES = [
	"no",
	"mail"
]

let errorReportingMode = "no"
if (env.ERR_REPORTING_MODE) {
	errorReportingMode = env.ERR_REPORTING_MODE

	if (!ERR_REPORTING_MODES.includes(errorReportingMode)) {
		log.err(`kiss.config - ERR_REPORTING_MODE must be one of the following: ${ERR_REPORTING_MODES.join(", ")} but ${errorReportingMode} provided!`)
		process.exit(EXIT_CODES.UNSUPPORTED_CONFIG_VALUE)
	}
}

const ERR_REPORTING_POLICIES = [
	"instant",
	"periodic"
]

let errorReportingPolicy = "periodic"
if (env.ERR_REPORTING_POLICY) {
	errorReportingPolicy = env.ERR_REPORTING_POLICY

	if (!ERR_REPORTING_POLICIES.includes(errorReportingPolicy)) {
		log.err(`kiss.config - ERR_REPORTING_POLICY must be one of the following: ${ERR_REPORTING_POLICIES.join(", ")} but ${errorReportingPolicy} provided!`)
		process.exit(EXIT_CODES.UNSUPPORTED_CONFIG_VALUE)
	}
}

const errorReportingRecipients = (env.ERR_REPORTING_RECIPIENTS || "").split(",").map(
	mail => mail.trim()
)


//
// PDF CONVERTER ----------------------------------------
//
const PDF_CONVERTER_MODES = [
	"local",
	"remote"
]

let pdfConverterMode = "local"
if (env.PDF_CONVERTER_MODE) {
	pdfConverterMode = env.PDF_CONVERTER_MODE.toLowerCase()

	if (!PDF_CONVERTER_MODES.includes(pdfConverterMode)) {
		log.err(`kiss.config - PDF_CONVERTER_MODE must be one of the following: ${PDF_CONVERTER_MODES.join(", ")} but ${pdfConverterMode} provided!`)
		process.exit(EXIT_CODES.UNSUPPORTED_CONFIG_VALUE)
	}
}

if (
	pdfConverterMode === "remote" &&
	(
		!env.PDF_CONVERTER_KEY ||
		!env.PDF_CONVERTER_HOST
	)
) {
	log.err(`kiss.config - If PDF_CONVERTER_MODE is 'remote', PDF_CONVERTER_KEY and PDF_CONVERTER_HOST must be provided.`)
	process.exit(EXIT_CODES.WRONG_CONFIG)
}

let pdfConverterWorkDir = env.PDF_CONVERTER_WORK_DIR
if (pdfConverterWorkDir && !fs.existsSync(pdfConverterWorkDir)) fs.mkdirSync(
	pdfConverterWorkDir, {
		recursive: true,
		mode: "771"
	}
)

let pdfConverterAPIWorkDir = env.PDF_CONVERTER_API_WORK_DIR
if (
	// We don"t want to create a working dir if we"re not in a pdf converter context :)
	env.PDF_CONVERTER_API_ENABLED === "true" &&
	pdfConverterAPIWorkDir &&
	!fs.existsSync(pdfConverterAPIWorkDir)
) {
	fs.mkdirSync(
		pdfConverterAPIWorkDir, {
			recursive: true,
			mode: "771"
		}
	)
}

const UPLOAD_DESTINATIONS = [
	"local",
	"amazon_s3"
	/*
		"microsoft_azure_blob_storage",
		"google_cloud_storage"
	*/
]

const uploadDestination = env.UPLOAD_DESTINATION
if (!UPLOAD_DESTINATIONS.includes(uploadDestination)) {
	log.err(`kiss.config - Supported UPLOAD_DESTINATION must be one of the following: ${UPLOAD_DESTINATIONS.join(", ")} but ${uploadDestination} provided`)
	process.exit(EXIT_CODES.UNSUPPORTED_CONFIG_VALUE)
}

if (
	// We do not want to do this check in a Docx2pdf server.
	env.PDF_CONVERTER_API_ENABLED !== "true" &&
	uploadDestination === "local" &&
	pdfConverterMode !== "local"
) {
	log.err(`kiss.config - Unsupported configuration. If UPLOAD_DESTINATION is setup to 'local', PDF_CONVERTER_MODE must be 'local' too.`)
	process.exit(EXIT_CODES.WRONG_CONFIG)
}

//
// FINAL CONFIG OBJECT ----------------------------------------
//
module.exports = {
	setup: env.SETUP,
	multiTenant: env.MULTI_TENANT,
	interactive: env.INTERACTIVE_MODE,
	release: env.RELEASE,
	envName: env.ENV_NAME,
	host: env.HOST,
	httpPort,
	httpsPort,
	wsPort,
	wssPort,
	serverMode,
	hashingSecret: env.HASHING_SECRET,
	isBehindProxy,
	superAdmin: env.SUPER_ADMIN,
	bootstrapFile: env.BOOTSTRAP_FILE,

	upload: {
		// "local" or "amazon_s3" or "microsoft_azure_blob_storage" or "google_cloud_storage"
		destination: uploadDestination,
		thumbnails: {
			s: env.UPLOAD_THUMBS_S || "64x64",
			m: env.UPLOAD_THUMBS_M || "256x256",
			l: env.UPLOAD_THUMBS_L || "512x512"
		}
	},

	ssl: {
		// Local SSL for testing purpose on https://localhost
		key: path.join(__dirname, "./https/key.pem"),
		cert: path.join(__dirname, "./https/cert.pem")
	},

	// Insert your own SaaS business model here
	plans: {
		trial: {
			apps: 2,
			models: 10,
			users: 20,
			storage: 100, // Mb
			period: 14 // days
		},
		guest: {
			apps: 0,
			models: 0,
			users: 0,
			storage: 0, // tied to host account
			period: 0 // infinite
		}
	},

	logs,

	errorReporting: {
		mode: errorReportingMode,
		policy: errorReportingPolicy,
		instance: env.INSTANCE,
		delay: Number.parseInt(env.ERR_REPORTING_DELAY ?? 60 * 60 * 3000),
		maxAttemptsBeforeCrash: Number.parseInt(env.ERR_REPORTING_MAX_ATTEMPTS_BEFORE_CRASH ?? 5),
		recipients: errorReportingRecipients
	},

	webSocketServer: {
		server: websocketServer,
		expressCompatibility,
		proxyPort: Number.parseInt(env.WS_PROXY_PORT),
		backpressureThreshold: Number.parseInt(env.WS_BACKPRESSURE_THRESHOLD),
		idleTimeout: Number.parseInt(env.WS_IDLE_TIMEOUT),
		maxBufferedMessages: Number.parseInt(env.WS_MAX_BUFFERED_MESSAGES),
		maxPayloadLength: Number.parseInt(env.WS_MAX_PAYLOAD_LENGTH),
		maxSocketsByUser: Number.parseInt(env.WS_MAX_SOCKETS_BY_USER),
		maxMessagesPerSecond: Number.parseInt(env.WS_MAX_MESSAGES_PER_SECOND),
		maxRateLimiterHits: Number.parseInt(env.WS_MAX_RATE_LIMITER_HITS)
	},

	jsonWebToken: {
		accessTokenSecret: env.JWT_ACCESS_TOKEN_SECRET,
		accessTokenLife: env.JWT_ACCESS_TOKEN_LIFE,
		refreshTokenSecret: env.JWT_REFRESH_TOKEN_SECRET,
		refreshTokenLife: env.JWT_REFRESH_TOKEN_LIFE
	},

	session: {
		cleanEvery: Number.parseInt(env.SESSION_CLEAN_EVERY || 300000)
	},

	db: {
		type: env.DB_TYPE,
		host: env.DB_HOST,
		port: env.DB_PORT,
		name: env.DB_NAME,
		path: env.DB_PATH,
		connectionTimeout: Number.parseInt(env.DB_CONNECTION_TIMEOUT || 15000)
	},

	smtp: {
		host: env.SMTP_HOST,
		port: env.SMTP_PORT,
		secure: env.SMTP_SECURE,
		user: env.SMTP_USER,
		password: env.SMTP_PASSWORD,
		from: env.SMTP_FROM
	},

	pdfConverter: {
		mode: pdfConverterMode,
		host: env.PDF_CONVERTER_HOST,
		port: env.PDF_CONVERTER_PORT,
		key: env.PDF_CONVERTER_KEY,
		path: env.PDF_CONVERTER_PATH,
		workDir: pdfConverterWorkDir,

		// Our own pdfConverter API service configuration, only required if you want to start a docx2pdf instance.
		api: {
			// Reserved to the convertToPdf service. This is the port the service will listen.
			// Since it may be behind a proxy, this port MUST only be used by the service.
			// To configure a specific port to CALL the pdfConverter, please see PDF_CONVERTER_PORT.
			port: env.PDF_CONVERTER_API_PORT,
			workDir: pdfConverterAPIWorkDir,
			libreOfficePath: env.PDF_CONVERTER_API_LIBREOFFICE_PATH || "soffice"
		}
	},

	authentication: {
		google: {
			clientID: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
			callbackURL: env.GOOGLE_CALLBACK_URL,
		},
		AzureAd: {
			clientID: env.AZURE_CLIENT_ID,
			clientSecret: env.AZURE_CLIENT_SECRET,
			callbackURL: env.AZURE_CALLBACK_URL,
			tenantId: env.AZURE_TENANT_ID
		},
		facebook: {
			clientID: env.FACEBOOK_CLIENT_ID,
			clientSecret: env.FACEBOOK_CLIENT_SECRET,
			callbackURL: env.FACEBOOK_CALLBACK_URL
		},
		linkedin: {
			clientID: env.LINKEDIN_CLIENT_ID,
			clientSecret: env.LINKEDIN_CLIENT_SECRET,
			callbackURL: env.LINKEDIN_CALLBACK_URL,
			verificationURL: env.LINKEDIN_VERIFICATION_URL
		},
		Box: {
			clientID: env.BOX_TEST_CLIENT_ID, // Test
			clientID: env.BOX_CLIENT_ID,
			clientSecret: env.BOX_TEST_CLIENT_SECRET, // Test
			clientSecret: env.BOX_CLIENT_SECRET,
			redirectTo: env.BOX_REDIRECT_TO
		},
		Instagram: {
			clientID: env.INSTAGRAM_CLIENT_ID,
			clientSecret: env.INSTAGRAM_CLIENT_SECRET,
			redirect_uri: env.INSTAGRAM_REDIRECT_URI,
			developerToken: env.INSTAGRAM_DEV_TOKEN,
			redirectTo: env.INSTAGRAM_REDIRECT_TO
		},
		redirectTo: {
			home: env.REDIRECT_TO_HOME,
			login: env.REDIRECT_TO_LOGIN,
			register: env.REDIRECT_TO_REGISTER,
			userAlreadyExists: env.REDIRECT_TO_USER_ALREADY_EXISTS,
			error: env.REDIRECT_TO_ERROR
		}
	},

	api: {
		stripe: {
			secret_key: env.STRIPE_SECRET_KEY,
			webhook_secret: env.WEBHOOK_SECRET_KEY
		},
		aws: {
			accessKeyId: env.AWS_ACCESS_KEY_ID,
			secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
			region: env.AWS_REGION,
			bucket: env.AWS_BUCKET
		},
		googleSearch: {
			apiKey: env.GOOGLESEARCH_API_KEY,
			searchEngineId: env.GOOGLESEARCH_SEARCH_ENGINE_ID
		},
		twilio: {
			accountSid: env.TWILIO_ACCOUNT_SID,
			authToken: env.TWILIO_AUTH_TOKEN,
			fromPhone: env.TWILIO_FROM_PHONE
		}
	}
}