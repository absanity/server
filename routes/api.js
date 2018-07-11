const express = require('express');
const router = express.Router();
// const cfg = require('../config/config');//path to the mongo connection
const jwt = require('jsonwebtoken');//jsonwebtoken for authentication
const User = require('../models/user')//call the Schema for a new user
const Wall = require('../models/wall')//call the Schema for a new user
const mongoose = require('mongoose')
const db = "mongodb://Cotelette:a123456@ds141870.mlab.com:41870/socialnetwork"//cfg.db//api for connecting the database with the admin users
const app = require('express')();
const server = require('http').Server(app); //protocole http pour démarrer avec socket io
const socket = require('socket.io')(server);
const mongodb = require('mongodb');//call to store messages in the database
const conversation = require('../models/conversation')// call the Schema for the conversation


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

router.post('/wall', (req, res) => {
    let o = req.body

    console.log('--------------------------------');
    console.log(req);
    console.log('--------------------------------');
    console.log(o);

    let wallData = {
      message: o.message
    }

    let wall = new Wall(wallData)
    wall.save((error, wallSaved) => {
        console.log('>>>>');
        console.log(error);
        console.log(wallSaved);
    })

})

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
      console.log(registerUser)

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
                console.log(userData)
                ///////MODIF WITH Hash
                // User.comparePassword(userData.password, function(err, isMatch){
                //   if(isMatch && isMatch == true){
                //     let payload = {subject: user._id}
                //     let token = jwt.sign(payload, 'thisIsASecretKey')
                //     res.status(200).send({token})
                //   }else{
                //     res.status(401).send('Invalid password')
                //   }
                // })
                let payload = {subject: user._id}
                let token = jwt.sign(payload, 'thisIsASecretKey')
                res.status(200).send({token})

                ///////
                /*
                  if (user.password !== userData.password) {//verify the password and email are matching one user
                      res.status(401).send('Invalid password')
                  } else {
                      let payload = {subject: user._id}
                      let token = jwt.sign(payload, 'thisIsASecretKey')
                      res.status(200).send({token})
                  }*/
            }//fin else
        }//fin else
    })//fin findOne user
})//fin login





///


module.exports = router;
