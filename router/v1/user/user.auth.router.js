/**
 * Node modules
 */
const { Router } = require("express");

/**
 * User controller 
 */
const { registerUser, renderRegister } = require("../../../controllers/v1/user/user.auth.controller.js");

/**
 * Router object
 */
const userRouter = Router();

/**
 * Routes
 */
userRouter.route("/register")
    .get(renderRegister)
    .post(registerUser)

module.exports = userRouter;