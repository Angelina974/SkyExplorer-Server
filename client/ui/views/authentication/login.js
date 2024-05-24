/**
 * Authentication => login
 */
kiss.app.defineView({
    id: "authentication-login",
    renderer: function (id, target) {

        // Define the possible login methods and build connection buttons accordingly
        let loginMethods = kiss.router.getRoute().lm
        if (!loginMethods) loginMethods = kiss.session.getLoginMethods()

        const allLoginButtons = kiss.session.getLoginMethodTypes().slice(1).map(loginMethod => {
            return {
                type: "button",
                alias: loginMethod.alias,
                text: loginMethod.text,
                icon: loginMethod.icon,
                action: async () => {

                    // Some environment (ex: docker) don't allow external auth
                    const serverEnvironment = await kiss.session.getServerEnvironment()
                    if (serverEnvironment == "docker") {
                        return createNotification(txtTitleCase("#feature not available"))
                    }

                    $("login").showLoading({
                        fullscreen: true,
                        spinnerSize: 128
                    })

                    let acceptInvitationOf = kiss.context.acceptInvitationOf || ''
                    if (acceptInvitationOf) acceptInvitationOf = '?acceptInvitationOf=' + acceptInvitationOf

                    document.location = loginMethod.callback + acceptInvitationOf
                }
            }
        })

        const loginButtons = Array.from(loginMethods).map(loginMethodAlias => allLoginButtons.find(button => button.alias == loginMethodAlias))
        const hasInternalLogin = loginMethods.includes("i")
        const hasExternalLogin = loginMethods.includes("g")

        // Default login infos (useful for test mode)
        const username = kiss.router.getRoute().username
        const password = kiss.router.getRoute().password

        // Get the required redirection after login, if any, or points to the default home page
        const redirectTo = kiss.context.redirectTo || {
            ui: kiss.session.defaultViews.home
        }
        delete kiss.context.redirectTo

        /**
         * Generates the panel containing the login infos
         */
        return createBlock({
            id,
            target,

            items: [
                // Fullscreen background with cover image
                {
                    id: "login-page",
                    fullscreen: true,
                    layout: "horizontal",
                    overflow: "auto",

                    items: [
                        // Gradient
                        {
                            flex: 1,
                            background: "var(--background-blue)"
                        },
                        // Matrix effect
                        {
                            type: "view",
                            id: "common-matrix"
                        }
                    ]
                },

                // Logo and login window
                {
                    items: [
                        // Logo
                        {
                            hidden: !app.logo,
                            position: "absolute",
                            top: 0,
                            left: 0,

                            type: "image",
                            src: app.logo,
                            alt: "Logo",

                        },
                        {
                            id: "login",
                            type: "panel",
                            headerBackgroundColor: "var(--background-blue)",
                            draggable: true,

                            width: 800,
                            maxHeight: () => kiss.screen.current.height,
                            
                            align: "center",
                            verticalAlign: "center",
                            layout: "horizontal",
                            overflowY: "auto",

                            // Language buttons
                            headerButtons: kiss.templates.authLanguageButtons(),

                            items: [
                                // LOCAL LOGIN METHOD
                                {
                                    hidden: !hasInternalLogin,

                                    flex: 1,
                                    class: "auth-block",
                                    overflow: "hidden",

                                    defaultConfig: {
                                        width: "100%",
                                        fieldWidth: "100%",
                                        labelPosition: "top",
                                        padding: 0
                                    },

                                    items: [
                                        // EMAIL
                                        {
                                            type: "text",
                                            id: "username",
                                            label: txtTitleCase("email"),
                                            required: true,
                                            validationType: "email",
                                            value: username
                                        },
                                        // PASSWORD
                                        {
                                            type: "password",
                                            id: "password",
                                            label: txtTitleCase("password"),
                                            value: password,
                                            events: {
                                                keydown: (event) => {
                                                    if (event.key == "Enter") {
                                                        $("login").login()
                                                    }
                                                }
                                            }
                                        },
                                        // LOGIN button
                                        {
                                            type: "button",
                                            icon: "fa fa-check",
                                            text: txtTitleCase("login"),
                                            iconColor: "#00aaee",
                                            height: 40,
                                            margin: "20px 0",
                                            events: {
                                                click: () => $("login").login()
                                            }
                                        },
                                        // LINK TO PASSWORD RESET
                                        {
                                            type: "html",
                                            html: `
                                            <div class="auth-reset-password">${txtTitleCase("forgot password?")}</div>
                                        `,
                                            events: {
                                                click: () => $("login").requestPasswordReset()
                                            }
                                        },                                        
                                        // LINK TO REGISTER PAGE
                                        {
                                            hidden: kiss.screen.isMobile,
                                            type: "html",
                                            html: `
                                            <div class="auth-create-account">${txtTitleCase("#no account")}</div>
                                        `,
                                            events: {
                                                click: () => kiss.router.navigateTo({
                                                    ui: "authentication-register",
                                                    lm: loginMethods
                                                }, true)
                                            }
                                        }
                                    ]
                                },

                                // Separation between login methods
                                {
                                    hidden: !hasInternalLogin || !hasExternalLogin,

                                    id: "auth-login-separator",
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

                                // OTHER LOGIN METHODS
                                {
                                    hidden: !hasExternalLogin,
                                    id: "auth-login-external",
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
                                        html: `<div class="auth-create-account">${txtTitleCase("#no account")}</div>`,
                                        events: {
                                            click: () => kiss.router.navigateTo({
                                                ui: "authentication-register",
                                                lm: loginMethods
                                            }, true)
                                        }
                                    })
                                }
                            ],

                            methods: {
                                async load() {
                                    // Check if a token was returned from a 3rd party service (Microsoft, Google, ...)
                                    // If yes, update the session with the token before routing
                                    const token = kiss.router.getRoute().token
                                    if (token) {
                                        this.hide()
                                        const success = await kiss.session.login({
                                            token: token
                                        })

                                        if (success) {
                                            await kiss.router.navigateTo(redirectTo, true)
                                        } else {
                                            $("login").setAnimation("shakeX")
                                        }
                                    } else {

                                        // Responsiveness
                                        this.adjustToScreen()
                                    }
                                },

                                /**
                                 * Try to login
                                 */
                                async login() {
                                    const fieldUsername = $("username")
                                    const fieldPassword = $("password")

                                    if (fieldUsername.isValid && fieldPassword.isValid) {
                                        const success = await kiss.session.login({
                                            username: fieldUsername.getValue(),
                                            password: fieldPassword.getValue()
                                        })

                                        if (success) {
                                            await kiss.router.navigateTo(redirectTo, true)
                                        } else {
                                            $("login").setAnimation("shakeX")
                                        }
                                    } else {
                                        $("login").setAnimation("shakeX")
                                    }
                                },

                                /**
                                 * Send a request to reset the password
                                 */
                                async requestPasswordReset() {
                                    const fieldUsername = $("username")
                                    if (!fieldUsername.isValid) {
                                        createNotification(txtTitleCase("#email missing"))
                                        return
                                    }

                                    await kiss.ajax.request({
                                        url: "/requestPasswordReset",
                                        method: "post",
                                        showLoading: true,
                                        body: JSON.stringify({
                                            username: fieldUsername.getValue(),
                                            language: kiss.language.current
                                        })
                                    })

                                    createDialog({
                                        type: "message",
                                        message: txtTitleCase("#password reset request")
                                    })
                                },

                                /**
                                 * Adjust layout to screen size
                                 */
                                adjustToScreen() {
                                    if (!$("authentication-login")) return

                                    if (kiss.screen.isVertical()) {
                                        $("common-matrix").hide()
                                        $("login").config.width = "380px"
                                        $("panel-body-login").style.flexFlow = "column"
                                        $("auth-login-separator").style.flexFlow = "row"
                                    } else {
                                        $("common-matrix").show()
                                        $("login").config.width = "760px"    
                                        $("panel-body-login").style.flexFlow = "row"
                                        $("auth-login-separator").style.flexFlow = "column"
                                    }
                                    
                                    if (kiss.screen.isMobile) {
                                        $("login").config.width = "95%" 
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