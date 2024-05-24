/**
 * 
 * Files controller
 * 
 * Upload process allows to:
 * - use various sources to grab the files
 * - use various destinations to store the files
 * 
 * Possible sources are:
 * - local (your device)
 * - Dropbox
 * - Box
 * - Google Drive
 * - Microsoft One Drive
 * - Instagram
 * - URL link (the file is taken from the link)
 * - Web search: for pictures only. It uses Google search API and the number of API calls is restricted to the free tier at the moment.
 * - Camera: use your device camera to take a picture
 * 
 * Possible destinations are:
 * - local: files are uploaded to the server's disk
 * - Amazon S3
 * 
 * In the future, the following destination services could be implemented: Microsoft Azure Blob, Google Cloud Storage.
 * 
 */
const authentication = require("./authentication")
const config = require("../config")
const multer = require("multer")
const mime = require("mime-types")
const axios = require("axios")
const AWS = require("aws-sdk")
const sharp = require("sharp")
const fs = require("fs")
const path = require("path")

const {
	resolve: resolvePath
} = require("path")

const {
	API: {
		APIError,
		InvalidToken,
		Unauthorized,
		Forbidden,
		NotFound,
		MethodNotAllowed,
		InternalServerError
	}
} = require("../core/errors")

// Configure S3 default details
// This is config is overridden if the user set up a custom S3 bucket
const s3 = new AWS.S3({
	accessKeyId: config.api.aws.accessKeyId,
	secretAccessKey: config.api.aws.secretAccessKey,
	region: config.api.aws.region
})

s3.activeBucket = config.api.aws.bucket

function responseToBase64FileDescriptor(file, response) {
	return {
		fileData: "data:" + response.headers["content-type"] + ";base64," + Buffer.from(response.data, "binary").toString("base64"),
		fileType: response.headers["content-type"],
		name: file.name ? file.name : ""
	}
}

