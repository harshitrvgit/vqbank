import { describe, it, expect } from 'vitest';
import AppError from './AppError.js';

describe('AppError', () => {
	it('should be an instance of Error', () => {
		const err = new AppError('Not found', 404);
		expect(err).toBeInstanceOf(Error);
	});

	it('should set the message property', () => {
		const err = new AppError('Resource not found', 404);
		expect(err.message).toBe('Resource not found');
	});

	it('should set the statusCode property', () => {
		const err = new AppError('Unauthorized', 401);
		expect(err.statusCode).toBe(401);
	});

	it('should have a stack trace', () => {
		const err = new AppError('Internal error', 500);
		expect(err.stack).toBeDefined();
		expect(err.stack).toContain('AppError');
	});

	it('should work with different status codes', () => {
		const testCases = [
			{ message: 'Bad Request', code: 400 },
			{ message: 'Forbidden', code: 403 },
			{ message: 'Not Found', code: 404 },
			{ message: 'Server Error', code: 500 },
		];

		for (const { message, code } of testCases) {
			const err = new AppError(message, code);
			expect(err.message).toBe(message);
			expect(err.statusCode).toBe(code);
		}
	});

	it('should be catchable as an Error', () => {
		const fn = () => {
			throw new AppError('Test error', 500);
		};
		expect(fn).toThrow(Error);
	});
});
