/**
 * Node modules
 */
const { Router } = require("express");

/**
 * Middlewares    
 */
const v2Protect = require("../../../middlewares/v2/auth/v2Protect.js");

/**
 * User controller 
 */
const {
    v2RegisterUser,
    v2LoginUser,
    v2LogoutUser,
    v2LogoutAllSessions
} = require("../../../controllers/v2/user/user.v2.auth.controller.js");

/**
 * Router object
 */
const v2UserRouter = Router();

/**
 * Routes
 */
v2UserRouter.route("/register")
    .get((req, res) => {
        return res.status(200).send("v2 register page");
    })
    .post(v2RegisterUser);

v2UserRouter.route("/login")
    .post(v2LoginUser)

v2UserRouter.route("/logout")
    .get(v2Protect, v2LogoutUser)

v2UserRouter.route("/logoutAll")
    .get(v2Protect, v2LogoutAllSessions)

module.exports = v2UserRouter;