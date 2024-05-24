/**
 * Window to display the message about successful Box session
 * 
 * @ignore
 */
kiss.app.defineView({
    id: "box-session",
    renderer: function (id, target) {
        return createPanel({
            id,
            target,
            title: txtTitleCase("box.com"),
            icon: "fas fa-box",

            draggable: true,
            align: "center",
            verticalAlign: "center",

            items: [{
                type: "html",
                html: txt("<center>Thank you!<br>Your Box session has been restored.<br></center>"),
                padding: "50px"
            }],

            methods: {
                load: () => {
                    window.close()
                }
            }
        })
    }
})

;