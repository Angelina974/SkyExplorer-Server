/**
 * 
 * Widget to upload files from Webcam
 * 
 * @ignore
 */
const createFileUploadTakePhoto = function () {
    return createBlock({
        id: "file-upload-takephoto",
        flex: 1,
        layout: "vertical",
        items: [
            // Hidden upload button to submit the files
            {
                hidden: true,
                type: "html",
                html: /*html*/ `<input id="field-upload-takephoto" type="file" multiple>`
            },

            // BLock to display the list of files
            {
                id: "upload-takephoto-gallery",
                layout: "vertical",
                alignItems: "center",
                overflow: "auto",
                flex: 1,
                class: "upload-gallery",

                items: [
                    // Html to display the help message
                    {
                        id: "upload-takephoto-gallery-help",
                        type: "html",
                        margin: "auto",
                        html: txtTitleCase("#upload webcam help")
                    },
                    {
                        id: "upload-takephoto"
                    },
                    // Block to preview the search result and select some images
                    {
                        id: "upload-takephoto-preview-items",
                        class: "upload-preview-items"
                    },
                    // Block to display the selected files
                    {
                        id: "upload-takephoto-gallery-items",
                        class: "upload-gallery-items"
                    },
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
                    // Flex element to fill space
                    {
                        type: "spacer",
                        flex: 1
                    },
                    // Open Webcam Button
                    {
                        type: "button",
                        text: txtTitleCase("open webcam"),
                        icon: "fas fa-camera",
                        iconColorHover: "#00aaee",
                        action: async function () {
                            $("upload-takephoto-gallery-help").hide()
                            await $("file-upload-takephoto").connect()
                            $("upload-takephoto").show()
                            $("upload-takephoto-gallery-items").hide()
                        }
                    },
                    // Add Webcam Image Button
                    {
                        type: "button",
                        text: txtTitleCase("#take photo"),
                        icon: "fas fa-plus",
                        iconColorHover: "#00aaee",
                        action: async function () {
                            await $("file-upload-takephoto").addImagesFromWebConnect()
                            $("upload-takephoto").hide()
                            $("upload-takephoto-gallery-items").show("")
                        }
                    },
                    // Button to upload the files
                    {
                        hidden: true,

                        id: "upload-takephoto-button",
                        type: "button",
                        text: txtTitleCase("Upload"),
                        icon: "fas fa-upload",
                        iconColor: "#ffffff",
                        iconColorHover: "#000000",
                        color: "#ffffff",
                        colorHover: "#000000",
                        backgroundColor: "#00aaee",
                        backgroundColorHover: "#ffffff",
                        action: () => $("file-upload").upload("takephoto")
                    },
                    // Switch to set public / private upload
                    {
                        hidden: true,
                        
                        id: "upload-takephoto-ACL",
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
            // Function to connect webcam
            async connect() {
                
                // Dynamically load the webcam script
                if (!window.Webcam) {
                    const loadingId = kiss.loadingSpinner.show()
                    await kiss.loader.loadScript("./resources/webcam/webcam.min")
                    kiss.loadingSpinner.hide(loadingId)
                }

                Webcam.set({
                    width: 450,
                    height: 400,
                    image_format: "jpeg",
                    jpeg_quality: 90
                });
                Webcam.attach($("upload-takephoto"));
            },

            // Function to add image from webcam
            async addImagesFromWebConnect() {
                if (!window.Webcam) {
                    const loadingId = kiss.loadingSpinner.show()
                    await kiss.loader.loadScript("./resources/webcam/webcam.min")
                    kiss.loadingSpinner.hide(loadingId)
                }

                // take snapshot and get image data
                Webcam.snap(function (data_uri) {
                    Webcam.reset($("upload-takephoto"))
                    $("file-upload").previewBase64File({ result: data_uri, status: "success" }, Date.now() + "capture.jpeg", "takephoto");
                });
            },
        }
    })
}

;