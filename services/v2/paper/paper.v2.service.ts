import Paper from '@/models/paper.model.js';
import AppError from '@/utils/server-error-handling/AppError.js';

interface CreatePaperInput {
	file: Express.Multer.File;
	userId: string;
	programmeName: string;
	semester: string;
	assessmentType: string;
	courseTitle: string;
}

interface ListPapersInput {
	page: number;
	limit: number;
	programmeName?: string;
	semester?: string;
	assessmentType?: string;
	courseTitle?: string;
}

interface UpdatePaperInput {
	semester?: string;
	assessmentType?: string;
	courseTitle?: string;
	programmeName?: string;
	file?: Express.Multer.File;
	userId: string;
}

export class PaperV2Service {
	static programmeNames = ['mca', 'btech', 'mtech', 'msc', 'other'];
	static semesters = ['fall-sem', 'winter-sem', 'summer-sem', 'other'];
	static assessmentTypes = [
		'cat-1',
		'cat-2',
		'mid-term',
		'fat',
		're-fat',
		're-cat',
		'other',
	];

	validateCreateInput(input: CreatePaperInput): void {
		const { programmeName, semester, assessmentType, courseTitle } = input;

		if (
			!programmeName ||
			!PaperV2Service.programmeNames.includes(programmeName)
		) {
			throw new AppError('Invalid programmeName', 400);
		}
		if (!semester || !PaperV2Service.semesters.includes(semester)) {
			throw new AppError('Invalid semester', 400);
		}
		if (
			!assessmentType ||
			!PaperV2Service.assessmentTypes.includes(assessmentType)
		) {
			throw new AppError('Invalid assessmentType', 400);
		}
		if (!courseTitle || courseTitle.trim().length === 0) {
			throw new AppError('courseTitle is required', 400);
		}
		if (courseTitle.length > 75) {
			throw new AppError('courseTitle must be within 75 characters', 400);
		}
	}

	async createPaper(input: CreatePaperInput) {
		const existingPaper = await Paper.findOne({
			buffer: input.file.buffer,
		}).select('_id');

		if (existingPaper) {
			throw new AppError('Paper already exists', 409);
		}

		const paper = new Paper({
			...input.file,
			user: input.userId,
			programmeName: input.programmeName,
			semester: input.semester,
			assessmentType: input.assessmentType,
			courseTitle: input.courseTitle,
		});

		await paper.save();
		return paper;
	}

	validateListInput(input: ListPapersInput): void {
		const { page, limit } = input;

		if (!Number.isFinite(page) || page < 1) {
			throw new AppError('page must be >= 1', 400);
		}
		if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
			throw new AppError('limit must be between 1 and 100', 400);
		}
		if (
			input.programmeName &&
			!PaperV2Service.programmeNames.includes(input.programmeName)
		) {
			throw new AppError('Invalid programmeName', 400);
		}
		if (input.semester && !PaperV2Service.semesters.includes(input.semester)) {
			throw new AppError('Invalid semester', 400);
		}
		if (
			input.assessmentType &&
			!PaperV2Service.assessmentTypes.includes(input.assessmentType)
		) {
			throw new AppError('Invalid assessmentType', 400);
		}
	}

	async listPapers(input: ListPapersInput) {
		const query: Record<string, unknown> = {};

		if (input.programmeName) query.programmeName = input.programmeName;
		if (input.semester) query.semester = input.semester;
		if (input.assessmentType) query.assessmentType = input.assessmentType;
		if (input.courseTitle)
			query.courseTitle = { $regex: new RegExp(input.courseTitle, 'i') };

		const skip = (input.page - 1) * input.limit;

		const [papers, total] = await Promise.all([
			Paper.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(input.limit)
				.select('-__v -buffer'),
			Paper.countDocuments(query),
		]);

		return { papers, total, page: input.page, limit: input.limit };
	}

	async getPaperById(paperId: string) {
		const paper = await Paper.findById(paperId);
		if (!paper) {
			throw new AppError('Paper not found', 404);
		}
		return paper;
	}

	async getPaperMetadataById(paperId: string) {
		const paper = await Paper.findById(paperId).select('-buffer -__v');
		if (!paper) {
			throw new AppError('Paper not found', 404);
		}
		return paper;
	}

	async searchPapers(query: string, limit: number = 10) {
		if (!query || query.trim().length === 0) {
			throw new AppError('Search query is required', 400);
		}

		const suggestions = await Paper.find({
			courseTitle: { $regex: new RegExp(query, 'i') },
		})
			.select(
				'mimetype size user views semester assessmentType courseTitle programmeName'
			)
			.limit(limit);

		return suggestions;
	}

	validateUpdateInput(input: UpdatePaperInput): void {
		if (
			input.programmeName &&
			!PaperV2Service.programmeNames.includes(input.programmeName)
		) {
			throw new AppError('Invalid programmeName', 400);
		}
		if (input.semester && !PaperV2Service.semesters.includes(input.semester)) {
			throw new AppError('Invalid semester', 400);
		}
		if (
			input.assessmentType &&
			!PaperV2Service.assessmentTypes.includes(input.assessmentType)
		) {
			throw new AppError('Invalid assessmentType', 400);
		}
		if (input.courseTitle && input.courseTitle.length > 75) {
			throw new AppError('courseTitle must be within 75 characters', 400);
		}
	}

	async updatePaper(paperId: string, input: UpdatePaperInput) {
		const paper = await Paper.findById(paperId);
		if (!paper) {
			throw new AppError('Paper not found', 404);
		}

		const updateOps: Record<string, unknown> = {};

		if (input.semester && input.semester !== paper.semester) {
			updateOps.semester = input.semester;
		}
		if (input.assessmentType && input.assessmentType !== paper.assessmentType) {
			updateOps.assessmentType = input.assessmentType;
		}
		if (input.courseTitle && input.courseTitle !== paper.courseTitle) {
			updateOps.courseTitle = input.courseTitle;
		}
		if (input.programmeName && input.programmeName !== paper.programmeName) {
			updateOps.programmeName = input.programmeName;
		}

		// Check if a new file was uploaded
		if (
			input.file?.buffer &&
			Buffer.compare(input.file.buffer, paper.buffer) !== 0
		) {
			updateOps.fieldname = input.file.fieldname;
			updateOps.originalname = input.file.originalname;
			updateOps.encoding = input.file.encoding;
			updateOps.mimetype = input.file.mimetype;
			updateOps.buffer = input.file.buffer;
			updateOps.size = input.file.size;
		}

		// Update user reference if different
		if (input.userId && input.userId !== paper.user.toString()) {
			updateOps.user = input.userId;
		}

		if (Object.keys(updateOps).length === 0) {
			return paper;
		}

		const updatedPaper = await Paper.findByIdAndUpdate(
			paperId,
			{ $set: updateOps },
			{ new: true, runValidators: true }
		).select('-buffer -__v');

		if (!updatedPaper) {
			throw new AppError('Paper not found', 404);
		}

		return updatedPaper;
	}

	async deletePaper(paperId: string) {
		const paper = await Paper.findByIdAndDelete(paperId);
		if (!paper) {
			throw new AppError('Paper not found', 404);
		}
		return paper;
	}
}
