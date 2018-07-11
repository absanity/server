const mongoose = require('mongoose');

const Schema = mongoose.Schema
const wallSchema = new Schema({
  message: {
    type: String,
    required: true,
    trim: true
  }
}, { collection: 'wall' });

const Wall = mongoose.model('wall', wallSchema)
module.exports = Wall
