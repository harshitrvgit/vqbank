/**
 * Utils
 */
import AppError from './server-error-handling/AppError.js';

import multer from 'multer';

const storage = multer.memoryStorage();
const multerConfigs = {
	limits: {
		fileSize: 5000000,
	},
	fileFilter(req, file, cb) {
		if (
			!file.originalname.match(/\.(pdf|doc|docx|txt|zip|pptx|jpg|jpeg|png)$/)
		) {
			return cb(
				new AppError('Supported file types are pdf, doc, docx and txt', 415)
			);
		}
		cb(undefined, true);
	},
	storage,
};

export default multer(multerConfigs);
