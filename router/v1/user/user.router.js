/**
 * Node modules
 */
const { Router } = require("express");

/**
 * User controller 
 */
const {
    getAllUsers
} = require("../../../controllers/v1/admin/admin.controller.js");

/**
 * Middlewares
 */
const protect = require("../../../middlewares/v1/auth/protect.js");
const role = require("../../../middlewares/v1/auth/role.js");

/**
 * Router object
 */
const userRouter = Router();

/**
 * Routes
 */
userRouter.route("/users")
    .get(protect, role.checkRole(role.ROLES.Admin), getAllUsers)

module.exports = userRouter;