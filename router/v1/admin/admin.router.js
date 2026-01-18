/**
 * Node modules
 */
import { Router } from 'express';

/**
 * Admin controller
 */
import { renderAdmin } from '../../../controllers/v1/admin/admin.controller.js';

/**
 * Middlewares
 */
import protect from '../../../middlewares/v1/auth/protect.js';
import role, { ROLES } from '../../../middlewares/v1/auth/role.js';

/**
 * Router object
 */
const adminRouter = Router();

adminRouter
	.route('/admin')
	.get(protect, role.checkRole(ROLES.Admin), renderAdmin);

export default adminRouter;
