/**
 * 
 * The Dialog box is just a Panel with pre-defined items:
 * - OK button
 * - Cancel button, except when dialog type = "message"
 * - Field to input a value if type = "input" or "select"
 * - Clicking on the OK button triggers the specified action.
 * - Clicking on the Cancel button close the dialog.
 * 
 * @param {object|string} config - Configuration object, or a simple text to display in the dialog box
 * @param {string} [config.id] - optional id in case you need to manage this dialog by id
 * @param {string} config.type - dialog | message | danger | input | select. Default = "dialog"
 * @param {string} config.message
 * @param {string} config.textAlign - use "center" to center the text in the dialog box
 * @param {function} config.action - Function called if the user clicks on the OK button. The function receives the input value if the dialog type is "input"
 * @param {object[]} [config.options] - Only for "select" type: define the list of options. 
 * @param {boolean} [config.multiple] - Only for "select" type: allow to select multiple options.
 * @param {boolean} [config.users] - Only for "directory" type: allow to select users
 * @param {boolean} [config.groups] - Only for "directory" type: allow to select groups
 * @param {boolean} [config.roles] - Only for "directory" type: allow to select roles
 * @param {boolean} [config.autoClose] - if true (default), the window is closed on validation. If false, the window is closed only if the <action> function returns true.
 * @param {string} [config.icon] - Header icon
 * @param {string} [config.header] - set to false to hide the header
 * @param {string} [config.headerHeight]
 * @param {string} [config.headerColor]
 * @param {string} [config.headerBackgroundColor]
 * @param {string} [config.title]
 * @param {string} [config.buttonOKPosition] - "left" | "right" (default = "right")
 * @param {string} [config.buttonOKText] - Text of the "OK" button. Default = "OK"
 * @param {string} [config.buttonCancelText] - Text of the "Cancel" button. Default = "Cancel"
 * @param {string|boolean} [config.iconOK] - Icon of the "OK" button, or false to hide the icon
 * @param {string|boolean} [config.iconCancel] - Icon of the "Cancel" button, or false to hide the icon
 * @param {string} [config.colorOK] - Hexa color code of the OK button
 * @param {string} [config.colorCancel] - Hexa color code of the Cancel button
 * @param {string} [config.noOK] - If true, hide the OK button
 * @param {string} [config.noCancel] - If true, hide the Cancel button
 * @param {string|number} [config.top]
 * @param {string|number} [config.left]
 * @param {string|number} [config.width]
 * @param {string|number} [config.height]
 * @param {string} [config.animation] - Check [component's animations](https://kissjs.net/doc/out/kiss.ui.component#setAnimation)
 * @returns this
 * 
 * @example
 * // Display a simple message box: it only has an OK button
 * createDialog({
 *  message: "Your asset is ready"
 * })
 * 
 * // Same thing, using just a text as argument
 * createDialog("Your asset is ready")
 * 
 * // Display a dialog box: it has OK and Cancel buttons
 * createDialog({
 *  type: "dialog",
 *  message: "Do you want to do that?",
 *  action: () => console.log("You've done that!")
 * })
 * 
 * // Display a danger box: OK button and header are red + exclamation icon
 * createDialog({
 *  type: "danger",
 *  message: "Do you want to delete the database?",
 *  action: () => console.log("You've deleted the database!")
 * })
 * 
 * // Display a dialog box with an input field: the callback catches the entered value
 * createDialog({
 *  type: "input",
 *  message: "Please enter your name:",
 *  action: (enteredValue) => console.log("You've entered " + enteredValue)
 * })
 * 
 * // Display a dialog box with a select field: the callback catches the selected values in an array
 * createDialog({
 *  type: "select",
 *  message: "Please select your items:",
 *  multiple: true, // Allow to select multiple options
 *  options: ["Item A", "Item B", "Item C"],
 *  action: (enteredValues) => console.log("You've entered " + enteredValues.join(" / "))
 * })
 */
