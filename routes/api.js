///// GLOBAL PACKAGES /////
const express = require('express');
const router = express.Router();
const app = require('express')();
const mongodb = require('mongodb');//call to store messages in the database

///// AUTHENTICATION / SECURITY /////
// const cfg = require('../config/config');//path to the mongo connection
const jwt = require('jsonwebtoken');//jsonwebtoken for authentication
const bcrypt = require('bcryptjs');

const saltRounds = 10;
const mongoose = require('mongoose')
const db = "mongodb://Cotelette:a123456@ds141870.mlab.com:41870/socialnetwork"//cfg.db//api for connecting the database with the admin users

///// SCHEMAS /////
const User = require('../models/user')//call the Schema for a new user
const Wall = require('../models/wall')//call the Schema for a new user
const Relationship = require('../models/relationship')//call the Schema for a new user
const Conversation = require('../models/conversation')// call the Schema for the conversation

///// SENDING MAIL /////
const mailer = require('../mail/nodemailer');//generic function for sending emails
const forgottenPassword = require('../mail/forgottenPassword')//used for requesting a new Password
const subscriptionSuccess = require('../mail/subscriptionSuccess')//used to notify a new user that the account have been successfully created

///// UPLOAD FILES /////
const multer = require('multer');

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
  req.userId = payload.userId
  next()

}

//Default route
router.get('/', (req, res) => {
  res.send('From API route')
});


//HomePage routes

router.get('/home',  (req, res) => {

  User.find({}).countDocuments().exec(function (err, result) {
    res.send(JSON.stringify({ result: result }))
  });

})


//Profil Route
router.get('/profil', verifyToken, (req, res) => {
  var token = req.headers['x-access-token'];
  if (!token) return res.status(401).send({auth: false, message: 'No token provided.'});

  jwt.verify(token, config.secret, function (err, decoded) {
    if (err) return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});

    res.status(200).send(decoded);
  });
})

router.post('/wall', verifyToken, (req, res) => {

  let o = req.body
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid
  let wallData = {
    message: o.message,
    userSourceId: payload.userId,
    userSource: payload.userId,
  }

  let wall = new Wall(wallData)
  wall.save((error, wallSaved) => {
    res.send({});
  })

})

router.post('/wall', verifyToken, (req, res) => {
  let o = req.body
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid
  let wallData = {
    message: o.message,
    userSourceId: payload.userId,
    userSource: payload.userId,
  }

  let wall = new Wall(wallData)
  wall.save((error, wallSaved) => {
    res.send({});
  })

})

router.get('/wall', verifyToken, (req, res) => {
  getWall(res, {});
})

function postWall(res, payloadWall) {
  let wall = new Wall(payloadWall)
  wall.save((error, wallSaved) => {
    res.send({});
  })
}

router.post('/profile-wall', verifyToken, (req, res) => {
  let o = req.body
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid
  let payloadWall = {}

  if (o.pseudo == '') {
    payloadWall = {
      message: o.message,
      userSourceId: payload.userId,
      userSource: payload.userId,
    };
    postWall(res, payloadWall);

  } else {
    User.findOne({pseudo: o.pseudo}).exec(function (err, infos) {
      payloadWall = {
        message: o.message,
        userSourceId: payload.userId,
        userSource: payload.userId,
        userTargetId: infos['_id'],
        userTarget: infos['_id'],
      };
      postWall(res, payloadWall)
    });

  }
})

function getWall(res, criteria) {
  Wall.find(criteria).populate('userSource', 'email pseudo').sort({created: -1}).limit(20).exec(function (err, messages) {
    var messageMap = {};
    messages.forEach(function (message) {
      messageMap[message._id] = message;
    });
    res.send(messageMap);
  });
}

