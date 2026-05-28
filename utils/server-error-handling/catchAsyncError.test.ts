import { describe, it, expect, vi } from 'vitest';
import catchAsync from './catchAsyncError.js';
import type { Request, Response, NextFunction } from 'express';

/**
 * Helper to create minimal mock Express objects.
 */
const mockReq = () => ({}) as Request;
const mockRes = () => ({}) as Response;

describe('catchAsync', () => {
	it('should return a function', () => {
		const wrapped = catchAsync(async () => {});
		expect(typeof wrapped).toBe('function');
	});

	it('should call the wrapped async function with req, res, next', async () => {
		const asyncFn = vi.fn().mockResolvedValue(undefined);
		const wrapped = catchAsync(asyncFn);

		const req = mockReq();
		const res = mockRes();
		const next = vi.fn() as unknown as NextFunction;

		wrapped(req, res, next);

		// Let the microtask queue flush
		await new Promise((r) => setTimeout(r, 0));

		expect(asyncFn).toHaveBeenCalledWith(req, res, next);
	});

	it('should call next(error) when the async function rejects', async () => {
		const error = new Error('async failure');
		const asyncFn = vi.fn().mockRejectedValue(error);
		const wrapped = catchAsync(asyncFn);

		const req = mockReq();
		const res = mockRes();
		const next = vi.fn() as unknown as NextFunction;

		wrapped(req, res, next);

		// Let the .catch() microtask resolve
		await new Promise((r) => setTimeout(r, 0));

		expect(next).toHaveBeenCalledWith(error);
	});

	it('should NOT call next when the async function resolves successfully', async () => {
		const asyncFn = vi.fn().mockResolvedValue('success');
		const wrapped = catchAsync(asyncFn);

		const req = mockReq();
		const res = mockRes();
		const next = vi.fn() as unknown as NextFunction;

		wrapped(req, res, next);

		await new Promise((r) => setTimeout(r, 0));

		expect(next).not.toHaveBeenCalled();
	});

	it('should forward different error types to next', async () => {
		const customError = { statusCode: 404, message: 'Not found' };
		const asyncFn = vi.fn().mockRejectedValue(customError);
		const wrapped = catchAsync(asyncFn);

		const req = mockReq();
		const res = mockRes();
		const next = vi.fn() as unknown as NextFunction;

		wrapped(req, res, next);

		await new Promise((r) => setTimeout(r, 0));

		expect(next).toHaveBeenCalledWith(customError);
	});
});
