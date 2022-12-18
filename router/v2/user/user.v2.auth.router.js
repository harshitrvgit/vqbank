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
const v2UserAuthRouter = Router();

/**
 * Routes
 */
v2UserAuthRouter.route("/register")
    .get((req, res) => {
        return res.status(200).send("v2 register page");
    })
    .post(v2RegisterUser);

v2UserAuthRouter.route("/login")
    .post(v2LoginUser)

v2UserAuthRouter.route("/logout")
    .get(v2Protect, v2LogoutUser)

v2UserAuthRouter.route("/logoutAll")
    .get(v2Protect, v2LogoutAllSessions)

module.exports = v2UserAuthRouter;