/**
 * 
 * ## Mockup tool to feed a database with fake random values
 * 
 * - The fake value is generated according to the field **label** property.
 * - A few common fields are recognized automatically
 * - If the **label** is undefined or not recognized, it tries to look at the field **type** property instead (text, number, date)
 * 
 * Recognized field labels are:
 * - name
 * - first name
 * - last name
 * - full name
 * - company name
 * - department
 * - email
 * - phone
 * - address
 * - address 1
 * - address 2
 * - zip code
 * - city
 * - country
 * - title
 * - description
 * - priority
 * - status
 * 
 * The fake values are generated one field at a time, so, to feed a complete record, you must loop over its list of fields.
 * ```
 * const userRecord = {}
 * userModel.getFields().forEach(field => userRecord[field.id] = kiss.db.faker(field))
 * ```
 * 
 * @namespace
 * @param {object|string} field - An object defining a label and a type | A simple string for the label ("First name") or the type ("number")
 * 
 * @example
 * kiss.db.faker({label: "First name"}) can return "Julia"
 * kiss.db.faker("First name") can return "Julia"
 * kiss.db.faker({label: "Full name"}) can return "Julia Giordini"
 * kiss.db.faker({label: "Amount", type: "number"}) can return 123
 * kiss.db.faker({label: "Workload", type: "float", min: 0, max: 100, precision: 2}) can return 42.42
 * kiss.db.faker({label: "Invoice date", type: "date", year: 2020}) can return "2020-05-27"
 * kiss.db.faker("date") can return "1984-05-31"
 * kiss.db.faker("priority") can return "high"
 * kiss.db.faker("status") can return "in progress"
 */
