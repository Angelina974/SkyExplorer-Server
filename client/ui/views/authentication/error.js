/**
 * Authentication error
 */
kiss.app.defineView({
    id: "authentication-error",
    renderer: function (id, target) {

        let msgCode = kiss.router.getRoute().msgCode
        if (!msgCode) msgCode = "authentication-error"
        const errorMessage = txtTitleCase(msgCode)

        /**
         * Generates the panel containing the error infos
         */
        return createBlock({
            id,
            target,
            fullscreen: true,
            layout: "horizontal",

            items: [{
                    type: "view",
                    id: "common-matrix"
                },
                {
                    type: "panel",
                    icon: "fas fa-exclamation-triangle",
                    headerBackgroundColor: "var(--background-red)",

                    modal: true,
                    draggable: true,

                    align: "center",
                    verticalAlign: "center",
                    layout: "vertical",

                    items: [{
                            type: "html",
                            html: errorMessage,
                            padding: "32px"
                        },
                        {
                            type: "button",
                            icon: "fas fa-times",
                            flex: 1,
                            text: "OK",
                            action: () => kiss.router.navigateTo("authentication-login", true)
                        }
                    ]
                }
            ]
        })
    }
})

;