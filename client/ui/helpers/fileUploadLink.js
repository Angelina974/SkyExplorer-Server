/**
 * 
 * Widget to upload files from an URL link
 * 
 * @ignore
 */
const createFileUploadLink = function () {
    return createBlock({
        id: "file-upload-link",
        flex: 1,
        layout: "vertical",
        items: [
            // Hidden upload button to submit the files
            {
                hidden: true,
                type: "html",
                html: /*html*/ `<input id="field-upload-link" type="file" multiple>`
            },
            // BLock to display the list of files
            {
                id: "upload-link-gallery",
                layout: "vertical",
                alignItems: "center",
                overflow: "auto",
                flex: 1,
                class: "upload-gallery",
                
                items: [
                    // Html to display the help message
                    {
                        id: "upload-link-gallery-help",
                        type: "html",
                        margin: "auto",
                        html: txtTitleCase("#upload link help")
                    },
                    // Block to display the selected files
                    {
                        id: "upload-link-gallery-items",
                        class: "upload-gallery-items"
                    }
                ]
            },
            // Bottom bar with buttons
            {
                layout: "horizontal",
                class: "upload-button-bar",

                defaultConfig: {
                    height: 36,
                    margin: "0px 0px 0px 10px"
                },

                items: [
                    // Text to copy/paste the link
                    {
                        id: "upload-link-url",
                        type: "text",
                        placeholder: txtTitleCase("enter an URL here"),
                        padding: "0px",
                        fieldWidth: 300
                    },
                    // Button to select the files
                    {
                        type: "button",
                        text: txtTitleCase("add file from URL"),
                        icon: "fas fa-link",
                        iconColorHover: "#00aaee",
                        action: function (event) {
                            $("file-upload-link").downloadFileFromUrl(event)
                            $("upload-link-url").setValue("")
                        }
                    },
                    {
                        type: "spacer",
                        flex: 1
                    },
                    // Button to upload the files
                    {
                        hidden: true,

                        id: "upload-link-button",
                        type: "button",
                        text: txtTitleCase("upload"),
                        icon: "fas fa-upload",
                        iconColor: "#ffffff",
                        iconColorHover: "#000000",
                        color: "#ffffff",
                        colorHover: "#000000",
                        backgroundColor: "#00aaee",
                        backgroundColorHover: "#ffffff",
                        action: () => $("file-upload").upload("link")
                    },
                    // Switch to set public / private upload
                    {
                        hidden: true,
                        
                        id: "upload-link-ACL",
                        type: "checkbox",
                        iconColorOn: "var(--blue)",
                        iconOff: "fas fa-lock",
                        iconOn: "fas fa-lock-open",
                        width: 32
                    }
                ]
            }
        ],

        methods: {

            /**
             * Download the list of selected files
             */
            downloadFileFromUrl(event) {
                event.preventDefault()

                const ImageUrl = $("upload-link-url").getValue()
                if (!ImageUrl) return

                const fileName = ImageUrl.split('/').pop()

                kiss.ajax.request({
                    url: "/urlToBase64",
                    method: "post",
                    showLoading: true,
                    body: JSON.stringify({
                        url: ImageUrl
                    })
                })
                .then(async data => $("file-upload").previewBase64File(data, fileName, "link"))
                .catch((err) => console.log("File upload: ", err))
            }
        }
    })
}

;