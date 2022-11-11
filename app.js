/**
 * Node modules
 */
const express = require("express");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");
const path = require("path");

/**
 * Declarations
 */
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Routes imports
 */
const userRouter = require("./router/user/user.auth.router.js");

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
/**
 * Routes middlewares
 */
app.use("/api/v1/users", userRouter);

/**
 * Home route
 */
app.route("/vqbank").get((req, res)=>{
    return res.render("vqbank/index");
});

/**
 * Sever status
 */
app.route("/status").get((req, res) => {
    res.status(200).send({ message: "Server is running" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});