/**
 * Node modules
 */
const { Router } = require("express");
const upload = require("../../../utils/multer.js");

/**
 * Middlewares
 */
const v2Protect = require("../../../middlewares/v2/auth/v2Protect.js");
const v2Role = require("../../../middlewares/v2/auth/v2Role.js");

/**
 * Controller
 */
const {
    v2UploadPaper,
    v2GetAllPapers
} = require("../../../controllers/v2/paper/paper.v2.controller.js");

const v2PaperRouter = Router();

/**
 * Routes
 */
v2PaperRouter.route("/upload")
    .post(v2Protect, v2Role.v2CheckRole(v2Role.ROLES.Admin), upload.single("file"), v2UploadPaper);

v2PaperRouter.route("/papers")
    .get(v2GetAllPapers);

module.exports = v2PaperRouter;