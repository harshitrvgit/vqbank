import { Request, Response } from 'express';
import catchAsync from '@/utils/server-error-handling/catchAsyncError.js';
import { PaperV2Service } from '@/services/v2/paper/paper.v2.service.js';

const paperService = new PaperV2Service();

/**
 * @route   POST /api/v2/upload
 * @desc    Upload a new paper
 * @access  Private (Admin only)
 */
export const v2UploadPaper = catchAsync(async (req: Request, res: Response) => {
	if (!req.file) {
		return res.status(400).send({ message: 'No file uploaded' });
	}

	if (!req.user) {
		return res.status(401).send({ message: 'Unauthorized' });
	}

	const { programmeName, semester, assessmentType, courseTitle } = req.body;

	const input = {
		file: req.file,
		userId: req.user._id.toString(),
		programmeName,
		semester,
		assessmentType,
		courseTitle,
	};

	paperService.validateCreateInput(input);
	const paper = await paperService.createPaper(input);

	return res
		.status(201)
		.send({ message: 'Paper uploaded', paperId: paper._id });
});

/**
 * @route   GET /api/v2/papers
 * @desc    List all papers with optional filtering & pagination
 * @access  Public
 */
export const v2GetAllPapers = catchAsync(
	async (req: Request, res: Response) => {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;
		const { programmeName, semester, assessmentType, courseTitle } = req.query;

		const input = {
			page,
			limit,
			programmeName: programmeName as string | undefined,
			semester: semester as string | undefined,
			assessmentType: assessmentType as string | undefined,
			courseTitle: courseTitle as string | undefined,
		};

		paperService.validateListInput(input);
		const result = await paperService.listPapers(input);

		return res.status(200).send(result);
	}
);

/**
 * @route   GET /api/v2/paper/:paperId
 * @desc    Get a single paper's metadata by ID
 * @access  Private
 */
export const v2GetPaper = catchAsync(async (req: Request, res: Response) => {
	const paperId = req.params.paperId as string;

	if (!paperId) {
		return res.status(400).send({ message: 'Paper ID is required' });
	}

	const paper = await paperService.getPaperMetadataById(paperId);

	return res.status(200).send(paper);
});

/**
 * @route   GET /api/v2/paper/view/:paperId
 * @desc    View/stream a paper inline (increments view count)
 * @access  Private
 */
export const v2ViewPaper = catchAsync(async (req: Request, res: Response) => {
	const paperId = req.params.paperId as string;

	if (!paperId) {
		return res.status(400).send({ message: 'Paper ID is required' });
	}

	const paper = await paperService.getPaperById(paperId);

	paper.views += 1;
	await paper.save();

	res.setHeader(
		'Content-Disposition',
		`inline; filename="${paper.originalname}"`
	);
	res.setHeader('Content-Type', `${paper.mimetype}`);

	return res.send(paper.buffer);
});

/**
 * @route   GET /api/v2/paper/suggestions
 * @desc    Search suggestions for papers by course title
 * @access  Private
 */
export const v2GetSuggestions = catchAsync(
	async (req: Request, res: Response) => {
		const { query } = req.query;

		if (!query || typeof query !== 'string') {
			return res.status(400).send({ message: 'Search query is required' });
		}

		const limit = parseInt(req.query.limit as string) || 10;
		const suggestions = await paperService.searchPapers(query, limit);

		return res.status(200).send({ suggestions });
	}
);

/**
 * @route   POST /api/v2/paper/sort
 * @desc    Filter/sort papers by programme, semester, assessmentType
 * @access  Private
 */
export const v2SortPapers = catchAsync(async (req: Request, res: Response) => {
	const { programmeName, semester, assessmentType } = req.body;

	const query: Record<string, unknown> = {};
	if (programmeName) query.programmeName = programmeName;
	if (semester) query.semester = semester;
	if (assessmentType) query.assessmentType = assessmentType;

	const page = parseInt(req.body.page as string) || 1;
	const limit = parseInt(req.body.limit as string) || 20;

	const input = {
		page,
		limit,
		programmeName: programmeName as string | undefined,
		semester: semester as string | undefined,
		assessmentType: assessmentType as string | undefined,
	};

	paperService.validateListInput(input);
	const result = await paperService.listPapers(input);

	if (result.papers.length === 0) {
		return res.status(404).send({
			message: 'No papers found. Try different filters.',
			papers: [],
			total: 0,
		});
	}

	return res.status(200).send(result);
});

/**
 * @route   PUT /api/v2/paper/edit/:id
 * @desc    Update a paper's metadata and/or file
 * @access  Private (Admin only)
 */
export const v2EditPaper = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;

	if (!id) {
		return res.status(400).send({ message: 'Paper ID is required' });
	}

	if (!req.user) {
		return res.status(401).send({ message: 'Unauthorized' });
	}

	const { semester, assessmentType, courseTitle, programmeName } = req.body;

	const input = {
		semester,
		assessmentType,
		courseTitle,
		programmeName,
		file: req.file,
		userId: req.user._id.toString(),
	};

	paperService.validateUpdateInput(input);
	const updatedPaper = await paperService.updatePaper(id as string, input);

	return res
		.status(200)
		.send({ message: 'Paper updated successfully', paper: updatedPaper });
});

/**
 * @route   DELETE /api/v2/paper/delete/:id
 * @desc    Delete a paper by ID
 * @access  Private (Admin only)
 */
export const v2DeletePaper = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;

	if (!id) {
		return res.status(400).send({ message: 'Paper ID is required' });
	}

	await paperService.deletePaper(id);

	return res.status(200).send({ message: 'Paper deleted successfully' });
});
