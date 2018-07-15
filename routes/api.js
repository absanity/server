///// GLOBAL PACKAGES /////
const express = require('express');
const router = express.Router();
const app = require('express')();
const server = require('http').Server(app); //protocole http pour démarrer avec socket io
const socket = require('socket.io')(server);
const mongodb = require('mongodb');//call to store messages in the database

///// AUTHENTICATION / SECURITY /////
const cfg = require('../config/config');//path to the mongo connection
const jwt = require('jsonwebtoken');//jsonwebtoken for authentication
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const mongoose = require('mongoose')
const db = "mongodb://Cotelette:a123456@ds141870.mlab.com:41870/socialnetwork"//cfg.db//api for connecting the database with the admin users

///// SCHEMAS /////
const User = require('../models/user')//call the Schema for a new user
const conversation = require('../models/conversation')// call the Schema for the conversation

///// SENDING MAIL /////
const mailer = require('../mail/nodemailer');//generic function for sending emails
const forgottenPassword =  require('../mail/forgottenPassword')//used for requesting a new Password
const subscriptionSuccess = require('../mail/subscriptionSuccess')//used to notify a new user that the account have been successfully created

///VARIABLES USED FOR THE CHAT APP///
let users;
let count;
let chatRooms;
let messagesArray = [];

///// GLOBAL CONNECTION TO MONGO DB /////
mongoose.connect(db, err => {
    if (err) {
        console.log(err)
    } else {
        console.log('connection to mongodb passed')//if the connection is alright, this is displayed into the terminal window
    }
})//end connection to mongo db

///// FUNCTION TO VERIFY TOKEN /////
//function to verify the token send from the browser
function verifyToken(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(401).send('Ooops, unauthorized request')
    }
    let token = req.headers.authorization.split(' ')[1]
    if (token === 'null') {
        return res.status(401).send('Ooops, unauthorized request')
    }
    let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid
    if (!payload) {
        return res.status(401).send('Ooops, unauthorized request')
    }// the variable payload is only valid if a value is set
    req.userId = payload.subject
    next()

}

///// GET ROUTES /////

//Default route
router.get('/', (req, res) => {
    res.send('From API route')
});

//HomePage routes
router.get('/home', (req, res) => {
    res.send('Hi')
})

//Profil Route
router.get('/profil', verifyToken, (req,res) => {
  var token = req.headers['x-access-token'];
  if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

  jwt.verify(token, config.secret, function(err, decoded) {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

    res.status(200).send(decoded);
  });
  /*
  let profil =
      {
        "email": "rourou@mail.com",
        "password": "123",
        "pseudo": "rourou",
        "role": 1,
        "avatar": "https://api.adorable.io/avatars/80/rourou"
      }
  res.json(profil)
  */
})

//Events route
router.get('/events', (req, res) => {
    let event = [
        {
            "_id": "1",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2018-05-21"
        },
        {
            "_id": "2",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2018-05-21"
        },
        {
            "_id": "3",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2018-05-21"
        },
        {
            "_id": "4",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2018-05-21"
        }
    ]
    res.json(event)
})

//Special events route
router.get('/special', verifyToken, (req, res) => {
    let event = [
        {
            "_id": "1",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2018-05-21"
        },
        {
            "_id": "2",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2018-05-21"
        },
        {
            "_id": "3",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2018-05-21"
        },
        {
            "_id": "4",
            "name": "Auto Expo",
            "description": "lorem ipsum",
            "date": "2018-05-21"
        }
    ]
    res.json(event)
});

///ROUTE FOR MESSAGES
router.get('/messages', (req, res) => {
  res.status(200);
  ///Connection to socket io
  io.on('connection', function(socket){
    console.log('user connected');

    socket.on('disconnect', function(){
      console.log('User disconnected');
    }); // end disconnect


  });//end connection socket io
})



///// POST ROUTES /////
//API FOR REGISTER
router.post('/register', (req, res) => {
    let userData = {
      email: req.body.email,
      password: req.body.password,
      pseudo: req.body.pseudo,
      role: 1,
      avatar: "https://api.adorable.io/avatars/80/" + req.body.pseudo
    }//extract the user data from the object front
    let user = new User(userData)//convert the userData into the model we specified in mongoose
    //console.log('hello')
    //console.log(userData)//object type with email and Password
//return;
    user.save((error, registerUser) => {
        if (error) {
            console.log(error.message)
            if(error.message == 'User validation failed: pseudo: Path `pseudo` is required.'){

            }
        } else {
            //console.log(registerUser)

            let payload = {subject: registerUser._id}
            let token = jwt.sign(payload, 'thisIsASecretKey')
            res.status(200).send({token})
            let subject = subscriptionSuccess.subject();
            let message = subscriptionSuccess.message();
            mailer.sendEmail(subject, message, user.email)
        }
    })//end save method for register someone
})//end post for register method
//////////////////////////////////////

//API FOR LOGIN
router.post('/login', (req, res) => {
    let userData = req.body//extract the user data when submitted

    User.findOne({// searching in the database for a user
        email: userData.email
    }, (error, user) => {
        if (error) {
            console.log(error)
        } else {
            if (!user) {//check if the user exists
                res.status(401).send('Invalid email')
            } else {
              console.log(user)
              console.log(userData.password)
              console.log(user.password)
              ///////MODIF WITH Hash
              /*
              user.comparePassword(user.password, function(err, isMatch){
                if(isMatch && isMatch == true){
                  console.log('comparison')
                  let payload = {subject: user._id}
                  let token = jwt.sign(payload, 'thisIsASecretKey')
                  res.status(200).send({token})
                }else{
                  res.status(401).send('Invalid password')
                }
              })//end comparePassword
              */
              bcrypt.compare(userData.password, user.password, function(err, result){
                if(err){
                  console.log(err)
                }{
                  if(!result){
                    res.status(401).send('invalid password');
                  }else{
                  let payload = {subject: user._id}
                  let token = jwt.sign(payload, 'thisIsASecretKey')
                  res.status(200).send({token})
                }
              }
              })//end bcrypt
            }//fin else
        }//fin else
    })//fin findOne user
})//fin login


///// ROUTE FOR PASSWORD REQUEST /////
router.post('/resetpassword', (req, res) => {
  let email = req.body.email;

  User.findOne({email: email}, (err, user) => {
    if(err){
      console.log(err)
    }else{
      if(!user){
        res.status(401).send('wrong email')
      }else{
        let newPassword = Math.random().toString(36).slice(-8);
        bcrypt.hash(newPassword, saltRounds, function (err, hash) {
          if(err){
            console.log(err)
          }else{
            User.findOneAndUpdate({email: email}, {password: hash}, (err, data) => {
              if(err){
                console.log(err)
              }else{
                let subject = forgottenPassword.subject();
                let message = forgottenPassword.message(newPassword);
                mailer.sendEmail(subject, message, email)
                res.status(200).send('OK')
              }
            })
          }
        });//end bcrypt
      }
    }
  })//end findOne
})//end resetpassword
router.post('/send', (req, res) => {
  console.log(req.body)
});//end send


///


module.exports = router;
