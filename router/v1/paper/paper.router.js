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
    getAllPapers,
    viewPaper,
    getSuggestions,
    sortPapers
} = require("../../../controllers/v1/paper/paper.controller.js");

const paperRouter = Router();

/**
 * Routes
 */
paperRouter.route("/upload")
    .get(renderUpload)
    .post(protect, role.checkRole(role.ROLES.Admin), upload.single("file"), uploadPaper);

paperRouter.route("/papers")
    .get(protect, getAllPapers);

paperRouter.route("/paper/view/:paperId")
    .get(protect, viewPaper)


paperRouter.route("/paper/suggestions")
    .get(protect, getSuggestions)

paperRouter.route("/paper/sort")
    .get(protect, sortPapers)
    .post(protect, sortPapers)

module.exports = paperRouter;