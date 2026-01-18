import { IUser } from '../models/user.model.js';

declare global {
	namespace Express {
		interface Request {
			user?: IUser | null;
			token?: string;
		}
	}
}
