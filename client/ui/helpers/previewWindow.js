/**
 * 
 * Generates the panel to preview files
 * 
 * TODO: bandwith optimization:
 * => cache the preview images that have already been opened to avoid reloading from the network
 * => to cache the blocks, use kiss.views.removeAndCacheNode and kiss.views.restoreCachedNode
 * => free the memory when leaving the preview window, using kiss.views.deleteCachedNode
 * => maybe generalize the concept building a "card" container, using the same approach as Sencha ExtJS
 * => check: https://docs.sencha.com/extjs/6.2.0/classic/Ext.layout.container.Card.html
 * 
 * @ignore
 */
const createPreviewWindow = function (files, fileId) {
    const useExternalViewer = true
    const disableNavigation = (files.length < 2) || (kiss.screen.isMobile && kiss.screen.isVertical())

    // Create a single thumbnail item
    const createThumbnail = function (file) {
        const fileType = file.filename.split(".").pop().toLowerCase()
        let viewHtml = ""
        let previewHtml = ""

        // Format filename properly
        let filePath = kiss.tools.createFileURL(file)
        filePath = filePath.replaceAll("\\", "/")

        if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileType)) {
            // Image
            viewHtml = `<img class="preview-item" src="${filePath}" loading="lazy">`
            previewHtml = `<img class="preview-thumbnail" src="${kiss.tools.createFileURL(file, 's')}" loading="lazy">`

        } else if (fileType == "pdf") {
            // PDF
            viewHtml = `<iframe width=100% height=100% frameborder=0 border=0 cellspacing=0 src="${filePath}"/>`
            previewHtml = `<span style="color: #ff0000" class="fas fa-file-pdf preview-thumbnail"></span>`

        // } else if (fileType == "docx" && useExternalViewer) {
        //     // DOCX with external viewer (Google viewer or Microsoft Office viewer)
        //     const encodedPath = encodeURIComponent(filePath)
        //     // const url = (useExternalViewer) ? "https://docs.google.com/viewer?embedded=true&url=" + encodedPath : filePath
        //     const url = (useExternalViewer) ? "https://view.officeapps.live.com/op/embed.aspx?src=" + encodedPath : filePath
            
        //     viewHtml = `<iframe width=100% height=100% frameborder=0 border=0 cellspacing=0 src="${url}"/>`
        //     previewHtml = `<span style="color: #00aaee" class="fas fa-file-word preview-thumbnail"></span>`

        } else {
            // Icon
            const {
                icon,
                color
            } = kiss.tools.fileToIcon(fileType)

            viewHtml = `<span style="color: ${color}" class="fas ${icon} preview-item preview-item-icon"></span>
                        <div class="preview-not-available">
                            ${txtTitleCase("#no preview") + " " + fileType}
                        </div>`

            previewHtml = `<span style="color: ${color}" class="fas ${icon} preview-thumbnail"></span>`
        }

        // Create an html element containing either an image or an icon
        return createHtml({
            id: "preview-file-" + file.id,
            html: previewHtml,
            display: "inline-block",

            // Mark the html element with a specific class to recognize it with querySelectorAll
            class: "preview-thumbnail-item",

            events: {
                click: function () {
                    this
                        .select()
                        .openPreview()
                }
            },

            methods: {
                openPreview() {
                    $("preview-content").setInnerHtml(viewHtml)
                    $("preview-window").setTitle(file.filename + " (" + file.size.toFileSize() + ")")
                    $("preview-window").currentPreview = file.id
                    const iframe = $("preview-content").querySelector('iframe')

                    if (iframe) {
                        // Workaround to reload the frame if the token was outdated.
                        iframe.addEventListener('load', async () => {
                            try {
                                const bodyContent = iframe.contentDocument.body.innerText;

                                try {
                                    const json = JSON.parse(bodyContent);
                                    if (json && json.error) {
                                        if (json.code === 498) {
                                            if (!await kiss.session.getNewToken()) {
                                                log("previewWindow - Unable to get a new token to preview the file.")
                                                return
                                            }

                                            let src = iframe.src
                                            iframe.src = ''
                                            iframe.src = src
                                        } // else nothing to do.
                                    }
                                } catch (err) {
                                    // Not JSON data. Nothing to do.
                                    return
                                }
                            } catch (err) {
                                // Unable to detect the error, we're probably in CORS context.
                                // console.error('Unable to check the preview pdf content. Maybe CORS issue.')
                            }
                        })
                    }
                    return this
                },

                select() {
                    const previewItemElements = $("preview-window").querySelectorAll(".preview-thumbnail")
                    const previewItems = [...previewItemElements]
                    previewItems.forEach(item => item.classList.remove("preview-thumbnail-selected"))
                    this.querySelector(".preview-thumbnail").classList.add("preview-thumbnail-selected")
                    return this
                }
            }
        })
    }

    // Build the preview window panel
    return createPanel({
        id: "preview-window",
        modal: true,
        closable: true,
        icon: "fas fa-search",
        headerBackgroundColor: (kiss.context.application) ? kiss.context.application.color : "#00aaee",
        background: "#000000",
        animation: "fadeIn",
        autoSize: true,

        // Size & position
        position: "absolute",
        top: 10,
        left: 10,
        height: () => (kiss.screen.current.height - 20) + "px",
        width: () => (kiss.screen.current.width - 20) + "px",
        padding: 0,

        // Content
        layout: "vertical",
        items: [
            // Preview content
            {
                id: "preview-content-container",
                layout: "horizontal",
                items: [
                    // Left navigation arrow
                    {
                        hidden: disableNavigation,
                        id: "preview-content-previous",

                        class: "preview-navigation",
                        layout: "vertical",
                        items: [{
                                type: "spacer",
                                flex: 1
                            },
                            // It's vertically aligned thanks to the flex spacers
                            {
                                type: "html",
                                flex: 0,
                                html: `<span class="fas fa-chevron-left preview-navigation-button"></span>`,
                                events: {
                                    // Switch to previous preview
                                    click: () => $("preview-window").openPreviousPreview()
                                }
                            },
                            {
                                type: "spacer",
                                flex: 1
                            }
                        ]
                    },
                    // Content
                    {
                        id: "preview-content",
                        width: "100%",
                        height: () => {
                            if (disableNavigation) return kiss.screen.getHeightMinus(80) + "px"
                            return kiss.screen.getHeightMinus(160) + "px"
                        },
                        class: "preview-item-container"
                    },
                    // Right navigation arrow
                    {
                        hidden: disableNavigation,
                        id: "preview-content-next",
                        class: "preview-navigation",

                        layout: "vertical",
                        items: [{
                                type: "spacer",
                                flex: 1
                            },
                            {
                                type: "html",
                                flex: 0,
                                html: `<span class="fas fa-chevron-right preview-navigation-button"></span>`,
                                events: {
                                    // Switch to next preview
                                    click: () => $("preview-window").openNextPreview()
                                }
                            },
                            {
                                type: "spacer",
                                flex: 1
                            }
                        ]
                    }
                ]
            },
            // Thumbnails
            {
                hidden: disableNavigation,
                id: "preview-thumbnails",
                class: "preview-thumbnails-container",
                items: files.filter(file => file.path).map(createThumbnail)
            }
        ],

        events: {
            onclick: function() {
                if (disableNavigation) this.close()
            },

            mousewheel: function (event) {
                if (disableNavigation) return

                // Navigating with the mousewheel
                if (event.wheelDelta < 0) this.openNextPreview()
                else this.openPreviousPreview()
            },

            keydown: function (event) {
                // Close the preview window using Escape key
                if (event.key == "Escape") $("preview-window").close()

                if (disableNavigation) return

                // Navigating with the arrows
                if (event.key == "ArrowRight") return this.openNextPreview()
                if (event.key == "ArrowLeft") return this.openPreviousPreview()
            }
        },

        methods: {
            // Automatically preview the clicked image when loading the window
            load() {
                this.openPreview(fileId)
            },

            openPreview(fileId) {
                const thumbnail = $("preview-file-" + fileId)

                thumbnail
                    .select()
                    .openPreview()

                setTimeout(() => thumbnail.scrollIntoView({
                    block: "center",
                    inline: "center",
                    behavior: "smooth"
                }), 200)
            },

            openNextPreview() {
                const currentPreviewId = $("preview-window").currentPreview
                let previewIndex = files.findIndex(item => item.id == currentPreviewId)
                previewIndex++
                if (previewIndex >= files.length) previewIndex = 0
                const newPreviewId = files[previewIndex].id
                $("preview-window").openPreview(newPreviewId)
            },

            openPreviousPreview() {
                const currentPreviewId = $("preview-window").currentPreview
                let previewIndex = files.findIndex(item => item.id == currentPreviewId)
                previewIndex--
                if (previewIndex < 0) previewIndex = files.length - 1
                const newPreviewId = files[previewIndex].id
                $("preview-window").openPreview(newPreviewId)
            }
        }
    }).render()
}

;