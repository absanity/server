const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); //call to hash password and not store it directly in the database
const SALT_WORK_FACTOR = 10; // used for hashing the password
const Schema = mongoose.Schema
const userSchema = new Schema({
  email: {
    type: String,
    lowercase: true,
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
  name: {
    type: String,
    required: true,
  },
  surname: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  gender: {
    type: Number,
    required: true
  },
  preferences: {
    type: Object,
  },
  summary: {
    type: String,
    required: true
  },
  role: {
    type: Number,
    default: 1
  },
  avatar: String
});
/// METHODS FOR THE HASHED PASSWORD ///
//execute this method just before saving the user in the database
userSchema.pre('save', function (next) {
  var user = this;

//Only hash the password if modified or new
  if(!user.isModified('password')) return next();

//Generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
    if(err) return next(err);
    //Hash the password using the salt
    bcrypt.hash(user.password, salt, function(err, hash){
      user.password = hash;
      next();
    });
  });
});


userSchema.methods.comparePassword = function(candidatePassword, callback){
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch){
    if(err) return callback(err);
    callback(undefined, isMatch);
  })
}

/*
/// CONNECTION
userSchema.methods.generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password){
  return bcrypt.compareSync(password, this.password);
}
*/
const User = mongoose.model('user', userSchema, 'users')
module.exports = User//export for the file user, with the schema for a user and the name of the collection created in mlab
