/**
 * Node modules
 */
import { Router } from 'express';

/**
 * Middlewares
 */
import v2Protect from '@/middlewares/v2/auth/v2Protect.js';
import v2Role from '@/middlewares/v2/auth/v2Role.js';

/**
 * Controller
 */
import {
	v2GetAdminStats,
	v2GetAllUsers,
	v2GetUser,
	v2GetMe,
} from '@/controllers/v2/admin/admin.v2.controller.js';

const v2AdminRouter = Router();

/**
 * Routes
 */

// Current user profile
v2AdminRouter.route('/me').get(v2Protect, v2GetMe);

// Admin dashboard stats
v2AdminRouter
	.route('/admin')
	.get(v2Protect, v2Role.v2CheckRole(v2Role.ROLES.Admin), v2GetAdminStats);

// List all users (Admin only)
v2AdminRouter
	.route('/users')
	.get(v2Protect, v2Role.v2CheckRole(v2Role.ROLES.Admin), v2GetAllUsers);

// Get single user by ID (Admin only)
v2AdminRouter
	.route('/user/:userId')
	.get(v2Protect, v2Role.v2CheckRole(v2Role.ROLES.Admin), v2GetUser);

export default v2AdminRouter;
