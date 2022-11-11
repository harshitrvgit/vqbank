/**
 * Node modules
 */
const validator = require("validator");

/**
 * Models
 */
const User = require("../../models/user.model.js");

/**
 * Utils
 */
const catchAsync = require("../../utils/server-error-handling/catchAsyncError.js");

/**
 * @description - Registers new user.
 */
module.exports.registerUser = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    if (!validator.isEmail(email)) {
        return res.status(400).send({ message: "Invalid email address" });
    }
    if (!validator.isLength(password, { min: 6, max: 20 })) {
        return res.status(400).send({ message: "Password must be between 6 and 20 characters" });
    }

    const existingUser = await User.findOne({
        $or: [
            {
                email,
            }, //Check if this matches
            {
                phoneNumber,
            }, // OR this matches
        ],
    });

    if(existingUser){
        return res.status(400).send({ message: "This email is already in use." });
    }

    const user = new User({
        email,
        password
    });

    const token = newToken(user._id);
    user.tokens.push({ token });
    await user.save();

    return res.status(201).send({ message: "successfully registered", user, token });
});