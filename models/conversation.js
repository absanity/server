const mongoose = require('mongoose');

const Schema = mongoose.Schema
const conversationSchema = new Schema({
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

}, { collection: 'conversation' });

const Conversation = mongoose.model('conversation', conversationSchema)
module.exports = Conversation
