import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPaper extends Document {
	fieldname?: string;
	originalname: string;
	encoding?: string;
	mimetype?: string;
	buffer: Buffer;
	size: number;
	user: Types.ObjectId;
	views: number;
	semester: string;
	assessmentType: string;
	courseTitle: string;
	programmeName: string;
	visibility: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const paperSchema = new Schema<IPaper>(
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

const Paper = mongoose.model<IPaper>('Paper', paperSchema);

export default Paper;
