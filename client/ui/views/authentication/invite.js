/**
 * Authentication => invitation process
 */
kiss.app.defineView({
    id: "authentication-invite",
    renderer: function (id, target) {
        /**
         * Generates the panel containing the login infos
         */
        return createPanel({
            id,
            target,
            title: txtTitleCase("invite a new user"),
            icon: "fas fa-user-plus",
            headerBackgroundColor: "var(--background-blue)",

            modal: true,
            draggable: true,
            position: "absolute",

            width: "500px",
            align: "center",
            verticalAlign: "center",

            items: [
                // EMAIL
                {
                    type: "text",
                    id: "email",
                    label: txtUpperCase("email"),
                    width: "100%",
                    labelPosition: "top",
                    required: true,
                    validationType: "email",
                    methods: {
                        load: function () {
                            setTimeout(() => this.focus(), 50)
                        }
                    }
                },
                // BUTTONS
                {
                    layout: "horizontal",
                    margin: "20px 0px 0px 0px",
                    items: [
                        // SEND INVITATION BUTTON
                        {
                            type: "button",
                            icon: "fa fa-paper-plane",
                            text: txtTitleCase("send the invitation"),
                            iconColor: "#00aaee",
                            flex: 1,
                            events: {
                                click: async function () {
                                    let fieldEmail = $("email")

                                    if (fieldEmail.isValid) {
                                        let email = fieldEmail.getValue()

                                        const response = await kiss.ajax.request({
                                            url: "/invite",
                                            method: "post",
                                            showLoading: true,
                                            body: JSON.stringify({
                                                email: email,
                                                language: kiss.language.current
                                            })
                                        })

                                        if (response.code === 403) {
                                            return createDialog({
                                                message: txtTitleCase(response.error),
                                                noCancel: true
                                            })
                                        }

                                        if (response.error) {
                                            createNotification({
                                                message: txtTitleCase(response.error)
                                            })
                                        } else {
                                            createNotification({
                                                message: txtTitleCase("invitation sent for") + " " + email
                                            })

                                            $("directory-users").close()
                                            $(id).close()
                                        }
                                    }
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