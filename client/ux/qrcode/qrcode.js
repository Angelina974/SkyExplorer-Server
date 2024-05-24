/**
 * 
 * The QrCode derives from [Component](kiss.ui.Component.html).
 * 
 * Encapsulates original QRCode.js inside a KissJS UI component:
 * https://github.com/davidshimjs/qrcodejs
 * 
 * The generator includes correct levels:
 * 
 * Level L
 * This is the lowest level of error correction rate that a QR code can have. QR code software uses this level if the user intends to generate a less dense QR code image.
 * Level L has the highest error correction rate of approximately seven percent (7%).
 * 
 * Level M
 * Level M is the middle tier of the error correction level that QR code experts recommend for marketing use. Because of this, marketers can correct their QR codes at a medium level. Level M has the highest error correction rate of approximately fifteen percent (15%).
 * 
 * Level Q
 * This level is the second to the highest error correction level. This error correction level has the highest error correction rate of approximately twenty-five percent (25%).
 * 
 * Level H
 * Level H is the highest error correction level that can withstand an extreme level of damage in their QR code. The level Q and H error correction levels are most recommended for industrial and manufacturing companies.
 * 
 * @param {object} config
 * @param {string} [config.text]
 * @param {integer} [config.width] - Width in pixels
 * @param {integer} [config.height] - Height in pixels
 * @param {string} [config.colorDark] - Hexa color code. Default #000000
 * @param {string} [config.colorLight] - Hexa color code. Default #ffffff
 * @param {string} [config.correctLevel] - "L", "M", "Q", or "H". Default "M"
 * 
 * @returns this
 * 
 * ## Generated markup
 * ```
 * <a-qrcode class="a-qrcode">
 *  <div class="qrcode-image"></div>
 * </a-qrcode>
 * ```
 */
kiss.ux.QrCode = class QrCode extends kiss.ui.Component {
    /**
     * Its a Custom Web Component. Do not use the constructor directly with the **new** keyword.
     * Instead, use one of the 3 following methods:
     * 
     * Create the Web Component and call its **init** method:
     * ```
     * const myQrCode = document.createElement("a-qrcode").init(config)
     * ```
     * 
     * Or use the shorthand for it:
     * ```
     * const myQrCode = createQrCode({
     *  text: "I'm a QRCode"
     * })
     * 
     * myQrCode.render()
     * ```
     * 
     * Or directly declare the config inside a container component:
     * ```
     * const myPanel = createPanel({
     *   title: "My panel",
     *   items: [
     *       {
     *          type: "qrcode",
     *          text: "I'm a QRCode",
     *          colorDark: "#00aaee",
     *          correctionLevel: "H"
     *       }
     *   ]
     * })
     * myPanel.render()
     * ```
     */
    constructor() {
        super()
    }

    /**
     * Generates a Button from a JSON config
     * 
     * @ignore
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config = {}) {
        super.init(config)

        this.innerHTML = `<div class="qrcode-image"></div>`
        this.QRCodeImage = this.querySelector(".qrcode-image")

        // Insert QRCode inside the KissJS component
        const correctLevels = {L: 1, M: 0, Q: 3, H: 2}
        new QRCode(this.QRCodeImage, {
            text: config.text,
            width: config.width || 100,
            height: config.height || 100,
            correctLevel: correctLevels[config.correctLevel] || 0
        })

        return this
    }
}

customElements.define("a-qrcode", kiss.ux.QrCode)

/**
 * Shorthand to create a new QrCode. See [kiss.ui.QrCode](kiss.ui.QrCode.html)
 * 
 * @param {object} config
 * @returns HTMLElement
 */
const createQRCode = (config) => document.createElement("a-qrcode").init(config)

;