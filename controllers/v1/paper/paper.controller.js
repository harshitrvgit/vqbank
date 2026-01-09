/**
 * Utils
 */
import catchAsync from '../../../utils/server-error-handling/catchAsyncError.js';

/**
 * Models
 */
import Paper from '../../../models/paper.model.js';

/**
 * @description - This method renders the upload page.
 *
 */
export const renderUpload = (req, res) => {
	return res.render('vqbank/upload', {
		paper: {},
		button: 'Upload',
		action: '/api/v1/upload',
		required: true,
	});
};

export const uploadPaper = catchAsync(async (req, res) => {
	// Check if paper already exists
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

	const paper = new Paper({
		...req.file,
		...req.body,
		user: req.user._id,
	});

	await paper.save();

	req.flash('success', 'Paper uploaded successfully');
	return res.redirect('/api/v1/papers');
});

/**
 * @description - Gets all the papers.
 */
export const getAllPapers = catchAsync(async (req, res) => {
	const papers = await Paper.find({}).select('-__v -buffer');

	return res.render('vqbank/index', {
		papers,
		options: {},
	});
});

/**
 * @description View paper
 */
export const viewPaper = catchAsync(async (req, res) => {
	const { paperId } = req.params;

	const paper = await Paper.findById(paperId);

	paper.views += 1;
	await paper.save();

	if (!paperId || !paper) {
		return res.status(404).send('Paper not found');
	}

	res.setHeader(
		'Content-Disposition',
		`inline; filename="${paper.originalname}"`
	);
	res.setHeader('Content-Type', `${paper.mimetype}`);

	res.send(paper.buffer);
});

/**
 * @description Returns the suggesstions for the search query.
 */
export const getSuggestions = catchAsync(async (req, res) => {
	const { query } = req.query;

	const suggestions = await Paper.find({
		courseTitle: { $regex: new RegExp(query, 'i') },
	})
		.select(
			'mimetype size user views semester  assessmentType courseTitle programmeName'
		)
		.limit(10);

	res.status(200).json(suggestions);
});

export const sortPapers = catchAsync(async (req, res) => {
	const { programmeName, semester, assessmentType } = req.body;

	// Build the query conditions based on provided filters
	const query = {
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

/**
 * @description Render Edit paper
 */
export const renderEditPaper = catchAsync(async (req, res) => {
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
});

/**
 * @description Edits paper
 */
export const editPaper = catchAsync(async (req, res) => {
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

	let query = {
		$set: {},
	};

	for (let key in req.body) {
		if (paper[key] && paper[key] !== req.body[key]) {
			query.$set[key] = req.body[key];
		}
	}

	// checking if the file is changed
	if (req.file?.buffer && Buffer.compare(req.file.buffer, paper.buffer) !== 0) {
		query.$set.fieldname = req.file.fieldname;
		query.$set.originalname = req.file.originalname;
		query.$set.encoding = req.file.encoding;
		query.$set.mimetype = req.file.mimetype;
		query.$set.buffer = req.file.buffer;
		query.$set.size = req.file.size;
	}

	// check if the user is changed
	if (req.user._id.toString() !== paper.user.toString()) {
		query.$set.user = req.user._id;
	}

	// Update the paper
	await Paper.findByIdAndUpdate(id, query['$set'], {
		new: true,
		runValidators: true,
	});

	req.flash('success', 'Paper updated successfully');
	return res.redirect('/api/v1/papers');
});

export const deletePaper = catchAsync(async (req, res) => {
	const { id } = req.params;
	await Paper.findByIdAndDelete(id);
	req.flash('success', 'Paper deleted successfully');
	return res.redirect('/api/v1/papers');
});
