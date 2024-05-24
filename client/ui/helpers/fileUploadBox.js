/**
 * 
 * Widget to upload files from Box.com
 * 
 * @ignore
 */
const createFileUploadBox = function () {
    const BOX_COM_SELECT = "https://app.box.com/js/static/select"
    const BOX_COM_PICKER = "https://cdn01.boxcdn.net/platform/elements/13.0.0/en-US/picker"
    const BOX_COM_PICKER_CSS = "https://cdn01.boxcdn.net/platform/elements/13.0.0/en-US/picker"

    const boxClientID = "s4mkchshoxquwjquomli1dneiwysp2oa"
    const boxAuthenticationUrl = `https://www.box.com/api/oauth2/authorize?client_id=${boxClientID}&response_type=code&state=${kiss.session.getUserId()}&redirect_uri=${encodeURIComponent(window.location.origin + '/boxConnect')}`
    const checkTokenUrl = "https://api.box.com/2.0/folders/0?fields=id&limit=1&offset=0"
    const logoUrl = (kiss.global.absolutePath) ? kiss.global.absolutePath + "/client/pickaform/resources/img/logo 32x32.png" : "./resources/img/logo 32x32.png"

	let filePicker

    return createBlock({
        id: "file-upload-box",
        flex: 1,
        layout: "vertical",
        items: [
            // Hidden upload button to submit the files
            {
                hidden: true,
                type: "html",
                html: /*html*/ `<input id="field-upload-box" type="file" multiple>`
            },
            // BLock to display the list of files
            {
                id: "upload-box-gallery",
                layout: "vertical",
                alignItems: "center",
                overflow: "auto",
                flex: 1,
                class: "upload-gallery",

                items: [
                    // Html to display the help message
                    {
                        id: "upload-box-gallery-help",
                        type: "html",
                        margin: "auto",
                        html: txtTitleCase("#upload drive help", null, {
                                drive: "Box"
                            }) +
                            `<br>` +
                            `<center><button class="a-button box-authentication-button" onclick="$('file-upload-box').connect()">${txtTitleCase('connect to your %drive account', null, {drive: "Box"})}</button></center>`
                    },
                    // Block to display the selected files
                    {
                        id: "upload-box-gallery-items",
                        class: "upload-gallery-items"
                    },
                    // Block to encapsulate the Box file picker
                    {
                        id: "upload-box-picker",
                        hidden: true,
                        class: "upload-box-picker"
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
                    // Flex element to fill space
                    {
                        type: "spacer",
                        flex: 1
                    },
                    // Button to upload the files
                    {
                        hidden: true,

                        id: "upload-box-button",
                        type: "button",
                        text: txtTitleCase("Upload"),
                        icon: "fas fa-upload",
                        iconColor: "#ffffff",
                        iconColorHover: "#000000",
                        color: "#ffffff",
                        colorHover: "#000000",
                        backgroundColor: "#00aaee",
                        backgroundColorHover: "#ffffff",

                        action: () => $("file-upload").upload("box", function () {
                            $("upload-box-picker").show()
                            $("upload-box-gallery-help").hide()
                        })
                    },
                    // Switch to set public / private upload
                    {
                        hidden: true,
                        
                        id: "upload-box-ACL",
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
             * When Box.com redirects to /boxConnect route,
             * our server sends the valid token through WebSocket to the client which requested Box.com.
             * This subscription listens to this message and captures the token.
             */
            EVT_BOX_CODE: (msgData) => {
                localStorage.setItem("api-boxAccessToken", msgData.token)
                $("file-upload-box").showBoxFilePicker()
            }
        },

        methods: {
            /**
             * When loading the component, we check if the boxAccessToken already exists.
             * If yes, we check if the token is still valid.
             * If the token is valid, we use it immediately to display the Box file picker.
             * If not, we do nothing: the user has to log in to Box manually.
             */
            _afterShow: function () {
                let boxAccessToken = localStorage.getItem("api-boxAccessToken")
                if (!boxAccessToken) return

                // Try to fetch a file to test the token
                fetch(checkTokenUrl, {
                        method: "get",
                        headers: {
                            Authorization: "Bearer " + boxAccessToken
                        },
                    })
                    .then(() => {
                        // If it works, the token is still valid
                        this.showBoxFilePicker()
                    })
                    .catch(() => {
                        // Otherwise we do nothing (the user has to reconnect manually using the button)
                    })
            },

            /**
             * Open a new window to connect to Box.com
             */
            connect() {
				const height = 800,
					  width  = 500
	            const y = window.top.outerHeight / 2 + window.top.screenY - ( height / 2);
	            const x = window.top.outerWidth / 2 + window.top.screenX - ( width / 2);

				const win = window.open(
					boxAuthenticationUrl,
	                "BoxLogin",
	                `location,toolbar=no,menubar=no,fullscreen=no,`
	                + `height=${height}px,width=${width}px,top=${y},left=${x}`
				)

	            const timer = setInterval(() => {
					// This is a hack. As long as the window doesn't have the same origin
		            // as the current page, accessing win.document will throw an CORS error
		            // If no CORS errer is thrown, then we know we have been redirected on ui=box-session
					try{
						win.document
		            }catch(err){
			            return
		            }

					// Token not set yet, we must await window loading.
					if(!window.localStorage.getItem('api-boxAccessToken')) return

		            if(win.closed) this.showBoxFilePicker()
		            else{
			            // Ok we can attach the event and trigger
			            win.addEventListener("beforeunload", () => {
				            if(window.localStorage.getItem('api-boxAccessToken')){
					            this.showBoxFilePicker()
				            }
			            })

			            win.close()
		            }

					clearInterval(timer)
	            }, 500)

                return win
            },

            /**
             * Show the file picker
             */
            async showBoxFilePicker() {
                // Dynamically load the Box script
                if (!window.Box) {
                    const loadingId = kiss.loadingSpinner.show()
                    await kiss.loader.loadScript(BOX_COM_SELECT)
                    await kiss.loader.loadScript(BOX_COM_PICKER)
                    await kiss.loader.loadStyle(BOX_COM_PICKER_CSS)
                    kiss.loadingSpinner.hide(loadingId)
                }

                const FilePicker = Box.FilePicker

	            // Reset the gallery
	            $("upload-box-gallery-help").hide()
	            $("upload-box-gallery-items").innerHTML = " "

	            if(filePicker){
		            // Display the picker container
		            $("upload-box-picker").show()
		            return
	            }

                filePicker = new FilePicker({
                    container: ".upload-box-picker",
                })

                let boxAccessToken = localStorage.getItem("api-boxAccessToken")

                // Insert the picker into the DOM
                filePicker.show("0", boxAccessToken, {
                    container: ".upload-box-picker",
                    canUpload: false,
                    canCreateNewFolder: false,
                    canSetShareAccess: false,
                    logoUrl
                })

	            // Display the picker container
	            $("upload-box-picker").show()

                // Attach event listener for when the choose button is pressed
                filePicker.addListener("choose", function (items) {

                    $("upload-box-picker").hide()

                    kiss.ajax.request({
                            url: "/boxFileDetail",
                            method: "post",
                            body: JSON.stringify({
                                items: items,
                                token: boxAccessToken
                            })
                        })
                        .then(async response => {
                            // Build the result in the right format to be processed by the function "previewBase64File":
                            let files = response.result.map(file => {
                                return {
                                    data: {
                                        result: file.fileData,
                                        status: "success"
                                    },
                                    name: file.name
                                }
                            })

                            // Preview each element
                            files.forEach(file => $("file-upload").previewBase64File(file.data, file.name, "box"))
                        })
                })

                // Attach event listener for when the cancel button is pressed
                filePicker.addListener("cancel", function () {
	                $("upload-box-gallery-help").show()

	                // Display the picker container
	                $("upload-box-picker").hide()
                })
            }
        }
    })
}

;