const mongoose = require('mongoose');

const Schema = mongoose.Schema
const relationshipSchema = new Schema({
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
  accepted:  {
    type: Boolean,
    default: false
  },

}, { collection: 'relationship' });

const Relationship = mongoose.model('relationship', relationshipSchema)
module.exports = Relationship
