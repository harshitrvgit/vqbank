/**
 * Node modules
 */
const express = require("express");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");
const path = require("path");
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");

/**
 * Utils
 */
const connectDB = require("./utils/connectDB.js");
const AppError = require("./utils/server-error-handling/AppError.js");
const { getLoggedInUser } = require("./utils/getLoggedInUser.js");


/**
 * Configs
 */
const sessionConfig = require("./configs/sessionConfig.js");

/**
 * Declarations
 */
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Routes imports
 */
const adminRouter = require("./router/v1/admin/admin.router.js");
const userRouter = require("./router/v1/user/user.router.js");

const userAuthRouter = require("./router/v1/user/user.auth.router.js");
const v2UserAuthRouter = require("./router/v2/user/user.v2.auth.router.js");

const paperRouter = require("./router/v1/paper/paper.router.js");
const v2PaperRouter = require("./router/v2/paper/paper.v2.router.js");

/**
 * Middlewares
 */
//
/** Stripe webhook requests **/
//
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "node_modules/bootstrap/dist")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(process.env.SIGN_COOKIE));
app.use(session(sessionConfig));
app.use(flash());
app.use(async (req, res, next) => {
	res.locals.user = await getLoggedInUser(req, res);
	res.locals.success = req.flash("success");
	res.locals.error = req.flash("error");
	next();
});
/**
 * Routes middlewares
 */
app.use("/api/v1", adminRouter);
app.use("/api/v1", userRouter);

app.use("/api/v1", userAuthRouter);
app.use("/api/v2", v2UserAuthRouter);

app.use("/api/v1", paperRouter);
app.use("/api/v2", v2PaperRouter);

/**
 * Landing page route
 */
app.route("/").get((req, res) => {
	return res.render("landing");
});

/**
 * Sever status
 */
app.route("/status").get((req, res) => {
	res.status(200).send({ message: "Server is running" });
});

/**
 * If none of the routes matches.
 */
app.all("*", (req, res, next) => {
	next(new AppError("This page does not exist or unavailable.", 404));
});

/**
 * Default error handling middleware.
 */
app.use((err, req, res, next) => {
	const { statusCode = 500, message = "Something went wrong", stack } = err;

	//! Refactoring required
	if (statusCode === 415) {
		req.flash("error", message);
		return res.redirect("/api/v1/upload");
	}
	if (err.name === "MulterError") {
		req.flash("error", err.message);
		return res.redirect("/api/v1/upload");
	}
	//! --------------------------------------------

	res.render("error", { statusCode, message });
});

const runServer = async () => {
	try {
		await connectDB();
		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
		});
	} catch (e) {
		console.log(`Error: ${e}`);
	}
};

runServer();
