const mongoose = require('mongoose');

const Schema = mongoose.Schema
const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  pseudo: {
    type: String,
    required: true,
    unique: true
  },
  role: Number,
  avatar: String
})
module.exports = mongoose.model('User', userSchema, 'users')//export for the file user, with the schema for a user and the name of the collection created in mlab
