import { describe, it, expect, beforeAll } from 'vitest';
import { newToken, verifyToken } from './jwt.js';

beforeAll(() => {
	process.env.JWT_SECRET = 'vitest-secret-key-for-testing';
	process.env.JWT_EXP = '1h';
});

describe('newToken', () => {
	it('should return a string token', () => {
		const token = newToken('user-123');
		expect(token).toBeTypeOf('string');
		expect(token.length).toBeGreaterThan(0);
	});

	it('should return a JWT with three dot-separated parts', () => {
		const token = newToken('user-456');
		const parts = token.split('.');
		expect(parts).toHaveLength(3);
	});

	it('should accept an object as payload', () => {
		const token = newToken({ userId: 'abc', role: 'admin' });
		expect(token).toBeTypeOf('string');
	});
});

describe('verifyToken', () => {
	it('should decode a valid token and return the payload', async () => {
		const token = newToken('user-789');
		const payload = await verifyToken(token);

		expect(payload).toBeDefined();
		expect(typeof payload).toBe('object');
		expect((payload as { id: string }).id).toBe('user-789');
	});

	it('should include standard JWT claims (iat, exp)', async () => {
		const token = newToken('user-claims');
		const payload = await verifyToken(token);

		expect(payload).toBeDefined();
		expect((payload as { iat: number }).iat).toBeTypeOf('number');
		expect((payload as { exp: number }).exp).toBeTypeOf('number');
	});

	it('should reject an invalid token', async () => {
		await expect(verifyToken('not.a.valid.token')).rejects.toThrow();
	});

	it('should reject a completely garbage string', async () => {
		await expect(verifyToken('garbage')).rejects.toThrow();
	});

	it('should reject a token signed with a different secret', async () => {
		// Temporarily change the secret to create a token with a different key
		const originalSecret = process.env.JWT_SECRET;
		process.env.JWT_SECRET = 'different-secret';
		const badToken = newToken('user-bad');
		process.env.JWT_SECRET = originalSecret;

		await expect(verifyToken(badToken)).rejects.toThrow();
	});
});

describe('newToken + verifyToken roundtrip', () => {
	it('should create and verify a token with a string id', async () => {
		const id = 'roundtrip-user-id';
		const token = newToken(id);
		const payload = await verifyToken(token);

		expect((payload as { id: string }).id).toBe(id);
	});

	it('should create and verify a token with an object id', async () => {
		const data = { userId: '123', role: 'admin' };
		const token = newToken(data);
		const payload = await verifyToken(token);

		expect((payload as { id: typeof data }).id).toEqual(data);
	});
});
