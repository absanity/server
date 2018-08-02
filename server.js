//Needed NPM packages

// var app = require('express')(),
//   server = require('http').createServer(app),
//   io = require('socket.io').listen(server);


const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

const port = 9000;

const bodyParser = require('body-parser');
const cors = require('cors');
const upload = require('./upload');
const api = require('./routes/api')// call to the module for routes api.js
// const server = require('http').Server(app); //protocole http pour démarrer avec socket io
const mongodb = require('mongodb');//call to store messages in the database
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer'); //used to send emails to user

const jwt = require('jsonwebtoken');//jsonwebtoken for authentication

const Conversation = require('./models/conversation')//call the Schema for a new user
const User = require('./models/user')//call the Schema for a new user

//const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser())
app.use('/api', api)
app.get('/', function (req, res) {
  res.send('Cotelette is here')
});

app.use('/uploads', express.static(__dirname + '/uploads/'));

///CONFIGURATION FOR THE CHAT EXCHANGES///
// Allowing cross-origin sites to make requests to this API
app.use((req, res, next) => {
  // res.append('Access-Control-Allow-Origin', 'http://audreyrocher.com');
  res.append('Access-Control-Allow-Origin', 'http://192.168.160.133:4200');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append("Access-Control-Allow-Headers", "Origin, Accept,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  res.append('Access-Control-Allow-Credentials', true);
  next();
});


///CONFIGURATION TO UPLOAD FILES
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
  //credentials: true
};

app.use(cors(corsOptions));
//app.post('/upload', upload);

server.listen(port, function () {
  console.log('listening on port ' + port)
});


var cloneSocket;
var socketIds = {};

io.sockets.on('connection', function (socket) {
  console.log('>>> [connection] >>>>');

  cloneSocket = socket;

  socket.on('disconnect', function () {
    console.log('>>> [disconnect] >>>>');

    for (var pseudo in socketIds) {
      if (socketIds[pseudo]['socketId'] == socket.id) {
        delete socketIds[pseudo];
      }
    }
    let connectedUsers = getConnectedUsers();
    console.log(connectedUsers);
    io.emit('disconnect', {connectedUsers: connectedUsers});
  });

  socket.on('forceDisconnect', function () {
    console.log('>>> [forceDisconnect] >>>>');

    socket.disconnect();
  });

  // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
  socket.on('nouveau_client', function (pseudo) {
    console.log('>>> [nouveau_client] >>>>');

    // pseudo = ent.encode(pseudo);
    socket.pseudo = pseudo;
    socket.broadcast.emit('nouveau_client', pseudo);
  });

  // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
  socket.on('message', function (message) {
    console.log('>>> [message] >>>>');
    // message = ent.encode(message);
    socket.broadcast.emit('message', {pseudo: socket.pseudo, message: message});
  });

  socket.on('send_token', function (token) {
    console.log('>>> [send_token] >>>>');
    if (token != null) {
      // socket.token = token;
      let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid
      console.log(payload);
      socketIds[payload.pseudo] = {socketId: socket.id, userId: payload.userId};

      socket.emit('token_check', "ok");

      io.emit('connected_users', getConnectedUsers());

    } else {
      socket.emit('token_check', "nok");

    }
  });


});

function getConnectedUsers() {
  let connectedUsers = [];
  for (let pseudo in socketIds) {
    connectedUsers.push({
      pseudo: pseudo
    });
  }
  return connectedUsers;
}

app.post('/api/previous-messages', verifyToken, (req, res) => {
  console.log('### [/api/previous-messages] >>');
  let o = req.body
  let key = o.key;
  console.log(key);
  let tab = key.split('-');
  let placeType = tab.shift();
  let placeName = tab.join('-');
  console.log('placeType: ' + placeType);
  console.log('placeName: ' + placeName);

  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey');

  let myId, otherUserId;
  myId = payload.userId;

  if (placeType == 'room') {
    getPreviousMessages(res, placeType, placeName, null, null);
  } else {
      User.findOne({pseudo: placeName}).exec(function (err, infos) {
        otherUserId = infos['_id'];
        getPreviousMessages(res, placeType, placeName, myId, otherUserId);
    });
  }






});

function getPreviousMessages(res, placeType, placeName, myId, otherUserId) {
  let criteria;
  if (placeType == 'room') {
    criteria = {userTargetId: null}
  } else {
    criteria = {
      $or: [
        {$and: [{userSourceId: myId}, {userTargetId: otherUserId}]},
        {$and: [{userSourceId: otherUserId}, {userTargetId: myId}]}
      ]
    };
  }

  Conversation
    .find(criteria)
    .populate('userSource', 'pseudo')
    .populate('userTarget', 'pseudo')
    .exec(function (err, result)
  {
    let messages = [];
    if(result != null) {
      for (let i in result) {
        let conversation = result[i];
        messages.push({
          senderPseudo: conversation['userSource']['pseudo'],
          message: conversation['message']
        });
      }
    }

    let key = placeType + '-' + placeName;
    res.send({ key: key, messages: messages } );
  });

}


app.post('/api/chat-message', verifyToken, (req, res) => {
  console.log('### [/api/chat-message] >>');

  let o = req.body
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey');

  let placeType = o.placeType;
  let placeName = o.placeName;

  let returnPayload = {
    placeType: placeType,
    placeName: placeName,
    message: o.message,
    senderPseudo: payload.pseudo
  };

  let source = socketIds[payload.pseudo];
  let target = socketIds[placeName];

  let payloadConversation;

  if (placeType == 'room' && placeName == 'default') {

    console.log('*** send room');

    payloadConversation = {
      message: o.message,
      userSourceId: source.userId,
      userSource: source.userId,
      userTargetId: null,
      userTarget: null,
    };

    let conversation = new Conversation(payloadConversation)
    conversation.save((error, conversationSaved) => {

      io.emit('message', returnPayload);

      res.status(200).send({});

    })


  } else {

    console.log('*** send private : ' + payload.pseudo + ' to ' + placeName);

    payloadConversation = {
      message: o.message,
      userSourceId: source.userId,
      userSource: source.userId,
      userTargetId: target.userId,
      userTarget: target.userId,
    };

    let conversation = new Conversation(payloadConversation)
    conversation.save((error, conversationSaved) => {

      io.to(source.socketId).emit('message-private-to-source', returnPayload);

      io.to(target.socketId).emit('message-private-to-target', returnPayload);

      res.status(200).send({});

    })

  }


});


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


// // sending to sender-client only
// socket.emit('message', "this is a test");
//
// // sending to all clients, include sender
// io.emit('message', "this is a test");
//
// // sending to all clients except sender
// socket.broadcast.emit('message', "this is a test");
//
// // sending to all clients in 'game' room(channel) except sender
// socket.broadcast.to('game').emit('message', 'nice game');
//
// // sending to all clients in 'game' room(channel), include sender
// io.in('game').emit('message', 'cool game');
//
// // sending to sender client, only if they are in 'game' room(channel)
// socket.to('game').emit('message', 'enjoy the game');
//
// // sending to all clients in namespace 'myNamespace', include sender
// io.of('myNamespace').emit('message', 'gg');
//
// // sending to individual socketid
// socket.broadcast.to(socketid).emit('message', 'for your eyes only');
