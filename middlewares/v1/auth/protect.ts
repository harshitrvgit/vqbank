import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt.js';
import User from '@/models/user.model.js';

const protect = async (req: Request, res: Response, next: NextFunction) => {
	let jwtToken: string | undefined;
	try {
		if (req.signedCookies && req.signedCookies.token) {
			jwtToken = req.signedCookies.token;

			if (!jwtToken) {
				req.flash('error', 'You need to login first');
				return res.render('auth/user/login');
			}

			const payload = await verifyToken(jwtToken);

			if (!payload || typeof payload === 'string' || !('id' in payload)) {
				req.flash('error', 'Invalid token');
				return res.redirect('/api/v1/login');
			}

			req.user = await User.findById(payload.id).select('-password -tokens');
			if (!req.user) {
				req.flash('error', 'You are not authorized to access this page.');
				return res.redirect('/api/v1/login');
			}
			req.token = jwtToken;

			return next();
		}

		req.flash('error', 'You need to login first');
		return res.render('auth/user/login');
	} catch (e: unknown) {
		if (e instanceof Error) {
			if (e.name === 'JsonWebTokenError') {
				req.flash('error', 'Your session has expired. Please login again.');
				return res.redirect('/api/v1/login');
			}
			if (e.name === 'TokenExpiredError') {
				req.flash('error', 'Your session has expired. Please login again.');
				// ...commented out logic...
				res.clearCookie('token');
				req.flash('error', 'Login to continue');
				return res.redirect('/api/v1/login');
			}
		}
		console.error(e);

		req.flash('error', 'Something went wrong. Please try again later.');
		return res.redirect('/api/v1/login');
	}
};

export default protect;
