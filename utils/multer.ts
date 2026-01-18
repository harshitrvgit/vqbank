/**
 * Utils
 */
import AppError from './server-error-handling/AppError.js';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();
const multerConfigs = {
	limits: {
		fileSize: 5000000,
	},
	fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
		if (
			!file.originalname.match(/\.(pdf|doc|docx|txt|zip|pptx|jpg|jpeg|png)$/)
		) {
			return cb(
				new AppError('Supported file types are pdf, doc, docx and txt', 415)
			);
		}
		cb(null, true);
	},
	storage,
};

export default multer(multerConfigs);
