/**
 * Node modules
 */
const { Router } = require("express");

/**
 * User controller 
 */
const { 
    registerUser, 
    renderRegister,
    renderLogin,
    loginUser, 
    logoutUser,
    logoutAllSessions
} = require("../../../controllers/v1/user/user.auth.controller.js");
const { renderVqbank } = require("../../../controllers/v1/user/user.controller.js");

/**
 * Middlewares
 */
const protect = require("../../../middlewares/v1/auth/protect.js");

/**
 * Router object
 */
const userAuthRouter = Router();

/**
 * Routes
 */
userAuthRouter.route("/register")
    .get(renderRegister)
    .post(registerUser)

userAuthRouter.route("/login")
    .get(protect, renderLogin)
    .post(loginUser)

userAuthRouter.route("/logout")
    .get(protect, logoutUser)

userAuthRouter.route("/vqbank")
    .get(protect, renderVqbank)

module.exports = userAuthRouter;