/**
 * Utils
 */
const catchAsync = require("../../../utils/server-error-handling/catchAsyncError.js");

/**
 * Models
 */
const Paper = require("../../../models/paper.model.js");

/**
 * @description - This method renders the upload page.
 *
 */
module.exports.renderUpload = (req, res) => {
	return res.render("vqbank/upload");
};

module.exports.uploadPaper = catchAsync(async (req, res) => {
	// Check if paper already exists
	const existingPaper = await Paper.findOne({
		buffer: req.file.buffer,
	});

	if (existingPaper) {
		req.flash("error", "Paper already exists");
		return res.redirect("/api/v1/upload");
	}

	const validProgrammeNames = ["mca", "btech", "mtech", "msc", "other"];
	const validSemesters = ["fall-sem", "winter-sem", "summer-sem", "other"];
	const validAssessmentTypes = [
		"cat-1",
		"cat-2",
		"mid-term",
		"fat",
		"re-fat",
		"re-cat",
		"other",
	];

	const { programmeName, semester, assessmentType, courseTitle } = req.body;
	if (!programmeName || !semester || !assessmentType || !courseTitle) {
		req.flash("error", "Please fill all the fields");
		return res.redirect("/api/v1/upload");
	}

	if (
		!validProgrammeNames.includes(programmeName) ||
		!validSemesters.includes(semester) ||
		!validAssessmentTypes.includes(assessmentType)
	) {
		req.flash("error", "Invalid option");
		return res.redirect("/api/v1/upload");
	}

	if (courseTitle.length > 75) {
		req.flash(
			"error",
			"Invalid course title, only alphanumeric characters are allowed"
		);
		return res.redirect("/api/v1/upload");
	}

	const paper = new Paper({
		...req.file,
		...req.body,
		user: req.user._id,
	});

	await paper.save();

	req.flash("success", "Paper uploaded successfully");
	return res.redirect("/api/v1/papers");
});

/**
 * @description - Gets all the papers.
 */
module.exports.getAllPapers = catchAsync(async (req, res) => {
	const papers = await Paper.find({}).select("-__v -buffer");

	return res.render("vqbank/index", {
		papers,
		options: {}
	});
});

/**
 * @description View paper
 */
module.exports.viewPaper = catchAsync(async (req, res) => {
	const { paperId } = req.params;

	const paper = await Paper.findById(paperId);

	paper.views += 1;
	await paper.save();

	if (!paperId || !paper) {
		return res.status(404).send("Paper not found");
	}

	res.setHeader(
		"Content-Disposition",
		`inline; filename="${paper.originalname}"`
	);
	res.setHeader("Content-Type", `${paper.mimetype}`);

	res.send(paper.buffer);
});

/**
 * @description Returns the suggesstions for the search query.
 */
module.exports.getSuggestions = catchAsync(async (req, res) => {
	const { query } = req.query;

	const suggestions = await Paper.find({
		courseTitle: { $regex: new RegExp(query, "i") },
	})
		.select("mimetype size user views semester  assessmentType courseTitle programmeName")
		.limit(10);

	// originalname, size, _id
	console.log(suggestions);
	res.status(200).json(suggestions);
});

module.exports.sortPapers = catchAsync(async (req, res) => {
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

	const papers = await Paper.find(query)
		.select("-__v -buffer")
		.limit(10);

	if (papers.length === 0) {
		req.flash("error", "No papers found :( Try different filter...");
		return res.redirect("/api/v1/papers");
	}

	res.render("vqbank/index", {
		papers,
		options: req.body
	});
});
