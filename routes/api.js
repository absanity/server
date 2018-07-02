const express = require('express');
const router = express.Router();
const cfg = require('../config/config');//path to the mongo connection
const jwt = require('jsonwebtoken');//jsonwebtoken for authentication
const User = require('../models/user')//call the Schema for a new user
const mongoose = require('mongoose')
const db = "mongodb://Cotelette:a123456@ds141870.mlab.com:41870/socialnetwork"//cfg.db//api for connecting the database with the admin users
const app = require('express')();
const server = require('http').Server(app); //protocole http pour démarrer avec socket io
const socket = require('socket.io')(server);
const mongodb = require('mongodb');//call to store messages in the database

///VARIABLES USED FOR THE CHAT APP///
let users;
let count;
let chatRooms;
let messagesArray = [];


mongoose.connect(db, err => {
    if (err) {
        console.log(err)
    } else {
        console.log('connection to mongodb passed')//if the connection is alright, this is displayed into the terminal window
    }

  //  users = db.collection("users"); // getting the users collection
  //  chatRooms = db.collection("chatRooms"); /* getting the chatRooms collection. This collection would store chats in that room*/

  const io = socket.listen(server);//connection avec socket io
  /* 'connection' is a socket.io event that is triggered when a new connection is
     made. Once a connection is made, callback is called. */
  io.sockets.on('connection', (socket) => { /* socket object allows us to join specific clients
                                              to chat rooms and also to catch
                                              and emit the events.*/
      // 'join event'
      socket.on('join', (data) => {
          socket.join(data.room);
          chatRooms.find({}).toArray((err, rooms) => {
              if(err){
                  console.log(err);
                  return false;
              }
              count = 0;
              rooms.forEach((room) => {
                  if(room.name == data.room){
                      count++;
                  }
              });
              // Create the chatRoom if not already created
              if(count == 0) {
                  chatRooms.insert({ name: data.room, messages: [] });
              }
          });
      });
      // catching the message event
      socket.on('message', (data) => {
          // emitting the 'new message' event to the clients in that room
          io.in(data.room).emit('new message', {user: data.user, message: data.message});
          // save the message in the 'messages' array of that chat-room
          chatRooms.update({name: data.room}, { $push: { messages: { user: data.user, message: data.message } } }, (err, res) => {
              if(err) {
                  console.log(err);
                  return false;
              }
          });
      });
      // Event when a client is typing
      socket.on('typing', (data) => {
          // Broadcasting to all the users except the one typing
          socket.broadcast.in(data.room).emit('typing', {data: data, isTyping: true});
      });
  });

})//end connection to mongo db

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

//Default route
router.get('/', (req, res) => {
    res.send('From API route')
});


//HomePage routes
router.get('/home', (req, res) => {
    res.send('Hi')
})

//Profil Route
router.get('/profil', (req,res) => {
  res.send('profil')
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


//API FOR REGISTER
router.post('/register', (req, res) => {
    let userData = req.body//extract the user data from the object front
    let user = new User(userData)//convert the userData into the model we spacified in mongoose
    console.log(userData)//object type with email and Password

    user.save((error, registerUser) => {
        if (error) {
            console.log(err)
        } else {
            let payload = {subject: registerUser._id}
            let token = jwt.sign(payload, 'thisIsASecretKey')
            res.status(200).send({token})
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
                if (user.password !== userData.password) {//verify the password and email are matching one user
                    res.status(401).send('Invalid password')
                } else {
                    let payload = {subject: user._id}
                    let token = jwt.sign(payload, 'thisIsASecretKey')
                    res.status(200).send({token})
                }
            }//fin else
        }//fin else
    })//fin findOne user
})//fin login

///


module.exports = router;
