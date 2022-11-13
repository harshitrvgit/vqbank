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
const v2Protect = async (req, res, next) => {
    let token;
    try {
        token = req.header("Authorization").split(" ")[1];

        if (!token) return res.status(400).send({ message: "No token provided" });

        const payload = await verifyToken(token);

        if (!payload) return res.status(400).send({ message: "Invalid token" });

        // Find the user with the given id who also has the provided token in his tokens array
        const user = await User.findOne({ _id: payload.id, "tokens.token": token });
        if (!user) return res.status(400).send({ message: "No user found" });

        req.token = token;
        req.user = user;
        next();

    } catch (e) {
        if (e.name === "JsonWebTokenError") {
            return res.status(400).send({ message: "Invalid token" });
        }
        if (e.name === "TokenExpiredError") {
            // When token expired delete it from user tokens array
            const user = await User.findOne({ "tokens.token": token });

            if (user && user.tokens.length > 0) {
                user.tokens = user.tokens.filter(token => token.token !== token);
                await user.save();
            }
           
            return res.status(400).send({ message: "Token expired" });
        }
        console.error(e);
        return res.status(500).send({ message: "Something went wrong. Please try again later." });
    }
}

module.exports = v2Protect;