kiss.db.faker = function (field) {
    // Don't generate values for these special items
    if (["panel", "link", "lookup", "summary", "attachment", "password", "selectViewColumn", "selectViewColumns"].indexOf(field.type) != -1) return null

    let sourceArray = []

    // Accept objects like {label: "First name", type: "text"} or simple strings like "First name"
    let mockupName = (typeof field === "object") ? field.label.toLowerCase() : field.toLowerCase()

    switch (mockupName) {
        /**
         * Generate *GENERIC* data according to field types
         */
        case "text":
            sourceArray = kiss.db.faker.text

            if (field.validationType == "url") return "https://en.pickaform.fr"
            if (field.validationType == "email") return kiss.db.faker("email")
            if (field.value == "unid") return kiss.tools.shortUid().toUpperCase()
            return sourceArray[Math.floor(Math.random() * sourceArray.length)]

        case "textarea":
        case "aiTextarea":
            return kiss.db.faker("description")

        case "select":
            // Time field is a select with custom options
            if (field.template == "time") return ("0" + Math.round(Math.random() * 24)).slice(-2) + ":00"

            if (field.options) {
                sourceArray = field.options.map(option => option.value)
                return sourceArray[Math.floor(Math.random() * sourceArray.length)]
            }
            return ["A", "B", "C"]

        case "checkbox":
            let value = Math.random() * 100
            return (value > 50)

        case "date":
            let year = field.year || (1980 + Math.floor(Math.random() * 40))
            let month = field.month || (1 + Math.floor(Math.random() * 12))
            let day = field.day || (1 + Math.floor(Math.random() * 28))
            let date = year.toString() + "-" + ("0" + month.toString()).slice(-2) + "-" + ("0" + day.toString()).slice(-2)
            return date

        case "integer":
            return Math.floor(kiss.db.faker(Object.assign({}, field, {
                label: "float",
                precision: 0
            })))

        case "number":
        case "float":
            let min = field.min || 0
            let max = field.max || 100
            let precision = (field.precision === 0) ? 0 : 2
            let val = (min + Math.random() * (max - min)).toFixed(precision)
            if (mockupName == "number") return Math.floor(val)
            return val

        case "slider":
            return Math.floor((Math.random() * 100).toFixed(0))

        case "rating":
            let minRate = field.min || 0
            let maxRate = field.max || 10
            let rate = (minRate + Math.random() * (maxRate - minRate)).toFixed(0)
            return Math.floor(rate)
        
        case "directory":
            return kiss.session.getUserId()

        case "color":
        case "colorpicker":
            return "#" + kiss.global.palette[Math.round(Math.random() * 59)]

        case "icon":
        case "iconpicker":
            return kiss.webfonts.all[Math.round(Math.random() * 1040)]

            /**
             * Generate *SPECIFIC* data according to field ids
             */
        case "username":
        case "fullname":
        case "full name":
        case "nom complet":
        case "utilisateur":
            return kiss.db.faker({
                label: "first name"
            }) + " " + kiss.db.faker({
                label: "last name"
            })

        case "prénom":
            return kiss.db.faker({
                label: "first name"
            })

        case "nom":
            return kiss.db.faker({
                label: "last name"
            })

        case "email":
            return (kiss.db.faker({
                label: "first name"
            }) + "." + kiss.db.faker({
                label: "last name"
            }) + "@" + kiss.db.faker({
                label: "company name"
            }).toLowerCase() + "." + kiss.db.faker({
                label: "domain"
            })).toLowerCase()

        case "phone":
        case "mobile":
        case "mobile phone":
        case "téléphone":
        case "telephone":
            return kiss.db.faker({
                label: "integer",
                min: 1000000000,
                max: 9900000000
            })

        case "company":
        case "société":
            return kiss.db.faker({
                label: "company name"
            })

        case "address":
        case "adresse":
            return kiss.db.faker({
                    label: "address 1"
                }) +
                ", " + kiss.db.faker({
                    label: "address 2"
                }) +
                ", " + kiss.db.faker({
                    label: "zip code"
                }) +
                ", " + kiss.db.faker({
                    label: "city"
                }) +
                ", " + kiss.db.faker({
                    label: "country"
                })

        case "address 1":
        case "addresse 1":
            return kiss.db.faker({
                label: "company name"
            }) + " building"

        case "address 2":
        case "addresse 2":
            return kiss.db.faker({
                label: "integer",
                min: 1
            }) + " " + kiss.db.faker({
                label: "last name"
            }) + " " + kiss.db.faker({
                label: "street"
            })

        case "zip code":
        case "code postal":
            return kiss.db.faker({
                label: "integer",
                min: 1000,
                max: 90000
            })

        case "description":
            return "Lorem ipsum dolor sit amet. Vel animi quia aut deserunt quos qui quia quaerat ut internos ipsa."

            // !Funny text disabled
            // return "This is a " + kiss.db.faker({
            //         label: "description.adjectives"
            //     }) +
            //     " " + kiss.db.faker({
            //         label: "description.starts"
            //     }) +
            //     " about a " + kiss.db.faker({
            //         label: "description.adjectives"
            //     }) +
            //     " " + kiss.db.faker({
            //         label: "description.subjects"
            //     }) +
            //     " who " + kiss.db.faker({
            //         label: "description.auxiliaries"
            //     }) +
            //     " " + kiss.db.faker({
            //         label: "description.adverbs"
            //     }) +
            //     " " + kiss.db.faker({
            //         label: "description.verbs"
            //     }) +
            //     " a " + kiss.db.faker({
            //         label: "description.subjects"
            //     }) +
            //     ", which " + kiss.db.faker({
            //         label: "description.ends"
            //     }) + "."

        case "title":
        case "titre":
            return kiss.db.faker({
                    label: "description.adjectives"
                }).toTitleCase() +
                " " + kiss.db.faker({
                    label: "description.adjectives"
                }) +
                " " + kiss.db.faker({
                    label: "description.subjects"
                })

        default:
            if (typeof field === "object") {
                // Field was passed as a field configuration object

                // If the field is a "description", it's generated using a composition of multiple db.faker elements.
                // Otherwise, we try to get a specific field definition, depending the field label (example: "Last name")
                sourceArray = (field.label.indexOf("description") != -1) ? kiss.db.faker.description[field.label.split(".")[1]] : kiss.db.faker[mockupName]

                // If the field label couldn't be find amongst pre-defined field names, we use the field's type instead (text, number, date, ...)
                if (!sourceArray) return kiss.db.faker(Object.assign({}, field, {
                    label: field.type
                }))
            } else {
                // Field was passed as a simple field label
                sourceArray = kiss.db.faker[mockupName]
                if (!sourceArray) return kiss.db.faker("text")
            }

            // If the field label could be find, returns a random value of the source array
            return sourceArray[Math.floor(Math.random() * sourceArray.length)]
    }
}

