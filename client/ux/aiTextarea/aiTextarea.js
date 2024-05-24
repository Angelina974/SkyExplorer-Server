/**
 * 
 * The aiTextarea derives from [Field](kiss.ui.Field.html).
 * 
 * **AI** field allows to generate content automatically
 * 
 * It's basically a textarea field with an extra button to open the AI parameters and prompt
 * 
 * @param {object} config
 * @param {string} [config.iconColorOn] - Icon color
 * @param {object} [config.ai] - Optional AI default configuration
 * @param {string} [config.ai.who] - Default persona: "-" | "sales manager" | "hr manager" | "marketing manager" | "product manager"
 * @param {string} [config.ai.what] - Default task: "-" | "draft a blog post" | "summup a text" | "convert to tweet" | "write an email" | "create user persona" | "create job description"
 * @param {string} [config.ai.tone] - Default tone: "casual" | "formal" | "humour" | "ironic"
 * @param {string} [config.ai.goal] - Default goal: "-" | "inform" | "persuade" | "inspire"
 * @param {number} [config.ai.temperature] - OpenAI creativity, from 0 to 1
 * @param {number} [config.ai.max_tokens] - Max number of tokens for OpenAI answer
 * 
 * @returns this
 * 
 */
kiss.ux.AiTextarea = class AiTextarea extends kiss.ui.Field {
    constructor() {
        super()
    }

    /**
     * @ignore
     */
    init(config = {}) {
        config.type = "aiTextarea"

        // Generates the field
        super.init(config)

        // Append a button right after the label
        this.label.appendChild(this._createAIButton())

        return this
    }

    /**
     * Add a button to open an AI assistant
     * 
     * @private
     * @ignore
     */
    _createAIButton() {
        const color = this.config.iconColorOn || "#00aaee"

        return createButton({
            icon: "far fa-lightbulb",
            iconSize: 16,
            iconColor: color,
            height: 17,
            margin: "0 0 0 5px",
            padding: "2px 0",
            borderWidth: 0,
            boxShadow: "none",
            iconColorHover: "#ffffff",
            backgroundColorHover: color,

            action: (event) => {
                event.stop()

                createPanel({
                    id: "AI-panel",
                    title: txtTitleCase("your AI assistant"),
                    icon: "far fa-lightbulb",
                    headerBackgroundColor: color,
                    modal: true,
                    closable: true,
                    draggable: true,
                    width: 500,
                    align: "center",
                    verticalAlign: "center",

                    // Prevent from closing if the user started to work with a prompt
                    events: {
                        close: (forceClose) => {
                            if (forceClose) return true

                            if ($("prompt").getValue() != "") {
                                createDialog({
                                    type: "danger",
                                    message: txtTitleCase("are you sure you want to cancel your input?"),
                                    buttonOKPosition: "left",
                                    action: () => $("AI-panel").close("remove", true)
                                })
                                return false
                            }
                        }
                    },

                    defaultConfig: {
                        labelPosition: "top",
                        width: "100%"
                    },

                    items: [{
                            layout: "horizontal",
                            defaultConfig: {
                                flex: 1,
                                labelPosition: "top"
                            },
                            items: [
                                // AI PROFILE
                                {
                                    id: "who",
                                    type: "select",
                                    label: txtTitleCase("AI profile"),
                                    value: this.config?.ai?.who || "-",
                                    allowValuesNotInList: true,
                                    options: [{
                                            label: txtTitleCase("no profile"),
                                            value: "-",
                                            color: "var(--green)"
                                        }, {
                                            label: txtTitleCase("sales rep"),
                                            value: "sales manager",
                                            color: "var(--red)"
                                        },
                                        {
                                            label: txtTitleCase("HR manager"),
                                            value: "hr manager",
                                            color: "var(--purple)"
                                        },
                                        {
                                            label: txtTitleCase("marketing manager"),
                                            value: "marketing manager",
                                            color: "var(--blue)"
                                        },
                                        {
                                            label: txtTitleCase("product manager"),
                                            value: "product manager",
                                            color: "var(--orange)"
                                        }
                                    ]
                                },
                                // TASK TO PERFORM
                                {
                                    id: "what",
                                    type: "select",
                                    label: txtTitleCase("task"),
                                    value: this.config?.ai?.what || "-",
                                    allowValuesNotInList: true,
                                    options: [{
                                            label: txtTitleCase("free"),
                                            value: "-",
                                            color: "var(--green)"
                                        }, {
                                            label: txtTitleCase("draft a blog post"),
                                            value: "draft a blog post"
                                        },
                                        {
                                            label: txtTitleCase("summup a text"),
                                            value: "summup a text"
                                        },
                                        {
                                            label: txtTitleCase("convert to Tweet"),
                                            value: "convert to Tweet"
                                        },
                                        {
                                            label: txtTitleCase("write an email"),
                                            value: "write an email"
                                        },
                                        {
                                            label: txtTitleCase("create user persona"),
                                            value: "create user persona"
                                        },
                                        {
                                            label: txtTitleCase("create job description"),
                                            value: "create job description"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            layout: "horizontal",
                            defaultConfig: {
                                flex: 1,
                                labelPosition: "top"
                            },
                            items: [
                                // AI TONE
                                {
                                    id: "tone",
                                    type: "select",
                                    label: txtTitleCase("tone to use"),
                                    value: this.config?.ai?.tone || "casual",
                                    allowValuesNotInList: true,
                                    options: [{
                                            label: txtTitleCase("casual"),
                                            value: "casual",
                                            color: "var(--green)"
                                        },
                                        {
                                            label: txtTitleCase("formal"),
                                            value: "formal",
                                            color: "var(--orange)"
                                        },
                                        {
                                            label: txtTitleCase("humour"),
                                            value: "humour",
                                            color: "var(--red)"
                                        },
                                        {
                                            label: txtTitleCase("ironic"),
                                            value: "ironic",
                                            color: "var(--purple)"
                                        }
                                    ]
                                },
                                // TASK GOAL
                                {
                                    id: "goal",
                                    type: "select",
                                    label: txtTitleCase("goal"),
                                    value: this.config?.ai?.goal || "-",
                                    allowValuesNotInList: true,
                                    options: [{
                                            label: txtTitleCase("none"),
                                            value: "-",
                                            color: "var(--green)"
                                        }, {
                                            label: txtTitleCase("inform"),
                                            value: "inform",
                                            color: "var(--blue)"
                                        },
                                        {
                                            label: txtTitleCase("persuade"),
                                            value: "persuade",
                                            color: "var(--purple)"
                                        },
                                        {
                                            label: txtTitleCase("inspire"),
                                            value: "inspire",
                                            color: "var(--red)"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            layout: "horizontal",
                            defaultConfig: {
                                flex: 1,
                                labelPosition: "top"
                            },
                            items: [
                                // MAX RESULT LENGTH
                                {
                                    id: "max_tokens",
                                    label: txtTitleCase("response max length"),
                                    type: "number",
                                    value: Math.min(this.config?.ai?.max_tokens || 1000, 2000) || 1000,
                                    max: 2000
                                },
                                // TEMPERATURE
                                {
                                    id: "temperature",
                                    label: txtTitleCase("creativity"),
                                    type: "slider",
                                    min: 0,
                                    max: 100,
                                    value: this.config?.ai?.temperature || 50
                                }
                            ]
                        },
                        // AI PROMPT
                        {
                            id: "prompt",
                            type: "textarea",
                            label: txtTitleCase("#AI prompt instructions"),
                            required: true,
                            rows: 10
                        },
                        // BUTTON TO SEND THE PROMPT
                        {
                            type: "button",
                            text: txtTitleCase("generate content..."),
                            icon: "fas fa-bolt",
                            iconColor: "var(--orange)",
                            margin: "20px 0 0 0",
                            height: 40,
                            action: async () => {
                                if (!$("AI-panel").validate()) {
                                    return
                                }

                                const data = $("AI-panel").getData()
                                const prompt = this._preparePrompt(data)
                                const temperature = Number((data.temperature / 100).toFixed(2))
                                const result = await this._executePrompt(prompt, temperature, data.max_tokens)

                                if (!result.success) {
                                    createDialog({
                                        type: "danger",
                                        message: txtTitleCase("#openAI error"),
                                        noCancel: true
                                    })
                                    return
                                }

                                await this.setValue(result.data)
                                $("AI-panel").close("remove", true)
                            }
                        }
                    ]
                }).setAnimation({
                    name: "jackInTheBox",
                    speed: "fast"
                }).render()
            }
        })
    }

    /**
     * Prepare the prompt with extra parameters.
     * 
     * @private
     * @ignore
     * @param {object} config
     * @param {string} config.who - AI agent personality
     * @param {string} config.what - Task to perform
     * @param {string} config.tone - Tone to use when answering
     * @param {string} config.goal - Content goal
     * @param {string} config.prompt - Free prompt to detail the task
     * 
     * @returns {string} Prompt with options
     */
    _preparePrompt({
        who,
        what,
        tone,
        goal,
        prompt
    }) {
        const language = (kiss.language.current == "fr") ? "french" : "english"

        let instructions = ""
        if (who != "-") instructions += `You are a ${who}. `
        if (goal != "-") instructions += `The goal is to ${goal} the reader. `
        if (tone != "-") instructions += `The tone must be ${tone}. `
        if (what != "-") instructions += `You have to ${what}. `
        instructions += `Your answer must be in ${language}. `
        instructions += `Data to process using previous requirements: ${prompt}`

        return instructions
    }

    /**
     * Execute the prompt calling OpenAI service
     * 
     * @private
     * @ignore
     * @param {string} prompt 
     * @param {number} temperature - OpenAI temperature (default 0.5)
     * @param {number} max_tokens - Max number of tokens for OpenAI answer (default 2000)
     * @returns {object} The OpenAI service response, or an error
     */
    async _executePrompt(prompt, temperature = 0.5, max_tokens = 2000) {
        return await kiss.ajax.request({
            url: "/command/openai/createCompletion",
            method: "post",
            showLoading: true,
            timeout: 2 * 60 * 1000, // Give OpenAI 2mn to answer
            body: JSON.stringify({
                prompt,
                temperature,
                max_tokens
            })
        })
    }
}

// Create a Custom Element
customElements.define("a-aitextarea", kiss.ux.AiTextarea)
const createAiTextareaField = (config) => document.createElement("a-aitextarea").init(config)

;