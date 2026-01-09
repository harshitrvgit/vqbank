/**
 * Node modules
 */
import { Router } from 'express';
import upload from '../../../utils/multer.js';

/**
 * Middlewares
 */
import v2Protect from '../../../middlewares/v2/auth/v2Protect.js';
import v2Role from '../../../middlewares/v2/auth/v2Role.js';
import v2GenDownloadFile from '../../../middlewares/v2/paper/v2GenDownloadFile.js';

/**
 * Controller
 */
import {
	v2UploadPaper,
	v2GetAllPapers,
} from '../../../controllers/v2/paper/paper.v2.controller.js';

const v2PaperRouter = Router();

/**
 * Routes
 */
v2PaperRouter
	.route('/upload')
	.post(
		v2Protect,
		v2Role.v2CheckRole(v2Role.ROLES.Admin),
		upload.single('file'),
		v2UploadPaper
	);

v2PaperRouter.route('/papers').get(v2GetAllPapers);

v2PaperRouter.route('/paper/download').get(v2Protect, v2GenDownloadFile);

export default v2PaperRouter;
