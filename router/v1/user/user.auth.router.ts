/**
 * Node modules
 */
import { Router } from 'express';

/**
 * User controller
 */
import {
	registerUser,
	renderRegister,
	renderLogin,
	loginUser,
	logoutUser,
} from '@/controllers/v1/user/user.auth.controller.js';
import { renderVqbank } from '@/controllers/v1/user/user.controller.js';

/**
 * Middlewares
 */
import protect from '@/middlewares/v1/auth/protect.js';

/**
 * Router object
 */
const userAuthRouter = Router();

/**
 * Routes
 */
userAuthRouter.route('/register').get(renderRegister).post(registerUser);

userAuthRouter.route('/login').get(renderLogin).post(loginUser);

userAuthRouter.route('/logout').get(protect, logoutUser);

userAuthRouter.route('/vqbank').get(protect, renderVqbank);

export default userAuthRouter;
