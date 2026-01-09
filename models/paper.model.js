import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const paperSchema = new Schema(
	{
		fieldname: {
			type: String,
		},
		originalname: {
			type: String,
			required: true,
		},
		encoding: {
			type: String,
		},
		mimetype: {
			type: String,
		},
		buffer: {
			type: Buffer,
			required: true,
		},
		size: {
			type: Number,
			required: true,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		views: {
			type: Number,
			default: 0,
		},
		semester: {
			type: String,
			required: true,
		},
		assessmentType: {
			type: String,
			required: true,
		},
		courseTitle: {
			type: String,
			required: true,
		},
		programmeName: {
			type: String,
			required: true,
		},
		visibility: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	}
);

const Paper = mongoose.model('Paper', paperSchema);

export default Paper;
