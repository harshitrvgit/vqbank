import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { Request } from 'express';

/**
 * Mock jwt utils and User model so getLoggedInUser can be tested in isolation.
 */
vi.mock('./jwt.js', () => ({
	verifyToken: vi.fn(),
}));

vi.mock('@/models/user.model.js', () => ({
	default: {
		findById: vi.fn(),
	},
}));

import { getLoggedInUser } from './getLoggedInUser.js';
import { verifyToken } from './jwt.js';
import User from '@/models/user.model.js';

/**
 * Helper to create a mock Request with signed cookies.
 */
const mockReq = (signedCookies: Record<string, string> = {}): Request =>
	({
		signedCookies,
	}) as unknown as Request;

beforeAll(() => {
	process.env.JWT_SECRET = 'vitest-secret-key-for-testing';
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getLoggedInUser', () => {
	it('should return undefined when no signed cookies exist', async () => {
		const req = mockReq({});
		const result = await getLoggedInUser(req);
		expect(result).toBeUndefined();
	});

	it('should return undefined when token cookie is empty', async () => {
		const req = mockReq({ token: '' });
		const result = await getLoggedInUser(req);
		expect(result).toBeUndefined();
	});

	it('should return undefined when verifyToken returns null', async () => {
		vi.mocked(verifyToken).mockResolvedValue(undefined);
		const req = mockReq({ token: 'some-jwt-token' });

		const result = await getLoggedInUser(req);
		expect(result).toBeUndefined();
	});

	it('should return undefined when verifyToken returns a string', async () => {
		vi.mocked(verifyToken).mockResolvedValue('just-a-string');
		const req = mockReq({ token: 'some-jwt-token' });

		const result = await getLoggedInUser(req);
		expect(result).toBeUndefined();
	});

	it('should return undefined when payload has no id field', async () => {
		vi.mocked(verifyToken).mockResolvedValue({ sub: '123', iat: 123 });
		const req = mockReq({ token: 'some-jwt-token' });

		const result = await getLoggedInUser(req);
		expect(result).toBeUndefined();
	});

	it('should return undefined when the user is not found in DB', async () => {
		vi.mocked(verifyToken).mockResolvedValue({ id: 'user-123', iat: 123 });
		const selectMock = vi.fn().mockResolvedValue(null);
		vi.mocked(User.findById).mockReturnValue({ select: selectMock } as any);

		const req = mockReq({ token: 'valid-token' });
		const result = await getLoggedInUser(req);

		expect(result).toBeUndefined();
	});

	it('should return the user when token and DB lookup succeed', async () => {
		const fakeUser = {
			_id: 'user-123',
			email: 'test@example.com',
			role: 'ROLE_USER',
		};
		vi.mocked(verifyToken).mockResolvedValue({ id: 'user-123', iat: 123 });
		const selectMock = vi.fn().mockResolvedValue(fakeUser);
		vi.mocked(User.findById).mockReturnValue({ select: selectMock } as any);

		const req = mockReq({ token: 'valid-token' });
		const result = await getLoggedInUser(req);

		expect(result).toEqual(fakeUser);
		expect(User.findById).toHaveBeenCalledWith('user-123');
		expect(selectMock).toHaveBeenCalledWith('-password -tokens');
	});

	it('should return undefined when verifyToken throws', async () => {
		vi.mocked(verifyToken).mockRejectedValue(new Error('Invalid token'));
		const req = mockReq({ token: 'bad-token' });

		const result = await getLoggedInUser(req);
		expect(result).toBeUndefined();
	});

	it('should return undefined when User.findById throws', async () => {
		vi.mocked(verifyToken).mockResolvedValue({ id: 'user-123', iat: 123 });
		vi.mocked(User.findById).mockImplementation(() => {
			throw new Error('DB error');
		});

		const req = mockReq({ token: 'valid-token' });
		const result = await getLoggedInUser(req);

		expect(result).toBeUndefined();
	});
});
