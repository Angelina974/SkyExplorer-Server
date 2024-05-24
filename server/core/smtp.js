/**
 * 
 * kiss.smtp
 * 
 * TODO: add DKIM params
 * 
 */
const nodemailer = require("nodemailer")
const config = require("../config")
const filesController = require("../controllers/files")

module.exports = {
    /**
     * Init the smtp server (NodeMailer)
     */
    init() {
        this.defaultMailer = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.secure,
            pool: true,
            auth: {
                user: config.smtp.user,
                pass: config.smtp.password
            },

            // TODO
            // dkim: {
            //     keys: [
            //         {
            //             domainName: 'example.com',
            //             keySelector: '2017',
            //             privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...'
            //         },
            //         {
            //             domainName: 'example.com',
            //             keySelector: '2016',
            //             privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...'
            //         }
            //     ],
            //     cacheDir: false
            // }            
        })
    },

    /**
     * Send an email
     * 
     * @param {object} params
     * @param {string} [params.from]
     * @param {string} params.to
     * @param {string} [params.cc]
     * @param {string} [params.bcc]
     * @param {string} params.subject 
     * @param {string} params.body
     * @param {string} params.attachments
     * @param {string} [params.host] - Used for custom SMTP server
     * @param {string} [params.port] - Used for custom SMTP server
     * @param {string} [params.dkim] - Used for custom SMTP server
     * @param {string} [params.user] - Used for custom SMTP server
     * @param {string} [params.password] - Used for custom SMTP server
     * @param {boolean} [params.html] - Default = true
     */
    async send(params) {
        let mailer

        let {
            from = config.smtp.from,
            to,
            cc = "",
            bcc = "",
            subject = "",
            body = "",
            attachments = [],
            html = true,
            host,
            port,
            secure,
            dkim,
            user,
            password,
            req
        } = params

        const isCustomSMTP = !!(host && port)

        try {
            if (isCustomSMTP) {
                
                // Use custom SMTP server
                log(`kiss.smtp - Sending an email from ${from} to ${to} using custom relay ${host}`)

                mailer = nodemailer.createTransport({
                    host,
                    port,
                    pool: true,

                    // Nodemailer documentation:
                    // secure:
                    // if true the connection will use TLS when connecting to server.
                    // If false (the default) then TLS is used if server supports the STARTTLS extension.
                    // In most cases set this value to true if you are connecting to port 465. For port 587 or 25 keep it false.
                    // Setting secure to false does not mean that you would not use an encrypted connection.
                    // Most SMTP servers allow connection upgrade via STARTTLS command but to use this you have to connect using plaintext first.
                    secure,
                    auth: {
                        user,
                        pass: password
                    },
        
                    // TODO
                    // dkim: {
                    //     keys: [
                    //         {
                    //             domainName: 'example.com',
                    //             keySelector: '2017',
                    //             privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...'
                    //         },
                    //         {
                    //             domainName: 'example.com',
                    //             keySelector: '2016',
                    //             privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...'
                    //         }
                    //     ],
                    //     cacheDir: false
                    // }            
                })
            } else {

                // Use default SMTP server + default "noreply" sender
                log(`kiss.smtp - Sending an email from ${from} to ${to} using default relay ${config.smtp.host}`)
                from = config.smtp.from
                mailer = this.defaultMailer
            }

            let mailAttachments = []

            for (attachment of attachments) {
                if (attachment.type === "local") {
                    // Local file
                    mailAttachments.push({
                        filename: attachment.filename,
                        path: attachment.path,
                        contentType: attachment.mimeType
                    })
                }
                else {
                    // Amazon S3 file
                    const currentAccountId = (req && req.token && req.token.currentAccountId) ? req.token.currentAccountId : ""
                    const s3 = await filesController.getS3(currentAccountId)

                    const s3Object = await s3.getObject({
                        Bucket: s3.activeBucket,
                        Key: decodeURIComponent(attachment.path.split("/").slice(3).join("/"))
                    }).promise()

                    mailAttachments.push({
                        filename: attachment.filename,
                        content: s3Object.Body
                    })                    
                }
            }

            const infos = await mailer.sendMail({
                from,
                to,
                cc,
                bcc,
                subject,
                attachments: mailAttachments,
                [html ? 'html' : 'text']: body
            })

            log('kiss.smtp - Email sent: ' + infos.response)

            // Free memory closing custom mailer
            if (isCustomSMTP) mailer.close()

        } catch (err) {
            log.err(`kiss.smtp - Unable to send mail to ${to}: `, err)
            throw new Error("kiss.smtp - " + err.message)
        }
    },

    /**
     * Properly stop the current mail transport
     * @return {Promise<void>}
     */
    async stop() {
        if (!this.defaultMailer) return
        this.defaultMailer.close()
    }
}