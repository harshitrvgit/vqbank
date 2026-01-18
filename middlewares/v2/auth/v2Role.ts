import { Request, Response, NextFunction } from 'express';

const ROLES = {
	Admin: 'ROLE_ADMIN',
	User: 'ROLE_USER',
};

const v2CheckRole =
	(...roles: string[]) =>
	(req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(401).send({ message: 'Unauthorized' });
		}
		const hasRole = roles.find((role) => req.user?.role === role);
		if (!hasRole) {
			return res.status(401).send({ message: 'Unauthorized' });
		}
		return next();
	};

const v2Role = { ROLES, v2CheckRole };

export default v2Role;
export { ROLES };
