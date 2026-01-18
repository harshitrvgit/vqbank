import { Request, Response } from 'express';
import catchAsync from '@/utils/server-error-handling/catchAsyncError.js';

export const renderVqbank = catchAsync(async (req: Request, res: Response) => {
	return res.render('vqbank/index');
});
