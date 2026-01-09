/**
 * Node modules (ESM)
 */
import express from 'express';
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
import connectDB from './utils/connectDB.js';
import AppError from './utils/server-error-handling/AppError.js';
import { getLoggedInUser } from './utils/getLoggedInUser.js';
/**
 * Configs
 */
import sessionConfig from './configs/sessionConfig.js';
/**
 * Declarations
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Routes imports
 */
import adminRouter from './router/v1/admin/admin.router.js';
import userRouter from './router/v1/user/user.router.js';

import userAuthRouter from './router/v1/user/user.auth.router.js';
import v2UserAuthRouter from './router/v2/user/user.v2.auth.router.js';

import paperRouter from './router/v1/paper/paper.router.js';

//
/** Stripe webhook requests **/
//
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(session(sessionConfig));
app.use(flash());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(cookieParser(process.env.SIGN_COOKIE));
app.use(async (req, res, next) => {
	res.locals.user = await getLoggedInUser(req, res);
	res.locals.success = req.flash('success');
	res.locals.error = req.flash('error');
	next();
});
/**
 * Routes middlewares
 */
app.use('/api/v1', adminRouter);
app.use('/api/v1', userRouter);

app.use('/api/v1', userAuthRouter);
app.use('/api/v2', v2UserAuthRouter);

app.use('/api/v1', paperRouter);

/**
 * Landing page route
 */
app.route('/').get(async (req, res) => {
	if (req.signedCookies && req.signedCookies.token) {
		return res.redirect('/api/v1/papers');
	}
	return res.render('landing');
});

/**
 * Sever status
 */
app.route('/status').get((req, res) => {
	res.status(200).json({ message: 'Server is running' });
});

/**
 * If none of the routes matches.
 */
app.all('*', (req, res, next) => {
	next(new AppError('This page does not exist or unavailable.', 404));
});

/**
 * Default error handling middleware.
 */
app.use((err, req, res, next) => {
	const { statusCode = 500, message = 'Something went wrong', stack } = err;

	//! Refactoring required
	if (statusCode === 415) {
		req.flash('error', message);
		return res.redirect('/api/v1/upload');
	}
	if (err.name === 'MulterError') {
		req.flash('error', err.message);
		return res.redirect('/api/v1/upload');
	}
	if (err.name === 'AggregateError') {
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
