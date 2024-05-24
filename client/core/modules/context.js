/**
 * 
 * ## Manage application **context**
 * 
 * The application context is mainly (but not only) driven by the client router, which observes the url hash and converts it to a context.
 * It can also be used as a global variable to store application states.
 * 
 * With KissJS, the url hash **must** contain the following parameter:
 * - ui: it stands for "user interface" and is used to display the main view
 * 
 * The url hash **may** contain other informations depending on your application.
 * For example, at PickaForm, we use:
 * - applicationId: the active application id
 * - modelId: the active model id
 * - viewType: the active view type (datatable|calendar|kanban|gallery|...)
 * - viewId: the active view id
 * - recordId: the active record id (when displayed in a form)
 * - themeColor: the current application CSS theme color
 * - themeGeometry: the current application CSS theme geometry
 * - etc...
 * 
 * @namespace
 * 
 */
kiss.context = {

    /**
     * Context history
     * 
     * Keep the history of visited routes
     * 
     * @example
     * console.log(kiss.context.history)
     * 
     * // Output:
     * [
     *  {ui: "tutorial", chapterId: "1", sectionId: "2"},
     *  {ui: "tutorial", chapterId: "1", sectionId: "7"},
     *  {ui: "tutorial", chapterId: "2", sectionId: "3"}
     * // ...
     * ]
     */
    history: [],

    /**
     * Last context
     * 
     * @example
     * console.log(kiss.context.lastContext)
     * 
     * // Output:
     * {ui: "tutorial", chapterId: "2", sectionId: "3"}
     */
    lastContext: {},

    /**
     * Last context changes
     * 
     * @example
     * console.log(kiss.context.changes)
     * 
     * // Output:
     * {ui: false, chapterId: false, sectionId: true}
     */
    changes: {},

    /**
     * Update the application context:
     * - you can use this as a global way to save some of your application states
     * - the whole context history is saved in kiss.context.history
     * 
     * @param {object} newContext
     * 
     * @example
     * kiss.context.update({
     *  applicationId: "c393b159-2dd2-41e0-9d68-17c40f7088ab",
     *  viewId: "56b64b39-e932-49ae-86f2-30058345d9c8",
     *  language: "fr"
     * })
     */
    update(newContext) {
        let {
            history,
            ...currentContext
        } = kiss.tools.snapshot(kiss.context)

        kiss.context.lastContext = currentContext
        kiss.context.history.push(currentContext)
        Object.assign(kiss.context, newContext)
    },

    /**
     * Allow to check how the context has changed during the last routing event
     * 
     * @param {string} [propertyName] - The property to check. If not provided, it returns all the property changes.
     * @returns {object} Where each property value is a boolean (true means "has changed")
     * 
     * @example
     * console.log(kiss.context.hasChanged())
     * // Output:
     * {
     *  ui: false,
     *  viewId: true,
     *  themeColor: false
     * }
     * 
     * console.log(kiss.context.hasChanged("ui")) // Output: false
     */
    hasChanged(contextName) {
        let isNew = (this.history.length <= 1)
        let propertiesToCheck = Object.keys(kiss.tools.snapshot(this))
        let lastContext = kiss.context.history[kiss.context.history.length - 1]

        propertiesToCheck.forEach(property => {
            if (property != "history") this.changes[property] = (isNew) ? false : (kiss.context[property] != lastContext[property])
        })

        if (contextName) return this.changes[contextName]
        return this.changes
    }
}

;