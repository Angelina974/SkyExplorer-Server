/**
 * 
 * kiss.loader
 * 
 */
const path = require("path")
const fs = require("fs")

module.exports = {
    /**
     * Helper to require all files in a directory
     * 
     * @param {string} directory
     * @return {number}
     */
    loadDirectory(directory) {
        let loadedFiles = 0
        const directoryPath = path.join(__dirname, directory)
        const files = fs.readdirSync(directoryPath)

        files.forEach(function (file) {
            const path = `${directory}/${file}`

            if (path.match(/\.test\.js$/)) {
                // *.test files are ignored
                return;
            }

            if (fs.lstatSync(`${__dirname}/${path}`).isFile()) {
                require(path)
                loadedFiles++
            }
        })

        return loadedFiles
    }
}