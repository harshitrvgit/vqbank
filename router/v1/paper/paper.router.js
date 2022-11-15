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

/**
 * Controller
 */
const {
    renderUpload,
    uploadPaper
} = require("../../../controllers/v1/paper/paper.controller.js");

const paperRouter = Router();

/**
 * Routes
 */
paperRouter.route("/upload")
    .get(renderUpload)
    .post(protect, role.checkRole(role.ROLES.Admin), upload.single("file"), uploadPaper);


module.exports = paperRouter;