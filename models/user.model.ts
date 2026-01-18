import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import bcrypt from 'bcrypt';

interface IUserProps {
	email: string;
	verified: boolean;
	password?: string;
	role: 'ROLE_USER' | 'ROLE_ADMIN';
	otp?: string;
	purchasedPapers: Types.ObjectId[];
	// Adding tokens based on usage in protect middleware
	tokens: { token: string }[];
	createdAt: Date;
	updatedAt: Date;
}

interface IUserMethods {
	checkPassword(password: string): Promise<boolean>;
	checkOTP(otp: string): Promise<boolean>;
}

export interface IUser extends IUserProps, Document, IUserMethods {}

type UserModel = Model<IUser, object, IUserMethods>;

const opts = { toJSON: { virtuals: true } };

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
	{
		email: {
			type: String,
			required: [true, 'Please add an email'],
			unique: true,
			trim: true,
			lowercase: true,
		},
		verified: {
			type: Boolean,
			default: false,
		},
		password: {
			type: String,
			// required: [true, "Please add the password"],
			trim: true,
		},
		role: {
			type: String,
			default: 'ROLE_USER',
			enum: ['ROLE_USER', 'ROLE_ADMIN'],
		},
		otp: {
			type: String,
			trim: true,
		},
		purchasedPapers: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Paper',
			},
		],
		tokens: [
			{
				token: {
					type: String,
					required: true,
				},
			},
		],
	},
	{
		timestamps: true,
		...opts,
	}
);

userSchema.pre('save', async function () {
	if (this.isModified('password') && this.password) {
		const hash = await bcrypt.hash(this.password, 8);
		this.password = hash;
	}
	if (this.isModified('otp') && this.otp) {
		const otpHash = await bcrypt.hash(this.otp, 8);
		this.otp = otpHash;
	}
});

userSchema.methods.checkPassword = function (
	password: string
): Promise<boolean> {
	const passwordHash = this.password;
	return new Promise((resolve, reject) => {
		if (!passwordHash) return reject(new Error('No password set for user'));
		bcrypt.compare(password, passwordHash, (err, same) => {
			if (err) {
				return reject(err);
			}
			resolve(same);
		});
	});
};

userSchema.methods.checkOTP = function (otp: string): Promise<boolean> {
	const otpHash = this.otp;
	return new Promise((resolve, reject) => {
		if (!otpHash) return reject(new Error('No OTP set for user'));
		bcrypt.compare(otp, otpHash, (err, same) => {
			if (err) {
				return reject(err);
			}
			resolve(same);
		});
	});
};

userSchema.virtual('papers', {
	ref: 'Paper',
	localField: '_id',
	foreignField: 'user',
});

const User = mongoose.model<IUser, UserModel>('User', userSchema);

export default User;
