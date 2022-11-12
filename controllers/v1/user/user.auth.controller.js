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
    // await user.save();

    return res.status(201).send({ message: "successfully registered", user, token });
});