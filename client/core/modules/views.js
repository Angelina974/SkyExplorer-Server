/**
 * 
 * ## A simple view manager
 * 
 * @namespace
 * 
 */
kiss.views = {

    /**
     * Contains all the views that are already built
     */
    views: {},

    /**
     * Contains view renderers functions
     */
    viewRenderers: {},

    /**
     * Contains view controllers functions
     */
    viewControllers: {},

    /**
     * Contains view meta informations for SEO
     */
    viewMetas: {},

    /**
     * Contains nodes temporarily detached from the DOM
     */
    cachedNodes: {},

    /**
     * Add a view by storing its renderer function in the list of view renderers.
     * 
     * It does NOT store a view, but instead stores a view 'renderer' function that will generate the view later, and only when needed.
     * The renderer function receives 2 parameters:
     * - the view id
     * - the view target: insertion point in the DOM to insert the view
     * 
     * Note: using this method is equivalent to using kiss.app.defineView({
     *  id,
     *  renderer
     * })
     * 
     * When using KissJS for building a SEO-friendly website, you can use meta configuration to help search engine understand your content.
     * Meta information currently supported is:
     * - url
     * - locale
     * - site_name
     * - type: website | article | ...
     * - title
     * - description
     * - author
     * - image
     * - audio
     * - video
     * - other tags will generate a basic meta, like: &lt;meta name="..." content="..."&gt;
     * 
     * KissJS is dispatching information properly so you don't have to repeat yourself.
     * For example, if you enter a title, this will generate:
     * - a &lt;title&gt; tag
     * - an opengraph title
     * - a twitter title
     * 
     * If meta 'url' property has multiple languages set up, the first is canonical and other are alternate:
     * 
     * ```
     * meta: {
     *  url: {
     *      en: "https://pickaform.fr/en",
     *      fr: "https://pickaform.fr/fr"
     *  }
     * }
     * 
     * // Will generate this in the header:
     * <link rel="canonical" href="https://pickaform.fr/en">
     * <link rel="alternate" hreflang="fr" href="https://pickaform.fr/fr">
     * ```
     *
     * @param {object} config
     * @param {string} config.id - The id of the view to add
     * @param {function} config.renderer - The function that will build the view when needed
     * @param {object} config.meta - Meta informations injected in the HTML header. Can be localized or not. See example.
     * 
     * @example
     * kiss.views.addView({
     *  id: "myView",
     *  renderer: function (id, target) {
     *      let myView = ... // Must be an Html element or a KissJS component
     *      myView.id = id // The view must have the passed id
     *      myView.target = target // The view can optionaly have a target to be inserted at a specific point in the DOM
     *      return myView
     *  }
     * })
     * 
     * // Example of a view using meta informations
     * kiss.app.defineView({
     *  id: "myProductPage",
     *  meta: {
     *      title: "CRM", // Meta without localization
     *      // Meta with localization
     *      description: {
     *          en: "A useful CRM",
     *          fr: "Un CRM utile"
     *      }
     *  },
     *  renderer: function(id, target) {
     *      // ...
     *  }
     * })
     * 
     * // Example returning a KissJS panel
     * kiss.app.defineView({
     *  id: "myPanel",
     *  renderer: function (id, target) {
     *      return createPanel({
     *          id,
     *          target,
     *       
     *          title: "My panel",
     *          icon: "fas fa-check",
     *
     *          width: 300,
     *          height: 200,
     *          align: "center",
     *          verticalAlign: "center",
     *
     *          draggable: true,
     *          modal: true,
     *          closable: true,
     *          expandable: true,
     *
     *          layout: "vertical", // => The content will be "display: flex" and "flex-flow: column"
     *          items: [{
     *                  type: "html",
     *                  flex: 1, // Fill maximum space
     *                  html: `<h3>Title</h3>
     *                       <p>Hello world</p>
     *                       <br>`
     *              },
     *              {
     *                  type: "button",
     *                  text: "Say hello",
     *                  icon: "far fa-comment",
     *                  action: () => createNotification("Hello!")
     *              }
     *          ]
     *      })
     *  }
     * })
     * 
     * // Display the view
     * kiss.views.show("myPanel")
     * 
     * // Display the view using the router
     * kiss.router.navigateTo("myPanel")
     * 
     * // ...or
     * kiss.router.navigateTo({
     *  ui: "myPanel"
     * })
     */
    addView({
        id,
        renderer,
        meta
    }) {
        if (!id || !renderer) {
            log(`kiss.views - You're trying to define the view <${id}>, but it's not properly setup: a view needs an id and a renderer.`, 3)
            return
        }

        this.viewRenderers[id] = renderer
        if (meta) this.viewMetas[id] = meta
    },

    /**
     * Adds a view controller
     * 
     * @param {string} id - The view id which will receive the controller
     * @param {function} controller - The view controller
     */
    addViewController(id, controller) {
        this.viewControllers[id] = controller
    },

    /**
     * Build a view from its renderer function
     * 
     * @ignore
     * @param {string} id - The id of the view to build
     * @param {string} [target] - The DOM node where the view should be inserted
     * @returns {HTMLElement} The DOM node that represents the view
     */
    buildView(id, target) {
        // If the view is generated from a mobile and if a mobile version does exist => build the mobile version
        if (kiss.screen.isMobile && this.viewRenderers["mobile-" + id]) {
            id = "mobile-" + id
        }

        if (!this.views[id]) {
            try {
                log(`kiss.views - buildView - Building view ${id}`)

                const viewRenderer = this.viewRenderers[id]

                // Abort if the view id wasn't found
                if (!viewRenderer) {
                    log(`kiss.views - You're trying to build the view <${id}>, but it hasn't been defined.`, 3)
                    return null
                }

                const view = this.views[id] = viewRenderer(id, target)
                view.isView = true

                // Bind external controllers for views that are *not* KissJS components, but standard HTML Elements
                if (!view.isComponent) {
                    const viewControllers = kiss.views.viewControllers[id]

                    if (viewControllers)
                        for (let method in viewControllers)
                            view[method] = viewControllers[method]
                }

                // Inject meta tags if needed for SEO
                if (this.viewMetas[id]) this._insertMeta(id)

            } catch (err) {
                log(`kiss.views - buildView - The view ${id} couldn't be built`, 4, err)
            }
        }

        // Update view target in case it moved to another DOM insertion point
        if (target) this.views[id].target = target

        return this.views[id]
    },

    /**
     * Get a view from its id
     * 
     * @param {string} id - The id of the view
     * @returns {HTMLElement} The DOM node that represents the view
     */
    get(id) {
        return this.views[id]
    },

    /**
     * Remove a view *OR* any node from its id
     * - removes the view if it exists
     * - delete the node and its children
     * - unsubscribe the node and its children from PubSub to avoid memory leaks
     * 
     * @param {string} id - The id of the view
     */
    remove(id) {
        // Delete the view reference from the manager
        if (this.views[id]) delete this.views[id]

        // Delete the view node (and all its children)
        let node = $(id)
        if (node) node.deepDelete()
    },

    /**
     * Show a view at a specific point of the DOM
     * 
     * If no target has been specified, the view is inserted into the document body.
     * 
     * When calling this method, the view is either built, or retrieved from the cache if it already exists.
     * 
     * If a view is displayed inside a non-empty container, there are 2 scenarii:
     * - by default, the view is appended to the container's children
     * - if the view is "exclusive", it will replace all other children of the container (that will be pushed into the cache for future use)
     * 
     * @param {string} id - The id of the view
     * @param {string} [target] - The DOM node where the view should be inserted
     * @param {boolean} [exclusive] - Indicates if the view must be shown exclusively to other sibling views within its parent container
     * @returns {HTMLElement} The DOM node that represents the view
     * 
     * @example
     * // Example 1:
     * kiss.views.show("view 1", "containerId") // Displays view 1
     * kiss.views.show("view 2", "containerId") // Append view 2 to the container
     * 
     * // Example 2:
     * kiss.views.show("view 1", "containerId") // Displays view 1
     * kiss.views.show("view 2", "containerId", true) // Replace view 2 inside the container. View 2 is pushed into kiss.views.cachedNodes
     * 
     * // Example 3:
     * kiss.views.show("view 1", "containerId") // Displays view 1
     * kiss.views.replaceBy("view 2", "containerId") // Equivalent to previous example
     */
    show(id, target, exclusive) {
        const view = this.buildView(id)

        if (view && (!view.isConnected || view.hidden)) {
            // if (this.getCachedNode(id) != null) {
            //     log("kiss.views - The view **was** in cache: " + id)
            // } else {
            //     log("kiss.views - The view **was not** in cache: " + id)
            // }

            view.render(target)

            // If a view is exclusive within a container, we hide (and cache) all other views within that container.
            if (exclusive) {

                // Remove and cache views which are at the same level
                Object.keys(this.views).forEach(function (viewId) {
                    if (viewId == view.id) return

                    const otherView = kiss.views.views[viewId]
                    if (otherView.parentNode == view.parentNode && viewId != "topbar") kiss.views.removeAndCacheNode(viewId)
                })
            }

            // Cache view params for being able to rebuild it with the same params
            if (target != undefined) view.target = target
            view.exclusive = !!exclusive
        }

        if (view && view.hidden) view.show()

        // Inject meta tags if needed for SEO
        if (this.viewMetas[id]) this._insertMeta(id)

        return view
    },

    /**
     * If the view has some meta informations, it's injected / updated in the header.
     * 
     * @private
     * @ignore
     * @param {string} id
     */
    _insertMeta(id) {
        const meta = this.viewMetas[id]

        Object.keys(meta).forEach(name => {
            switch (name) {
                case "title":
                    document.title = this._getMetaData(meta, "title")
                    this._injectMetaTag("name", "twitter:title", meta, name)
                    this._injectMetaTag("property", "og:title", meta, name)
                    break

                case "description":
                    this._injectMetaTag("name", "description", meta, name)
                    this._injectMetaTag("name", "twitter:description", meta, name)
                    this._injectMetaTag("property", "og:description", meta, name)
                    break

                case "author":
                    this._injectMetaTag("name", "author", meta, name)
                    this._injectMetaTag("name", "twitter:creator", meta, name)
                    this._injectMetaTag("property", "og:article:author", meta, name)
                    break

                case "type":
                    this._injectMetaTag("property", "og:type", meta, name)
                    break

                case "site_name":
                    this._injectMetaTag("property", "og:site_name", meta, name)
                    break

                case "image":
                    this._injectMetaTag("name", "twitter:image", meta, name)
                    this._injectMetaTag("property", "og:image", meta, name)
                    break

                case "audio":
                    this._injectMetaTag("property", "og:audio", meta, name)
                    break

                case "video":
                    this._injectMetaTag("property", "og:video", meta, name)
                    break

                case "url":
                    this._injectMetaTag("name", "twitter:url", meta, name)
                    this._injectMetaTag("property", "og:url", meta, name)
                    this._injectLanguageLinks(meta)
                    break

                case "locale":
                    this._injectMetaTag("property", "og:locale", meta, name)
                    break

                default:
                    this._injectMetaTag("name", name, meta, name)
            }
        })
    },


    /**
     * Update language meta tags for SEO.
     * 
     * @private
     * @ignore
     * @param {object} meta 
     */
    _injectLanguageLinks(meta) {
        const url = meta.url

        if (typeof url == "string") {
            // Single language
            let language = kiss.language.current || "en"
            this._injectLinkRel("canonical", language, url)
        } else {
            // Multiple languages
            Object.keys(url).forEach((language, index) => {
                if (index == 0) {
                    this._injectLinkRel("canonical", language, url[language])
                } else {
                    this._injectLinkRel("alternate", language, url[language])
                }
            })
        }
    },

    /**
     * Insert or update a <link rel="canonical"> or <link rel="alternate" hreflang="..."> tag.
     * 
     * @private
     * @ignore
     * @param {string} type 
     * @param {string} language 
     * @param {string} url 
     */
    _injectLinkRel(type, language, url) {
        let linkTag

        if (type == "canonical") {
            linkTag = document.querySelector('link[rel="canonical"]')
        } else if (type == "alternate") {
            linkTag = document.querySelector('link[rel="alternate"][hreflang="' + language + '"')
        }

        if (linkTag) {
            linkTag.setAttribute("href", url)
        } else {
            linkTag = document.createElement("link")
            linkTag.setAttribute("rel", type)
            if (type == "alternate") linkTag.setAttribute("hreflang", language)
            linkTag.setAttribute("href", url)
            document.head.appendChild(linkTag)
        }
    },

    /**
     * Insert or replace a meta tag in the document header
     * 
     * @private
     * @ignore
     * @param {string} propertyType
     * @param {string} propertyName 
     * @param {object} meta
     * @param {string} name
     */
    _injectMetaTag(propertyType, propertyName, meta, name) {
        let metaTag = document.querySelector('meta[' + propertyType + '="' + propertyName + '"]')
        let value = this._getMetaData(meta, name)

        if (metaTag) {
            metaTag.setAttribute("content", value)
        } else {
            metaTag = document.createElement("meta")
            metaTag.setAttribute(propertyType, propertyName)
            metaTag.setAttribute("content", value)
            document.head.appendChild(metaTag)
        }
    },

    /**
     * Get a meta data which can be:
     * - a string, if there is no translation
     * - an object, if it's localized
     * 
     * @private
     * @ignore
     * @param {object} meta 
     * @param {string} name 
     * @returns {string|object} The meta value
     */
    _getMetaData(meta, name) {
        if (typeof meta[name] == "string") {
            return meta[name]
        } else {
            return meta[name][kiss.language.current]
        }
    },

    /**
     * Destroys a view and rebuild it
     * 
     * @param {string} viewId 
     */
    reset(viewId, target, exclusive) {
        const view = kiss.views.get(viewId)
        kiss.views.remove(viewId)
        kiss.views.show(viewId, view.target, view.exclusive)
    },

    /**
     * Show a view and replace other views in the same container.
     * 
     * All the replaced views are pushed into the cache (kiss.views.cachedNodes) for future use.
     * 
     * @param {string} id - The id of the view
     * @param {string} [target] - The DOM node where the view should be replaced
     * @returns {HTMLElement} The DOM node that represents the view
     * 
     * @example
     * kiss.views.show("view 1", "containerId") // Displays view 1
     * kiss.views.replaceBy("view 2", "containerId") // Replace view 2 inside the container. View 2 is pushed into kiss.views.cachedNodes
     */
    replaceBy(id, target) {
        return this.show(id, target, true)
    },

    /**
     * Remove a node from the DOM and keep it temporarily in cache for future use.
     * It stores an object that keeps track of the parent and the index within its sibling nodes, like this:
     * ```
     * {parentId: "abc", index: 4, node: theCachedNode}
     * ```
     * 
     * Tech note:
     * - Removed elements are kept in a cache to not be garbage collected, so they can be used later.
     * - Compared to display:none, removed elements are **not** triggering their events anymore.
     * - When you have a huge number of hidden elements, preventing them from participating in the events and pubsub mechanism gives a massive performance boost.
     * 
     * @param {string} id - The id of the node Element 
     * @returns {HTMLElement} The DOM node Element that was removed and cached
     */
    removeAndCacheNode(id) {
        log("kiss.views - Pushed node into cache: " + id)

        let node = $(id)

        this.cachedNodes[id] = {
            parentId: node.parentNode.id,
            index: Array.from(node.parentNode.children).indexOf(node),
            node: node.parentElement.removeChild(node)
        }
        return node
    },

    /**
     * Restore a node and inserts it at its previous position within its parent node
     * 
     * @param {string} id - The id of the node Element to restore
     * @returns {HTMLElement} The DOM node Element that was restore into the DOM
     */
    restoreCachedNode(id) {
        log("kiss.views - Restored node from cache: " + id)

        let cachedNode = this.cachedNodes[id]
        let parentNode = (cachedNode.parentId) ? $(cachedNode.parentId) : document.body
        parentNode.insertBefore(cachedNode.node, parentNode.children[cachedNode.index])
        return cachedNode.node
    },

    /**
     * Get a cached node
     * 
     * @returns {HTMLElement} The DOM node actually cached, or null if not found
     */
    getCachedNode(id) {
        let cachedNode = this.cachedNodes[id]
        if (cachedNode) {
            return cachedNode.node
        } else {
            return null
        }
    },

    /**
     * Deletes a node which is in cache to free memory
     * 
     * @param {string} id 
     */
    deleteCachedNode(id) {
        log("kiss.views - Deleted node from cache: " + id)

        delete this.cachedNodes[id]
    }
}

;