// Define values to pick from...
kiss.db.faker["priority"] = ["1 - Critical", "2 - High", "3 - Normal", "4 - Low"]
kiss.db.faker["first name"] = ["Mihaela", "Johanna", "Julia", "Christian", "Brigitte", "Erwin", "Maurice", "Lydia", "Adrian", "Lucienne", "John", "Robert", "Bob", "Will", "Stephen", "Pavel", "Robin", "Gad", "Arnold", "Sylvester", "Dolph", "Robbie", "Flavien"]
kiss.db.faker["last name"] = ["Clinciu", "Giordini", "Cvejzek", "Ponzini", "Collat", "Romell", "Lanoix", "Mikevskaia", "Smith", "Dupont", "Romero", "De Rosa", "Wilson", "Smith", "King", "Yurgen", "Lundgren", "Al'Shadar", "Gad'Nayé", "Bouliama", "Legendre"]
kiss.db.faker["department"] = ["Head office", "Sales", "IT", "Support", "Marketing", "Communication", "Accounting", "Back office", "Human resources", "Quality"]
kiss.db.faker["company name"] = ["Google", "Amazon", "Facebook", "Apple", "IBM", "Microsoft", "Sony", "Nintendo", "SpaceX", "Toyota", "Ford", "Ferrari", "Renault", "Epic", "Ubisoft", "Quantic Dream", "Valve", "Stripe", "PickaForm", "Exauce", "The-Data-Box", "Infinity"]
kiss.db.faker["domain"] = ["net", "com", "org", "eu", "fr", "re"]
kiss.db.faker["city"] = ["Paris", "New York", "Tokyo", "London", "Ajaccio", "Saint-Denis", "Sydney", "Marseilles", "Lyon"]
kiss.db.faker["street"] = ["street", "avenue", "boulevard", "road"]
kiss.db.faker["country"] = ["Gaulle", "Germanistan", "Corsica", "Bhukistan", "Wessex", "Africanistan", "Americanistan", "Paradisistan"]
kiss.db.faker["text"] = ["Sample text", "This is an example", "Lorem ipsum"]
kiss.db.faker["description"] = {
    starts: ["example", "story", "book", "example", "use case", "case", "article"],
    adjectives: ["green", "blue", "red", "purple", "big", "small", "giant", "slick", "clever", "stupid", "wonderful", "serious", "shy", "dangerous", "hilarious", "not so serious", "really cool", "strange", "perfect", "moody"],
    subjects: ["man", "woman", "gorilla", "flying saucer", "donkey", "cat", "kiwi", "dog", "mouse", "wolf", "mammoth", "banana", "peanut", "zombie", "monster", "frog", "bird", "chair", "laptop", "planet"],
    auxiliaries: ["can", "can't", "could", "couldn't", "will", "won't", "did", "didn't", "may", "may not", "might", "might not", "shall"],
    verbs: ["talk to", "jump over", "sing with", "eat", "reprogram", "brain-wash", "help", "paint", "study", "invite"],
    adverbs: ["gracefully", "peacefully", "gently", "heavily", "slightly", "deeply", "silently", "carefully", "nicely", "easily", "electronically"],
    ends: ["is funny", "is a bit weird", "doesn't make any sense", "hurts a little bit", "should never happen", "remains to proof", "is nonsense", "might or might not be the truth", "makes me wonder", "invites to meditation"]
}

/**
 * Generate multiple fake records
 * 
 * @param {object[]} fields
 * @param {number} numberOfRecords
 * @returns {object[]} - An array of fake records
 */
kiss.db.faker.generate = function (fields, numberOfRecords) {
    let records = []
    let max = numberOfRecords || 50

    // Keep only the non-deleted fields
    let activeFields = fields.filter(field => field.deleted != true)

    for (let index = 0; index < max; index++) {
        let newRecord = {}
        activeFields.forEach(field => {
            if (field.primary == true) {
                // Primary fields: get field name + index
                newRecord[field.id] = field.label.toTitleCase() + " " + ("0000" + (index + 1)).slice(-5)
            } else if (field.label.toLowerCase() == "name") {
                // Name fields
                newRecord[field.id] = "Name " + ("0000" + (index + 1)).slice(-5)
            } else {
                // Other fields
                let generatedValue = kiss.db.faker(field)
                if (generatedValue !== "") newRecord[field.id] = generatedValue
            }
        })

        newRecord.id = uid()
        newRecord.isFake = true
        records.push(newRecord)
    }
    return records
}

;