const filesController = {
	/**
	 * Get the record which contains the file
	 * 
	 * @param {string} accountId 
	 * @param {string} fileId 
	 * @returns {object} Record with file infos
	 */
	async getFile(accountId, fileId) {
		const file = await kiss.db.findOne("file_" + accountId, {
			_id: fileId
		})
		if (!file) return false
		return file
	},

	/**
	 * Update the properties a file record
	 * 
	 * Note: currently, the AI knowledge plugin uses this method to track the conversations about this file
	 * 
	 * @param {string} accountId 
	 * @param {string} fileId 
	 * @param {object} update
	 * @returns {boolean} True if the file has been updated, false otherwise
	 */
	async updateFile(accountId, fileId, update) {
		try {
			await kiss.db.updateOne("file_" + accountId, {
				_id: fileId
			}, update)

			return true
		}
		catch(err) {
			log.err("kiss.files - Could not update file record", err)
			return false
		}
	},

	/**
	 * Get the file MIME type
	 * 
	 * @param {string} accountId 
	 * @param {string} fileId 
	 * @returns {string} File mime type or false if the file doesn't exist
	 */
	async getFileMimeType(accountId, fileId) {
		const file = await kiss.db.findOne("file_" + accountId, {
			_id: fileId
		})
		if (!file) return false
		return file.mimeType
	},	

	/**
	 * Get the file as a buffer
	 * 
	 * @param {string} accountId 
	 * @param {string} fileId 
	 * @returns {object} File as a buffer or false if the file doesn't exist
	 */
	async getFileAsBuffer(accountId, fileId) {
		const file = await kiss.db.findOne("file_" + accountId, {
			_id: fileId
		})
		if (!file) return false

        try {
            if (file.type === "amazon_s3") {
                const s3 = await this.getS3(accountId)
                const s3Object = await s3.getObject({
                    Bucket: s3.activeBucket,
                    Key: decodeURIComponent(file.path.split("/").slice(3).join("/"))
                }).promise()

                fileContent = Buffer.from(s3Object.Body, "binary")

            } else {

                fileContent = fs.readFileSync(path.resolve("./", file.path))
            }
            return fileContent

        } catch (err) {
            log(err)
            return false
        }
	},

	/**
	 * Upload middleware, used for /upload route
	 */
	async upload(req, res, next) {
		let uploadWithMulter

		// Configure Multer service
		switch (config.upload.destination) {
			case "local":
				uploadWithMulter = multer({
					storage: kiss.fileStorage
				}).array("files")
				break

			case "amazon_s3":
				uploadWithMulter = multer({
					storage: multer.memoryStorage()
				}).array("files")
				break

			case "microsoft_azure_blob_storage":
				// TODO
				break

			case "google_cloud_storage":
				// TODO
				break
		}

		return new Promise((resolve, reject) => {
			// Upload a file using Multer middleware
			uploadWithMulter(req, res, async err => {
				if (err) reject(err)

				// Enrich the request object before sending it to the upload controller
				const token = req.token
				req.uploadDestination = config.upload.destination
				req.userId = token.userId
				req.accountId = token.accountId
				req.currentAccountId = token.currentAccountId

				// log(req.method + ": /" + req.path_0)

				// Set the ACL mode for uploaded files. Default to "private"
				const mode = req.body.ACL || "private"

				// Route the request to the upload controller
				switch (config.upload.destination) {
					case "local":
						await filesController.localUpload(req, res, next, req.files, mode)
						break

					case "amazon_s3":
						await filesController.s3Upload(req, res, next, req.files, mode)
						break

					case "microsoft_azure_blob_storage":
						// TODO
						break

					case "google_cloud_storage":
						// TODO
						break
				}

				resolve()
			})
		})
	},

	/**
	 * Upload files to local disk
	 */
	async localUpload(req, res, next, files, mode) {
		const response = await filesController._localUpload(req, files, mode)
		if (response.success === false) return next(response.err)
		res.status(200).send(files)
	},

	async _localUpload(req, files, mode) {
		try {
			for (let record of files) {
				record.id = kiss.tools.uid()
				record.userId = req.userId
				record.accountId = req.currentAccountId
				record.type = req.uploadDestination
				// record.createdAt = record.updatedAt = new Date().toISOString()
				// record.createdBy = record.updatedBy = req.userId
				record.createdAt = new Date().toISOString()
				record.createdBy = req.userId
				record.mimeType = mime.lookup(record.originalname.split(".").pop())
				record.thumbnails = {}
				record.accessReaders = (mode == "public") ? ["*"] : ["$authenticated"]

				if (record.mimeType.match(/^image/)) {
					const thumbnails = await this.createThumbnails(record)

					for (let thumbName in thumbnails) {
						const thumb = thumbnails[thumbName]
						record.thumbnails[thumbName] = {
							path: thumb.path,
							size: thumb.size
						}
						fs.writeFileSync(thumb.path, thumb.buffer)
					}
				}
				delete record.buffer
			}

			// There is one "file" collection per account in the database
			const modelId = "file_" + req.currentAccountId
			await kiss.db.insertMany(modelId, files)
			return files

		} catch (err) {
			return {
				success: false,
				error: err.message,
				err
			}
		}
	},

	/**
	 * Upload files to an Amazon S3 bucket
	 */
	async s3Upload(req, res, next, files, mode) {
		const response = await filesController._s3Upload(req, files, mode)
		if (response.success === false) return next(response.err)
		res.status(200).send(files)
	},

	async _s3Upload(req, files, mode) {
		try {
			// Create Path Same As Local Server
			const accountId = req.currentAccountId
			const year = new Date().getFullYear()
			const month = ("0" + (new Date().getMonth() + 1)).slice(-2)
			const day = ("0" + new Date().getDate()).slice(-2)
			const dir = `files/${accountId}/${year}/${month}/${day}/`

			// Timestamp all the records
			const currentDateTime = new Date().toISOString()

			// Set ACL
			const fileACL = (mode == "public") ? "public-read" : "private"

			// Get s3 params
			const s3 = await filesController.getS3(accountId)

			// Upload files on Amazon S3 by starting several concurrent promises.
			// We may want to manage error one by one later
			const uploads = files.map(file => (async file => {
				try {
					// Where you want to store your file
					const params = {
						Bucket: s3.activeBucket,
						Key: dir + file.originalname,
						Body: file.buffer,
						ACL: fileACL
					}

					// Try to auto-detect mime type since Amazon S3 has a bug and defaults everything to application/octet-stream
					const mimeType = mime.lookup(file.originalname.split(".").pop())
					if (mimeType) Object.assign(params, {
						ContentType: mimeType
					})

					// Upload
					const fileData = await s3.upload(params).promise()

					const record = file
					record.userId = req.userId
					record.accountId = req.currentAccountId
					record.type = req.uploadDestination
					record.createdAt = record.updatedAt = currentDateTime
					record.createdBy = record.updatedBy = req.userId
					record.path = decodeURIComponent(fileData.Location)
					record.id = kiss.tools.uid()
					record.mimeType = mimeType
					record.name = dir + file.originalname
					record.accessReaders = (mode == "public") ? ["*"] : ["$authenticated"]

					// Create image thumbnails
					if (mimeType.match(/^image/)) {
						record.thumbnails = {}

						const thumbnails = await this.createThumbnails(record)

						for (let thumbName in thumbnails) {
							const thumb = thumbnails[thumbName]

							const thumbFileData = await s3.upload({
								Bucket: s3.activeBucket,
								Key: thumb.path.split("/").slice(3).join("/"),
								Body: thumb.buffer,
								ACL: fileACL
							}).promise()

							record.thumbnails[thumbName] = {
								path: thumbFileData.Location,
								size: thumb.size
							}
						}
					}

					delete record.buffer
					return record
				}
				catch (err) {
					log.err("kiss.files - Could not upload file to Amazon S3", err)
					return false
				}
			})(file))

			// Save file records in the database
			const modelId = "file_" + req.currentAccountId
			let fileRecords = await Promise.all(uploads)
			fileRecords = fileRecords.filter(record => record) // Filters out failed uploads

			const insertedFiles = await kiss.db.insertMany(modelId, fileRecords)
			return insertedFiles

		} catch (err) {
			return {
				success: false,
				error: err.message,
				err
			}
		}
	},

	/**
	 * Create image thumbnails
	 */
	async createThumbnails(record) {
		const res = {}
		const thumbs = config.upload.thumbnails
		const buffer = record.buffer || fs.readFileSync(resolvePath(`${__dirname}/../../../${record.path}`))

		for (let thumbName in thumbs) {
			const [height, width] = thumbs[thumbName].split("x").map(nb => Number.parseInt(nb))

			const sharpImg = await sharp(buffer.subarray(0))

			const {
				height: imgHeight,
				width: imgWidth
			} = await sharpImg.metadata()

			// We don't want unneeded thumbnails. If the image already fits into the thumbnail
			// threshold, we just skip the thumbnail.
			if (imgHeight <= height && imgWidth <= width) continue;

			const splitPath = record.path.split(".")
			const ext = splitPath.pop()
			const path = splitPath.join(".") + `.${thumbs[thumbName]}.${ext}`

			const resizedBuffer = await sharpImg.resize({
					height,
					width,
					fit: "inside"
				})
				.toBuffer()

			res[thumbName] = {
				path: path,
				buffer: resizedBuffer,
				size: resizedBuffer.length
			}
		}

		return res
	},

	/**
	 * Converts a single URL to a base64 file
	 */
	async urlToBase64(req, res) {
		const url = req.body.url
		const response = await axios.get(url, {
			responseType: "arraybuffer"
		})

		res.status(200).send({
			result: "data:" + response.headers["content-type"] + ";base64," + Buffer.from(response.data, "binary").toString("base64"),
			status: "success"
		})
	},

	/**
	 * Converts multiple URL to base64 files
	 */
	async multiUrlToBase64(req, res) {
		const files = req.body.url

		// Map a file url array into an array of promises
		const requests = files.map(file => {
			return axios.get(typeof file === "string" ? file : file.image, {
				responseType: "arraybuffer"
			}).then(response => {
				return responseToBase64FileDescriptor(file, response)
				// We only handle the first error, as we want to retry with the thumbnail
			}).catch(() => axios.get(file.thumb, {
				responseType: "arraybuffer"
			}).then(response => {
				return responseToBase64FileDescriptor(file, response)
			}))
		})

		const result = await Promise.all(requests)
		res.status(200).send({
			result
		})
	},

	/**
	 * Update ACL of a single file
	 */
	async updateFileACL(req, res, next) {
		try {
			if (req.method != "patch") {
				throw new Forbidden()
			}

			const body = req.body
			const {
				modelId,
				recordId,
				fieldId,
				file,
				ACL // "public" || "private"
			} = body

			// Get the "file" record and check its creator
			const fileRecord = await kiss.db.findOne("file_" + req.token.currentAccountId, {
				_id: file.id
			})

			if (!fileRecord) {
				throw new NotFound()
			}

			// To update the ACL, the user must be:
			// - the user who uploaded the file
			// - or the account owner
			if (!req.token.isOwner && fileRecord.createdBy != req.token.userId) {
				throw new Forbidden()
			}

			// Update ACL on an Amazon S3 file
			if (file.type == "amazon_s3") {
				const fileACL = (ACL == "public") ? "public-read" : "private"
				const accountId = req.token.currentAccountId
				const s3 = await filesController.getS3(accountId)

				// Update the ACL of the file
				let params = {
					Bucket: s3.activeBucket,
					Key: "files" + decodeURIComponent(file.path.rightString("files")),
					ACL: fileACL
				}

				await s3.putObjectAcl(params).promise()

				// Update the ACL of the file thumbnails, if any
				// Catch errors in a separate block to prevent the method to throw before updating the database
				try {
					let updates = []
					if (file.thumbnails) {
						for (thumbSize of Object.keys(file.thumbnails)) {
							const thumbnail = file.thumbnails[thumbSize]
							let params = {
								Bucket: s3.activeBucket,
								Key: "files" + decodeURIComponent(thumbnail.path.rightString("files")),
								ACL: fileACL
							}
							updates.push(s3.putObjectAcl(params).promise())
						}
					}

					await Promise.all(updates)
				} catch (err) {
					log.err("kiss.files - UpdateFileACL method could not update the ACL of all thumbnails for the file " + fileId)
					log.info("Involved thumbnails:")
					log.info(file.thumbnails)
				}
			}

			// Update the attachment field of the record holding all the attachments
			const record = await kiss.db.findOne(modelId, {
				_id: recordId
			})

			let attachments = record[fieldId]
			attachments.forEach(attachment => {
				if (attachment.id == file.id) {
					attachment.accessReaders = (ACL == "public") ? ["*"] : ["$authenticated"]
				}
			})

			await kiss.db.updateOne(modelId, {
				_id: recordId
			}, {
				[fieldId]: attachments
			})

			// Update the corresponding "file" record
			await kiss.db.updateOne("file_" + req.token.currentAccountId, {
				_id: file.id
			}, {
				accessReaders: (ACL == "public") ? ["*"] : ["$authenticated"]
			})

			res.status(200).send({
				success: true
			})

			kiss.websocket.publish(req.token.currentAccountId, "*+", {
				channel: "EVT_DB_UPDATE:" + modelId.toUpperCase(),
				accountId: req.token.currentAccountId,
				userId: req.token.userId,
				modelId,
				id: recordId,
				data: {
					[fieldId]: attachments
				}
			})
		} catch (err) {
			next(err)
		}
	},

	/**
	 * Delete all the files contained by multiple records.
	 * Each record can contain multiple attachment fields,
	 * which can contain multiples files.
	 * 
	 * @param {object} config
	 * @param {object} config.req - The original request (to grab the user id)
	 * @param {string} config.records - Records that will be deleted
	 */
	async deleteFilesFromRecords({req, records}) {
		try {
			// For each record, find all the "attachment" fields.
			// They are arrays of objects with at least a "path" property.
			// Each file stored in the attachment field must be deleted.
			let ids = []
			records.forEach(record => {
				Object.values(record).forEach(value => {
					if (!Array.isArray(value) || value.length == 0) return
					if (value[0].path) {
						ids = ids.concat(value.map(file => file.id))
					}
				})
			})

			await filesController.deleteFiles({
				req,
				modelId: "file" + req.targetCollectionSuffix,
				ids
			})
		}
		catch(err) {
			log.err("kiss.files - Error while trying to delete multiple files", err)
		}
	},

	/**
	 * Delete somes files which are stored locally or on Amazon S3
	 * 
	 * @param {object} config
	 * @param {object} config.req - The original request (to grab the user id)
	 * @param {string} config.modelId - Source collection
	 * @param {string} config.ids - List of records to delete
	 */
	async deleteFiles({req, modelId, ids}) {
		// Retrieve the informations about the files to delete
		const records = await kiss.db.findById(modelId, ids)
		if (!records || !Array.isArray(records) || records.length == 0) return

		let files = {
			local: [],
			amazon_s3: []
		}

		for (record of records) {
			const isLocal = (record.type == "local")
			const filepath = (isLocal) ? record.path : record.path.slice(record.path.indexOf("files/"))
			files[record.type].push(decodeURI(filepath))

			// Get thumbnails associated to this file, if any
			if (record.thumbnails) {
				Object.values(record.thumbnails).forEach(thumb => {
					const thumbpath = (isLocal) ? thumb.path : thumb.path.slice(thumb.path.indexOf("files/"))
					files[record.type].push(decodeURI(thumbpath)) // Thumbnails are stored with encoded path
				})
			}
		}

		// Delete local files
		let path
		for (path of files.local) {
			try {
				await fs.promises.unlink(path)
				log.info(`kiss.files (local) - ${req.token.userId} deleted file ${path}`)
			}
			catch(err) {
				log.err("kiss.files (local) - Did not find file to delete: " + path)
			}
		}

		// Delete Amazon files, if any
		if (files.amazon_s3.length == 0) return

		const objectsToDelete = files.amazon_s3.map(path => ({ Key: path }))

		try {
			const accountId = req.token.currentAccountId
			const s3 = await filesController.getS3(accountId)

			await s3.deleteObjects({
				Bucket: s3.activeBucket,
				Delete: {
					Objects: objectsToDelete,
					Quiet: false
				}
			}).promise()
			
			files.amazon_s3.forEach(path => log.info(`kiss.files (S3 ${s3.activeBucket}) - ${req.token.userId} deleted file ${path}`))
		}
		catch(err) {
			log.err("kiss.files (S3) - Could not delete some files")
		}
	},

	/**
	 * BOX.COM
	 * Get Box Access Token
	 */
	async boxAccessToken(req, res) {
		const token = authentication.getToken(req, res)
		if (!token) return

		const code = req.body.code
		const response = await axios.post("https://api.box.com/oauth2/token", {
			grant_type: "authorization_code",
			code: code,
			client_id: config.authentication.Box.clientID,
			client_secret: config.authentication.Box.clientSecret,
		})

		res.status(200).send({
			result: response.data.access_token
		})
	},

	/**
	 * BOX.COM
	 * Get Box file object data using file id
	 */
	async boxFileDetail(req, res) {
		const authToken = authentication.getToken(req, res)
		if (!authToken) return

		const token = req.body.token
		const items = req.body.items
		const requests = items.map(data => (async data => {
			const url = "https://api.box.com/2.0/files/" + data.id + "/content"
			const response = await axios.get(
				url, {
					headers: {
						Authorization: "Bearer " + token
					},
					responseType: "arraybuffer"
				}
			)

			return {
				fileData: "data:" + response.headers["content-type"] + ";base64," + Buffer.from(response.data, "binary").toString("base64"),
				name: data.name
			}
		})(data))

		const body = await Promise.all(requests)
		res.status(200).send({
			result: body
		})
	},

	/**
	 * BOX.COM
	 * Capture Box code sent by Box.com and broadcast it through websocket
	 * 
	 * Note:
	 * This allows the client to automate the verification code step.
	 * When the code is captured by the client, it uses it immediately to display the Box filePicker in the UI.
	 */
	async boxConnect(req, res) {
		const code = req.queryStringObject.code
		const userId = req.queryStringObject.state

		const response = await axios.post("https://api.box.com/oauth2/token", {
			grant_type: "authorization_code",
			code: code,
			client_id: config.authentication.Box.clientID,
			client_secret: config.authentication.Box.clientSecret
		})
		const token = response.data.access_token

		// Send the Box token to the user via websocket
		kiss.websocket.publish(req.token.currentAccountId, userId, {
			channel: "EVT_BOX_CODE",
			token: token
		})

		res.redirect(301, config.authentication.Box.redirectTo)
	},

	/**
	 * INSTAGRAM
	 * Function to send auth code and get access token in response
	 */
	async instaAccessToken(req, res) {
		const userId = req.queryStringObject.state
		const code = req.queryStringObject.code

		const params = new URLSearchParams()
		params.append("client_id", config.authentication.Instagram.clientID)
		params.append("client_secret", config.authentication.Instagram.clientSecret)
		params.append("redirect_uri", config.authentication.Instagram.redirect_uri)
		params.append("grant_type", "authorization_code")
		params.append("code", code)

		const response = await axios.post("https://api.instagram.com/oauth/access_token", params)
		const token = response.data.access_token

		// Send the Box token to the user via websocket
		kiss.websocket.publish("", userId, {
			channel: "EVT_INSTAGRAM_CODE",
			token: token
		})

		// Redirect to a special page which the user can close
		res.redirect(301, config.authentication.Instagram.redirectTo)
	},

	/**
	 * INSTAGRAM
	 * Function to fetch Instagram posts of the user
	 */
	async getInstaFeeds(req, res) {
		const response = await axios.get("https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,timestamp&access_token=" + req.body.access_token)

		res.status(200).send({
			result: response.data
		})
	},

	/**
	 * WEB SEARCH
	 * Function to search images using Google api
	 */
	async googleImageSearch(req, res) {
		const authToken = authentication.getToken(req, res)
		if (!authToken) return

		const page = [1, 50]

		const requests = page.map(p => (async p => {
			/*
			 * Request Params:
			 * - Key -> Google Api Key 
			 * - cx -> Google Search Engine Id
			 * - searchType -> Specifies the search type
			 * - q -> search value
			 * - start -> The index of the first result to return
			 * - imgType -> Returns images of a type. Acceptable values like:"clipart", "face", "photo"
			 */
			const url = "https://www.googleapis.com/customsearch/v1?key=" + config.api.googleSearch.apiKey +
				"&cx=" + config.api.googleSearch.searchEngineId +
				"&searchType=image&q=" + encodeURIComponent(req.body.search) +
				"&start=" + p

			// Create a promise for each API call
			const response = await axios.get(url, {
				json: true
			})

			return response.data.items
		})(p))

		const body = await Promise.all(requests)

		res.status(200).send({
			result: body.flat()
		})
	},

	//
	// EXPRESS MIDDLEWARES
	// to handle the /file route
	//

	/**
	 * NOT USED FOR NOW
	 * 
	 * When trying to download an AWS file, creating a download token and redirecting
	 * to an AWS signed URL will improve performances. But at a cost: the given URL is made public for
	 * a given time. It's much more complexity to manage and much more server/client round trips too.
	 * 
	 * @return {Promise<void>}
	 */
	async downloadFile(req, res, next) {
		try {
			const downloadToken = req.path_1

			if (!downloadToken) throw new NotFound()
			if (!kiss.tools.isUid(downloadToken)) throw new BadRequest()

			const accessRecord = await kiss.db.findOne("downloadToken", {
				_id: downloadToken
			})

			// Since the token exists and is a file token, we can confidently serve it. It would not have been created
			// in the first place if the user didn't get right to download it.

			if (accessRecord.source === "amazon_s3") {
				// Temporary link already created.
				res.redirect(301, accessRecord.file)
			} else {
				res.sendFile(resolvePath(`${__dirname}/../../../${record.file}`))
			}

			// Tokens are only one-time use.
			await kiss.db.deleteOne("downloadToken", {
				_id: downloadToken
			})
		} catch (err) {
			next(err)
		}
	},

	/**
	 * Serve a private file, either hosted on amazon s3 or in local.
	 * Can serve generated thumbnails for images too:
	 *
	 * - original file: /file/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
	 * - Thumbnails (if image): /file/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX/[thumbCode]
	 *
	 * If thumbCode doesn't exist or if no thumbnail was generated for the requested file, will serve the original file.
	 *
	 * To see available thumbCodes, please see config.upload.thumbnails
	 * 
	 * @see config.upload.thumbnails
	 * @return {Promise<void>}
	 */
	async serveFile(req, res, next) {
		// This middleware to serve files must not interfere with the controller to manage records of type "file"
		// We use it only if:
		// - it's a GET request (= read a file)
		// - it's doesn't have any id after the path /file, for example /file/01845784-1b69-7f24-9621-5164d0864aab
		if (!["get", "head"].includes(req.method) || req.path_1) {
			return next()
		}

		try {
			let {
				path,
				mimeType,
				size
			} = req.queryStringObject

			// console.log({ path, mimeType, size })
			if (!path || !mimeType || !size) {
				throw new BadRequest("GET parameters path, mimeType and size are required!")
			}

			path = decodeURIComponent(path)
			mimeType = decodeURIComponent(mimeType)

			if (!path.replaceAll("\\", "/").match(new RegExp(`/?((files)|(uploads))/${req.token.currentAccountId}/`))) {
				throw new Forbidden()
			}

			const splitPath = path.split("/")
			if (mimeType) res.setHeader("Content-Type", mimeType)

			res.setHeader("Content-Length", size)
			res.setHeader("Cache-Control", `public, must-revalidate, max-age=${60 * 60 * 24}`)
			res.setHeader("Content-Disposition", `filename="${splitPath[splitPath.length - 1]}"`)
			res.setHeader("Access-Control-Allow-Origin", "*")

			if (req.method.toLowerCase() === "head") return res.status(204).end()
			
			if (path.startsWith("http")) {
				// Remote / Amazon S3
				const accountId = req.token.currentAccountId
				const s3 = await filesController.getS3(accountId)

				// We test the path against our aws bucket
				if (path.match(new RegExp(`^https://${s3.activeBucket}\.s3\.[a-z0-9-]+\.amazonaws\.com`))) {
					
					const stream = s3.getObject({
						Bucket: s3.activeBucket,
						Key: decodeURIComponent(splitPath.slice(3).join("/")) // We don't need the domain
					}).createReadStream()

					// We don't want to try to close the stream if it has been closed to avoid errors.
					let streamClosed = false

					stream.on("error", err => {
						log.err(`kiss.server - Error while trying to send AWS file '${ path }' with Key '${splitPath.slice(3).join("/")}': `, err)

						res.end()
						streamClosed = true
					})

					stream.on("close", () => {
						if (streamClosed) return

						res.end()
						streamClosed = true
					})

					stream.pipe(res)
				} else throw new Forbidden()

			} else {
				// Local file
				// console.log(resolvePath(`${__dirname}/../../../${path}`))
				res.sendFile(resolvePath(`${__dirname}/../../../${path}`))
			}
		} catch (err) {
			console.log(err)
			next(err)
		}
	},

	//
	// Amazon S3 custom setup routes
	//

    /**
     * Setup custom Amazon S3 parameters for the account.
     * Only the account owner can use this method + super admin team support
     */
    async s3Setup(req, res, next) {
		const superAdminDomain = "@" + config.superAdmin.rightString("@")
        if (!req.token.isOwner && !req.token.userId.includes(superAdminDomain)) throw new Forbidden()

        const accountId = req.token.currentAccountId
        const {
            AWS_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY,
            AWS_REGION,
            AWS_BUCKET
        } = req.body

        const newConfig = {
            id: kiss.tools.uid(),
            value: {
                AWS_ACCESS_KEY_ID: kiss.tools.encrypt(AWS_ACCESS_KEY_ID),
                AWS_SECRET_ACCESS_KEY: kiss.tools.encrypt(AWS_SECRET_ACCESS_KEY),
                AWS_REGION: kiss.tools.encrypt(AWS_REGION),
                AWS_BUCKET: kiss.tools.encrypt(AWS_BUCKET)
            }
        }

        const existingConfig = await filesController.getS3Parameters(accountId)

        if (existingConfig) {
            // Update existing config
            await kiss.db.updateOne("config", {
                _id: existingConfig.id
            }, {
                value: newConfig.value
            })
        } else {
            // Creates new config
            await kiss.db.insertOne("config", newConfig)

            await kiss.db.updateOne("account", {
                _id: accountId
            }, {
                amazon_s3: newConfig.id
            })
            kiss.directory.accounts[accountId].amazon_s3 = newConfig.id
        }

        // Update account cache
        kiss.directory.accounts[accountId].s3Setup = {
            id: (existingConfig) ? existingConfig.id : newConfig.id,
            value: {
                AWS_ACCESS_KEY_ID,
                AWS_SECRET_ACCESS_KEY,
                AWS_REGION,
                AWS_BUCKET
            }
        }

        res.status(200).end()
    },

    /**
     * Retrieve custom Amazon S3 parameters of the account.
     * Only the account owner can use this method + super admin team support
     */
    async getS3Setup(req, res, next) {
		const superAdminDomain = "@" + config.superAdmin.rightString("@")
        if (!req.token.isOwner && !req.token.userId.includes(superAdminDomain)) throw new Forbidden()

        const config = await filesController.getS3Parameters(req.token.currentAccountId)
        if (config) {
            res.status(200).send(config.value)
        } else {
            res.status(200).send({})
        }
    },

	/**
	 * Get a handle to the custom S3 of a specific account
	 * 
	 * This is used only in the case where the customer decides
	 * to setup his own Amazon S3 bucket.
	 * 
	 * @param {string} accountId 
	 */
	async getS3(accountId) {
		const config = await filesController.getS3Parameters(accountId)

		if (!config) return s3
		if (config.value && config.value.AWS_ACCESS_KEY_ID === "") return s3

		let customS3 = new AWS.S3({
			accessKeyId: config.value.AWS_ACCESS_KEY_ID,
			secretAccessKey: config.value.AWS_SECRET_ACCESS_KEY,
			region: config.value.AWS_REGION
		})

		customS3.activeBucket = config.value.AWS_BUCKET
		return customS3
	},

    /**
     * Get the Amazon S3 parameters of a specific account
     * 
     * @param {string} accountId 
     * @returns {object|boolean} The S3 parameters, or false
     */
    async getS3Parameters(accountId) {
        // Try to retrieve the config in cache, if available
		if (!accountId) return

		const account = kiss.directory.accounts[accountId]
		if (!account) return

        const s3Setup = account.s3Setup
        if (s3Setup) return s3Setup

        // If not available in cache, try to get it from DB
        const configId = account.amazon_s3
        if (!configId) return false

        const config = await kiss.db.findOne("config", {
            _id: configId
        })
        if (!config) return false

        config.value = {
            AWS_ACCESS_KEY_ID: kiss.tools.decrypt(config.value.AWS_ACCESS_KEY_ID),
            AWS_SECRET_ACCESS_KEY: kiss.tools.decrypt(config.value.AWS_SECRET_ACCESS_KEY),
            AWS_REGION: kiss.tools.decrypt(config.value.AWS_REGION),
            AWS_BUCKET: kiss.tools.decrypt(config.value.AWS_BUCKET)
        }

        // Update account cache
        kiss.directory.accounts[accountId].s3Setup = config
        return config
    },

	/**
	 * Get the list of buckets
	 * Only the account owner can use this method.
	 */
    async getS3Buckets(req, res, next) {
		const superAdminDomain = "@" + config.superAdmin.rightString("@")
		if (!req.token.isOwner && !req.token.userId.includes(superAdminDomain)) throw new Forbidden()

        const accountId = req.token.currentAccountId
        const s3Parameters = await filesController.getS3Parameters(accountId)

        if (!s3Parameters) {
            return res.status(200).send({
                success: false,
                error: "No Amazon S3 setup found for your account"
            })
        }

        if (!s3Parameters.value.AWS_ACCESS_KEY_ID || !s3Parameters.value.AWS_SECRET_ACCESS_KEY) {
            return res.status(200).send({
                success: false,
                error: "Wrong Amazon S3 parameters"
            })
        }

        const s3 = new AWS.S3({
            accessKeyId: s3Parameters.value.AWS_ACCESS_KEY_ID,
            secretAccessKey: s3Parameters.value.AWS_SECRET_ACCESS_KEY
        })

        try {
            const data = await s3.listBuckets().promise()
            res.status(200).send({
                success: true,
                data: data.Buckets
            })
        } catch (err) {
            res.status(200).send({
                success: false,
                error: "Amazon S3 parameters are not correct"
            })
        }
    },

	/**
	 * Get the region of a bucket
	 * Only the account owner can use this method.
	 */
    async getS3BucketRegion(req, res, next) {
		const superAdminDomain = "@" + config.superAdmin.rightString("@")
		if (!req.token.isOwner && !req.token.userId.includes(superAdminDomain)) throw new Forbidden()

        const accountId = req.token.currentAccountId
        const bucketId = req.body.bucketId
        const s3Parameters = await filesController.getS3Parameters(accountId)

        const s3 = new AWS.S3({
            accessKeyId: s3Parameters.value.AWS_ACCESS_KEY_ID,
            secretAccessKey: s3Parameters.value.AWS_SECRET_ACCESS_KEY
        })

        try {
            const data = await s3.getBucketLocation({
                Bucket: bucketId
            }).promise()

            res.status(200).send({
                success: true,
                data: data.LocationConstraint || "us-east-1" // Default region if AWS returns ""
            })
        } catch (err) {
            res.status(200).send({
                success: false,
                error: "Could not retrieve Amazon S3 bucket informations"
            })
        }
	},

	/**
	 * Upload one or more files from URLs.
	 * Actually used by Midjourney controller.
	 * 
	 * @param {object} req - Express request object
	 * @param {string[]} fileUrls - Array of file URLs
	 * @param {string} mode - "public" or "private"
	 * 
	 * @private
	 */
	async _uploadFromUrl(req, fileUrls, mode = "private") {
		// File name parameters
		const title = req.body.title
		const tags = req.body.tags

		// Set the directory where the file will be stored
		const accountId = req.token.currentAccountId
		const year = new Date().getFullYear()
		const month = ("0" + (new Date().getMonth() + 1)).slice(-2)
		const day = ("0" + new Date().getDate()).slice(-2)
		const dir = `./uploads/${accountId}/${year}/${month}/${day}`
	
		// Make sure the directory exists only if the destination is local
		if (config.upload.destination === "local" && !fs.existsSync(dir)) {
			fs.mkdirSync(dir, {
				recursive: true
			})
		}
	
		try {
			const files = await Promise.all(fileUrls.map(async (fileUrl) => {
				const imgId = kiss.tools.shortUid()
				const extension = (fileUrl.split("?")[0]).split(".").pop() || "png"
				const fileName = `${kiss.tools.generateSlug(title)}-${tags.join("-")}-${imgId}.${extension}` //fileUrl.substring(fileUrl.lastIndexOf('/') + 1)
				
				const response = await axios({
					method: "GET",
					url: fileUrl,
					responseType: "stream"
				})
	
				const fileBuffer = await filesController._streamToBuffer(response.data)
	
				const fileData = {
					fieldname: "files",
					originalname: fileName,
					encoding: "7bit",
					mimetype: mime.lookup(fileName.split(".").pop()),
					buffer: fileBuffer,
					size: fileBuffer.length
				}
	
				// If the destination is local, save the file locally
				if (config.upload.destination === "local") {
					const filePath = path.join(dir, fileName)
					await fs.promises.writeFile(filePath, fileBuffer)
	
					// Add path details for local storage
					fileData.destination = dir
					fileData.filename = fileName
					fileData.path = filePath //.replace(/\\/g, '/');
				}
	
				return fileData
			}))
	
			const token = req.token
			req.uploadDestination = config.upload.destination
			req.userId = token.userId
			req.accountId = token.accountId
			req.currentAccountId = token.currentAccountId
	
			let response
			switch (config.upload.destination) {
				case "local":
					response = await filesController._localUpload(req, files, mode)
					break
	
				case "amazon_s3":
					response = await filesController._s3Upload(req, files, mode)
					break
			}
			return response

		} catch (err) {
			return {
				success: false,
				error: err.message,
				err
			}
		}
	},

	_streamToBuffer(stream) {
		return new Promise((resolve, reject) => {
			const chunks = []
			stream.on("data", chunk => chunks.push(chunk))
			stream.on("end", () => resolve(Buffer.concat(chunks)))
			stream.on("error", reject)
		})
	}
}

module.exports = filesController