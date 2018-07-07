//Needed NPM packages
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const upload = require('./upload');
const port = 3000;
const api = require('./routes/api')// call to the module for routes api.js
const server = require('http').Server(app); //protocole http pour démarrer avec socket io
const io = require('socket.io')(server);
const mongodb = require('mongodb');//call to store messages in the database
const cookieParser = require('cookie-parser');

//const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser())
app.use('/api', api)
app.get('/', function (req, res) {
    res.send('Cotelette is here')
});

///CONFIGURATION FOR THE CHAT EXCHANGES///
// Allowing cross-origin sites to make requests to this API
app.use((req, res, next) => {
    res.append('Access-Control-Allow-Origin' , 'http://localhost:4200');
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.append("Access-Control-Allow-Headers", "Origin, Accept,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    res.append('Access-Control-Allow-Credentials', true);
    next();
});


///CONFIGURATION TO UPLOAD FILES
var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.post('/upload', upload);

app.listen(port, function () {
    console.log('listening on port ' + port)
});
