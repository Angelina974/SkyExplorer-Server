/**
 * 
 * Widget to upload images from a web search
 * 
 * @ignore
 */
const createFileUploadWebSearch = function () {
    return createBlock({
        id: "file-upload-websearch",
        flex: 1,
        layout: "vertical",
        items: [
            // Hidden upload button to submit the files
            {
                hidden: true,
                type: "html",
                html: /*html*/ `<input id="field-upload-websearch" type="file" multiple>`
            },
            // BLock to display the list of files
            {
                id: "upload-websearch-gallery",
                layout: "vertical",
                alignItems: "center",
                overflow: "auto",
                flex: 1,
                class: "upload-gallery",
                
                items: [
                    // Html to display the help message
                    {
                        id: "upload-websearch-gallery-help",
                        type: "html",
                        margin: "auto",
                        html: txtTitleCase("#upload web search help")
                    },
                    // Block to preview the search result and select some images
                    {
                        id: "upload-websearch-preview-items",
                        class: "upload-preview-items"
                    },
                    // Block to display the selected files
                    {
                        id: "upload-websearch-gallery-items",
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
                    // Text to enter the web search
                    {
                        id: "upload-websearch-url",
                        type: "text",
                        placeholder: txtTitleCase("enter your search term and press Enter"),
                        padding: "0px",
                        fieldWidth: 300,
                        events: {
                            onkeypress: function (event) {
                                if (event.key == "Enter") {
                                    $("file-upload-websearch").downloadFileFromWebSearch(event)
                                    $("upload-websearch-preview-items").show()
                                    $("upload-websearch-gallery-items").hide()
                                    $("upload-websearch-url").setValue("")
                                }
                            }
                        }
                    },
                    // Button to select the files
                    {
                        type: "button",
                        text: txtTitleCase("add images from Web search"),
                        icon: "fas fa-plus",
                        iconColorHover: "#00aaee",
                        action: (event) => $("file-upload-websearch").addImagesFromWebSearch(event)
                    },
                    {
                        type: "spacer",
                        flex: 1
                    },
                    // Button to upload the files
                    {
                        hidden: true,

                        id: "upload-websearch-button",
                        type: "button",
                        text: txtTitleCase("upload"),
                        icon: "fas fa-upload",
                        iconColor: "#ffffff",
                        iconColorHover: "#000000",
                        color: "#ffffff",
                        colorHover: "#000000",
                        backgroundColor: "#00aaee",
                        backgroundColorHover: "#ffffff",
                        action: () =>$("file-upload").upload("websearch")
                    },
                    // Switch to set public / private upload
                    {
                        hidden: true,
                        
                        id: "upload-websearch-ACL",
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
            async downloadFileFromWebSearch(event) {
                event.preventDefault()

                const search = $("upload-websearch-url").getValue()
                if (!search) return

                $("upload-websearch-gallery").showLoading()

	            try{
		            const response = await kiss.ajax.request({
			            url: "/googleImageSearch",
			            method: 'post',
			            body: JSON.stringify({ search })
		            });

		            if(!response) return;

					console.log(response)
		            const webImages = (response.result || []).map((item) => {
			            return {
				            "url": item.link,
				            "thumbnail": item.image.thumbnailLink,
				            "snippet": item.title,
				            "context": item.image.contextLink
			            }
		            })

		            const preview = webImages.map(this.buildImagePreview).join("")
		            $("upload-websearch-preview-items").setInnerHtml(preview)
	            }catch(err){
					log('kiss.fileUpload.googleWebSearch - Error while trying to upload file: ', 4, err)
	            } finally {
		            $("upload-websearch-gallery").hideLoading()
		            $("upload-websearch-gallery-help").hide()
				}
            },

            /**
             * Build a single image preview
             */
            buildImagePreview(file) {
                return `<img src="${file.thumbnail}" fullSizeImage="${file.url}" class="upload-preview-item" onclick="$('file-upload-websearch').selectImagePreview(event)" loading="lazy">`
            },

            /**
             * Select an image preview
             */
            selectImagePreview(event) {
                const image = event.target
                image.classList.toggle("upload-preview-item-selected")
            },

            /**
             * Add the selected images to the list of files to upload
             */
            addImagesFromWebSearch(event) {
                event.preventDefault()

                const selectedImages = document.querySelectorAll(".upload-preview-item-selected")
                const images = [...selectedImages].map(image => {
                    return {
                        image: image.getAttribute("fullSizeImage"),
                        thumb: image.src
                    }
                })

                kiss.ajax.request({
                    url: "/multiUrlToBase64",
                    method: "post",
                    body: JSON.stringify({
                        url: images
                    })
                })
                .then(async response => {
                    $("upload-websearch-preview-items").hide()
                    $("upload-websearch-gallery-items").show()
                    $("upload-websearch-button").show()

                    // Build the result in the right format to be processed by the function "previewBase64File":
                    let files = response.result.map((file, i) => {
                        let fileExtension = file.fileData.split(';')[0].split('/')[1]
                        return {
                            data: {
                                result: file.fileData,
                                status: "success"
                            },
                            name: "WebImage_" + i + "." + fileExtension
                        }
                    })

                    // Preview each element
                    files.forEach(file => $("file-upload").previewBase64File(file.data, file.name, "websearch"))
                })
            }
        }
    })
}

;