router.get('/profile-wall', verifyToken, (req, res) => {
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  let criteria = {};
  if (query['pseudo'] != undefined) {
    User.findOne({pseudo: query['pseudo']}).exec(function (err, infos) {
      criteria = {$or: [{userSourceId: infos['_id']}, {userTargetId: infos['_id']}]};
      getWall(res, criteria);
    });
  } else {
    let token = req.headers.authorization.split(' ')[1]
    let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid
    criteria = {$or: [{userSourceId: payload.userId}, {userTargetId: payload.userId}]};
    getWall(res, criteria);
  }
})

function getInfos(res, criteriaInfos, myId) {
  User.findOne(criteriaInfos).exec(function (err, infos) {
    let criteriaRelationship = {
      $or: [
        {$and: [{userSourceId: infos['_id']}, {userTargetId: myId}]},
        {$and: [{userSourceId: myId}, {userTargetId: infos['_id']}]}
      ]
    };

    Relationship.findOne(criteriaRelationship).exec(function (err, relationship) {
      let accepted = null;
      let typeRelationship = null;

      if (myId != infos['_id']) {
        typeRelationship = 0;
        if (relationship != null) {
          if (relationship.userSourceId == myId) {
            typeRelationship = 1;
          } else {
            typeRelationship = 2;
          }
          accepted = relationship.accepted;
        }
      }
      let data = {
        pseudo: infos['pseudo'],
        email: infos['email'],
        avatar: infos['avatar'],
        typeRelationship: typeRelationship,
        accepted: accepted,
      }
      res.send(data);
    })


  });
}

router.get('/profile-infos', verifyToken, (req, res) => {
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')

  if (query['pseudo'] != undefined) {
    User.findOne({pseudo: query['pseudo']}).exec(function (err, infos) {
      getInfos(res, {_id: infos['_id']}, payload.userId);
    });
  } else {

    getInfos(res, {_id: payload.userId}, payload.userId);
  }

})

router.get('/members', verifyToken, (req, res) => {

  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid

  User.find({_id: {$ne: payload.userId}}).exec(function (err, result) {

    let data = [];
    for (let i in result) {
      let user = result[i];
      data.push({
        pseudo: user['pseudo'],
        email: user['email'],
        avatar: user['avatar'],
      });

    }

    res.send(data);
  });
})


router.post('/invite', verifyToken, (req, res) => {
  let o = req.body
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid

  User.findOne({pseudo: o.pseudo}).exec(function (err, infos) {
    if (payload.userId == infos['_id']) {
      res.send({});
    } else {

      let criteriaRelationship = {
        $or: [
          {$and: [{userSourceId: infos['_id']}, {userTargetId: payload.userId}]},
          {$and: [{userSourceId: payload.userId}, {userTargetId: infos['_id']}]}
        ]
      };

      Relationship.findOne(criteriaRelationship).exec(function (err, relationship) {

        if (relationship != null) {
          res.send({});
        } else {
          let payloadRelationship = {
            userSourceId: payload.userId,
            userTargetId: infos['_id'],
            userSource: payload.userId,
            userTarget: infos['_id'],
          };
          let relationship = new Relationship(payloadRelationship)
          relationship.save((error, data) => {
            res.send({});
          })
        }

      })

    }
  });
})

router.post('/cancel-invitation', verifyToken, (req, res) => {
  let o = req.body
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid

  User.findOne({pseudo: o.pseudo}).exec(function (err, infos) {
    if (payload.userId == infos['_id']) {
      res.send({});
    } else {

      let criteriaRelationship = {
        $or: [
          {$and: [{userSourceId: infos['_id']}, {userTargetId: payload.userId}]},
          {$and: [{userSourceId: payload.userId}, {userTargetId: infos['_id']}]}
        ]
      };

      Relationship.findOne(criteriaRelationship).exec(function (err, relationship) {

        if (relationship == null) {
          res.send({});
        } else {
          Relationship.remove({_id: relationship._id}, function (err) {
            res.send({});

          });
        }

      })

    }
  });

})


