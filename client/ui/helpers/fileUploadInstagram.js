/**
 * 
 * Widget to upload files from instagram
 * 
 * @ignore
 */
const createFileUploadInstagram = function () {
    // Instagram optional details
    const instagramOption = {
        baseUrl: "https://api.instagram.com/oauth/authorize",
        clientId: "3985518578229875",
        redirectUrl: "https://449abdd7f2cf.ngrok.io/instagramOauth", // replace it with your redirect url here
        nextPage: "",
        images: []
    }

    return createBlock({
        id: "file-upload-instagram",
        flex: 1,
        layout: "vertical",
        items: [
            // Hidden upload button to submit the files
            {
                hidden: true,
                type: "html",
                html: /*html*/ `<input id="field-upload-instagram" type="file" multiple>`
            },

            // BLock to display the list of files
            {
                id: "upload-instagram-gallery",
                layout: "vertical",
                alignItems: "center",
                overflow: "auto",
                flex: 1,
                class: "upload-gallery",

                items: [
                    // Html to display the help message
                    {
                        id: "upload-instagram-gallery-help",
                        type: "html",
                        margin: "auto",
                        html: txtTitleCase("#upload drive help", null, {drive: "Instagram"}) +
                            `<br>` +
                            `<center><button class="a-button box-authentication-button" onclick="$('file-upload-instagram').connect()">${txtTitleCase('connect to your %drive account', null, {drive: "Instagram"})}</button></center>`
                    },
                    // Block to preview the search result and select some images
                    {
                        hidden: true,
                        id: "upload-instagram-preview-items",
                        class: "upload-preview-items"
                    },
                    // Block to display the selected files
                    {
                        id: "upload-instagram-gallery-items",
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
                    // Button to select the files
                    {
                        hidden: true,
                        id: "load-instagram-button",
                        type: "button",
                        text: txtTitleCase("Load more files"),
                        icon: "fas fa-plus",
                        iconColorHover: "#00aaee",
                        action: (event) => $("file-upload-instagram").loadMoreFiles(event)
                    },
                    {
                        hidden: true,
                        id: "add-instagram-button",
                        type: "button",
                        text: txtTitleCase("Add files from Instagram"),
                        icon: "fas fa-plus",
                        iconColorHover: "#00aaee",
                        action: (event) => $("file-upload-instagram").addImagesFromInstagram(event)
                    },
                    // Button to upload the files
                    {
                        hidden: true,

                        id: "upload-instagram-button",
                        type: "button",
                        text: txtTitleCase("Upload"),
                        icon: "fas fa-upload",
                        iconColor: "#ffffff",
                        iconColorHover: "#000000",
                        color: "#ffffff",
                        colorHover: "#000000",
                        backgroundColor: "#00aaee",
                        backgroundColorHover: "#ffffff",

                        action: () => $("file-upload").upload("instagram")
                    },
                    // Switch to set public / private upload
                    {
                        hidden: true,
                        
                        id: "upload-instagram-ACL",
                        type: "checkbox",
                        iconColorOn: "var(--blue)",
                        iconOff: "fas fa-lock",
                        iconOn: "fas fa-lock-open",
                        width: 32
                    }
                ]
            }
        ],

        subscriptions: {
            /**
             * When Instagram Auth redirects to /instagramOauth route,
             * our server sends the valid token through WebSocket to the client which requested Instagram.
             * This subscription listens to this message and captures the token.
             */
            EVT_INSTAGRAM_CODE: (msgData) => {
                localStorage.setItem("api-instagramAccessToken", msgData.token)
                $("file-upload-instagram").getInstagramFeeds()
            }
        },

        methods: {
            /**
             * Open a new window to connect to Instagram
             */
            connect() {
                let boxAccessToken = localStorage.getItem("api-instagramAccessToken")
                if (!boxAccessToken) return window.open("https://api.instagram.com/oauth/authorize?client_id=" + instagramOption.clientId + "&scope=user_profile,user_media&response_type=code&state=" + kiss.session.getUserId() + "&redirect_uri=" + instagramOption.redirectUrl, "_blank")

                $("file-upload-instagram").getInstagramFeeds()
            },

            getInstagramFeeds() {
                let instagramAccessToken = localStorage.getItem("api-instagramAccessToken")

                fetch("/instagramMedia", {
                        method: "post",
                        body: JSON.stringify({
                            access_token: instagramAccessToken
                        })
                    })
                    .then(response => response.json())
                    .then((response) => {
                        if (response.result) {
                            const dataset = response.result.data
                            if (response.result.paging && response.result.paging.next) {
                                instagramOption.nextPage = response.result.paging.next
                                $("load-instagram-button").show()
                            }
                            dataset.map((i) => (instagramOption.images).push(i))

                            $("upload-instagram-preview-items").show()
                            $("add-instagram-button").show()
                            $("upload-instagram-gallery-items").hide()

                            const preview = (instagramOption.images).map(this.buildImagePreview).join("")

                            $("upload-instagram-preview-items").setInnerHtml(preview)
                            $("upload-instagram-gallery-help").hide()
                        }
                    })
                    .catch((err) => ("Something went wrong please check and try again.", err))
            },

            /**
             * Build a single image preview
             */
            buildImagePreview(file) {
                if (file.media_type == "VIDEO") {
                    return `<video controls src="${file.media_url}" class="upload-preview-item" onclick="$('file-upload-instagram').selectImagePreview(event)"><source src="${file.media_url}"></video>`
                } else {
                    return `<img src="${file.media_url}" class="upload-preview-item" onclick="$('file-upload-instagram').selectImagePreview(event)" loading="lazy">`
                }
            },

            /**
             * Select an image preview
             */
            selectImagePreview(event) {
                const image = event.target
                image.classList.toggle("upload-instagram-item-selected")
            },

            /**
             * Add the selected images to the list of files to upload
             */
            addImagesFromInstagram(event) {
                event.preventDefault()

                const token = kiss.session.getToken()
                const selectedImages = document.querySelectorAll(".upload-instagram-item-selected")
                const images = [...selectedImages].map(image => {
                    var fileName = (image.getAttribute("src")).split("/").pop()
                    fileName = fileName.split("?")[0]
                    return {
                        image: image.getAttribute("src"),
                        name: fileName
                    }
                })

                kiss.ajax.request({
                    url: "/multiUrlToBase64",
                    method: "post",
                    showLoading: true,
                    body: JSON.stringify({
                        url: images
                    })
                })
                .then(async response => {
                    $("upload-instagram-preview-items").hide()
                    $("add-instagram-button").hide()
                    $("upload-instagram-gallery-items").show()
                    
                    allDocumentData = response.result
                    allDocumentData.forEach(data => $("file-upload").previewBase64File({
                        result: data.fileData,
                        status: "success"
                    }, data.name, "instagram"))
                })
                .catch((err) => ("Error occured ", err))
            },

            /**
             * Load More Instagram Files
             */
            loadMoreFiles(event) {
                event.preventDefault()

                fetch(instagramOption.nextPage, {
                        method: "get",
                    })
                    .then(response => response.json())
                    .then((response) => {
                        const dataset = response.data
                        paging = response.paging

                        if (response.paging && response.paging.next) {
                            instagramOption.nextPage = response.paging.next
                            $("load-instagram-button").show()
                        } else {
                            instagramOption.nextPage = ""
                            $("load-instagram-button").hide()
                        }

                        dataset.map((i) => (instagramOption.images).push(i))

                        const preview = (instagramOption.images).map(this.buildImagePreview).join("")
                        $("upload-instagram-preview-items").setInnerHtml(preview)
                    })
                    .catch((err) => ("Something went wrong please check and try again.", err))
            }
        }
    })
}

;