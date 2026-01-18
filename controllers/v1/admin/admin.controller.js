/**
 * Model import.
 */
import User from '../../../models/user.model.js';

/**
 * @description - Render Admin Dashboard
 */
export const renderAdmin = async (req, res) => {
	return res.render('admin/index');
};

/**
 * @description - Get all users
 */
export const getAllUsers = async (req, res) => {
	const users = await User.find();
	return res.render('admin/users', {
		users,
	});
};
