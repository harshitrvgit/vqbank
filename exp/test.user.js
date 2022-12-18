const mongoose = require("mongoose");
const User = require("../models/user.model.js");
const { createNewUser, findUser } = require("../playground/db.js");

const main = async () => {
    const { user } = await createNewUser();
    const paperId = "6379cd0fd445984cdd8e4d99";
    user.purchasedPapers = { paperId };
    await user.save();
    console.log("let's see: ", user.purchasedPapers);
    await mongoose.connection.close();
}

main();
// findUser();