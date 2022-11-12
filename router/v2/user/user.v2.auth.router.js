/**
 * Node modules
 */
const { Router } = require("express");

/**
 * User controller 
 */
const { v2RegisterUser } = require("../../../controllers/v2/user/user.v2.auth.controller.js");

/**
 * Router object
 */
const v2UserRouter = Router();

/**
 * Routes
 */
v2UserRouter.route("/register")
.get((req, res)=>{
    return res.status(200).send("v2 register page");
})
.post(v2RegisterUser);

module.exports = v2UserRouter;