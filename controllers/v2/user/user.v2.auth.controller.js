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
 * @description - v2: Registers new user.
 */
export const v2RegisterUser = catchAsync(async (req, res) => {
	const { email, password } = req.body;
	if (!validator.isEmail(email)) {
		return res.status(400).send({ message: 'Invalid email address' });
	}
	if (!validator.isLength(password, { min: 6, max: 20 })) {
		return res
			.status(400)
			.send({ message: 'Password must be between 6 and 20 characters' });
	}

	// *! ---
	// return res.status(200).send({ email, password });

	const existingUser = await User.findOne({
		$or: [
			{
				email,
			},
		],
	});

	if (existingUser) {
		return res.status(400).send({ message: 'This email is already in use.' });
	}

	const user = new User({
		email,
		password,
	});

	const token = newToken(user._id);
	user.tokens.push({ token });

	await user.save();

	return res
		.status(201)
		.send({ message: 'successfully registered', email, token });
});

/**
 * @description - Logs in user.
 */
export const v2LoginUser = catchAsync(async (req, res) => {
	const { email, password } = req.body;
	if (!validator.isEmail(email)) {
		return res.status(400).send({ message: 'Invalid email address' });
	}

	const user = await User.findOne({
		$or: [
			{
				email,
			},
		],
	});

	if (!user) {
		return res.status(400).send({ message: 'Invalid email or password' });
	}

	const isMatch = await user.checkPassword(password);

	if (!isMatch) {
		return res.status(400).send({ message: 'Invalid email or password' });
	}

	const token = newToken(user._id);
	user.tokens.push({ token });
	await user.save();

	return res
		.status(200)
		.send({ message: 'successfully logged in', email, token });
});

/**
 * @description - Logs out user.
 */
export const v2LogoutUser = catchAsync(async (req, res) => {
	const { user, token } = req;

	user.tokens = user.tokens.filter((t) => t.token !== token);
	await user.save();
	return res.status(200).send({ message: 'successfully logged out' });
});

/**
 * @description - Logout from all session
 */
export const v2LogoutAllSessions = catchAsync(async (req, res) => {
	const { user } = req;
	user.tokens = [];
	await user.save();
	return res
		.status(200)
		.send({ message: 'successfully logged out from all sessions' });
});
