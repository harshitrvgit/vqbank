/**
 * Node modules
 */
const express = require("express");
const morgan = require("morgan");

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

app.use(morgan("dev"));

/**
 * Routes middlewares
 */
app.use("/api/v1/users", userRouter);

/**
 * Home route
 */
app.route("/").get((req, res)=>{
    return res.status(200).send({message: "Hello world!"});
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