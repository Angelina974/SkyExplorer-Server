/**
 * 
 * Widget to upload files from the local device
 * 
 * @ignore
 */
const createFileUploadLocal = function () {
    return createBlock({
        id: "file-upload-local",
        flex: 1,
        layout: "vertical",
        items: [
            // Hidden upload button to submit the files
            {
                hidden: true,
                type: "html",
                html: /*html*/ `<input id="field-upload-local" type="file" multiple onchange="$('file-upload').previewFiles(this.files, 'local')">`
            },
            // Gallery block
            {
                id: "upload-local-gallery",
                layout: "vertical",
                overflow: "auto",
                alignItems: "center",
                flex: 1,
                class: "upload-gallery",

                items: [
                    // Html to display the help message
                    {
                        id: "upload-local-gallery-help",
                        type: "html",
                        display: "flex",
                        flexFlow: "column",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        flex: 1,
                        html: (kiss.screen.isMobile) ? txtTitleCase("#upload local help mobile") : txtTitleCase("#upload local help")
                    },
                    // Block to display the selected files
                    {
                        id: "upload-local-gallery-items",
                        class: "upload-gallery-items"
                    }
                ],

                // Drag'n drop events
                events: {
                    dragover: function (e) {
                        e.preventDefault()
                        this.classList.add("upload-gallery-dragover")
                    },
                    dragleave: function () {
                        this.classList.remove("upload-gallery-dragover")
                    },
                    drop: function (e) {
                        e.preventDefault()
                        this.classList.remove("upload-gallery-dragover")
                        $("file-upload-local").handleDrop(e)
                    }
                },
            },

            // Bottom bar with buttons
            {
                layout: (kiss.screen.isMobile) ? "vertical" : "horizontal",
                class: "upload-button-bar",
                
                defaultConfig: {
                    margin: "10px 10px 0px 0px",
                    iconColorHover: "#00aaee"
                },
                
                items: [
                    // Flex element to fill space
                    {
                        type: "spacer",
                        flex: 1
                    },
                    // Button to select the files
                    {
                        type: "button",
                        text: txtTitleCase("select files to upload"),
                        icon: "fas fa-file-alt",
                        action: () => $("field-upload-local").click()
                    },
                    {
                        layout: "horizontal",
                        width: "100%",
                        items: [
                            // Button to upload the files
                            {
                                hidden: true,
                                id: "upload-local-button",
                                type: "button",
                                text: txtTitleCase("Upload"),
                                icon: "fas fa-upload",
                                iconColor: "#ffffff",
                                iconColorHover: "#000000",
                                color: "#ffffff",
                                colorHover: "#000000",
                                backgroundColor: "#00aaee",
                                backgroundColorHover: "#ffffff",
                                flex: 1,
                                action: () => $("file-upload").upload("local")
                            },
                            // Switch to set public / private upload
                            {
                                hidden: true,
                                id: "upload-local-ACL",
                                type: "checkbox",
                                tip: txtTitleCase("#upload security mode"),
                                iconColorOn: "var(--blue)",
                                iconOff: "fas fa-lock",
                                iconOn: "fas fa-lock-open",
                                width: 50
                            }
                        ]
                    }

                ]
            }
        ],

        methods: {

            /**
             * Handle files after drag'n drop event
             * 
             * @param {object} event - The drop event
             */
            handleDrop: function (event) {
                const files = event.dataTransfer.files
                $("field-upload-local").files = files
                $("file-upload").previewFiles(files, "local")
            }
        }
    })
}

;