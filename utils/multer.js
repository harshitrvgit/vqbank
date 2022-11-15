/**
 * Utils
 */
const AppError = require("./server-error-handling/AppError.js");

const multer = require("multer");
const storage = multer.memoryStorage();
const multerConfigs = {
    limits: {
        fileSize: 5000000
    },
    fileFilter(req, file, cb) {            
        if (!file.originalname.match(/\.(pdf|doc|docx|txt|zip|pptx|jpg|jpeg|png)$/)) {
            return cb(new AppError("Supported file types are pdf, doc, docx and txt", 415));
        }
        cb(undefined, true);
    },
    storage
}

module.exports = multer(multerConfigs);