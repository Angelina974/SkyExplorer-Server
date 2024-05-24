/**
 * Authentication => registration process
 */
kiss.app.defineView({
    id: "authentication-register",
    renderer: function (id, target) {
        // Grab parameters sent through URL
        const userEmail = kiss.router.getRoute().email
        const pendingUserId = kiss.router.getRoute().userId

        // Define the possible login methods and build registration buttons accordingly
        let loginMethods = kiss.router.getRoute().lm
        if (!loginMethods) loginMethods = kiss.session.getLoginMethods()

        const allLoginButtons = kiss.session.getLoginMethodTypes().slice(1).map(loginMethod => {
            return {
                type: "button",
                alias: loginMethod.alias,
                text: loginMethod.text,
                icon: loginMethod.icon,
                action: async () => {

                    // Some environment (ex: docker) don't allow external registration
                    const serverEnvironment = await kiss.session.getServerEnvironment()
                    if (serverEnvironment == "docker") {
                        return createNotification(txtTitleCase("#feature not available"))
                    }

                    document.location = loginMethod.callback
                }
            }
        })

        const loginButtons = Array.from(loginMethods).map(loginMethodAlias => allLoginButtons.find(button => button.alias == loginMethodAlias))
        const hasInternalLogin = loginMethods.includes("i")
        const hasExternalLogin = loginMethods.includes("g")

        /**
         * Show a welcome popup once the registration is complete
         */
        const showWelcome = () => {
            $("register").hide()

            createPanel({
                type: "panel",
                title: txtUpperCase("welcome onboard"),
                icon: "fas fa-handshake",
                headerBackgroundColor: "var(--background-blue)",
                position: "absolute",
                top: () => ((window.innerHeight - 128) / 2) + "px",
                width: () => Math.min(window.innerWidth - 100, 600),
                align: "center",

                items: [{
                    type: "html",
                    html: "<center>" + txtTitleCase("#thanks for registration") + "</center>",
                    padding: "32px"
                }]
            }).render()
        }

        /**
         * Generates the panel containing the login infos
         */
        return createBlock({
            id,
            target,

            items: [
                // Fullscreen background with cover image
                {
                    id: "register-page",
                    fullscreen: true,
                    layout: "horizontal",
                    overflow: "auto",

                    items: [
                        // Gradient
                        {
                            flex: 1,
                            background: "var(--background-blue)"
                        },
                        // Image
                        {
                            id: "welcome-image",
                            flex: 1,
                            
                            type: "image",
                            position: "absolute",
                            top: 0,
                            left: "50%",
                            minWidth: "100%",
                            height: "100%",
                            objectFit: "cover",
                            src: "./resources/img/registration.jpg",
                            alt: "Registration",
                        }
                    ]
                },

                // Logo and register window
                {
                    margin: "0px 0px 200px 0px",

                    items: [
                        // Logo
                        {
                            hidden: !app.logo,
                            position: "absolute",
                            top: 0,
                            left: 0,

                            type: "image",
                            src: app.logo,
                            alt: "Logo"
                        },
                        {
                            id: "register",
                            type: "panel",
                            headerBackgroundColor: "var(--background-blue)",
                            draggable: true,

                            width: 800,
                            align: "center",
                            verticalAlign: "center",
                            layout: "horizontal",

                            // Language buttons
                            headerButtons: kiss.templates.authLanguageButtons(),

                            items: [
                                // LOCAL REGISTRATION METHOD
                                {
                                    hidden: !hasInternalLogin,

                                    flex: 1,
                                    class: "auth-block",

                                    defaultConfig: {
                                        width: "100%",
                                        fieldWidth: "100%",
                                        labelPosition: "top",
                                        padding: "2px 0"
                                    },

                                    items: [
                                        // FIRST NAME
                                        {
                                            type: "text",
                                            id: "firstName",
                                            placeholder: txtTitleCase("first name"),
                                            required: true
                                        },
                                        // LAST NAME
                                        {
                                            type: "text",
                                            id: "lastName",
                                            placeholder: txtTitleCase("last name"),
                                            required: true
                                        },
                                        // COMPANY
                                        {
                                            hidden: (pendingUserId) ? true : false,
                                            type: "text",
                                            id: "company",
                                            placeholder: txtTitleCase("company")
                                        },
                                        // TELEPHONE
                                        {
                                            hidden: (pendingUserId) ? true : false,
                                            type: "text",
                                            id: "telephone",
                                            placeholder: txtTitleCase("telephone")
                                        },
                                        // EMAIL
                                        {
                                            type: "text",
                                            id: "email",
                                            placeholder: txtTitleCase("email"),
                                            required: true,
                                            validationType: "email",
                                            value: userEmail
                                        },
                                        // PASSWORD
                                        {
                                            type: "password",
                                            id: "password",
                                            placeholder: txtTitleCase("password"),
                                            required: true
                                        },
                                        // PASSWORD CONFIRMATION
                                        {
                                            type: "password",
                                            id: "passwordConfirmation",
                                            placeholder: txtTitleCase("password confirmation"),
                                            required: true
                                        },
                                        // BUTTONS
                                        {
                                            layout: "horizontal",
                                            margin: "20px 0px 0px 0px",
                                            items: [
                                                // REGISTER button
                                                {
                                                    type: "button",
                                                    icon: "fa fa-check",
                                                    text: txtTitleCase("register"),
                                                    iconColor: "#00aaee",
                                                    flex: 1,
                                                    height: 40,
                                                    events: {
                                                        click: async function () {
                                                            let fieldFirstName = $("firstName")
                                                            let fieldLastName = $("lastName")
                                                            let fieldEmail = $("email")
                                                            let fieldPassword = $("password")
                                                            let fieldPasswordConfirmation = $("passwordConfirmation")

                                                            fieldFirstName.validate()
                                                            fieldLastName.validate()
                                                            fieldEmail.validate()
                                                            fieldPassword.validate()
                                                            fieldPasswordConfirmation.validate()

                                                            if (fieldFirstName.isValid && fieldLastName.isValid && fieldEmail.isValid && fieldPassword.isValid && fieldPasswordConfirmation.isValid) {
                                                                let firstName = fieldFirstName.getValue()
                                                                let lastName = fieldLastName.getValue()
                                                                let email = fieldEmail.getValue()
                                                                let password = fieldPassword.getValue()
                                                                let passwordConfirmation = fieldPasswordConfirmation.getValue()

                                                                if (password != passwordConfirmation) {
                                                                    createNotification(txtTitleCase("#password don't match"))
                                                                    return $("register").setAnimation("shakeX")
                                                                }

                                                                kiss.ajax.request({
                                                                        url: "/register",
                                                                        method: "post",
                                                                        body: JSON.stringify({
                                                                            userId: pendingUserId,
                                                                            firstName: firstName,
                                                                            lastName: lastName,
                                                                            language: kiss.language.current,
                                                                            email: email,
                                                                            password: password,
                                                                            passwordConfirmation: passwordConfirmation
                                                                        })
                                                                    })
                                                                    .then(response => {
                                                                        if (response.error) {
                                                                            $("register").setAnimation("shakeX")

                                                                            // Beta closed!
                                                                            if (response.error == "#beta closed") {
                                                                                createDialog({
                                                                                    title: "Beta test is closed",
                                                                                    message: response.msg,
                                                                                    noCancel: true
                                                                                })
                                                                            }
                                                                        } else {
                                                                            // Jump to welcome page
                                                                            showWelcome()
                                                                        }
                                                                    }).catch(err => {
                                                                        $("register").setAnimation("shakeX")
                                                                    })
                                                            } else {
                                                                $("register").setAnimation("shakeX")
                                                            }
                                                        }
                                                    }
                                                }
                                            ]
                                        },
                                        // LINK TO LOGIN PAGE
                                        {
                                            type: "html",
                                            html: `
                                            <div class="auth-create-account">${txtTitleCase("#already an account")}</div>
                                        `,
                                            events: {
                                                click: () => kiss.router.navigateTo({
                                                    ui: "authentication-login",
                                                    lm: loginMethods
                                                }, true)
                                            }
                                        }
                                    ]
                                },

                                // Separation between registration methods
                                {
                                    hidden: !hasInternalLogin || !hasExternalLogin,

                                    id: "auth-separator",
                                    class: "auth-separator",

                                    layout: "vertical",
                                    items: [{
                                            type: "spacer",
                                            flex: 1
                                        },
                                        {
                                            type: "html",
                                            class: "auth-separator-text",
                                            html: txtUpperCase("or")
                                        },
                                        {
                                            type: "spacer",
                                            flex: 1
                                        }
                                    ]
                                },

                                // OTHER REGISTRATION METHODS
                                {
                                    hidden: !hasExternalLogin,
                                    flex: 1,
                                    class: "auth-block",
                                    layout: "vertical",
                                    justifyContent: "center",

                                    defaultConfig: {
                                        margin: "5px",
                                        colorHover: "#00aaee",
                                        backgroundColorHover: "#ffffff",
                                        iconSize: "20px",
                                        iconColorHover: "#00aaee",
                                        height: 40
                                    },

                                    items: loginButtons.concat({
                                        hidden: hasInternalLogin,
                                        type: "html",
                                        html: `<div class="auth-create-account">${txtTitleCase("#already an account")}</div>`,
                                        events: {
                                            click: () => kiss.router.navigateTo({
                                                ui: "authentication-login",
                                                lm: loginMethods
                                            }, true)
                                        }
                                    })
                                }
                            ],

                            methods: {
                                load: function () {
                                    this.adjustToScreen()
                                },

                                /**
                                 * Adjust layout to screen size
                                 */
                                adjustToScreen: () => {
                                    if (kiss.context.ui != "authentication-register") return

                                    if (kiss.screen.isVertical()) {
                                        $("welcome-image").hide()
                                        $("register").config.width = (kiss.screen.isMobile) ? "320px" : "380px"
                                        $("panel-body-register").style.flexFlow = "column"
                                        $("auth-separator").style.flexFlow = "row"
                                    } else {
                                        $("welcome-image").show()
                                        $("register").config.width = "760px"
                                        $("panel-body-register").style.flexFlow = "row"
                                        $("auth-separator").style.flexFlow = "column"
                                    }
                                }
                            },

                            // Responsiveness
                            subscriptions: {
                                EVT_WINDOW_RESIZED: function () {
                                    this.adjustToScreen()
                                }
                            }
                        }
                    ]
                }

            ]
        })
    }
})

;