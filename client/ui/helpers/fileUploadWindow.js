/**
 * 
 * Generates a file upload window
 * 
 * @ignore
 */
const createFileUploadWindow = function (config = {}) {

    const uploadServices = {
        local: txtTitleCase("my device"),
        link: txtTitleCase("link (URL)"),
        websearch: txtTitleCase("web search"),
        dropbox: txtTitleCase("dropbox"),
        box: txtTitleCase("box"),
        googledrive: txtTitleCase("google drive"),
        onedrive: txtTitleCase("one Drive"),
        instagram: txtTitleCase("instagram"),
        takephoto: txtTitleCase("take photo"),
    }

    return createPanel({
        id: "file-upload",
        title: txtTitleCase("upload files"),
        headerBackgroundColor: (kiss.context.application) ? kiss.context.application.color : "#00aaee",

        modal: true,
        draggable: true,
        closable: true,

        // Center vertically and horizontally
        align: "center",
        verticalAlign: "center",

        class: (kiss.screen.isMobile) ? "upload-window-mobile" : "upload-window",
        layout: "vertical",
        items: [
            // Container for the buttons to select a file upload service
            {
                hidden: kiss.screen.isMobile, // Mobile has only access to local files & camera
                layout: "horizontal",
                alignItems: "center",
                minHeight: 50,

                defaultConfig: {
                    margin: "0px 10px 0px 0px",
                    iconColorHover: "#00aaee"
                },

                items: [{
                        id: "upload-method-button",
                        type: "button",
                        text: txtTitleCase("choose your upload method"),
                        icon: "fas fa-chevron-down",
                        iconPosition: "right",
                        action: () => {

                            // Exit if the menu already exists
                            if ($("upload-method-menu")) return

                            // Otherwise build the menu
                            const buttonBox = $("upload-method-button").getBoundingClientRect()

                            createMenu({
                                    id: "upload-method-menu",
                                    top: buttonBox.top + 40,
                                    left: buttonBox.left,
                                    width: () => $("upload-method-button").getBoundingClientRect().width,
                                    items: [{
                                            text: uploadServices.local,
                                            icon: "fas fa-paperclip",
                                            action: () => $("file-upload").displayService("file-upload-local")
                                        },
                                        {
                                            text: uploadServices.link,
                                            icon: "fas fa-link",
                                            action: () => $("file-upload").displayService("file-upload-link")
                                        }, {
                                            type: "button",
                                            text: uploadServices.websearch,
                                            icon: "fas fa-search",
                                            action: () => $("file-upload").displayService("file-upload-websearch")
                                        }, {
                                            type: "button",
                                            text: uploadServices.box,
                                            icon: "fas fa-box",
                                            action: () => $("file-upload").displayService("file-upload-box")
                                        }, {
                                            type: "button",
                                            text: uploadServices.dropbox,
                                            icon: "fab fa-dropbox",
                                            action: () => $("file-upload").displayService("file-upload-dropbox")
                                        }, {
                                            type: "button",
                                            text: uploadServices.onedrive,
                                            icon: "fas fa-cloud",
                                            action: () => $("file-upload").displayService("file-upload-onedrive")
                                        }, {
                                            type: "button",
                                            text: uploadServices.googledrive,
                                            icon: "fab fa-google-drive",
                                            action: () => $("file-upload").displayService("file-upload-googledrive")
                                        }, {
                                            type: "button",
                                            text: uploadServices.instagram,
                                            icon: "fab fa-instagram",
                                            action: () => $("file-upload").displayService("file-upload-instagram")
                                        }, {
                                            type: "button",
                                            text: uploadServices.takephoto,
                                            icon: "fas fa-camera",
                                            action: () => $("file-upload").displayService("file-upload-takephoto")
                                        }
                                    ]
                                })
                                .render()
                        }
                    },
                    {
                        id: "upload-method-title",
                        type: "html",
                        class: "upload-method-title",
                        html: uploadServices.local
                    }
                ]
            },
            // Container for the file upload services
            {
                id: "file-upload-services",
                layout: "vertical",
                width: "100%",
                class: "upload-gallery-container",
                multiview: true,

                items: [
                    createFileUploadLocal(),
                    createUploadGoogleDrive(),
                    createFileUploadLink(),
                    createFileUploadDropbox(),
                    createFileUploadBox(),
                    createFileUploadWebSearch(),
                    createFileUploadOneDrive(),
                    createFileUploadInstagram(),
                    createFileUploadTakePhoto(),
                ]
            }
        ],

        // Observe onclose event
        events: {
            onclose: () => {
                // Close the upload method menu if it's opened while exiting the upload widget
                if ($("upload-method-menu")) kiss.views.remove("upload-method-menu")

                // Propagate close event in case some other elements depend on it
                kiss.pubsub.publish("EVT_FILE_UPLOAD_CLOSED")
            }
        },

        methods: {
            /**
             * Display the right upload service
             * 
             * @param {string} uploadServiceType - "local" | "link" | "dropbox" | "box" | "websearch" | "googledrive" | "onedrive"
             */
            displayService(uploadServiceType) {
                $("file-upload-services").showItemById(uploadServiceType)
                $("upload-method-title").setInnerHtml(uploadServices[uploadServiceType.split("-")[2]])
            },

            // Function to set selected files into input field of type file
            fileSetter(data, uploadServiceType) {
                let objHidden = document.getElementById("field-upload-" + uploadServiceType);
                const dt = new DataTransfer()

                for (let i = 0; i < data.length; i++) {
                    const file = data[i]
                    dt.items.add(file)
                    objHidden.files = dt.files
                }
            },

            /**
             * Upload the list of selected files
             * 
             * @param {string} uploadServiceType - "local" | "link" | "dropbox" | "box" | "websearch" | "googledrive" | "onedrive"
             * @param {function} callback
             */
            upload(uploadServiceType, callback) {
                // Exit if offline
                if (kiss.session.isOffline()) return kiss.tools.featureNotAvailable()

                // Check file upload field
                const formData = new FormData()
                const input = $("field-upload-" + uploadServiceType)

                if (input.files.length == 0) {
                    return createNotification(txtTitleCase("Please add some file before uploading..."))
                }

                // Add files to form data
                for (let i = 0; i < input.files.length; i++) {
                    formData.append("files", input.files[i])
                }

                // Set ACL for uploaded files ("public" or "private")
                const ACLSwitch = $("upload-" + uploadServiceType + "-ACL")
                let ACLValue = (ACLSwitch) ? ACLSwitch.getValue() : "private"
                ACLValue = (ACLValue === true) ? "public" : "private"
                formData.append("ACL", ACLValue)

                kiss.ajax.request({
                        method: "post",
                        url: "/upload",
                        contentType: "multipart/form-data",
                        showLoading: true,
                        body: formData
                    })
                    .then(data => {
                        // Reset the gallery
                        $("upload-" + uploadServiceType + "-gallery-help").show()
                        $("upload-" + uploadServiceType + "-gallery-items").innerHTML = " "

                        // Reset the <input type="file"> field
                        const dt = new DataTransfer()
                        input.files = dt.files

                        // Hide the upload button
                        $("upload-" + uploadServiceType + "-button").hide()
                        $("upload-" + uploadServiceType + "-ACL").hide()

                        // Execute custom callback
                        if (callback) callback()

                        // Broadcast the uploaded files
                        kiss.pubsub.publish("EVT_FILE_UPLOAD", {
                            modelId: config.modelId,
                            recordId: config.recordId,
                            fieldId: config.fieldId,
                            files: data
                        })

                        $("file-upload").close()
                    })
                    .catch((err) => {
                        log("kiss.ui - File upload with service <" + uploadServiceType + "> failed:", 4, err)
                    })
            },

            /**
             * Preview base 64 data
             * 
             * @param {object} data
             * @param {string} fileName
             * @param {string} uploadServiceType - "local" | "link" | "dropbox" | "box" | "websearch" | "googledrive" | "onedrive"
             */
            previewBase64File(data, fileName, uploadServiceType) {
                if (data.status == "success") {
                    const dt = new DataTransfer()
                    const input = $("field-upload-" + uploadServiceType)
                    const files = input.files

                    // Add the files which are already attached to the <input type=file> field
                    for (let i = 0; i < files.length; i++) {
                        let file = files[i]
                        dt.items.add(file)
                        input.files = dt.files
                    }

                    // Add the new file created from URL
                    let dataUrl = data.result
                    let fileData = $("file-upload").dataURLtoFile(dataUrl, fileName)
                    dt.items.add(fileData)

                    // Update the <input type="file"> field
                    input.files = dt.files

                    // Update the upload button text
                    const btnUploadText = txtTitleCase("upload %n file(s)", null, {
                        n: input.files.length
                    })
                    $("upload-" + uploadServiceType + "-button").setText(btnUploadText).show()
                    $("upload-" + uploadServiceType + "-ACL").show()

                    // Add the preview of the new file
                    $("file-upload").previewFile(fileData, (input.files.length - 1), uploadServiceType)
                }
            },

            /**
             * Preview the files that have been selected for upload
             * 
             * @param {array} files - List of selected files to upload
             * @param {string} uploadServiceType - "local" | "link" | "dropbox" | "box" | "websearch" | "googledrive" | "onedrive"
             */
            previewFiles: function (files, uploadServiceType) {
                $("upload-" + uploadServiceType + "-gallery-items").innerHTML = " "

                files = [...files]
                files.forEach((file, i) => {
                    $("file-upload").previewFile(file, i, uploadServiceType)
                })

                // Update the upload button
                const btnUploadText = txtTitleCase("upload %n file(s)", null, {
                    n: files.length
                })
                $("upload-" + uploadServiceType + "-button").setText(btnUploadText)
                if (files.length > 0) {
                    $("upload-" + uploadServiceType + "-button").show()
                    $("upload-" + uploadServiceType + "-ACL").show()
                }
                
                // Show ACL switcher
                const ACLSwitch = $("upload-" + uploadServiceType + "-ACL")
                if (ACLSwitch) ACLSwitch.show()
            },

            /**
             * Show file preview after upload
             * 
             * @param {object} file 
             * @param {number} i - File index
             * @param {string} uploadServiceType - "local" | "link" | "dropbox" | "box" | "websearch" | "googledrive" | "onedrive"
             */
            previewFile: function (file, i, uploadServiceType) {
                // Hide the help message of the gallery
                $("upload-" + uploadServiceType + "-gallery-help").hide()

                const extension = (file.name).split(".").pop()
                const reader = new FileReader()
                reader.readAsDataURL(file)

                reader.onloadend = function () {
                    let thumbnail = $("file-upload").getFileUploadThumbnail(extension, reader.result)

                    $("upload-" + uploadServiceType + "-gallery-items").innerHTML += /*html*/ `
                        <div class="upload-item">
                            <span class="upload-thumbnail-container">${thumbnail}</span>
                            <span class="upload-filename">${file.name}</span>
                            <span class="upload-filesize">${file.size.toFileSize()}</span>
                            <span class="upload-delete fas fa-times" index="${i}" onclick="$('file-upload').deleteFile(this, '${uploadServiceType}')"></span>
                        </div>
                    `.removeExtraSpaces()
                }
            },

            /**
             * Convert base64 data to file
             * 
             * @param {string} dataUrl 
             * @param {string} filename 
             * @returns {object}
             */
            dataURLtoFile(dataUrl, filename) {
                let arr = dataUrl.split(','),
                    mime = arr[0].match(/:(.*?);/)[1],
                    bstr = atob(arr[1]),
                    n = bstr.length,
                    u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new File([u8arr], filename, {
                    type: mime
                })
            },

            /**
             * Delete a file from the upload list
             * 
             * @param {Element} element - DOM element of the Delete button
             * @param {string} uploadServiceType - "local" | "link" | "dropbox" | "box" | "websearch" | "googledrive" | "onedrive"
             */
            deleteFile: function (element, uploadServiceType) {
                const index = element.getAttribute("index")
                const dt = new DataTransfer()
                const input = $("field-upload-" + uploadServiceType)
                const files = input.files
                for (let i = 0; i < files.length; i++) {
                    let file = files[i]
                    if (index != i) dt.items.add(file)
                    input.files = dt.files
                }
                $("file-upload").previewFiles(input.files, uploadServiceType)

                // If it was the last element, show the gallery help message and hide the upload button 
                if (input.files.length == 0) {
                    $("upload-" + uploadServiceType + "-gallery-help").show()
                    $("upload-" + uploadServiceType + "-button").hide()
                    $("upload-" + uploadServiceType + "-ACL").hide()
                }
                else {
                    $("upload-" + uploadServiceType + "-button").show()
                    $("upload-" + uploadServiceType + "-ACL").show()
                }
            },

            /**
             * Return an image thumbnail, which can be:
             * - a real image, for image files
             * - a font awesome icon class, for all other types
             * 
             * @param {string} fileType
             * @param {string} encodedImage - Base64 image used for gallery thumbnail
             * @returns {string} The Font Awesome class
             */
            getFileUploadThumbnail(fileType, encodedImage) {
                switch (fileType.toLowerCase()) {
                    // Images
                    case "jpg":
                    case "jpeg":
                    case "png":
                    case "gif":
                    case "webp":
                        return `<img class="upload-thumbnail" src="${encodedImage}">`

                        // Other
                    default:
                        const {
                            icon, color
                        } = kiss.tools.fileToIcon(fileType.toLowerCase())
                        return `<span style="color: ${color}" class="fas ${icon} upload-thumbnail"></span>`
                }
            }
        }
    }).render()
}

;