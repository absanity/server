const express = require('express');
const router = express.Router();
const cfg = require('../config/config');
const jwt = require('jsonwebtoken');//jsonwebtoken for authentication
const User = require('../models/user')//call the Schema for a new user
const mongoose = require('mongoose')
const db = cfg.db//api for connecting the database with the admin users

mongoose.connect(db, err => {
    if (err) {
        console.log(err)
    } else {
        console.log('connection to mongodb passed')//if the connection is alright, this is displayed into the terminal window
    }
})

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
