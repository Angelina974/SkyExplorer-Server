/**
 * 
 * Display a tip that follows the mouse cursor.
 * The tip is just a floating <Html> component that moves with the cursor.
 * 
 * @param {object} config
 * @param {string} config.text - Tip text
 * @param {string} [config.textAlign] - ex: "center"
 * @param {string} [config.target] - DOM target insertion point
 * @param {number} [tipConfig.x] - Optional static x
 * @param {number} [tipConfig.Y] - Optional static y
 * @param {object} [config.deltaX] - X position difference from the cursor position
 * @param {object} [config.deltaY] - Y position difference from the cursor position
 * @param {object} [config.minWidth]
 * @param {object} [config.maxWidth]
 * @returns this
 */
kiss.ui.Tip = class Tip {
    /**
     * You can create a Tip using the class, the shorthand, the HTMLElement "attachTip" method, or the "tip" property of KissJS components:
     * ```
     * // Using kiss namespace
     * new kiss.ui.Tip(config)
     * 
     * // Using the class
     * new Tip(config)
     * 
     * // Using the shorthand
     * createTip({
     *  target: "your_element_id",
     *  text: "your tip text",
     *  deltaX: 0,
     *  deltaY: 20
     * })
     * 
     * // You can also directly attach a tip to any HTMLElement or KissJS component like this:
     * myHTMLElementOrKissComponent.attachTip({
     *  text: "your tip text",
     *  deltaX: 0,
     *  deltaY: 20
     * })
     * 
     * // Finally, KissJS components have a "tip" property to attach a tip automatically:
     * const myTextField = createField({
     *  type: "textarea",
     *  label: "Comments",
     *  tip: "Please, tell us about what you think"
     * })
     * 
     * const myButton = createButton({
     *  icon: "fas fa-rocket",
     *  tip: "Click to launch the rocket!"
     * })
     * ```
     */
    constructor(config) {
        const tipId = uid()
        const targetElement = config.target
        const deltaX = config.deltaX || 0
        const deltaY = config.deltaY || 20
        const minWidth = config.minWidth || 50
        const maxWidth = config.maxWidth || 300
        const message = config.text.replaceAll("\n", "<br>")

        return createHtml({
            id: tipId,
            position: "absolute",
            display: "block",
            zIndex: 1000,
            class: "a-tip",
            minWidth,
            maxWidth,

            html: (config.textAlign) ? `<div style="width: 100%; text-align: ${config.textAlign}">${message}</div>` : message,

            methods: {
                /**
                 * When the tip is rendered, the component triggers this load method.
                 * We track the mousemove event at the document level.
                 * Note that it will overwrite other onmousemove events, if any.
                 */
                load() {                    
                    // Make the tip follow the mouse cursor
                    document.addEventListener("mousemove", this.showTip)

                    // Display the tip on the target when entering it
                    targetElement.onmouseenter = () => this.render()

                    // Hide the tip and destroy the document.mousemove event when leaving the target
                    targetElement.onmouseleave = () => this.hideTip()

                    // Hide the tip and destroy the document.mousemove event when the target is deleted
                    targetElement._beforeDelete = () => this.hideTip()
                }, 
                
                hideTip() {
                    document.removeEventListener("mousemove", this.showTip)
                    this.remove()
                },

                detach() {
                    document.removeEventListener("mousemove", this.showTip)
                    targetElement.onmouseenter = null
                    targetElement.onmouseleave = null
                    this.remove()
                },

                showTip(event) {
                    if (!event) return
                    const element = $(tipId)
                    element.showAt(config.x || event.pageX + deltaX, config.y || event.pageY + deltaY)
                }
            }
        })
    }
}

/**
 * Shorthand to create a new Tip. See [kiss.ui.Tip](kiss.ui.Tip.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createTip = (config) => new kiss.ui.Tip(config)

;