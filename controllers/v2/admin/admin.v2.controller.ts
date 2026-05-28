import { Request, Response } from 'express';
import catchAsync from '@/utils/server-error-handling/catchAsyncError.js';
import User from '@/models/user.model.js';
import Paper from '@/models/paper.model.js';

/**
 * @route   GET /api/v2/admin
 * @desc    Get admin dashboard stats (JSON)
 * @access  Private (Admin only)
 */
export const v2GetAdminStats = catchAsync(async (_, res: Response) => {
	const [totalUsers, totalPapers, totalViews] = await Promise.all([
		User.countDocuments(),
		Paper.countDocuments(),
		Paper.aggregate([
			{
				$group: {
					_id: null,
					totalViews: { $sum: '$views' },
				},
			},
		]),
	]);

	return res.status(200).send({
		totalUsers,
		totalPapers,
		totalViews: totalViews[0]?.totalViews ?? 0,
	});
});

/**
 * @route   GET /api/v2/users
 * @desc    List all users (JSON)
 * @access  Private (Admin only)
 */
export const v2GetAllUsers = catchAsync(async (req: Request, res: Response) => {
	const page = parseInt(req.query.page as string) || 1;
	const limit = parseInt(req.query.limit as string) || 20;
	const skip = (page - 1) * limit;

	const [users, total] = await Promise.all([
		User.find()
			.select('-password -otp -tokens -__v')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit),
		User.countDocuments(),
	]);

	return res.status(200).send({ users, total, page, limit });
});

/**
 * @route   GET /api/v2/user/:userId
 * @desc    Get a single user's profile by ID
 * @access  Private (Admin only)
 */
export const v2GetUser = catchAsync(async (req: Request, res: Response) => {
	const { userId } = req.params;

	if (!userId) {
		return res.status(400).send({ message: 'User ID is required' });
	}

	const user = await User.findById(userId).select(
		'-password -otp -tokens -__v'
	);

	if (!user) {
		return res.status(404).send({ message: 'User not found' });
	}

	return res.status(200).send(user);
});

/**
 * @route   GET /api/v2/me
 * @desc    Get current authenticated user's profile
 * @access  Private
 */
export const v2GetMe = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		return res.status(401).send({ message: 'Unauthorized' });
	}

	const user = await User.findById(req.user._id).select(
		'-password -otp -tokens -__v'
	);

	if (!user) {
		return res.status(404).send({ message: 'User not found' });
	}

	return res.status(200).send(user);
});
