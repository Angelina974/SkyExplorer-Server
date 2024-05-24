/**
 * 
 * kiss.fileStorage
 * 
 */
const multer = require("multer")
const fs = require("fs")
const path = require("path")

module.exports = multer.diskStorage({
    
    destination: function (req, file, callback) {
        let accountId = req.token.currentAccountId
        let year = new Date().getFullYear()
        let month = ("0" + (new Date().getMonth() + 1)).slice(-2)
        let day = ("0" + new Date().getDate()).slice(-2)
        let dir = `./uploads/${accountId}/${year}/${month}/${day}`

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {
                recursive: true
            });
        }
        callback(null, dir)
    },

    filename: function (req, file, callback) {
        let accountId = req.token.currentAccountId
        let year = new Date().getFullYear()
        let month = ("0" + (new Date().getMonth() + 1)).slice(-2)
        let day = ("0" + new Date().getDate()).slice(-2)
        let dir = `./uploads/${accountId}/${year}/${month}/${day}`

        if (fs.existsSync(path.join(dir, file.originalname))) {
            callback(null, Date.now() + ' - ' + file.originalname)
        } else {
            callback(null, file.originalname)
        }
    }
})