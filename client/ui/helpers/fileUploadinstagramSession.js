/**
 * Window to display the message about successful Instagram session
 * 
 * @ignore
 */
kiss.app.defineView({
    id: "instagram-session",
    renderer: function (id, target) {
        return createPanel({
            id,
            target,
            title: txtTitleCase("instagram.com"),
            icon: "fas fa-instagram",

            draggable: true,
            align: "center",
            verticalAlign: "center",

            items: [{
                type: "html",
                html: txt("<center>Thank you!<br>Your instagram session has been restored.<br>You can close this page.</center>"),
                padding: "50px"
            }]
        })
    }
})

;