/**
 * Utils
 */
import { newToken } from '../../../utils/jwt.js';
/**
 * Models
 */
import User from '../../../models/user.model.js';

/**
 * @description Checks if user is authenticated with Auth0
 */
const checkAuthZeroLogin = async (req, res, next) => {
	if (req.oidc.isAuthenticated()) {
		const email = req.oidc.user.email;
		const existingUser = await User.findOne({
			$or: [
				{
					email,
				},
			],
		});

		if (existingUser) {
			const token = newToken(existingUser._id);
			res.cookie('token', token, { signed: true });
			return res.redirect('/api/v1/papers');
		}

		const user = new User({
			email,
		});

		const token = newToken(user._id);

		await user.save();

		res.cookie('token', token, { signed: true });

		return res.redirect('/api/v1/papers');
	}

	next();
};

export default checkAuthZeroLogin;
