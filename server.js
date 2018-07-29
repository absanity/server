//Needed NPM packages

// var app = require('express')(),
//   server = require('http').createServer(app),
//   io = require('socket.io').listen(server);


const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

const port = 3000;

const bodyParser = require('body-parser');
const cors = require('cors');
const upload = require('./upload');
const api = require('./routes/api')// call to the module for routes api.js
// const server = require('http').Server(app); //protocole http pour démarrer avec socket io
const mongodb = require('mongodb');//call to store messages in the database
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer'); //used to send emails to user

const jwt = require('jsonwebtoken');//jsonwebtoken for authentication

//const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser())
app.use('/api', api)
app.get('/', function (req, res) {
    res.send('Cotelette is here')
});

///CONFIGURATION FOR THE CHAT EXCHANGES///
// Allowing cross-origin sites to make requests to this API
app.use((req, res, next) => {
    res.append('Access-Control-Allow-Origin' , 'http://192.168.160.133:4200');
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

app.get('/uploads/:name', function(req, res, next) {

  var options = {
    root:  '/Users/admin/Documents/rsocial/socialNetwork/1_socialNetwork/src/assets/uploads/',
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

server.listen(port, function () {
    console.log('listening on port ' + port)
});


var cloneSocket;
var socketIds = [];

io.sockets.on('connection', function (socket) {
  console.log('>>> [connection] >>>>');

  cloneSocket = socket;

  socket.on('disconnect', function(){
    console.log('>>> [disconnect] >>>>');

    for(var pseudo in socketIds) {
      if(socketIds[pseudo] == socket.id) {
        delete socketIds[pseudo];
      }
    }
    let connectedUsers = getConnectedUsers();
    console.log(connectedUsers);
    io.emit('disconnect', { connectedUsers: connectedUsers });
  });

  socket.on('forceDisconnect', function(){
    console.log('>>> [forceDisconnect] >>>>');

    socket.disconnect();
  });

  // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
  socket.on('nouveau_client', function(pseudo) {
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

  socket.on('send_token', function(token) {
    console.log('>>> [send_token] >>>>');
    if(token != null) {
      // socket.token = token;
      let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid
      console.log(payload);
      socketIds[payload.pseudo] = socket.id;

      socket.emit('token_check', "ok");

      io.emit('connected_users', getConnectedUsers());

    } else {
      socket.emit('token_check', "nok");

    }
  });


});

function getConnectedUsers() {
  let connectedUsers = [];
  for(let pseudo in socketIds) {
    connectedUsers.push({
      pseudo: pseudo
    });
  }
  return connectedUsers;
}


app.post('/api/chat-message', verifyToken, (req, res) => {
  console.log('### [/api/chat-message] >>');

  let o = req.body
  let token = req.headers.authorization.split(' ')[1]
  let payload = jwt.verify(token, 'thisIsASecretKey')
  // console.log(payload);


  let placeType = o.placeType;
  let placeName = o.placeName;

  console.log('placeType: ' + placeType);
  console.log('placeName: ' + placeName);

  let returnPayload = {
    placeType: placeType,
    placeName: placeName,
    message: o.message,
    senderPseudo: payload.pseudo
  };

  if(placeType == 'room' && placeName== 'default') {

    console.log('*** send room');

    // sending to all clients, include sender
    io.emit('message', returnPayload);

    res.status(200).send({});

  } else {

    console.log('*** send private : ' + payload.pseudo + ' to ' + placeName);

    let idSource = socketIds[payload.pseudo];
    let idTarget = socketIds[placeName];

    // sending to sender-client only
    console.log('idSource : ' + idSource);
    // cloneSocket.emit('message-private-to-source', returnPayload);
    // cloneSocket.broadcast.to(idSource).emit('message-private-to-source', returnPayload);
    io.to(idSource).emit('message-private-to-source', returnPayload);


    // sending to individual socketid
    console.log('idTarget : ' + idTarget);
    // cloneSocket.broadcast.to(idTarget).emit('message-private-to-target', returnPayload);
    io.to(idTarget).emit('message-private-to-target', returnPayload);

    res.status(200).send({});

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