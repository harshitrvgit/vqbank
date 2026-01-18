import jwt, { JwtPayload } from 'jsonwebtoken';

/**
 * @description - This function create a JWT Token based on user._id, secret key and expiration time
 * @param {object} - user id
 * @returns {string} - JWT Token
 */
export const newToken = (id: string | object): string => {
	return jwt.sign(
		{
			id,
		},
		process.env.JWT_SECRET as string,
		{
			expiresIn: process.env.JWT_EXP as jwt.SignOptions['expiresIn'],
		}
	);
};

/**
 * This function varifies JWT token and give out id of the user it belongs to.
 * We can further use the id to find the user and authenticate accordingly.
 *
 * @param {string} JWT token
 * @returns {object} payload i.e. user._id
 */
export const verifyToken = (
	token: string
): Promise<string | JwtPayload | undefined> =>
	new Promise((resolve, reject) => {
		jwt.verify(token, process.env.JWT_SECRET as string, (err, payload) => {
			if (err) return reject(err);
			resolve(payload);
		});
	});
