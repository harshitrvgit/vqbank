/**
 * Node modules
 */
const { Router } = require("express");
const upload = require("../../../utils/multer.js");

/**
 * Middlewares
 */
const protect = require("../../../middlewares/v1/auth/protect.js");
const role = require("../../../middlewares/v1/auth/role.js");
const genDownloadFile = require("../../../middlewares/v1/paper/genDownloadFile.js");

/**
 * Controller
 */
const {
    renderUpload,
    uploadPaper,
    getAllPapers
} = require("../../../controllers/v1/paper/paper.controller.js");

const paperRouter = Router();

/**
 * Routes
 */
paperRouter.route("/upload")
    .get(renderUpload)
    .post(protect, role.checkRole(role.ROLES.Admin), upload.single("file"), uploadPaper);

paperRouter.route("/papers")
    .get(getAllPapers);

paperRouter.route("/paper/download/:paperId")
    .get(protect, genDownloadFile)

module.exports = paperRouter;