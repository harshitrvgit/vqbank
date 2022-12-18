/**
 * Node modules
 */
const { Router } = require("express");

/**
 * Admin controller
 */
const { renderAdmin } = require("../../../controllers/v1/admin/admin.controller.js");

/**
 * Middlewares
 */
const protect = require("../../../middlewares/v1/auth/protect.js");
const role = require("../../../middlewares/v1/auth/role.js");
const { ROLES } = require("../../../middlewares/v1/auth/role.js");

/**
 * Router object
 */
const adminRouter = Router();

adminRouter.route("/admin")
    .get(protect, role.checkRole(ROLES.Admin), renderAdmin)

module.exports = adminRouter;