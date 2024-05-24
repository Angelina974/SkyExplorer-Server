/**
 * Authentication => reset password process
 */
kiss.app.defineView({
    id: "authentication-reset-password",
    renderer: function (id, target) {

        return createBlock({
            id,
            target,

            items: [
                // Fullscreen background with cover image
                {
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
                            class: "auth-welcome"
                        }
                    ]
                },

                // Logo and password reset window
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
                            id: "password-reset",
                            type: "panel",
                            title: txtTitleCase("password reset"),
                            icon: "fas fa-recycle",
                            headerBackgroundColor: "var(--background-blue)",
                            draggable: true,

                            width: 450,
                            align: "center",
                            verticalAlign: "center",
                            layout: "horizontal",

                            // Language buttons
                            headerButtons: kiss.templates.authLanguageButtons(),

                            items: [{
                                flex: 1,
                                class: "auth-block",

                                defaultConfig: {
                                    width: "100%",
                                    labelPosition: "top"
                                },

                                items: [
                                    // PASSWORD
                                    {
                                        type: "password",
                                        id: "password",
                                        label: txtUpperCase("new password"),
                                        required: true
                                    },
                                    // PASSWORD CONFIRMATION
                                    {
                                        type: "password",
                                        id: "passwordConfirmation",
                                        label: txtUpperCase("new password confirmation"),
                                        required: true
                                    },
                                    // BUTTONS
                                    {
                                        layout: "horizontal",
                                        margin: "20px 0px 0px 0px",
                                        items: [
                                            // VALIDATE button
                                            {
                                                type: "button",
                                                icon: "fa fa-check",
                                                text: txtTitleCase("change password"),
                                                iconColor: "#00aaee",
                                                flex: 1,
                                                events: {
                                                    click: async function () {
                                                        let fieldPassword = $("password")
                                                        let fieldPasswordConfirmation = $("passwordConfirmation")

                                                        fieldPassword.validate()
                                                        fieldPasswordConfirmation.validate()

                                                        if (fieldPassword.isValid && fieldPasswordConfirmation.isValid) {
                                                            let password = fieldPassword.getValue()
                                                            let passwordConfirmation = fieldPasswordConfirmation.getValue()

                                                            if (password != passwordConfirmation) {
                                                                createNotification(txtTitleCase("#password don't match"))
                                                                return $("password-reset").setAnimation("shakeX")
                                                            }

                                                            await kiss.ajax.request({
                                                                url: "/resetPassword",
                                                                method: "post",
                                                                body: JSON.stringify({
                                                                    token: kiss.router.getRoute().token,
                                                                    password: password,
                                                                    language: kiss.language.current
                                                                })
                                                            })

                                                            kiss.router.navigateTo({
                                                                ui: "authentication-login"
                                                            }, true)
                                                        } else {
                                                            $("password-reset").setAnimation("shakeX")
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }],

                            methods: {
                                load: function () {
                                    this.adjustToScreen()
                                },

                                /**
                                 * Adjust layout to screen size
                                 */
                                adjustToScreen: () => {
                                    if (kiss.context.ui != "authentication-reset-password") return

                                    // Hide picture under a width/height ratio
                                    if (kiss.screen.current.ratio < 1) {
                                        $("welcome-image").hide()
                                    } else {
                                        $("welcome-image").show()
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