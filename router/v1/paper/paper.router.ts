/**
 * Node modules
 */
import { Router } from 'express';
import upload from '@/utils/multer.js';

/**
 * Middlewares
 */
import protect from '@/middlewares/v1/auth/protect.js';
import role from '@/middlewares/v1/auth/role.js';
import {
	generalLimiter,
	downloadLimiter,
} from '@/middlewares/v1/rateLimit.js';

/**
 * Controller
 */
import {
	renderUpload,
	uploadPaper,
	getAllPapers,
	viewPaper,
	getSuggestions,
	sortPapers,
	renderEditPaper,
	editPaper,
	deletePaper,
} from '@/controllers/v1/paper/paper.controller.js';

const paperRouter = Router();

/**
 * Routes
 */
paperRouter
	.route('/upload')
	.get(protect, role.checkRole(role.ROLES.Admin), renderUpload)
	.post(
		protect,
		role.checkRole(role.ROLES.Admin),
		upload.single('file'),
		uploadPaper
	);

paperRouter.route('/papers').get(generalLimiter, getAllPapers);

paperRouter.route('/paper/view/:paperId').get(downloadLimiter, viewPaper);

paperRouter.route('/paper/suggestions').get(generalLimiter, getSuggestions);

paperRouter
	.route('/paper/sort')
	.get(generalLimiter, sortPapers)
	.post(generalLimiter, sortPapers);

paperRouter
	.route('/paper/edit/:id')
	.get(protect, role.checkRole(role.ROLES.Admin), renderEditPaper)
	.put(
		protect,
		role.checkRole(role.ROLES.Admin),
		upload.single('file'),
		editPaper
	);

paperRouter
	.route('/paper/delete/:id')
	.delete(protect, role.checkRole(role.ROLES.Admin), deletePaper);

export default paperRouter;
