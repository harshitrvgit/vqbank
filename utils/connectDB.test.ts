import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

/**
 * Mock mongoose before importing connectDB, so the real mongoose.connect
 * is never called during unit tests.
 */
vi.mock('mongoose', () => {
	return {
		default: {
			connect: vi.fn(),
		},
	};
});

import connectDB from './connectDB.js';
import mongoose from 'mongoose';

beforeAll(() => {
	// Suppress console output during tests
	vi.spyOn(console, 'log').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe('connectDB', () => {
	it('should call mongoose.connect with the provided URI', async () => {
		vi.mocked(mongoose.connect).mockResolvedValue({
			connections: [{ name: 'test-db' }],
		} as unknown as typeof mongoose);

		await connectDB('mongodb://localhost:27017/testdb');

		expect(mongoose.connect).toHaveBeenCalledWith(
			'mongodb://localhost:27017/testdb'
		);
	});

	it('should use process.env.MONGODB_URI as default', async () => {
		process.env.MONGODB_URI = 'mongodb://env-uri:27017/envdb';

		vi.mocked(mongoose.connect).mockResolvedValue({
			connections: [{ name: 'env-db' }],
		} as unknown as typeof mongoose);

		await connectDB();

		expect(mongoose.connect).toHaveBeenCalledWith(
			'mongodb://env-uri:27017/envdb'
		);
	});

	it('should resolve successfully when connection succeeds', async () => {
		vi.mocked(mongoose.connect).mockResolvedValue({
			connections: [{ name: 'success-db' }],
		} as unknown as typeof mongoose);

		await expect(
			connectDB('mongodb://localhost:27017/testdb')
		).resolves.toBeUndefined();
	});

	it('should throw when mongoose.connect fails', async () => {
		const dbError = new Error('Connection refused');
		vi.mocked(mongoose.connect).mockRejectedValue(dbError);

		await expect(connectDB('mongodb://localhost:27017/baddb')).rejects.toThrow(
			'Connection refused'
		);
	});

	it('should throw when mongoose.connect returns a falsy value', async () => {
		vi.mocked(mongoose.connect).mockResolvedValue(
			null as unknown as typeof mongoose
		);

		await expect(connectDB('mongodb://localhost:27017/testdb')).rejects.toThrow(
			'Connection to db failed!'
		);
	});
});
