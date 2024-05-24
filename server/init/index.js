// Load kissJS library dynamically
kiss.loader.loadLibrary({
    libraryPath: ".."
}).then(() => {
    kiss.loader.loadScript("./views/matrix")
})

window.onload = async function () {
    kiss.db.mode = "memory"
    kiss.app.init()

    // GENERAL
    const general = {
        title: "General",
        icon: "fas fa-cog",
        items: [{
                type: "text",
                id: "PORT",
                label: "HTTP port",
                placeholder: "80"
            },
            {
                type: "text",
                id: "HTTPS_PORT",
                label: "HTTPS port",
                placeholder: "443"
            }, {
                type: "text",
                id: "WS_PORT",
                label: "Websocket port",
                placeholder: "80"
            },
            {
                type: "text",
                id: "WSS_PORT",
                label: "Secured websocket port",
                placeholder: "443"
            }, {
                type: "text",
                id: "HASHING_SECRET",
                label: "Hashing secret for passwords",
                placeholder: "Your secret phrase"
            }
        ]
    }

    // PROXY
    const proxy = {
        title: "Proxy",
        icon: "fas fa-exchange-alt",
        items: [{
                type: "text",
                id: "PROXY",
                label: "Is the server behind a proxy?",
                tip: "0 = No, 1 = Yes",
                placeholder: "0"
            },
            {
                type: "text",
                id: "WS_PROXY_PORT",
                label: "Proxy port"
            }
        ]
    }

    // TOKENS
    const tokens = {
        title: "JWT tokens",
        icon: "fas fa-key",
        items: [{
                type: "text",
                id: "JWT_ACCESS_TOKEN_SECRET",
                label: "JWT Access Token Secret",
                placeholder: "Your secret phrase"
            },
            {
                type: "text",
                id: "JWT_ACCESS_TOKEN_LIFE",
                label: "JWT Access Token life (seconds)",
                placeholder: "600"
            },
            {
                type: "text",
                id: "JWT_REFRESH_TOKEN_SECRET",
                label: "JWT Refresh Token Secret",
                placeholder: "Your secret phrase"
            },
            {
                type: "text",
                id: "JWT_REFRESH_TOKEN_LIFE",
                label: "JWT Refresh Token life (seconds)",
                placeholder: "3600"
            }
        ]
    }

    // MONGODB
    const mongodb = {
        title: "MongoDb",
        icon: "fas fa-database",
        items: [{
                type: "text",
                id: "DB_HOST",
                label: "Database host",
                placeholder: "127.0.0.1"
            },
            {
                type: "text",
                id: "DB_PORT",
                label: "Database port",
                placeholder: "27017"
            }, {
                type: "text",
                id: "DB_NAME",
                label: "Database name",
                placeholder: "your_db_name"
            }, {
                type: "text",
                id: "DB_PATH",
                label: "Database path",
                placeholder: "mongodb://127.0.0.1:21017"
            }
        ]
    }

    // UPLOADS
    const uploads = {
        title: "File uploads",
        icon: "fas fa-file",
        items: [{
                type: "select",
                id: "UPLOAD_DESTINATION",
                label: "Upload destination",
                options: ["local", "amazon_s3"]
            },
            {
                type: "text",
                id: "AWS_ACCESS_KEY_ID",
                label: "AWS access key ID"
            }, {
                type: "text",
                id: "AWS_SECRET_ACCESS_KEY",
                label: "AWS secret access key"
            }, {
                type: "text",
                id: "AWS_REGION",
                label: "AWS region"
            }, {
                type: "text",
                id: "AWS_BUCKET",
                label: "AWS bucket"
            }
        ]
    }

    // PDF converter
    const PDFConverter = {
        title: "PDF converter",
        icon: "fas fa-file-pdf",
        items: [{
                type: "select",
                id: "PDF_CONVERTER_MODE",
                label: "PDF converter mode",
                options: ["local", "remote"]
            },
            {
                type: "text",
                id: "PDF_CONVERTER_HOST",
                label: "PDF converter host"
            }, {
                type: "text",
                id: "PDF_CONVERTER_PORT",
                label: "PDF converter port"
            }, {
                type: "text",
                id: "PDF_CONVERTER_KEY",
                label: "PDF converter key"
            }, {
                type: "text",
                id: "PDF_CONVERTER_WORK_DIR",
                label: "PDF converter directory"
            }
        ]
    }

    // SMTP
    const smtp = {
        title: "SMTP relay",
        icon: "far fa-envelope",
        items: [{
                type: "text",
                id: "SMTP_HOST",
                label: "SMTP host",
                placeholder: "smtp.yourdomain.com"
            },
            {
                type: "text",
                id: "SMTP_PORT",
                label: "SMTP port",
                placeholder: "465 or 587"
            }, {
                type: "text",
                id: "SMTP_USER",
                label: "SMTP user"
            }, {
                type: "text",
                id: "SMTP_PASSWORD",
                label: "SMTP password",
            }, {
                type: "text",
                id: "SMTP_FROM",
                label: "SMTP from field",
                placeholder: "noreply@yourdomain.com"
            }
        ]
    }

    // AUTHENTICATION
    const authentication = {
        title: "3rd party authentication",
        icon: "fas fa-user",
        items: [{
                type: "text",
                id: "GOOGLE_CLIENT_ID",
                label: "Google client ID"
            },
            {
                type: "text",
                id: "GOOGLE_CLIENT_SECRET",
                label: "Google client secret"
            }, {
                type: "text",
                id: "AZURE_CLIENT_ID",
                label: "Azure client ID"
            }, {
                type: "text",
                id: "AZURE_CLIENT_SECRET",
                label: "Azure client secret"
            }, {
                type: "text",
                id: "AZURE_TENANT_ID",
                label: "Azure tenant ID"
            }
        ]
    }

    // ERRORS
    const errors = {
        title: "Errors",
        icon: "fas fa-bug",
        items: [{
                type: "text",
                id: "ERR_REPORTING_RECIPIENTS",
                label: "Error reporting recipients",
                placeholder: "youradmin@yourdomain.com"
            },
            {
                type: "text",
                id: "INSTANCE",
                label: "Error reporting instance name",
                placeholder: "Production server"
            }
        ]
    }

    // Matrix background
    createBlock({
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        items: [
            {
                type: "view",
                id: "common-matrix"
            }
        ]
    }).render()

    // Aggregate config sections
    const content = [
        general,
        proxy,
        tokens,
        mongodb,
        uploads,
        PDFConverter,
        smtp,
        authentication,
        errors
    ]

    // Add a menu for a direct access to any section
    content.forEach(section => section.id = section.title)

    const buttons = content.map(section => {
        return {
            type: "button",
            text: section.title,
            icon: section.icon,
            textAlign: "left",
            margin: "0 0 5px 0",
            action: () => {
                $(section.id).scrollIntoView({
                    block: "start",
                    inline: "end",
                    behavior: "smooth"
                })

                content.forEach(section => $(section.id).collapse())
                $(section.id).expand()
            }
        }
    })

    // Button to save config
    buttons.push({
        type: "button",
        icon: "fas fa-save",
        text: "Save new server parameters",
        margin: "50px 0 5px 0",
        minHeight: 40,
        borderColor: "var(--blue)",
        action: async () => $("kissjs-server-setup").saveConfig()
    })

    // Button to Exit SETUP mode
    buttons.push({
        type: "button",
        text: "Exit setup mode",
        icon: "fas fa-reply",
        margin: "0 0 5px 0",
        minHeight: 40,
        borderColor: "var(--red)",
        action: () => $("kissjs-server-setup").exitSetupMode()
    })

    // Buttons floating container
    createPanel({
        header: false,
        position: "fixed",
        top: 0,
        left: 0,
        margin: 5,
        layout: "vertical",
        items: buttons
    }).render()

    // Setup panel
    createPanel({
        id: "kissjs-server-setup",
        title: "KissJS server setup",
        icon: "fas fa-bolt",
        layout: "vertical",

        width: 800,
        height: () => kiss.screen.current.height - 40,
        align: "center",
        verticalAlign: "center",
        overflowY: "auto",

        defaultConfig: {
            type: "panel",
            layout: "vertical",
            collapsible: true,
            margin: 5,
            boxShadow: "var(--shadow-1)",
            defaultConfig: {
                fieldWidth: "100%",
                labelWidth: 200
            }
        },
        items: content,

        methods: {
            async load() {
                const currentSetup = await kiss.ajax.request({
                    url: "/setup"
                })

                Object.keys(currentSetup).forEach(fieldId => {
                    const field = $(fieldId)
                    if (!field) return
                    field.setValue(currentSetup[fieldId])
                })
            },

            async saveConfig() {
                const config = $("kissjs-server-setup").getData()
                await kiss.ajax.request({
                    url: "/setup",
                    method: "post",
                    body: JSON.stringify(config)
                })

                createDialog({
                    type: "message",
                    message: "Your new server configuration has been saved in the .env config file."
                }).render()
            },
         
            exitSetupMode() {
                createDialog({
                    title: "Exiting setup mode?",
                    type: "danger",
                    message:
                        `Are you sure you want to exit setup mode?
                        There is no way to return to this setup screen directly.
                        Please re-check your parameters before validating.

                        To re-run the setup later, you need to manually edit the .env file:
                        - Find the parameter SETUP=false
                        - Change it to SETUP=true
                        - Restart the server again`,
                    action: async () => {
                        await kiss.ajax.request({
                            url: "/setup",
                            method: "post",
                            body: JSON.stringify({
                                SETUP: false
                            })
                        })
        
                        createDialog({
                            type: "message",
                            message: `The setup is done. You need to restart the server to apply changes.`
                        })
                    }
                })
            }
        }
    }).render()
};