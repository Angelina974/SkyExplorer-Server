/**
 * 
 * !!! IN PROGRESS - NOT IMPLEMENTED YET !!!
 * 
 * # class TreeList
 * 
 * The TreeList component build a hierarchical list of UL / LI elements from a JSON config object.
 * The config should have the following properties:
 * 
 * @ignore
 * @param {object[]} tree - a an array of object literals that have at least a "name" and "children" property (see example below)
 * @param {function} [folderRenderer] - Optional function to render the content of a *folder* node. Should include at least the node name. Example: fn = node => `<span>${node.name}</span>`
 * @param {function} [leafRenderer] - Same as folderRenderer, but to render the content of a *leaf* node
 * @param {object} methods - All the custom methods for your treelist.
 * 
 * - The Component custom methods can be called from the UL & LI inner elements using this.getComponent() to reach the top-level Component
 * - The 'onLeafClick' and 'onFolderClick' methods are used by default at the LU / LI level
 * 
 * Example of leafRenderer that calls an openMenu method of the Component:
 * leafRenderer = (node) => `${node.name}<span class="tree-leaf-menu" onclick="this.getComponent().openMenu(event, this)"></span>`
 * 
 * @example
 * {
 *      id: "myTreeList",
 *      tree: [ {id: "id1", name: "name1", children: [...]}, {id: "id2", name: "name2", children: [...]} ],
 *      folderRenderer: node => `<span>${node.name}</span>`,
 *      leafRenderer: node => `<span>${node.name}</span>`,
 *      methods: {
 *          onFolderClick: function(event, node) {
 *              console.log("You clicked on the folder " + node.id)
 *              event.stop() // Prevent event bubbling
 *          },
 *          onLeafClick: function(event, node) {
 *              console.log("You clicked on the leaf " + node.id)
 *              event.stop() // Prevent event bubbling
 *          },
 *          openMenu: function(event, node) {
 *              console.log("You've clicked on the menu icon " + node.id)
 *              event.stop() // Prevent event bubbling
 *          }
 *      }
 */
kiss.ui.TreeList = class TreeList extends kiss.ui.Component {
    constructor() {
        super()
    }

    /**
     * Generates a TreeList from a JSON config
     * 
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config) {
        super.init(config)

        // Default function to render a *Folder* node
        const defaultFolderRenderer = (node) => `${node.name}`

        // Default function to render a *Leaf* node
        const defaultLeafRenderer = (node) => `${node.name}`

        // Explore tree and create html
        const buildTreeList = function (tree, fnFolderRenderer, fnLeafRenderer) {

            let html = '<ul class="tree">'
            tree.forEach(node => {
                let isFolder = ((node.items) && (node.items.length != 0))

                if (isFolder == true) {
                    // Render a folder node
                    html += `<li id="${node.id || uid()}" class="tree-folder tree-folder-open" onclick="this.getComponent().onFolderClick(event, this)"><div onclick="this.parentNode.switch()">` + fnFolderRenderer(node) + "</div>"
                } else {
                    // Render a leaf node
                    html += `<li id="${node.id || uid()}" class="tree-leaf" onclick="this.getComponent().onLeafClick(event, this)"><div>` + fnLeafRenderer(node) + "</div>"
                }

                // If it's folder, we call the function recursively to render the children
                if (isFolder) html += buildTreeList(node.items, fnFolderRenderer, fnLeafRenderer)

                html += "</li>"
            })
            html += "</ul>"
            return html
        }

        // Insert the html into the node
        this.innerHTML = buildTreeList(config.tree, config.folderRenderer || defaultFolderRenderer, config.leafRenderer || defaultLeafRenderer)

        // Bind events
        //this._bindEvents(this.config.events)

        return this
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-treelist", kiss.ui.TreeList)

/**
 * Shorthand to create a new TreeList. See [kiss.ui.TreeList](kiss.ui.TreeList.html)
 * 
 * @ignore
 * @param {object} config
 * @returns HTMLElement
 */
const createTreeList = (config) => document.createElement("a-treelist").init(config)

/**
 * HTMLLIElement.switch
 * 
 * Allow to expand / collapse all the children UL nodes of a hierarchical list
 * 
 * @returns this
 */
 HTMLLIElement.prototype.switch = function () {
    // Switch LI element between open & closed class
    this._toggleClass("tree-folder-open")
    this._toggleClass("tree-folder-closed")

    // Display / hide children UL
    this.children.forEach(function (node) {
        if (node.nodeName == "UL") {
            if (node.style.display == "none") {
                node.style.display = "block"
            } else {
                node.style.display = "none"
            }
        }
    })
    return this
}

;