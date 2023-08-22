const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const opts = { toJSON: { virtuals: true } }

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    trim: true,
    lowercase: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: [true, "Please add the password"],
    trim: true
  },
  role: {
    type: String,
    default: 'ROLE_USER',
    enum: ['ROLE_USER', 'ROLE_ADMIN']
  },
  otp: {
    type: String,
    trim: true
  },
  purchasedPapers:[
    {
      type: Schema.Types.ObjectId,
      ref: "Paper"
    }
  ]
},
  {
    timestamps: true
  }, opts);

/**
 * PRE
 * These funcitons will execute everytime "BEFORE" a document is saved in users collection
 * 
 * @param {string} -  mongoose command
 * @param {function} - middleware anonymous function
 * @returns {funciton} - next method stating return to the call stack
 * 
 * 
*/

/**
 * Before saving hash and salt the password if it has been modified.
 */
userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const hash = await bcrypt.hash(this.password, 8);
      this.password = hash;
    }
    if (this.isModified("otp")) {
      const otpHash = await bcrypt.hash(this.otp, 8);
      this.otp = otpHash;
    }

    next();
  } catch (err) {
    next(err);
  }
});


/**
* This function is attached to UserSchema, i.e. Every document would have access to this funciton, where
* it can validate the password hash using becrypt
* 
* @param {string}  user password
* @returns {Promise} - If does not match, returns rejecton and if matched, resolves the value
*/

/**
 * Compare the hashed password with the password provided.
 */
userSchema.methods.checkPassword = function (password) {
  const passwordHash = this.password;
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, passwordHash, (err, same) => {
      if (err) {
        return reject(err);
      }
      resolve(same);
    });
  });
}

userSchema.methods.checkOTP = function (otp) {
  const otpHash = this.otp;
  return new Promise((resolve, reject) => {
    bcrypt.compare(otp, otpHash, (err, same) => {
      if (err) {
        return reject(err);
      }
      resolve(same);
    });
  });
}

/**
 * @description - This is a virtual field, which is not stored in the database, but can be accessed
 */
userSchema.virtual('papers', {
  ref: 'Paper',
  localField: '_id',
  foreignField: 'user',
});

const User = mongoose.model('User', userSchema)

module.exports = User;