router.post('/accept-invitation', verifyToken, (req, res) => {
  let o = req.body
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid

  User.findOne({pseudo: o.pseudo}).exec(function (err, infos) {
    if (payload.userId == infos['_id']) {
      res.send({});
    } else {

      let criteriaRelationship = {
        $or: [
          {$and: [{userSourceId: infos['_id']}, {userTargetId: payload.userId}]},
          {$and: [{userSourceId: payload.userId}, {userTargetId: infos['_id']}]}
        ]
      };

      Relationship.findOne(criteriaRelationship).exec(function (err, relationship) {

        if (relationship == null) {
          res.send({});
        } else {
          Relationship.update({_id: relationship._id}, {$set: {accepted: true}}, function (err) {
            res.send({});

          });

        }

      })

    }
  });

})

router.post('/delete-relationship', verifyToken, (req, res) => {
  let o = req.body
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid

  User.findOne({pseudo: o.pseudo}).exec(function (err, infos) {
    if (payload.userId == infos['_id']) {
      res.send({});
    } else {
      let criteriaRelationship = {
        $or: [
          {$and: [{userSourceId: infos['_id']}, {userTargetId: payload.userId}]},
          {$and: [{userSourceId: payload.userId}, {userTargetId: infos['_id']}]}
        ]
      };

      Relationship.findOne(criteriaRelationship).exec(function (err, relationship) {

        if (relationship == null) {
          res.send({});
        } else {
          Relationship.remove({_id: relationship._id}, function (err) {
            res.send({});

          });

        }

      })

    }
  });

})

function getFriends(res, criteria) {
  Relationship.find(criteria).populate('userSource', 'email pseudo').populate('userTarget', 'email pseudo').exec(function (err, data) {
    res.send(data);
  })
}

router.get('/friends', verifyToken, (req, res) => {
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid

  let criteria = {};
  if (query['pseudo'] != undefined) {
    User.findOne({pseudo: query['pseudo']}).exec(function (err, infos) {
      // criteria = {$or: [{userSourceId: infos['_id']}, {userTargetId: infos['_id']}]};
      criteria = {
        $and: [
          {accepted: true},
          {$or: [{userSourceId: infos['_id']}, {userTargetId: infos['_id']}]}
        ]
      }
      getFriends(res, criteria);
    });
  } else {
    // criteria = {$or: [{userSourceId: payload.userId}, {userTargetId: payload.userId}]};
    criteria = {
      $and: [
        {accepted: true},
        {$or: [{userSourceId: payload.userId}, {userTargetId: payload.userId}]}
      ]
    }
    getFriends(res, criteria);
  }
})


router.get('/invitations', verifyToken, (req, res) => {
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid
  let myId = payload.userId;

  let criteria =
    {
      $or: [{userSourceId: myId}, {userTargetId: myId}]
    }

  Relationship.find(criteria).populate('userSource', 'email pseudo').populate('userTarget', 'email pseudo').exec(function (err, result) {
    let data = [];
    for (let i in result) {
      let relationship = result[i];

      let accepted = relationship.accepted;

      if (relationship.userSourceId == myId) {
        data.push({
          pseudo: relationship.userTarget['pseudo'],
          email: relationship.userTarget['email'],
          typeRelationship: 1,
          accepted: accepted
        });

      } else {
        data.push({
          pseudo: relationship.userSource['pseudo'],
          email: relationship.userSource['email'],
          typeRelationship: 2,
          accepted: accepted
        });

      }

    }
    res.send(data);
  })


})

////// UPLOAD /////
var storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, '/Users/admin/Documents/rsocial/socialNetwork/1_socialNetwork/src/assets/uploads')
  },
  filename: function(req, file, cb){
    cb(null, file.originalname)
  }
})//end diskstorage

var upload = multer({ storage: storage })

router.post('/upload', verifyToken, upload.single('image'), function(req, res, next) {
  User.findOneAndUpdate({_id: req.userId}, {
    avatar: {
      path: req.file.originalname
    }
  }, (err, data) => {
    if(err){
      console.log(err)
    }else{
      let theServerSaid = {
        message: req.file.path
      };
      res.status(200).send({theServerSaid})
    }
  })//end findOneAndUpdate
})//end router upload

