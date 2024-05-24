/**
 * 
 * ## Undo / Redo operations
 * 
 * This module captures the Ctrl+Z (undo) and Ctrl+Y (redo) keys then execute the corresponding callback actions.
 * 
 * @namespace
 * 
 */
kiss.undoRedo = {
    // Log of all the undoable operations
    log: [],

    /**
     * Init the undo/redo module and specify the callbacks to execute when pressing Ctrl+Z or Ctrl+Y
     * 
     * @param {object} config
     * @param {function} config.undo - Callback function to call to undo (Ctrl+Z)
     * @param {function} config.redo - Callback function to call to redo (Ctrl+Y)
     * 
     * @example
     * kiss.undoRedo.init({
     *  undo() {
     *     // Undo code here
     *  },
     *  redo() {
     *   // Redo code here
     *  }
     * })
     */
    init(config = {}) {
        document.addEventListener("keydown", function (e) {
            e.preventDefault

            if (e.keyCode === 89 && e.ctrlKey) {
                if (!config.redo) return
                log(kiss.undoRedo.log)
                
                config.redo()

            } else if (e.keyCode === 90 && e.ctrlKey) {

                if (!config.undo) return
                log(kiss.undoRedo.log)

                if (!kiss.undoRedo.log.length > 0) {
                    createNotification(txt("Nothing to undo"))
                    return
                }

                config.undo()
            }
        })
    }
}

;