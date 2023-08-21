/**
 * Utils
 */
const { verifyToken } = require("./jwt.js");

/**
 * Models
 */
const User = require("../models/user.model.js");

/**
 * @description Check if the user is logged in or not and return
 *              the logged in user else reuturn undefined
 */
module.exports.getLoggedInUser = async (req, res) => {
	let jwtToken;
	try {
		if (req.signedCookies && req.signedCookies.token) {
			jwtToken = req.signedCookies.token;
            
			const payload = await verifyToken(jwtToken, process.env.JWT_SECRET);
          
			const user = await User.findById(payload.id).select("-password -tokens");
            
			if (!user) {
				return undefined;
			}
			return user;
		}

		if (!jwtToken) {
			return undefined;
		}
	} catch (e) {
		return undefined;
	}
};