//API FOR REGISTER
router.post('/register', (req, res) => {
  let userData = {
    email: req.body.email,
    password: req.body.password,
    pseudo: req.body.pseudo,
    name: req.body.name,
    surname: req.body.surname,
    age: parseInt(req.body.age),
    city: req.body.city,
    gender: req.body.gender,
    preferences: req.body.preferences,
    summary: req.body.summary,
    role: 1,
    avatar: {path: "https://api.adorable.io/avatars/80/" + req.body.pseudo},
    _id: new mongoose.Types.ObjectId(),
  }//extract the user data from the object front
  let user = new User(userData)//convert the userData into the model we specified in mongoose
  user.save((error, registerUser) => {
    if (error) {
      console.log(error.message)
      if (error.message == 'User validation failed: pseudo: Path `pseudo` is required.') {

      }
    } else {
      let payload = {userId: registerUser._id, pseudo: req.body.pseudo}
      let token = jwt.sign(payload, 'thisIsASecretKey')
      res.status(200).send({token})
    }
  })//end save method for register someone
})//end post for register method
//////////////////////////////////////


//API FOR LOGIN
router.post('/login', (req, res) => {
  console.log('### [/api/login] >>');

  let userData = req.body//extract the user data when submitted
  console.log(userData);

  User.findOne({// searching in the database for a user
    email: userData.email
  }, (error, user) => {
    if (error) {
      console.log(error)
    } else {
      if (!user) {//check if the user exists
        res.status(401).send('Invalid email')
      } else {
        ///////MODIF WITH Hash
         user.comparePassword(userData.password, function(err, isMatch){
           if(isMatch && isMatch == true){
             let payload = {userId: user._id, pseudo: user.pseudo}
             let token = jwt.sign(payload, 'thisIsASecretKey')
             res.status(200).send({token})
           }else{
             res.status(401).send('Invalid password')
           }
         })
  /*      let payload = {
          userId: user._id
        }
        let token = jwt.sign(payload, 'thisIsASecretKey')
        res.status(200).send({token})*/

        ///////
        /*
          if (user.password !== userData.password) {//verify the password and email are matching one user
              res.status(401).send('Invalid password')
          } else {
              let payload = {userId: user._id}
              let token = jwt.sign(payload, 'thisIsASecretKey')
              res.status(200).send({token})
          }*/
      }//fin else
    }//fin else
  })//fin findOne user
})//fin login


///// ROUTE FOR PASSWORD REQUEST /////
router.post('/resetpassword', (req, res) => {
  let email = req.body.email;

  User.findOne({email: email}, (err, user) => {
    if (err) {
      console.log(err)
    } else {
      if (!user) {
        res.status(401).send('wrong email')
      } else {
        let newPassword = Math.random().toString(36).slice(-8);
        bcrypt.hash(newPassword, saltRounds, function (err, hash) {
          if (err) {
            console.log(err)
          } else {
            User.findOneAndUpdate({email: email}, {password: hash}, (err, data) => {
              if (err) {
                console.log(err)
              } else {
                let subject = forgottenPassword.subject();
                let message = forgottenPassword.message(newPassword);
                mailer.sendEmail(subject, message, email)
                res.status(200).send({})
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
//
// router.post('/chat-message', verifyToken, (req, res) => {
//   console.log('chat-message...');
//
//   let o = req.body
//   let token = req.headers.authorization.split(' ')[1]
//   let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid
//
//   let placeType = o.placeType;
//   let placeName = o.placeName;
//   let message = o.message;
//
//   if(placeType == 'room' && placeName== 'default') {
//     io.emit('message', '{ placeType: "'+placeType+'", placeName: "'+placeName+'", message: "'+message+'" }');
//
//   } else {
//
//   }
//
//   console.log(o.message);
//
// });


module.exports = router;
