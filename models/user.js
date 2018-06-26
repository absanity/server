const mongoose = require('mongoose');

const Schema = mongoose.Schema
const userSchema = new Schema({
  email: String,
  password: String
})
module.exports = mongoose.model('user', userSchema, 'users')//export for the file user, with the schema for a user and the name of the collection created in mlab
