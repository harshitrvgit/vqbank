/**
 * Node modules
 */
const express = require("express");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");
const path = require("path");
const flash = require("connect-flash");
const session = require("express-session");

/**
 * Utils
 */
const connectDB = require("./utils/connectDB.js");

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
const userRouter = require("./router/v1/user/user.auth.router.js");
const v2UserRouter = require("./router/v2/user/user.v2.auth.router.js");

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
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session(sessionConfig));
app.use(flash());
app.use(async (req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});
/**
 * Routes middlewares
 */
app.use("/api/v1", userRouter);
app.use("/api/v2", v2UserRouter);

/**
 * Landing page route
 */
app.route("/").get((req, res) => {
    return res.render("landing");
});

/**
 * Home route
 */
app.route("/vqbank").get((req, res) => {
    return res.render("vqbank/index");
});

/**
 * Sever status
 */
app.route("/status").get((req, res) => {
    res.status(200).send({ message: "Server is running" });
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