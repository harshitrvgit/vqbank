/**
 * Node modules
 */
import { Router } from 'express';
import upload from '@/utils/multer.js';

/**
 * Middlewares
 */
import v2Protect from '@/middlewares/v2/auth/v2Protect.js';
import v2Role from '@/middlewares/v2/auth/v2Role.js';
import v2GenDownloadFile from '@/middlewares/v2/paper/v2genDownloadFile.js';

/**
 * Controller
 */
import {
	v2UploadPaper,
	v2GetAllPapers,
	v2GetPaper,
	v2ViewPaper,
	v2GetSuggestions,
	v2SortPapers,
	v2EditPaper,
	v2DeletePaper,
} from '@/controllers/v2/paper/paper.v2.controller.js';

const v2PaperRouter = Router();

/**
 * Routes
 */

// Upload a new paper (Admin only, multipart)
v2PaperRouter
	.route('/upload')
	.post(
		v2Protect,
		v2Role.v2CheckRole(v2Role.ROLES.Admin),
		upload.single('file'),
		v2UploadPaper
	);

// List all papers (with optional filtering & pagination via query params)
v2PaperRouter.route('/papers').get(v2GetAllPapers);

// Search suggestions by course title
v2PaperRouter.route('/paper/suggestions').get(v2Protect, v2GetSuggestions);

// Filter/sort papers
v2PaperRouter.route('/paper/sort').post(v2Protect, v2SortPapers);

// View/stream a paper inline (increments view count)
v2PaperRouter.route('/paper/view/:paperId').get(v2Protect, v2ViewPaper);

// Download a paper (uses middleware to write file to disk and send)
v2PaperRouter.route('/paper/download').get(v2Protect, v2GenDownloadFile);

// Get a single paper's metadata
v2PaperRouter.route('/paper/:paperId').get(v2Protect, v2GetPaper);

// Edit a paper (Admin only, optionally with a new file)
v2PaperRouter
	.route('/paper/edit/:id')
	.put(
		v2Protect,
		v2Role.v2CheckRole(v2Role.ROLES.Admin),
		upload.single('file'),
		v2EditPaper
	);

// Delete a paper (Admin only)
v2PaperRouter
	.route('/paper/delete/:id')
	.delete(v2Protect, v2Role.v2CheckRole(v2Role.ROLES.Admin), v2DeletePaper);

export default v2PaperRouter;
