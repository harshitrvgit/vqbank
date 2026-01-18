import mongoose from 'mongoose';

/**
 * @description: Connect to the database by providing the connection string.
 * @param {String} uri | MongoDB URI
 * @default: mongodb://localhost:27017/vqbank
 *
 * @returns {undefined}
 */
const connectDB = async (
	uri: string = process.env.MONGODB_URI as string
): Promise<void> => {
	console.log('Connecting to db...⏱');
	try {
		const con = await mongoose.connect(uri);
		if (con)
			console.log('Connected to db -->' + con.connections[0].name + '  ✅ ');
		else throw new Error('Connection to db failed! ❌');
	} catch (e) {
		console.error(`Error in [connectDB]: ${e}`);
	}
};

export default connectDB;
