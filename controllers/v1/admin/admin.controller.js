/**
 * Model import.
 */
const User = require("../../../models/user.model.js");

/**
 * @description - Render Admin Dashboard
 */
module.exports.renderAdmin = async (req, res) => {
	return res.render("admin/index");
};

/**
 * @description - Get all users
 */
module.exports.getAllUsers = async (req, res) => {
	const users = await User.find();
	console.log(users);
	return res.render("admin/users", {
		users,
	});
};