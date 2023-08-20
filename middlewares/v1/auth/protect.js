/**
 * Utils
 */
const { verifyToken } = require("../../../utils/jwt.js");

/**
 * Models
 */
const User = require("../../../models/user.model.js");

/**
 * @description - Protects routes from unauthorized access.
 * 
 */
const protect = async (req, res, next) => {
    let jwtToken;
    try {
        if (req.signedCookies && req.signedCookies.token) {
            jwtToken = req.signedCookies.token;

            const payload = await verifyToken(jwtToken, process.env.JWT_SECRET);
            // *!
            // console.log(payload);

            req.user = await User.findById(payload.id).select("-password -tokens");
            if (!req.user) {
                req.flash("error", "You are not authorized to access this page.");
                return res.redirect("/api/v1/login");
            }
            req.token = jwtToken;

            next();
        }

        if (!jwtToken) {
            req.flash("error", "You need to login first");
            return res.render('auth/user/login');
        }
    } catch (e) {
        if (e.name === "JsonWebTokenError") {
            req.flash("error", "Your session has expired. Please login again.");
            return res.redirect("/api/v1/login");
        }
        if (e.name === "TokenExpiredError") {
            req.flash("error", "Your session has expired. Please login again.");
            // When token expired delete it from user tokens array
            const user = await User.findOne({ "tokens.token": jwtToken });

            if (user && user.tokens.length > 0) {
                user.tokens = user.tokens.filter(token => token.token !== jwtToken);
                await user.save();
            }

            res.clearCookie("token");

            return res.redirect("/api/v1/login");
        }
        console.error(e);
        req.flash("error", "Something went wrong. Please try again later.");
        return res.redirect("/api/v1/login");
    }
}

module.exports = protect;