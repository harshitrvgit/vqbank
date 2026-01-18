/**
 * Node modules
 */
import { Router } from 'express';

/**
 * User controller
 */
import { getAllUsers } from '../../../controllers/v1/admin/admin.controller.js';

/**
 * Middlewares
 */
import protect from '../../../middlewares/v1/auth/protect.js';
import role from '../../../middlewares/v1/auth/role.js';

/**
 * Router object
 */
const userRouter = Router();

/**
 * Routes
 */
userRouter
	.route('/users')
	.get(protect, role.checkRole(role.ROLES.Admin), getAllUsers);

export default userRouter;
