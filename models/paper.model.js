const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paperSchema = new Schema({
  fieldname: {
    type: String
  }, 
  originalname: {
    type: String,
    required: true
  },
  encoding: {
    type: String
  },
  mimetype: {
    type: String
  },
  buffer: {
    type: Buffer,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  downloads: {
    type: Number,
    default: 0
  }
},
  {
    timestamps: true
  })

const Paper = mongoose.model('Paper', paperSchema)

module.exports = Paper;