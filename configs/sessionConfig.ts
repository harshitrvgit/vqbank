import MongoStore from 'connect-mongo';
import { SessionOptions } from 'express-session';

const sessionConfig: SessionOptions = {
	secret: process.env.SIGN_COOKIE as string,
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
		maxAge: 1000 * 60 * 60 * 24 * 7,
	},
	store: MongoStore.create({
		mongoUrl: process.env.MONGODB_URI as string,
		touchAfter: 24 * 60 * 60,
	}),
};

export default sessionConfig;
