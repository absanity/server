var app = require('express')(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server);
  // ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
  // fs = require('fs');

console.log('test1');
// Chargement de la page index.html
// app.get('/', function (req, res) {
//   res.send('jjjjjjjjjjjjjjjjj');
// });
// console.log('test2');

io.sockets.on('connection', function (socket, pseudo) {
  console.log('connected : ');
  console.log(pseudo);

  // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
  socket.on('nouveau_client', function(pseudo) {
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
});

server.listen(8080);

console.log('test2');

