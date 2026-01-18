import { Request, Response } from 'express';
import catchAsync from '@/utils/server-error-handling/catchAsyncError.js';
import Paper from '@/models/paper.model.js';

export const v2UploadPaper = catchAsync(async (req: Request, res: Response) => {
	// Check if paper already exists

	if (!req.file) {
		return res.status(400).send({ message: 'No file uploaded' });
	}

	const existingPaper = await Paper.findOne({
		originalname: req.file.originalname,
	});

	if (existingPaper) {
		return res.status(400).send({ message: 'Paper already exists' });
	}

	if (!req.user) {
		return res.status(401).send({ message: 'Unauthorized' });
	}

	const paper = new Paper({
		...req.file,
		user: req.user._id,
	});

	await paper.save();

	return res
		.status(201)
		.send({ message: 'Paper uploaded', paperId: paper._id });
});

export const v2GetAllPapers = catchAsync(
	async (req: Request, res: Response) => {
		const papers = await Paper.find({}).select('-__v -buffer');
		console.log(papers);
		return res.status(200).send(papers);
	}
);
