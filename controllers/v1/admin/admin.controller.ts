import { Request, Response } from 'express';
import User from '@/models/user.model.js';

export const renderAdmin = async (req: Request, res: Response) => {
	return res.render('admin/index');
};

export const getAllUsers = async (req: Request, res: Response) => {
	const users = await User.find();
	return res.render('admin/users', {
		users,
	});
};
