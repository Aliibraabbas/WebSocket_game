// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const snakeServer = require('./snake-server.js');
const ticTacToeServer = require('./tic-tac-toe-server.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// Initialise les modules de jeu avec l'instance de Socket.IO
ticTacToeServer(io);
snakeServer(io);




server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
