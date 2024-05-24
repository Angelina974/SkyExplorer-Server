/**
 * 
 * Widget to upload files from Dropbox
 * 
 * @ignore
 */
const createFileUploadDropbox = function () {
    const DROPBOX_SRC = "https://www.dropbox.com/static/api/2/dropins"
    const DROPBOX_ID = "dropboxjs"
    // const DROPBOX_APP_KEY = "2tkajpbphy1m7dj"
    const DROPBOX_APP_KEY = "hfxz6unvbi6tfyp"

    const dropBoxOptions = {
        // Required. Called when a user selects an item in the file picker.
        success: function (files) {
            $("file-upload-dropbox").downloadFilesFromDropbox(files)
        },

        // Optional. Called when the user closes the dialog without selecting a file and does not include any parameters.
        cancel: function () {
            log('Attach file request cancelled by the user')
        },

        // Optional. "preview" (default) is a preview link to the document for sharing,
        // "direct" is an expiring link to download the contents of the file.
        // For more information about link types, see Dropbox link types.
        linkType: "direct",

        // Optional. A value of false (default) limits selection to a single file,
        // while true enables multiple file selection.
        multiselect: true,

        // Optional. This is a list of file extensions. If specified, the user will
        // only be able to select files with these extensions. You may also specify
        // file types, such as "video" or "images" in the list. For more information,
        // see File types below. By default, all extensions are allowed.
        // extensions: ['.pdf', '.doc', '.docx','.jpeg','.png','.jpg'],

        // Optional. A limit on the size of each file that may be selected, in bytes.
        // If specified, the user will only be able to select files with size
        // less than or equal to this limit.
        // For the purposes of this option, folders have size zero.
        sizeLimit: 1024 * 1024 * 8, // 8Mb
    }

    return createBlock({
        id: "file-upload-dropbox",
        flex: 1,
        layout: "vertical",
        items: [
            // Hidden upload button to submit the files
            {
                hidden: true,
                type: "html",
                html: /*html*/ `<input id="field-upload-dropbox" type="file" multiple>`
            },
            // BLock to display the list of files
            {
                id: "upload-dropbox-gallery",
                layout: "vertical",
                alignItems: "center",
                overflow: "auto",
                flex: 1,
                class: "upload-gallery",

                items: [
                    // Html to display the help message
                    {
                        id: "upload-dropbox-gallery-help",
                        type: "html",
                        margin: "auto",
                        html: txtTitleCase("#upload drive help", null, {drive: "Dropbox"}) +
                            `<br>` +
                            `<center><div id="dropbox-btn" class="upload-dropbox-button"></div></center>`
                    },
                    // Block to display the selected files
                    {
                        id: "upload-dropbox-gallery-items",
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
                    // Flex element to fill space
                    {
                        type: "spacer",
                        flex: 1
                    },
                    // Button to upload the files
                    {
                        hidden: true,
                        
                        id: "upload-dropbox-button",
                        type: "button",
                        text: txtTitleCase("Upload"),
                        icon: "fas fa-upload",
                        iconColor: "#ffffff",
                        iconColorHover: "#000000",
                        color: "#ffffff",
                        colorHover: "#000000",
                        backgroundColor: "#00aaee",
                        backgroundColorHover: "#ffffff",
                        action: () => $("file-upload").upload("dropbox")
                    },
                    // Switch to set public / private upload
                    {
                        hidden: true,
                        
                        id: "upload-dropbox-ACL",
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
             * Insert the Dropbox button when loading the component
             */
            _afterShow: async function () {
                // Dynamically load the DropBox script
                if (!window.Dropbox) {
                    const loadingId = kiss.loadingSpinner.show()
                    await kiss.loader.loadScript(DROPBOX_SRC, {
                        id: DROPBOX_ID,
                        "data-app-key": DROPBOX_APP_KEY
                    })
                    kiss.loadingSpinner.hide(loadingId)
                }
                const dropBoxButton = Dropbox.createChooseButton(dropBoxOptions)
                $("dropbox-btn").appendChild(dropBoxButton)
            },

            /**
             * Download multiple files from Dropbox
             */
            downloadFilesFromDropbox(filesData) {
                filesData.forEach(fileData => this.downloadFileFromDropbox(fileData))
            },

            /**
             * Download one file from DropBox
             */
            async downloadFileFromDropbox(fileObject) {
                const fileName = fileObject.link.split('/').pop()

                kiss.ajax.request({
                    url: "/urlToBase64",
                    method: "post",
                    showLoading: true,
                    body: JSON.stringify({
                        url: fileObject.link
                    })
                })
                .then(async data => $("file-upload").previewBase64File(data, fileName, "dropbox"))
                .catch((err) => console.log("File upload: ", err))        
            }
        }
    })
}

;