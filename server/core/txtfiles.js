/**
 * 
 * kiss.txtFiles - For storing and editing txt files
 * (not used at the moment)
 * 
 */
const fs = require("fs")
let path = require("path")
let lib = {}

module.exports = {
    baseDir: path.join(__dirname, "/"),

    /**
     * Write data to a file
     * 
     * @param {string} dir 
     * @param {string} file 
     * @param {object} data 
     * @param {function} callback
     */
    create(dir, file, data, callback) {

        // Open the file for writing (wx)
        fs.open(this.baseDir + dir + "/" + file + ".json", "wx", function (err, fileDescriptor) {
            if (!err && fileDescriptor) {

                // Convert data to string
                let stringData = JSON.stringify(data)

                // Write to file and close it
                fs.writeFile(fileDescriptor, stringData, function (err) {
                    if (!err) {

                        // Close the file
                        fs.close(fileDescriptor, function (err) {
                            if (!err) {
                                callback(false)
                            } else {
                                callback("Error closing new file")
                            }
                        })
                    } else {
                        callback("Error writing to new file")
                    }
                })
            } else {
                callback("Could not create a new file, it may already exist")
            }
        })
    },

    /**
     * Read file data
     * 
     * @param {string} dir 
     * @param {string} file 
     * @param {function} callback 
     */
    read(dir, file, callback) {
        fs.readFile(this.baseDir + dir + "/" + file + ".js", "utf-8", function (err, data) {
            if (!err && data) {
                let parsedData = kiss.tools.parseJsonToObject(data)
                callback(false, parsedData)
            } else {
                callback(err, data)
            }
        })
    },

    /**
     * Update file data
     * 
     * @param {string} dir 
     * @param {string} file 
     * @param {object} data 
     * @param {function} callback 
     */
    update(dir, file, data, callback) {
        // Open the file for updating (r+)
        fs.open(this.baseDir + dir + "/" + file + ".js", "r+", function (err, fileDescriptor) {
            if (!err && fileDescriptor) {

                // Convert data to string
                let stringData = JSON.stringify(data)

                // Truncate the file
                fs.truncate(fileDescriptor, function (err) {
                    if (!err) {

                        // Write to file and close it
                        fs.writeFile(fileDescriptor, stringData, function (err) {
                            if (!err) {

                                // Close the file
                                fs.close(fileDescriptor, function (err) {
                                    if (!err) {
                                        callback(false)
                                    } else {
                                        callback("Error closing new file")
                                    }
                                })
                            } else {
                                callback("Error writing to existing file")
                            }
                        })
                    } else {
                        callback("Error truncating file")
                    }
                })
            } else {
                callback("Could not open the file for updating, it may not exist yet")
            }
        })
    },

    /**
     * Delete the file
     * 
     * @param {string} dir 
     * @param {string} file 
     * @param {function} callback 
     */
    delete(dir, file, callback) {
        fs.unlink(this.baseDir + dir + "/" + file + ".json", function (err) {
            if (!err) {
                callback(false)
            } else {
                callback("Could not delete the file " + file)
            }
        })
    },

    /**
     * List all the files of a directory
     * 
     * @param {string} dir 
     * @param {function} callback 
     */
    list(dir, callback) {
        fs.readdir(this.baseDir + dir + "/", function (err, data) {
            if (!err && data && data.length > 0) {
                let trimmedFileNames = []
                trimmedFileNames = data.map(filename => filename.replace(".json", ""))
                callback(false, trimmedFileNames)
            } else {
                callback(err, data)
            }
        })
    }
}