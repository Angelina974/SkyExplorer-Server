/**
 * 
 * Widget to upload files from Google Drive
 * 
 * @ignore
 */
const createUploadGoogleDrive = function () {
    const GOOGLE_AUTH_SRC = "https://accounts.google.com/gsi/client"
    const GOOGLE_DRIVE_SRC = "https://apis.google.com/js/api"
    const scope = 'https://www.googleapis.com/auth/drive.readonly'

	const appId = "pickaform-apps-1668670210366";
	const client_id = "325367213155-k97e6u17n0jq2185f8gnju04qs4afos3.apps.googleusercontent.com"

	let tokenClient
	let accessToken = null
	let pickerInitialized = false
	let driveInitialized = false
	let gisInitialized = false

	function apiLoaded(){
		gapi.load('picker', onPickerApiLoad)
		gapi.load('client', onClientLoaded)
	}

	function onPickerApiLoad() {
		pickerInitialized = true
	}

	function onClientLoaded(){
		gapi.client.load('drive', 'v2', onDriveApiLoad)
	}

	function onDriveApiLoad(){
		driveInitialized = true
	}

	function gisLoaded(){
		tokenClient = google.accounts.oauth2.initTokenClient({
			client_id,
			scope,
			callback: ''
		})

		gisInitialized = true
	}

    return createBlock({
        id: "file-upload-googledrive",
        flex: 1,
        layout: "vertical",
        items: [
            // Hidden upload button to submit the files
            {
                hidden: true,
                type: "html",
                html: /*html*/ `<input id="field-upload-googledrive" type="file" multiple>`
            },
            // BLock to display the list of files
            {
                id: "upload-googledrive-gallery",
                layout: "vertical",
                alignItems: "center",
                overflow: "auto",
                flex: 1,
                class: "upload-gallery",

                items: [
                    // Html to display the help message
                    {
                        id: "upload-googledrive-gallery-help",
                        type: "html",
                        margin: "auto",
                        html: txtTitleCase("#upload drive help", null, {drive: "Google Drive"}) +
                            `<br>` +
                            `<center><button class="a-button box-authentication-button" onclick="$('file-upload-googledrive').connect()">${txtTitleCase('connect to your %drive account', null, {drive: "Google Drive"})}</button></center>`
                    },
                    // Block to display the selected files
                    {
                        id: "upload-googledrive-gallery-items",
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
                    // Button to upload the files
                    {
                        hidden: true,

                        id: "upload-googledrive-button",
                        type: "button",
                        text: txtTitleCase("Upload"),
                        icon: "fas fa-upload",
                        iconColor: "#ffffff",
                        iconColorHover: "#000000",
                        color: "#ffffff",
                        colorHover: "#000000",
                        backgroundColor: "#00aaee",
                        backgroundColorHover: "#ffffff",

                        action: () => $("file-upload").upload("googledrive")
                    },
                    // Switch to set public / private upload
                    {
                        hidden: true,
                        
                        id: "upload-googledrive-ACL",
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
             * Load the google picker and drive scope
             */
            _afterShow: async function () {
                // Dynamically load the Google Drive script
                if (!window.google) {
                    const loadingId = kiss.loadingSpinner.show()
                    await kiss.loader.loadScript(GOOGLE_AUTH_SRC, null, { autoAddExtension: '' })
	                await kiss.loader.loadScript(GOOGLE_DRIVE_SRC)
	                kiss.loadingSpinner.hide(loadingId)
                }

                apiLoaded()
	            gisLoaded()
            },

	        showPicker(){
		        const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
		        const mimeTypeArray = [
			        "image/png",
			        "image/jpeg",
			        "image/jpg",
			        "application/msword",
			        "application/pdf",
			        "text/xml",
			        "application/vnd.ms-excel",
			        "text/plain",
			        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			        "application/vnd.ms-powerpoint"
		        ]

		        view
			        .setIncludeFolders(true)
			        .setSelectFolderEnabled(false)
			        .setMimeTypes(mimeTypeArray)

		        const picker = new google.picker.PickerBuilder()
			        .enableFeature(google.picker.Feature.NAV_HIDDEN)
			        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
			        .setOAuthToken(accessToken)
			        .setAppId(appId)
			        .addView(view)
			        .setCallback(this.pickerCallback)
			        .build()
		        picker.setVisible(true)
			},

	        connect(){
				this.createPicker()
	        },

	        createPicker(){
		        tokenClient.callback = async response => {
			        if(response.error !== undefined) throw response

			        accessToken = response.access_token
			        this.showPicker()
		        }

				if(accessToken === null){
					// No session, user should choose an account
					tokenClient.requestAccessToken({ prompt: 'consent' })
				}else{
					// There is already a session, so no need to ask to choose an account
					tokenClient.requestAccessToken({ prompt: '' })
				}
	        },

            // A simple callback implementation.
            async pickerCallback(data) {
                if (data.action == google.picker.Action.PICKED) {
                    // Getting the file object from file Id 
                    let allDocumentData = await Promise.all((data.docs).map(async doc => {
                        return await $("file-upload-googledrive").getFilesObject(doc)
                    }))

                    // Function to set selected files into input field of type file
                    $("file-upload").fileSetter(allDocumentData, "googledrive")

                    // Preview Google Drive Data 
                    $("file-upload").previewFiles(allDocumentData, "googledrive")
                }
            },

            // Get File object using file Ids
            async getFilesObject(files) {
                let res = await window.gapi.client.drive.files.get({
                    fileId: files.id,
                    alt: "media",
                })
                const dataUrl = "data:" + res.headers["Content-Type"] + ";base64," + window.btoa(res.body)
                return $("file-upload").dataURLtoFile(dataUrl, files.name)
            }
        }
    })
}

;