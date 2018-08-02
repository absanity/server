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


/* USEFUL FUNCTIONS */
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

//Post on the wall
function postWall(res, payloadWall) {
  let wall = new Wall(payloadWall)
  wall.save((error, wallSaved) => {
    res.send({});
  })
}

//get the messages from wall
function getWall(res, criteria) {
  Wall.find(criteria).populate('userSource', 'email pseudo avatar').sort({created: -1}).limit(20).exec(function (err, messages) {
    var messageMap = {};
    messages.forEach(function (message) {
      messageMap[message._id] = message;
    });
    res.send(messageMap);
  });
}//end getWall


//get the infos of members
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
        city: infos['city'],
        preferences: infos['preferences'],
        summary: infos['summary']
      }
      //console.log(data + 'getInfos')
      res.send(data);
    })
  });
}//end getInfos

//function to get friends
function getFriends(res, criteria) {
  //console.log('getFriends...');
  //console.log(criteria);

  Relationship.find(criteria).populate('userSource', 'email pseudo avatar').populate('userTarget', 'email pseudo avatar').exec(function (err, data) {
    //console.log('getFriends res...');
    //console.log(data)
    //console.log(data[0].userTarget.avatar);
    res.send(data);
  })
}

//function compare arrays
//Compare des tableaux de reponses
function getRightAnswers(list1, list2){
   var alreadyFound = false;
   var same = [];
   var longList;
   var shortList;
   // On vérifie quelle liste est la plus longue
   if(list1.length - list2.length >= 0){
       longList = list1;
       shortList = list2;
   }else if(list1.length - list2.length < 0){
       longList = list2;
       shortList = list1;
   }
   // On compare la 1ere liste à la 2e
   for(var i=0; i<longList.length; i++){
       for(var j=0; j<shortList.length; j++){
           // Si on tombe sur un doublon
           if(shortList[j] === longList[i]){
               alreadyFound = false; // réinitialisation
               // On vérifie que ce doublon n'a pas déjà été enregistré
               for(var k=0; k<same.length; k++){
                   // Si ce doublon a déjà été enregistré
                   if(same[k] === longList[i]){
                       // On passe à l'élément suivant dans la 2eme liste
                       alreadyFound = true;
                       k = same.length;
                   }
               }
               // Si ce doublon n'a pas déjà été enregistré, on l'enregistre
               if(alreadyFound !== true){
                   same.push(longList[i]);
               }
           }
       }
   }
   return same.length;
} // end getRightAnswers


/*GET ROUTES */

///// DEFAULT ROUTE /////
router.get('/', (req, res) => {
  res.send('From API route')
});

///// HOMEPAGE /////
router.get('/home',  (req, res) => {
  User.find({}).count().exec(function (err, result) {
    var nbUsers = result
    //console.log(nbUsers)
    Wall.find({}).count().exec(function (err, result) {
      var nbMsg = result
      //console.log(nbMsg)
      var stats = {nbUsers: nbUsers, nbMsg: nbMsg}
      res.send(JSON.stringify(stats))
    })
  });
});


///// PROFIL OLD /////
router.get('/profil', verifyToken, (req, res) => {
  var token = req.headers['x-access-token'];
  if (!token) return res.status(401).send({auth: false, message: 'No token provided.'})
  jwt.verify(token, config.secret, function (err, decoded) {
    if (err) return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});
    res.status(200).send(decoded);
  });
});

///// WALL /////
router.get('/wall', verifyToken, (req, res) => {
  getWall(res, {});
});//end get wall

///// GET PROFIL INFOS /////
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
});

///// Get the infos for the profile /////
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
})//end get profile infos

///// GET INFOS FOR UPDATE PROFILE /////
router.get('/infos',verifyToken, (req, res) => {
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')

  getInfos(res, {_id: payload.userId}, payload.userId);

  //res.send(JSON.stringify())
})//en get update

//////// ROUTE FOR SEEING ALL THE MEMBERS ///////
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
});


///// SEARCH MEMBERS /////
router.get('/search', (req, res) => {
  console.log('server')

  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  let userToFind = query['ml'];

  User.find({pseudo: new RegExp(userToFind, "i")}).exec(function (err, result){
    if(result.length == 0){
      console.log('erreur recherche')
    }else{
      let data = [];
      for (let i in result) {
        let user = result[i];
        data.push({
          pseudo: user['pseudo']
        });
      }
      res.send(JSON.stringify(data))
    }
  })
}); //end post members

///// GET FRIENDS /////
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


///// GET INVITATIONS /////
router.get('/invitations', verifyToken, (req, res) => {
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid
  let myId = payload.userId;
  let criteria =
    {
      $or: [{userSourceId: myId}, {userTargetId: myId}]
    }

  Relationship.find(criteria).populate('userSource', 'email pseudo avatar').populate('userTarget', 'email pseudo avatar').exec(function (err, result) {
    //console.log('invitations res...');
    //console.log(result);
    let data = [];
    for (let i in result) {
      let relationship = result[i];

      let accepted = relationship.accepted;

      if (relationship.userSourceId == myId) {
        data.push({
          pseudo: relationship.userTarget['pseudo'],
          email: relationship.userTarget['email'],
          avatar: relationship.userTarget['avatar'],
          typeRelationship: 1,
          accepted: accepted
        });

      } else {
        data.push({
          pseudo: relationship.userSource['pseudo'],
          email: relationship.userSource['email'],
          avatar: relationship.userSource['avatar'],
          typeRelationship: 2,
          accepted: accepted
        });
      }
    }
    res.send(data);
  })
});

