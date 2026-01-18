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
	.get(protect, renderUpload)
	.post(
		protect,
		role.checkRole(role.ROLES.Admin),
		upload.single('file'),
		uploadPaper
	);

paperRouter.route('/papers').get(protect, getAllPapers);

paperRouter.route('/paper/view/:paperId').get(protect, viewPaper);

paperRouter.route('/paper/suggestions').get(protect, getSuggestions);

paperRouter
	.route('/paper/sort')
	.get(protect, sortPapers)
	.post(protect, sortPapers);

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
