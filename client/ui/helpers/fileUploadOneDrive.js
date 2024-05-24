/**
 * 
 * Widget to upload files from Microsoft One Drive
 * 
 * @ignore
 */
const createFileUploadOneDrive = function () {
    const oneDriveOption = {
        clientId: "9f2e6664-61f3-412b-b1ea-5aa4c7411876",
        action: "download",
        multiSelect: true,
        redirectUri: window.location.host + "/fake",
        openInNewWindow: true,
        advanced: {
            queryParameters: "select=id,name,size,file,folder,photo,@microsoft.graph.downloadUrl"
        },

        // Required. Called when a user selects an item in the file picker.
        success: function (files) {
            $("file-upload-onedrive").downloadFilesFromOneDrive(files.value)
        }
    }

    return createBlock({
        id: "file-upload-onedrive",
        flex: 1,
        layout: "vertical",
        items: [
            // Hidden upload button to submit the files
            {
                hidden: true,
                type: "html",
                html: /*html*/ `<input id="field-upload-onedrive" type="file" multiple>`
            },

            // BLock to display the list of files
            {
                id: "upload-onedrive-gallery",
                layout: "vertical",
                alignItems: "center",
                overflow: "auto",
                flex: 1,
                class: "upload-gallery",

                items: [
                    // Html to display the help message
                    {
                        id: "upload-onedrive-gallery-help",
                        type: "html",
                        margin: "auto",
                        html: txtTitleCase("#upload drive help", null, {drive: "One Drive"}) +
                            `<br>` +
                            `<center><button class="a-button box-authentication-button" onclick="$('file-upload-onedrive').connect()">${txtTitleCase('connect to your %drive account', null, {drive: "One Drive"})}</button></center>`
                    },
                    // Block to display the selected files
                    {
                        id: "upload-onedrive-gallery-items",
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

                        id: "upload-onedrive-button",
                        type: "button",
                        text: txtTitleCase("Upload"),
                        icon: "fas fa-upload",
                        iconColor: "#ffffff",
                        iconColorHover: "#000000",
                        color: "#ffffff",
                        colorHover: "#000000",
                        backgroundColor: "#00aaee",
                        backgroundColorHover: "#ffffff",

                        action: () => $("file-upload").upload("onedrive")
                    },
                    // Switch to set public / private upload
                    {
                        hidden: true,
                        
                        id: "upload-onedrive-ACL",
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
             * Open a new window to connect to OneDrive.com
             */
            async connect() {
                // Dynamically load the OneDrive script
                // if (!window.OneDrive) {
                //     const loadingId = kiss.loadingSpinner.show()
                //     await kiss.loader.loadScript(ONE_DRIVE_SRC)
                //     kiss.loadingSpinner.hide(loadingId)
                // }
                OneDrive.open(oneDriveOption)
            },

            /**
             * Download multiple files from one drive
             */
            downloadFilesFromOneDrive(filesData) {
                let selectedImage = []
                for (let files of filesData) {
                    selectedImage.push({
                        image: files["@microsoft.graph.downloadUrl"],
                        thumb: files.thumbnails[0].medium["url"],
                        name: files.name
                    })
                }

                // Fetch the base64 data by image url
                kiss.ajax.request({
                    url: "/multiUrlToBase64",
                    method: "post",
                    showLoading: true,
                    body: JSON.stringify({
                        url: selectedImage
                    })
                })
                .then(async response => {
                    allDocumentData = response.result
                    allDocumentData.forEach(data => $("file-upload").previewBase64File({
                        result: data.fileData,
                        status: "success"
                    }, data.name, "onedrive"))
                })
                .catch((err) => ("Error occured ", err))            
            }
        }
    })
}

;