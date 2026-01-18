import validator from 'validator';
import { Request, Response } from 'express';
import User from '@/models/user.model.js';
import { newToken } from '@/utils/jwt.js';
import catchAsync from '@/utils/server-error-handling/catchAsyncError.js';

export const renderRegister = (req: Request, res: Response) => {
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

export const registerUser = catchAsync(async (req: Request, res: Response) => {
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

	res.cookie('token', token, { signed: true });
	req.flash('success', 'Welcome to vqbank');

	return res.redirect('/api/v1/papers');
});

export const renderLogin = (req: Request, res: Response) => {
	return res.render('auth/user/login');
};

export const loginUser = catchAsync(async (req: Request, res: Response) => {
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

	res.cookie('token', token, { signed: true });
	req.flash('success', 'Welcome back to vqbank');

	return res.redirect('/api/v1/papers');
});

export const logoutUser = catchAsync(async (req: Request, res: Response) => {
	res.clearCookie('token');
	req.flash('success', 'You have been logged out');
	return res.redirect('/');
});
