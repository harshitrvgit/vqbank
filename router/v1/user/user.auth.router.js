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
const userRouter = Router();

/**
 * Routes
 */
userRouter.route("/register")
    .get(renderRegister)
    .post(registerUser)

userRouter.route("/login")
    .get(renderLogin)
    .post(loginUser)

userRouter.route("/logout")
    .get(protect, logoutUser)

userRouter.route("/logoutAll")
    .get(protect, logoutAllSessions)

userRouter.route("/vqbank")
    .get(protect, renderVqbank)

module.exports = userRouter;