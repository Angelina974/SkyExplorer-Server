/**
 * Matrix effect
 */
kiss.app.defineView({
    id: "common-matrix",
    renderer: function (id, target) {
        return createBlock({
            id,
            target,

            layout: "vertical",
            height: "100%",
            flex: 1, //width: "50%",

            items: [{
                type: "html",
                flex: 1,
                html: /*html*/ `<canvas id="matrix-effect"></canvas>`
            }],

            subscriptions: {
                EVT_WINDOW_RESIZED: function () {
                    if (this.isConnected) this.load()
                }
            },

            methods: {
                load() {
                    kiss.tools.wait(0).then(() => {
                        clearInterval(kiss.global.matrix)

                        const canvas = $("matrix-effect")
                        if (!canvas) return

                        const ctx = canvas.getContext("2d")
                        const w = canvas.width = $(id).offsetWidth
                        const h = canvas.height = $(id).offsetHeight

                        const cols = Math.floor(w / 20) + 1
                        const ypos = Array(cols).fill(0)

                        // Fill the background
                        ctx.fillStyle = "#fff"
                        ctx.fillRect(0, 0, w, h)

                        function matrix() {
                            // Draw a semitransparent rectangle on top of previous drawing
                            ctx.fillStyle = "#fff1"
                            ctx.fillRect(0, 0, w, h)

                            // Set color and font to 15pt monospace in the drawing context
                            ctx.fillStyle = "#cccccc"
                            ctx.font = "15pt monospace"

                            // For each column put a random character at the end
                            ypos.forEach((y, ind) => {
                                // Generate a random character
                                const text = String.fromCharCode(Math.random() * 1000)

                                // x coordinate of the column, y coordinate is already given
                                const x = ind * 20

                                // Render the character at (x, y)
                                ctx.fillText(text, x, y)

                                // Randomly reset the end of the column if it's at least 100px high
                                if (y > 100 + Math.random() * 10000) ypos[ind] = 0

                                // ...otherwise just move the y coordinate for the column 20px down
                                else ypos[ind] = y + 20
                            })
                        }

                        // Render the animation at 20 FPS
                        kiss.global.matrix = setInterval(matrix, 25)
                    })
                },

                _afterDisconnected() {
                    // Stop the animation when hidden
                    clearInterval(kiss.global.matrix)
                }
            }
        })
    }
})


;