const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const conversationSchema = new Schema({
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


}, { collection: 'conversation' });

module.exports = mongoose.model('Conversation', conversationSchema);
