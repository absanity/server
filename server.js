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


let socketTokens = {};

io.sockets.on('connection', function (socket) {
  console.log('connected ++++++++++++++++ ');
  console.log(socket.id);
  // console.log(socket);

  // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
  socket.on('nouveau_client', function(pseudo) {
    console.log('on nouveau_client ...');

    // pseudo = ent.encode(pseudo);
    socket.pseudo = pseudo;
    socket.broadcast.emit('nouveau_client', pseudo);
  });

  // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
  socket.on('message', function (message) {
    console.log('on message ...');
    console.log(message);
    // message = ent.encode(message);
    socket.broadcast.emit('message', {pseudo: socket.pseudo, message: message});
  });

  socket.on('send_token', function(token) {
    console.log('on send_token....');
    // console.log(token);
    // socket.token = token;

    let payload = jwt.verify(token, 'thisIsASecretKey')// return the decoded value only if it's valid

    console.log(payload);

    socketTokens[payload.pseudo] = socket;
    // console.log(socketTokens);
  });


});
