/**
 * 
 * ## Simple module to handle a global loading spinner.
 * 
 * When multiple components needs to lock the UI while they are loading, it can be tricky to know when to show and hide the loading screen.
 * This module solves the problem by mutualizing the loading screen between components.
 * 
 * @namespace
 * 
 */
kiss.loadingSpinner = {

    // Used to track components which are in loading state
    components: [],

    /**
     * Check the loading state
     * 
     * @private
     * @ignore
     * @returns {boolean} true if the loading spinner is displayed
     */
    _isLoading() {
        return (this.components.length != 0)
    },

    /**
     * Build the DOM element that will hold the loading spinner
     * 
     * @private
     * @ignore
     */
    _init() {
        this.loadingLayer = document.createElement("div")
        this.loadingLayer.setAttribute("id", "loading-layer")
        this.loadingLayer.style.display = "fixed"
        this.loadingLayer.style.width = "100%"
        this.loadingLayer.style.height = "100%"
        document.body.append(this.loadingLayer)
    },

    /**
     * Show the loading spinner.
     * 
     * @returns {string} A unique id used later to hide the loading spinner
     * 
     * @example
     * 
     * // To show the loading spinner
     * const loadingId = kiss.loadingSpinner.show()
     * 
     * // To hide the loading spinner
     * kiss.loadingSpinner.hide(loadingId)
     * 
     * // With multiple components loading in parallel:
     * const loadingComponent1 = kiss.loadingSpinner.show()
     * const loadingComponent2 = kiss.loadingSpinner.show()
     * 
     * kiss.loadingSpinner.hide(loadingComponent1) // This will not hide the spinner because component 2 is still loading
     * kiss.loadingSpinner.hide(loadingComponent2) // This will hide the spinner because there are no more components loading
     * 
     */
    show() {
        if (!this.loadingLayer) this._init()
        this.loadingId = kiss.tools.shortUid()
        this.components.push(this.loadingId)

        this.loadingLayer.showLoading({
            fullscreen: true,
            spinnerSize: 128,
            mask: false
        })
        return this.loadingId
    },

    /**
     * Hide the loading spinner.
     * 
     * Note: it will hide the loading spinner only if there is no more loading components in the buffer.
     * 
     * @param {string} loadingId - The unique id given by the kiss.loadingSpinner.show() method
     */
    hide(loadingId) {
        this.components = this.components.filter(componentId => componentId != loadingId)
        if (this.components.length == 0 && this.loadingLayer) this.loadingLayer.hideLoading()
    }
}

;