kiss.ui.Dialog = class Dialog {
    /**
     * You can create a Dialog using the class or using the shorthand:
     * ```
     * // Using kiss namespace
     * new kiss.ui.Dialog(config)
     * 
     * // Using the class
     * new Dialog(config)
     * 
     * // Using the shorthand
     * createDialog(config)
     * ```
     * 
     * @param {object} config 
     * @returns this
     */
    constructor(config) {
        const isMobile = kiss.screen.isMobile
        const dialogId = config.id || kiss.tools.shortUid()
        
        if (typeof config == "string") {
            config = {
                type: "message",
                message: config
            }
        }

        const dialogType = config.type || "dialog"

        if (config.textAlign == "center") {
            config.message = `<center>${config.message}</center>`
        }

        config.message = (config.message || "").replaceAll("\n", "<br>")

        if (config.type == "danger") {
            config.icon = "fas fa-exclamation-triangle"
            config.headerBackgroundColor = "var(--background-red)"
            config.colorOK = "var(--red)"
            config.colorCancel = "var(--green)"
        }

        // OK button
        const buttonOK = {
            hidden: (config.noOK == true),

            type: "button",
            text: config.buttonOKText || txtTitleCase("ok"),
            icon: (config.iconOK === false) ? false : (config.iconOK || "fas fa-check"),
            iconColor: config.colorOK || null,
            flex: 1,
            styles: {
                "this": (config.colorOK) ? "border-color: " + config.colorOK : ""
            },
            events: {
                click: async function () {
                    $(dialogId).validate()
                }
            }
        }

        // CANCEL button
        const buttonCancel = {
            hidden: (dialogType == "message" || config.noCancel == true),

            type: "button",
            text: config.buttonCancelText || txtTitleCase("cancel"),
            icon: (config.iconCancel === false) ? false : (config.iconCancel || "fas fa-times"),
            iconColor: config.colorCancel || null,
            flex: 1,
            styles: {
                "this": (config.colorCancel) ? "border-color: " + config.colorCancel : ""
            },
            events: {
                click: function () {
                    this.closest("a-panel").close()
                }
            }
        }

        // Dialog box
        let dialogConfig = {
            id: dialogId,
            class: "panel-dialog",
            top: config.top || null,
            left: config.left || null,
            width: (isMobile) ? "100%" : (config.width || null),
            height: (isMobile) ? "100%" : (config.height || null),
            borderRadius: (isMobile) ? "0 0 0 0" : "",
            align: "center",
            verticalAlign: "center",

            modal: true,
            draggable: true,
            closable: !(config.closable === false),
            animation: config.animation || null,
            zIndex: 1,

            header: (config.header !== false),
            title: config.title || "",
            icon: config.icon || "fas fa-info-circle",
            headerHeight: config.headerHeight,
            headerBackgroundColor: config.headerBackgroundColor || "#00aaee",

            items: [

                // MESSAGE
                (dialogType == "message" || dialogType == "dialog" || dialogType == "danger") ? {
                    type: "html",
                    width: "100%",
                    padding: "32px",
                    html: config.message
                } : null,

                // INPUT FIELD
                (dialogType == "input") ? {
                    id: "input-box-field",
                    type: "text",
                    label: config.message,
                    labelPosition: "top",
                    width: "100%",
                    fieldWidth: "100%",
                    value: config.defaultValue || ""
                } : null,

                // SELECT FIELD
                (dialogType == "select") ? {
                    id: "input-box-field",
                    type: "select",
                    label: config.message,
                    labelPosition: "top",
                    width: "100%",
                    value: config.defaultValue || "",
                    multiple: !!config.multiple,
                    options: config.options || [],
                    allowValuesNotInList: false
                } : null,

                // DIRECTORY FIELD
                (dialogType == "directory") ? {
                    id: "input-box-field",
                    type: "directory",
                    label: config.message,
                    labelPosition: "top",
                    width: "100%",
                    value: config.defaultValue || "",
                    multiple: !!config.multiple,
                    users: (config.users === false) ? false : true,
                    groups: (config.groups === false) ? false : true,
                    roles: !!config.roles,
                    allowValuesNotInList: false
                } : null,

                // BUTTONS
                {
                    layout: "horizontal",
                    margin: "10px 0px 0px 0px",

                    defaultConfig: {
                        margin: 5
                    },
                    items: (config.buttonOKPosition == "left") ? [buttonOK, buttonCancel] : [buttonCancel, buttonOK]
                }
            ],

            // Manage the keyboard shortcuts
            // - Enter to validate
            // - Esc to cancel
            events: {
                onkeydown(event) {
                    if (event.key == "Escape") {
                        this.close()
                    } else if (event.key == "Enter") {
                        this.validate()
                    }
                }
            },

            methods: {
                // Focus the panel or the input field so that keyboard events can be listened to
                _afterRender() {
                    if (dialogType == "input") {
                        setTimeout(() => $("input-box-field").focus(), 100)
                    } else {
                        setTimeout(() => this.panelBody.focus(), 100)
                    }
                },

                // Clicked on the OK button
                async validate() {
                    if (config.action) {
                        // If there is an action to handle the entered value
                        const newValue = ((dialogType == "input") || (dialogType == "select") || (dialogType == "directory")) ? $("input-box-field").getValue() : true
                        const result = await config.action(newValue)
                        if ((config.autoClose == null) || (config.autoClose == true) || (result == true)) this.close()
                    } else {
                        // Otherwise, just close
                        this.close()
                    }
                }
            }
        }

        // Optionally methods
        if (config.methods) Object.assign(dialogConfig.methods, config.methods)

        // Optionally bind events
        if (config.events) Object.assign(dialogConfig.events, config.events)

        // Generate the dialog using a Panel
        let dialog = createPanel(dialogConfig).render()

        return dialog
    }
}

/**
 * Shorthand to create a new Dialog window. See [kiss.ui.Dialog](kiss.ui.Dialog.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createDialog = (config) => new kiss.ui.Dialog(config)

;