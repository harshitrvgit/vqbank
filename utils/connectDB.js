const mongoose = require("mongoose");

/**
 * @description: Connect to the database by providing the connection string.
 * @param {String} uri | MongoDB URI
 * @default: mongodb://localhost:27017/auctionDB
 *
 * @returns {undefined}
 */
const connectDB = async (url = process.env.MONGODB_URI) => {
    try {
        const con = await mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        if (con) console.log("Connected to db --> " + con.connections[0].name);
        else throw new Error("Connection to db failed!");
    } catch (e) {
        console.error(`Error: ${e}`);
    }
};

module.exports = connectDB;