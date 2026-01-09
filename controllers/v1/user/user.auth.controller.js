/**
 * Node modules
 */
import validator from 'validator';

/**
 * Models
 */
import User from '../../../models/user.model.js';

/**
 * Utils
 */
import { newToken } from '../../../utils/jwt.js';
import catchAsync from '../../../utils/server-error-handling/catchAsyncError.js';

/**
 * @description: Render the register page
 */
export const renderRegister = (req, res) => {
	if (req.token) {
		req.flash(
			'success',
			'You are already logged in, try logging out before signing up again'
		);
		return res.redirect('/api/v1/papers');
	} else {
		return res.render('auth/user/register');
	}
};

/**
 * @description - Registers new user.
 */
export const registerUser = catchAsync(async (req, res) => {
	const { email, password } = req.body;
	if (!validator.isEmail(email)) {
		req.flash('error', 'Invalid email address');
		return res.redirect('/api/v1/register');
	}
	if (!validator.isLength(password, { min: 6, max: 50 })) {
		req.flash('error', 'Password must be between 6 and 50 characters');
		return res.redirect('/api/v1/register');
	}

	const existingUser = await User.findOne({
		$or: [
			{
				email,
			},
		],
	});

	if (existingUser) {
		req.flash('error', 'This email is already in use.');
		return res.redirect('/api/v1/register');
	}

	const user = new User({
		email,
		password,
	});

	const token = newToken(user._id);

	await user.save();

	// setting token to session and logging user in
	res.cookie('token', token, { signed: true });
	req.flash('success', 'Welcome to vqbank');

	return res.redirect('/api/v1/papers');
});

/**
 * @description: Render the login page
 */
export const renderLogin = (req, res) => {
	return res.render('auth/user/login');
};

/**
 * @description - Logs in user.
 */
export const loginUser = catchAsync(async (req, res) => {
	const { email, password } = req.body;
	if (!validator.isEmail(email)) {
		req.flash('error', 'Invalid email address');
		return res.redirect('/api/v1/login');
	}

	const user = await User.findOne({
		$or: [
			{
				email,
			},
		],
	});

	if (!user) {
		req.flash('error', 'Invalid email or password');
		return res.redirect('/api/v1/login');
	}

	const isMatch = await user.checkPassword(password);

	if (!isMatch) {
		req.flash('error', 'Invalid email or password');
		return res.redirect('/api/v1/login');
	}

	const token = newToken(user._id);

	// setting token to session and logging user in
	res.cookie('token', token, { signed: true });
	req.flash('success', 'Welcome back to vqbank');

	return res.redirect('/api/v1/papers');
});

/**
 * @description - Logs out user.
 */
export const logoutUser = catchAsync(async (req, res) => {
	res.clearCookie('token');
	req.flash('success', 'You have been logged out');
	return res.redirect('/logout');
});
