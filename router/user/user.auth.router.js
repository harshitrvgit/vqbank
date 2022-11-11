/**
 * Node modules
 */
const { Router } = require("express");

/**
 * User controller 
 */
const { registerUser } = require("../../contollers/user/user.auth.controller.js");

/**
 * Router object
 */
const userRouter = Router();

/**
 * Routes
 */
userRouter.route("/register").get(registerUser);

module.exports = userRouter;