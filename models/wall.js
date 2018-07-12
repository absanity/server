const mongoose = require('mongoose');

const Schema = mongoose.Schema
const wallSchema = new Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  created:  {
    type: Date,
    default: Date.now
  },
  userId:  {
    type: String,
    required: true,
    trim: true
  },
  user: { type: Schema.Types.ObjectId, ref: 'user' }

}, { collection: 'wall' });

const Wall = mongoose.model('wall', wallSchema)
module.exports = Wall
