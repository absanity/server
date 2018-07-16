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
  userSourceId:  {
    type: String,
    trim: true,
    default: null
  },
  userTargetId:  {
    type: String,
    trim: true,
    default: null
  },
  userSource: { type: Schema.Types.ObjectId, ref: 'user', default: null },
  userTarget: { type: Schema.Types.ObjectId, ref: 'user', default: null },


}, { collection: 'wall' });

const Wall = mongoose.model('wall', wallSchema)
module.exports = Wall
