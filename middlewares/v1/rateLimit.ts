import rateLimit from 'express-rate-limit';

// NOTE: ecosystem.config.cjs runs pm2 in cluster mode (instances: 'max'),
// and the default in-memory store is per-worker — each worker keeps its own
// counter, so a single IP effectively gets `limit × cores` requests before
// being throttled. Acceptable for modest personal traffic; swap to
// rate-limit-mongo (Mongo already in the stack) or rate-limit-redis when
// you need a globally consistent counter.
//
// trust proxy is set to 'loopback' in app.ts so req.ip resolves to the
// real client behind nginx instead of 127.0.0.1.

export const generalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 300,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	message: 'Too many requests, please try again later.',
});

export const downloadLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 60,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	message: 'Too many downloads, please try again later.',
});
