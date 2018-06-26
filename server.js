//Needed NPM packages
const express = require('express');
const app = require('express')();
const bodyParser = require('body-parser');
const cors = require('cors');

const port = 3000;
const api = require('./routes/api')// call to the module for routes api.js
const server = require('http').Server(app); //protocole http pour démarrer avec socket io
const io = require('socket.io')(server);
//const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', api)
app.get('/', function (req, res) {
    res.send('Hello world')
});

app.listen(port, function () {
    console.log('listening on port ' + port)
});