/// GET UPLOAD ///
app.get('/uploads/:name', function(req, res, next) {
  var options = {
    root: __dirname + '/uploads/',
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }//end options

  var fileName = req.params.name;
  res.sendFile(fileName, options, function (err) {
    if(err) {
      next(err)
    } else {
      console.log('send')
    }
  })
});//end app get

///// GET FRIEND SUGGESTION /////
router.get('/suggestions', verifyToken, (req, res) => {
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid

  let myId = payload.userId
  var myUser;
////// MY INFOS //////
  User.findOne({_id: myId}).exec(function (err, infos) {
    let criteriaRelationship =
      {
        $or: [{userSourceId: myId}, {userTargetId: myId}]
      }
    var friends = {}
    Relationship.find(criteriaRelationship).exec(function (err, relationships) {
      //console.log('/// relationships////')
      //console.log(relationships)
      for(let i in relationships){
        let relationship = relationships[i]
        //console.log(relationship)
      //  let accepted = null;
      //      accepted = relationship.accepted
        //console.log(accepted);
      //  if(accepted == true){
          if(relationship.userSourceId == infos['_id']){
            friends[relationship.userTargetId] = true
          }else{
            friends[relationship.userSourceId] = true
          }
        //}
      }
      //console.log('suggestion friends')
      //console.log(friends)

      User.find({}).exec(function (err, result){
        let notFriends = [];
        console.log('///RESULT///')
        console.log(result)
        console.log('///FRIENDS////')
        console.log(friends)
        console.log('///MYID///')
        console.log(myId)
        for(let i in result){
          let user = result[i]
          if(result[i]._id != myId){
            if(friends[user._id] == undefined){
              notFriends.push({'pseudo': user.pseudo, 'email': user.email, 'avatar': user.avatar})
              if(i == 4){
                break
              }
            }
          }
        }
        res.send(notFriends)
      });//end user.find
    });//end relationship.find
  });//end user.findone

///// FRIEND SUGGESTION //////
/*  User.find({"preferences": {$exists: true}}, {pseudo: 1, email: 1, avatar: 1, preferences: 1, _id: 0}, (err, data) => {
    if(err){
      console.log(err)
    }else{
      let pref = [];
      let allFriends = data; ///ARRAY WITH THE DATAS

      for(let i=0 ; i<allFriends.length; i++){
        pref = Object.keys(allFriends[i].preferences)
        allFriends[i].preferences = pref
      }
      res.send(allFriends)
    }
  })*/
})//end friend suggestion


/*POST ROUTES*/

///// POST A MESSAGE ON THE WALL /////
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


///// PROFILE WALL /////
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
})//end profile wall


///// INVITATIONS /////
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
});

///// REFUSE AN INVITATION /////
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
}); //end refuse invitation


///// ACCEPT AN INVITATION /////
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

///// DELETE A FRIEND /////
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
});

///// DELETE A MESSAGE /////
router.post('/delete-message', verifyToken, (req, res) => {
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid
  //console.log(req.body)

  Wall.deleteOne({_id: req.body.res}, (err, data) => {
    if(err){
      console.log(err)
    }else{
      let theServerSaid = {
        message: "successfully deleted"
      }
      res.status(200).send({theServerSaid})
    }
  });
})//end post delete message


////// UPDATE INFOS /////
router.post('/update', verifyToken, (req, res) => {
  let changes = req.body;
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid
  console.log('.... changes ....')
  console.log(req.body)
  User.findOneAndUpdate({pseudo: req.body.pseudo}, {
    city: req.body.city, summary: req.body.summary, preferences: req.body.preferences
  }, (err, data) => {
    if(err){
      console.log(err)
    }else{
      let theServerSaid = {
        message: "updated successfully"
      }
      res.status(200).send({theServerSaid})
    }
  })
})//end router update


////// UPLOAD /////
var storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, './uploads/')
  },
  filename: function(req, file, cb){
    cb(null, file.originalname)
  }
})//end diskstorage

var upload = multer({ storage: storage });

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
        message: "http://localhost:3000" + req.file.path
      };
      res.status(200).send({theServerSaid})
    }
  })//end findOneAndUpdate
})//end router upload

///// API FOR REGISTER /////
router.post('/register', (req, res) => {
<<<<<<< HEAD

  console.log("################# REGISTER #######################");

=======
>>>>>>> cb09558124b675a916da8e75dfe3530e66a3ae48
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
    avatar: {path: "https://api.adorable.io/avatars/200/" + req.body.pseudo},
    _id: new mongoose.Types.ObjectId(),
  }//extract the user data from the object front
  let user = new User(userData)//convert the userData into the model we specified in mongoose
  user.save((error, registerUser) => {
    if (error) {
      console.log('----- err -------');
      console.log(error.message)
      if (error.message == 'User validation failed: pseudo: Path `pseudo` is required.') {

      }
    } else {

      console.log("--- result ok -------");

      let payload = {userId: registerUser._id, pseudo: registerUser.pseudo}
      console.log(payload);
      let token = jwt.sign(payload, 'thisIsASecretKey')
      let subject = subscriptionSuccess.subject();
      let message = subscriptionSuccess.message();
      let email = userData.email;
      mailer.sendEmail(subject, message, email)

      console.log('---- return -----');
      console.log({token: token, pseudo: registerUser.pseudo});

      res.status(200).send({token: token, pseudo: registerUser.pseudo})

    }
  })//end save method for register someone
})//end post for register method


///// API FOR LOGIN /////
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
             res.status(200).send({ token: token, pseudo: user.pseudo })
           }else{
             res.status(401).send('Invalid password')
           }
         })
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

module.exports = router;
