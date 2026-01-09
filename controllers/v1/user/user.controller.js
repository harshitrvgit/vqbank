/**
 * Utils
 */
import catchAsync from '../../../utils/server-error-handling/catchAsyncError.js';

/**
 * @description - Renders vqbank index page.
 */
export const renderVqbank = catchAsync(async (req, res) => {
	return res.render('vqbank/index');
});
