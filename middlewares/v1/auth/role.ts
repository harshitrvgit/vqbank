import { Request, Response, NextFunction } from 'express';

const ROLES = {
	Admin: 'ROLE_ADMIN',
	User: 'ROLE_USER',
};

const checkRole =
	(...roles: string[]) =>
	(req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			req.flash('error', 'You need to login first');
			return res.redirect('/api/v1/login');
		}
		const hasRole = roles.find((role) => req.user?.role === role);

		if (!hasRole) {
			req.flash('error', 'You are not authorized to perform this action');
			return res.redirect('/api/v1/papers');
		}
		return next();
	};

const role = { ROLES, checkRole };

export default role;
export { ROLES };
