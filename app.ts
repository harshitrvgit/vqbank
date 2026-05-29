/**
 * Node modules (ESM)
 */
import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import ejsMate from 'ejs-mate';
import path from 'node:path';
import flash from 'connect-flash';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
/**
 * Utils
 */
import connectDB from '@/utils/connectDB.js';
import AppError from '@/utils/server-error-handling/AppError.js';
import { getLoggedInUser } from '@/utils/getLoggedInUser.js';
import catchAsync from '@/utils/server-error-handling/catchAsyncError.js';
import Paper from '@/models/paper.model.js';
/**
 * Configs
 */
import sessionConfig from '@/configs/sessionConfig.js';
/**
 * Declarations
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
// Sit behind nginx on loopback (Cloudflare tunnel → nginx → app). Trust
// X-Forwarded-For only from 127.0.0.1 so req.ip resolves to the real client.
app.set('trust proxy', 'loopback');
const PORT = process.env.PORT || 3000;
const SITE_URL = process.env.SITE_URL || 'https://vqbank.harshitrv.in';

const escapeXml = (value: unknown) =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

/**
 * Routes imports
 */
import adminRouter from '@/router/v1/admin/admin.router.js';
import userRouter from '@/router/v1/user/user.router.js';

import userAuthRouter from '@/router/v1/user/user.auth.router.js';
import v2UserAuthRouter from '@/router/v2/user/user.v2.auth.router.js';

import paperRouter from '@/router/v1/paper/paper.router.js';

//
/** Stripe webhook requests **/
//
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(session(sessionConfig));
app.use(flash());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(cookieParser(process.env.SIGN_COOKIE));
app.use(async (req: Request, res: Response, next: NextFunction) => {
	res.locals.user = await getLoggedInUser(req);
	res.locals.success = req.flash('success');
	res.locals.error = req.flash('error');
	res.locals.siteUrl = SITE_URL;
	res.locals.originalUrl = req.originalUrl.split('?')[0];
	res.locals.canonicalUrl = `${SITE_URL}${res.locals.originalUrl}`;
	res.locals.title = 'vqBank - VIT Question Papers';
	res.locals.description =
		'Browse and download VIT Vellore previous year question papers by course, programme, semester, and exam type.';
	res.locals.metaRobots = 'index,follow';
	res.locals.structuredData = null;
	next();
});

app.route('/robots.txt').get((_req: Request, res: Response) => {
	res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /api/v1/login
Disallow: /api/v1/register
Disallow: /api/v1/logout
Disallow: /api/v1/upload
Disallow: /api/v1/paper/view/
Disallow: /api/v1/paper/edit/
Disallow: /api/v1/paper/delete/
Disallow: /upload
Disallow: /paper/edit/
Disallow: /paper/delete/

Sitemap: ${SITE_URL}/sitemap.xml
`);
});

app.route('/sitemap.xml').get(
	catchAsync(async (_req: Request, res: Response) => {
		const papers = await Paper.find({ visibility: true })
			.select('_id updatedAt')
			.sort({ updatedAt: -1 })
			.limit(50000);

		const staticUrls = [
			{ loc: `${SITE_URL}/landing`, priority: '1.0' },
			{ loc: `${SITE_URL}/papers`, priority: '0.9' },
		];

		const paperUrls = papers.map((paper) => ({
			loc: `${SITE_URL}/paper/view/${paper._id}`,
			lastmod: paper.updatedAt.toISOString(),
			priority: '0.6',
		}));

		const urls = [...staticUrls, ...paperUrls]
			.map(
				(url) => `<url>
	<loc>${escapeXml(url.loc)}</loc>${'lastmod' in url ? `
	<lastmod>${escapeXml(url.lastmod)}</lastmod>` : ''}
	<priority>${url.priority}</priority>
</url>`
			)
			.join('\n');

		res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
	})
);
/**
 * Routes middlewares
 */
app.use('/api/v1', adminRouter);
app.use('/api/v1', userRouter);

app.use('/api/v1', userAuthRouter);
app.use('/api/v2', v2UserAuthRouter);

app.use('/api/v1', paperRouter);
app.use('/', paperRouter);

/**
 * Landing page route
 */
app.route('/landing').get(async (_req: Request, res: Response) => {
	res.locals.title = 'vqBank - VIT Vellore Previous Year Question Papers';
	res.locals.description =
		'Search, browse, and download VIT Vellore question papers for CAT, FAT, re-FAT, and other assessments.';
	res.locals.canonicalUrl = `${SITE_URL}/landing`;
	res.locals.structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'vqBank',
		url: SITE_URL,
		description: res.locals.description,
	};

	return res.render('landing');
});

app.route('/').get(async (req: Request, res: Response) => {
	if (req.signedCookies && req.signedCookies.token) {
		return res.redirect('/papers');
	}

	res.locals.title = 'vqBank - VIT Vellore Previous Year Question Papers';
	res.locals.description =
		'Search, browse, and download VIT Vellore question papers for CAT, FAT, re-FAT, and other assessments.';
	res.locals.canonicalUrl = `${SITE_URL}/`;
	res.locals.structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'vqBank',
		url: SITE_URL,
		description: res.locals.description,
	};

	return res.render('landing');
});

/**
 * Sever status
 */
app.route('/status').get((req: Request, res: Response) => {
	res.status(200).json({ message: 'Server is running' });
});

/**
 * If none of the routes matches.
 */
app.all(/(.*)/, (req: Request, res: Response, next: NextFunction) => {
	next(new AppError('This page does not exist or unavailable.', 404));
});

/**
 * Default error handling middleware.
 */
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
	let statusCode = 500;
	let message = 'Something went wrong';
	let name = 'Error';

	if (err instanceof AppError) {
		statusCode = err.statusCode;
		message = err.message;
		name = err.name;
	} else if (err instanceof Error) {
		message = err.message;
		name = err.name;
	}

	// Check if err is an object with statusCode (for libraries that throw plain objects)
	if (
		typeof err === 'object' &&
		err !== null &&
		'statusCode' in err &&
		typeof (err as Record<string, unknown>).statusCode === 'number'
	) {
		statusCode = (err as { statusCode: number }).statusCode;
	}

	//! Refactoring required
	if (statusCode === 415) {
		req.flash('error', message);
		return res.redirect('/api/v1/upload');
	}
	if (name === 'MulterError') {
		req.flash('error', message);
		return res.redirect('/api/v1/upload');
	}
	if (name === 'AggregateError') {
		req.flash('error', 'You are offline. Check your network.');
		return res.redirect('/api/v1/login');
	}
	//! --------------------------------------------

	res.render('error', { statusCode, message });
});

const runServer = async () => {
	try {
		// If you feel like removing await on next line then don't.
		await connectDB();
		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT} 🔥`);
		});
	} catch (e) {
		console.log(`Error: ${e}`);
		process.exit(1);
	}
};

runServer();
