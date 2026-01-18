/**
 * Utils (ESM)
 */
import { verifyToken } from './jwt.js';

/**
 * Models
 */
import User from '@/models/user.model.js';
import { Request } from 'express';

/**
 * @description Check if the user is logged in or not and return
 *              the logged in user else reuturn undefined
 */
export const getLoggedInUser = async (req: Request) => {
	let jwtToken: string | undefined;
	try {
		if (req.signedCookies && req.signedCookies.token) {
			jwtToken = req.signedCookies.token;
			if (!jwtToken) return undefined;

			const payload = await verifyToken(jwtToken);

			if (!payload || typeof payload === 'string' || !('id' in payload)) {
				return undefined;
			}

			const user = await User.findById(payload.id).select('-password -tokens');

			if (!user) {
				return undefined;
			}
			return user;
		}

		if (!jwtToken) {
			return undefined;
		}
	} catch {
		return undefined;
	}
};
