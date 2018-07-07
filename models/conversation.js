const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const chatSchema = new Schema({
  room: String,
  pseudo: String,
  message: String,
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Chat', chatSchema);
