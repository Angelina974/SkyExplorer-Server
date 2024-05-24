/**
 * 
 * Generates the panel containing the application themes
 * 
 * @ignore
 */
const createThemeBuilderWindow = function () {

    const cssVariables = [
        txtTitleCase("body"),
        "--body",
        "--body-alt",
        "--body-background",
        "--body-background-alt",

        txtTitleCase("basic colors"),
        "--green",
        "--blue",
        "--purple",
        "--red",
        "--background-green",
        "--background-blue",
        "--background-purple",
        "--background-red",

        txtTitleCase("fields"),
        "--field",
        "--field-label",
        "--field-background",
        "--field-background-hover",
        "--field-background-focus",
        "--field-border",
        "--field-border-hover",
        "--field-border-invalild",

        txtTitleCase("select fields"),
        "--select-value-shadow",
        "--select-option",
        "--select-option-background",
        "--select-option-background-selected",
        "--select-option-highlight",
        "--select-option-background-highlight",
        "--select-option-box-shadow",

        txtTitleCase("panels"),
        "--panel-background",
        "--panel-header",
        "--panel-border",
        "--panel-box-shadow",

        txtTitleCase("menus"),
        "--menu-background",
        "--menu-border",
        "--menu-separator",
        "--menu-item",
        "--menu-item-hover",
        "--menu-item-background",
        "--menu-item-background-hover",
        "--menu-item-border",
        "--menu-item-border-hover",
        "--menu-item-selected",
        "--menu-item-background-selected",

        txtTitleCase("buttons"),
        "--button-text",
        "--button-text-hover",
        "--button-icon",
        "--button-background",
        "--button-background-hover",
        "--button-border",
        "--button-border-hover",
        "--button-shadow",
        "--button-shadow-hover",

        txtTitleCase("datatables"),
        "--datatable-header",
        "--datatable-header-background",
        "--datatable-header-background-hover",
        "--datatable-header-background-dragover",
        "--datatable-header-border",
        "--datatable-body-background",
        "--datatable-input-background",
        "--datatable-row-hover",
        "--datatable-row-selected",
        "--datatable-cell",
        "--datatable-cell-background",
        "--datatable-cell-border",
        "--datatable-cell-1st-column",
        "--datatable-cell-1st-column-background",
        "--datatable-toolbar-text",
        "--datatable-toolbar-background",
        "--datatable-filter-buttons",
        "--datatable-group-text",
        "--datatable-group-hierarchy",
        "--datatable-group-background",
        "--datatable-group-background-hover",
        "--datatable-group-cell-border"
    ]

    let items = cssVariables.map(variable => {
        if (variable.startsWith("--")) {
            let variableValue = getComputedStyle(document.documentElement).getPropertyValue(variable)
            variableValue = variableValue.trim()

            const isColor = (
                variableValue.startsWith("#") ||
                variableValue.indexOf("linear-gradient") != -1 ||
                variableValue == "inherit" ||
                variableValue == ""
            )

            // console.log(variable + " : " + variableValue + " > " + isColor)

            return {
                id: variable,
                type: (isColor) ? "color" : "text",
                palette: "default",
                label: variable,
                labelWidth: 300,
                fieldWidth: 600,
                width: "100%",
                value: variableValue,
                events: {
                    change: function () {
                        const newColor = this.getValue()
                        document.documentElement.style.setProperty(variable, newColor)
                    }
                }
            }
        } else {
            return {
                type: "html",
                class: "theme-window-title",
                html: variable,
                margin: "20px 0 10px 0"
            }
        }
    })

    const saveButton = {
        type: "button",
        text: txtTitleCase("#save theme"),
        icon: "fas fa-save",
        width: 300,
        action: () => {
            const theme = $("theme-builder").getData()
            localStorage.setItem("config-theme", JSON.stringify(theme))
        }
    }

    items.splice(0, 0, saveButton)
    items.push(saveButton)

    return createPanel({
        id: "theme-builder",
        title: txtTitleCase("theme builder"),
        icon: "fas fa-sliders-h",
        // modal: true,
        draggable: true,
        closable: true,
        maxHeight: () => kiss.screen.current.height - 20,
        align: "center",
        verticalAlign: "center",
        layout: "vertical",
        overflow: "auto",
        items
    }).render()
}

;