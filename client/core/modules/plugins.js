/**
 * 
 * ## Plugin manager
 * 
 * Allow to add / get plugins.
 * Plugins are used to add features to the application.
 * Check the example for further details.
 * 
 * @namespace
 */
kiss.plugins = {

    /**
     * Array of loaded plugins
     */
    plugins: [],

    /**
     * Adds a plugin to the list
     * 
     * @param {object} plugin
     * 
     * @example
     * 
     * // Defines the plugin which adds the form feature: "See JSON data"
     * kiss.plugins.add({
     *     // Plugin id
     *     id: "form-feature-show-json",
     * 
     *     // The plugin has an icon to recognize it
     *     icon: "fab fa-node-js",
     * 
     *     // A plugin must support multi-language texts
     *     texts: {
     *         // A plugin must at least have name and a description
     *         "name": {
     *             en: "see data as JSON",
     *             fr: "Voir les données JSON"
     *         },
     *         "description": {
     *             en: "this plugin displays the record data as JSON",
     *             fr: "ce plugin affiche les données JSON du document"
     *         }
     *     },
     * 
     *     // A plugin is an array of features because a single plugin can add multiple features at the same time.
     *     features: [{
     *         // The plugin "type" tells the application WHERE to integrate the plugin.
     *         // There are many places where a feature can be plugged into pickaform.
     *         // The most common one is "form-section", which adds a... form section, of course.
     *         type: "form-section",
     * 
     *         // The "renderer" is the function that will render the plugin into the page.
     *         // In the case of a form section, the function will receive the form itself as input parameter.
     *         // There are only 2 rules to follow to build the renderer:
     *         // - the function **must** return an HTMLElement.
     *         // - the HTMLElement **must** have a class with the plugin id. The class will be used as a selector when showing/hiding the plugin.
     *         renderer: function (form) {
     *             const record = form.record
     * 
     *             // Return your UI: can be any HTMLElement or KissJS component. The example below is a KissJS component:
     *             return createHtml({
     *                 class: "form-feature-show-json",
     * 
     *                 collections: [
     *                     kiss.app.collections[record.model.id]
     *                 ],
     * 
     *                 methods: {
     *                     async load() {
     *                         let recordDataToHtml = JSON.stringify(record.getRawData(), null, 4)
     *                         recordDataToHtml = recordDataToHtml.replaceAll("\n", "<br>")
     *                         recordDataToHtml = recordDataToHtml.replaceAll(" ", "&nbsp;")
     *                         this.setInnerHtml(recordDataToHtml)
     *                     }
     *                 }
     *             })
     *         }
     *     }]
     * });
     */
    add(plugin) {
        try {
            // Get the current language
            kiss.language.get()

            // Translate main properties into the right language
            plugin.name = txtTitleCase("name", plugin.texts)
            plugin.description = txtTitleCase("description", plugin.texts)
            plugin.instructions = txtTitleCase("instructions", plugin.texts)

            // Add the plugin
            log("kiss.plugins - Adding plugin <" + plugin.name + ">", 1, plugin)
            kiss.plugins.plugins.push(plugin)

        } catch (err) {
            log("kiss.plugins - The plugin " + plugin.id + " is not well formatted", 4, plugin)
        }
    },

    /**
     * Get one or all the plugin definitions
     * 
     * @param {string} [pluginId] - If provided, returns only the specified plugin. Otherwise, return all plugins.
     * @returns {*} The array of all plugins, or only the specified plugin
     */
    get(pluginId) {
        if (!pluginId) return kiss.plugins.plugins.sortBy("order")
        return kiss.plugins.plugins.find(plugin => plugin.id == pluginId)
    },

    /**
     * Init all the plugins at once
     */
    async init() {
        for (let plugin of kiss.plugins.plugins) {
            if (plugin.init) await plugin.init()
        }
    }
}

;