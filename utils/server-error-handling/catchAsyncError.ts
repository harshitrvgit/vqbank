import { Request, Response, NextFunction } from 'express';

type AsyncMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
) => Promise<unknown>;

/**
 * @description - This function is uses to handle the async errors.
 *
 * @param {async function} f - The async function
 * @returns {function} - The middleware function
 */
const catchAsync = (f: AsyncMiddleware) => {
	return function (req: Request, res: Response, next: NextFunction) {
		f(req, res, next).catch((e: unknown) => next(e));
	};
};

export default catchAsync;
