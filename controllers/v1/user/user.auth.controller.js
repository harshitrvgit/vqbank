/**
 * Node modules
 */
const validator = require("validator");

/**
 * Models
 */
const User = require("../../../models/user.model.js");

/**
 * Utils
 */
const {
    newToken
} = require("../../../utils/jwt.js");
const catchAsync = require("../../../utils/server-error-handling/catchAsyncError.js");

/**
 * @description: Render the register page
 */
module.exports.renderRegister = (req, res) => {
    return res.render("auth/user/register");
};

/**
 * @description - Registers new user.
 */
module.exports.registerUser = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    if (!validator.isEmail(email)) {
        req.flash("error", "Invalid email address");
        return res.redirect("/api/v1/register");
    }
    if (!validator.isLength(password, { min: 6, max: 20 })) {
        req.flash("error", "Password must be between 6 and 20 characters");
        return res.redirect("/api/v1/register");
    }

    // *! --- 
    // return res.status(200).send({ email, password });

    const existingUser = await User.findOne({
        $or: [
            {
                email,
            }
        ],
    });

    if (existingUser) {
        req.flash("error", "This email is already in use.");
        return res.redirect("/api/v1/register");
    }

    const user = new User({
        email,
        password
    });

    const token = newToken(user._id);
    user.tokens.push({ token });
    await user.save();

    // setting token to session and logging user in
    res.cookie("token", token, { signed: true });
    req.flash("success", "Welcome to vqbank");

    return res.redirect("/api/v1/vqbank");
});

/**
 * @description: Render the login page
 */
module.exports.renderLogin = (req, res) => {
    return res.render("auth/user/login");
}

/**
 * @description - Logs in user.
 */
module.exports.loginUser = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    if (!validator.isEmail(email)) {
        req.flash("error", "Invalid email address");
        return res.redirect("/api/v1/login");
    }

    const user = await User.findOne({
        $or: [
            {
                email,
            }
        ],
    });

    if (!user) {
        req.flash("error", "Invalid email or password");
        return res.redirect("/api/v1/login");
    }

    const isMatch = await user.checkPassword(password);

    if (!isMatch) {
        req.flash("error", "Invalid email or password");
        return res.redirect("/api/v1/login");
    }

    const token = newToken(user._id);
    user.tokens.push({ token });
    await user.save();

    // setting token to session and logging user in
    res.cookie("token", token, { signed: true });
    req.flash("success", "Welcome back to vqbank");

    return res.redirect("/api/v1/vqbank");
});

/**
 * @description - Logs out user.
 */
module.exports.logoutUser = catchAsync(async (req, res) => {
    const { user, token } = req;
    user.tokens = user.tokens.filter((t) => t.token !== token);
    await user.save();
    res.clearCookie("token");
    req.flash("success", "You have been logged out");
    return res.redirect("/api/v1/login");
});

/**
 * @description - Logout from all session
 */
module.exports.logoutAllSessions = catchAsync(async (req, res) => {
    const { user } = req;
    user.tokens = [];
    await user.save();
    res.clearCookie("token");
    req.flash("success", "You have been logged out from all session");
    return res.redirect("/api/v1/login");
});