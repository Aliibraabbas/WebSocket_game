const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let rooms = {};
const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange'];

io.on('connection', (socket) => {
    console.log('New player connected:', socket.id);

    socket.on('joinRoom', (room) => {
        if (!rooms[room]) {
            rooms[room] = {
                players: {},
                apples: generateApples(),
            };
        }

        rooms[room].players[socket.id] = {
            id: socket.id,
            snake: [{ x: 10, y: 10 }],
            direction: 'right',
            color: colors[Object.keys(rooms[room].players).length % colors.length],
        };

        socket.join(room);

        socket.emit('currentPlayers', rooms[room].players);
        socket.emit('appleLocation', rooms[room].apples);
        io.to(room).emit('newPlayer', rooms[room].players[socket.id]);

        socket.on('disconnect', () => {
            console.log('Player disconnected:', socket.id);
            delete rooms[room].players[socket.id];
            io.to(room).emit('playerDisconnected', socket.id);
        });

        socket.on('playerMovement', (movementData) => {
            if (rooms[room].players[socket.id]) {
                rooms[room].players[socket.id].direction = movementData.direction;
            }
        });

        socket.on('update', () => {
            updateGame(room);
        });

        socket.on('chatMessage', (message) => {
            io.to(room).emit('chatMessage', message);
        });
    });
});

function updateGame(room) {
    const roomData = rooms[room];

    if (!roomData) return;

    Object.keys(roomData.players).forEach((playerId) => {
        const player = roomData.players[playerId];
        moveSnake(player);

        roomData.apples.forEach((apple, index) => {
            if (isEatingApple(player.snake[0], apple)) {
                player.snake.push({});
                roomData.apples[index] = generateApple();
                io.to(room).emit('appleLocation', roomData.apples);
            }
        });
    });

    io.to(room).emit('updatePlayers', roomData.players);
}

function moveSnake(player) {
    const head = { ...player.snake[0] };
    switch (player.direction) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    player.snake.unshift(head);
    player.snake.pop();
}

function isEatingApple(head, apple) {
    return head.x === apple.x && head.y === apple.y;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateApple() {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange'];
    return { x: getRandomInt(0, 39), y: getRandomInt(0, 29), color: colors[getRandomInt(0, colors.length - 1)] };
}

function generateApples(count = 3) {
    const apples = [];
    for (let i = 0; i < count; i++) {
        apples.push(generateApple());
    }
    return apples;
}

setInterval(() => {
    Object.keys(rooms).forEach((room) => {
        updateGame(room);
    });
}, 250);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
