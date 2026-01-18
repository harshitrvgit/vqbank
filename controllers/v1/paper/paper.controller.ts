import { Request, Response } from 'express';
import catchAsync from '@/utils/server-error-handling/catchAsyncError.js';
import Paper from '@/models/paper.model.js';

export const renderUpload = (req: Request, res: Response) => {
	return res.render('vqbank/upload', {
		paper: {},
		button: 'Upload',
		action: '/api/v1/upload',
		required: true,
	});
};

export const uploadPaper = catchAsync(async (req: Request, res: Response) => {
	// Check if paper already exists
	// req.file is from multer
	if (!req.file) {
		req.flash('error', 'Please upload a file');
		return res.redirect('/api/v1/upload');
	}

	const existingPaper = await Paper.findOne({
		buffer: req.file.buffer,
	});

	if (existingPaper) {
		req.flash('error', 'Paper already exists');
		return res.redirect('/api/v1/upload');
	}

	const validProgrammeNames = ['mca', 'btech', 'mtech', 'msc', 'other'];
	const validSemesters = ['fall-sem', 'winter-sem', 'summer-sem', 'other'];
	const validAssessmentTypes = [
		'cat-1',
		'cat-2',
		'mid-term',
		'fat',
		're-fat',
		're-cat',
		'other',
	];

	const { programmeName, semester, assessmentType, courseTitle } = req.body;
	if (!programmeName || !semester || !assessmentType || !courseTitle) {
		req.flash('error', 'Please fill all the fields');
		return res.redirect('/api/v1/upload');
	}

	if (
		!validProgrammeNames.includes(programmeName) ||
		!validSemesters.includes(semester) ||
		!validAssessmentTypes.includes(assessmentType)
	) {
		req.flash('error', 'Invalid option');
		return res.redirect('/api/v1/upload');
	}

	if (courseTitle.length > 75) {
		req.flash(
			'error',
			'Invalid course title, only alphanumeric characters are allowed'
		);
		return res.redirect('/api/v1/upload');
	}

	if (!req.user) {
		req.flash('error', 'Login required');
		return res.redirect('/api/v1/login');
	}

	const paperData = {
		...req.file,
		...req.body,
		user: req.user._id,
	};

	const paper = new Paper(paperData);

	await paper.save();

	req.flash('success', 'Paper uploaded successfully');
	return res.redirect('/api/v1/papers');
});

export const getAllPapers = catchAsync(async (req: Request, res: Response) => {
	const papers = await Paper.find({}).select('-__v -buffer');

	return res.render('vqbank/index', {
		papers,
		options: {},
	});
});

export const viewPaper = catchAsync(async (req: Request, res: Response) => {
	const { paperId } = req.params;

	const paper = await Paper.findById(paperId);

	if (!paperId || !paper) {
		return res.status(404).send('Paper not found');
	}

	paper.views += 1;
	await paper.save();

	res.setHeader(
		'Content-Disposition',
		`inline; filename="${paper.originalname}"`
	);
	res.setHeader('Content-Type', `${paper.mimetype}`);

	res.send(paper.buffer);
});

export const getSuggestions = catchAsync(
	async (req: Request, res: Response) => {
		const { query } = req.query;

		const suggestions = await Paper.find({
			courseTitle: { $regex: new RegExp(query as string, 'i') },
		})
			.select(
				'mimetype size user views semester  assessmentType courseTitle programmeName'
			)
			.limit(10);

		res.status(200).json(suggestions);
	}
);

export const sortPapers = catchAsync(async (req: Request, res: Response) => {
	const { programmeName, semester, assessmentType } = req.body;

	const query: Record<string, unknown> = {
		programmeName,
		semester,
		assessmentType,
	};

	Object.keys(query).forEach(
		(key) => query[key] === undefined && delete query[key]
	);

	const papers = await Paper.find(query).select('-__v -buffer').limit(10);

	if (papers.length === 0) {
		req.flash('error', 'No papers found :( Try different filter...');
		return res.redirect('/api/v1/papers');
	}

	res.render('vqbank/index', {
		papers,
		options: req.body,
	});
});

export const renderEditPaper = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const paper = await Paper.findById(id).select('-buffer');

		if (!paper) {
			req.flash('error', "Paper doesn't exist");
			return res.redirect('/papers');
		}

		return res.render('vqbank/upload', {
			paper,
			button: 'Update',
			action: `/api/v1/paper/edit/${id}?_method=PUT`,
			required: false,
		});
	}
);

export const editPaper = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;
	const { semester, assessmentType, courseTitle, programmeName } = req.body;

	if (!semester || !assessmentType || !courseTitle || !programmeName) {
		console.log('validation failed...');
		req.flash('error', 'Please fill all the fields');
		return res.redirect(`/api/v1/paper/edit/${id}`);
	}

	const validProgrammeNames = ['mca', 'btech', 'mtech', 'msc', 'other'];
	const validSemesters = ['fall-sem', 'winter-sem', 'summer-sem', 'other'];
	const validAssessmentTypes = [
		'cat-1',
		'cat-2',
		'mid-term',
		'fat',
		're-fat',
		're-cat',
		'other',
	];

	if (
		!validProgrammeNames.includes(programmeName) ||
		!validSemesters.includes(semester) ||
		!validAssessmentTypes.includes(assessmentType)
	) {
		req.flash('error', 'Invalid options choosen');
		return res.redirect(`/api/v1/paper/edit/${id}`);
	}

	if (courseTitle.length > 75) {
		req.flash(
			'error',
			'Invalid course title, title length must be within 75 characters'
		);
		return res.redirect(`/api/v1/paper/edit/${id}`);
	}

	const paper = await Paper.findById(id);

	if (!paper) {
		req.flash('error', "Paper doesn't exist");
		return res.redirect('/papers');
	}

	const updateOps: Record<string, unknown> = {};

	for (const key in req.body) {
		if (paper.get(key) && paper.get(key) !== req.body[key]) {
			updateOps[key] = req.body[key];
		}
	}

	// checking if the file is changed
	if (req.file?.buffer && Buffer.compare(req.file.buffer, paper.buffer) !== 0) {
		updateOps.fieldname = req.file.fieldname;
		updateOps.originalname = req.file.originalname;
		updateOps.encoding = req.file.encoding;
		updateOps.mimetype = req.file.mimetype;
		updateOps.buffer = req.file.buffer;
		updateOps.size = req.file.size;
	}

	// check if the user is changed
	if (!req.user) {
		req.flash('error', 'Login required');
		return res.redirect('/api/v1/login');
	}

	if (req.user._id.toString() !== paper.user.toString()) {
		updateOps.user = req.user._id;
	}

	// Update the paper
	await Paper.findByIdAndUpdate(
		id,
		{ $set: updateOps },
		{
			new: true,
			runValidators: true,
		}
	);

	req.flash('success', 'Paper updated successfully');
	return res.redirect('/api/v1/papers');
});

export const deletePaper = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;
	await Paper.findByIdAndDelete(id);
	req.flash('success', 'Paper deleted successfully');
	return res.redirect('/api/v1/papers');
});
