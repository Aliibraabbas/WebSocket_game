// snake-server.js
module.exports = function(io) {
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
            if (!player) return;
    
            moveSnake(player);
            if (checkBoundaryCollision(player)) {
                io.to(room).emit('playerLost', player.id);
                delete rooms[room].players[player.id];
            }
        });
    
        roomData.apples.forEach((apple, index) => {
            Object.keys(roomData.players).forEach((playerId) => {
                const player = roomData.players[playerId];
                if (!player) return;
    
                if (isEatingApple(player.snake[0], apple)) {
                    player.snake.push({...player.snake[player.snake.length - 1]});
                    roomData.apples[index] = generateApple();
                    io.to(room).emit('appleLocation', roomData.apples);
                }
            });
        });
    
        checkSnakeCollision(room);
    
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

    function checkBoundaryCollision(player) {
        const head = player.snake[0];
        return head.x < 0 || head.x >= 40 || head.y < 0 || head.y >= 30;
    }

    function checkSnakeCollision(room) {
        const roomData = rooms[room];
        const playerIds = Object.keys(roomData.players);
    
        playerIds.forEach(playerId => {
            const currentPlayer = roomData.players[playerId];
            if (!currentPlayer) return; // Vérifiez si currentPlayer est défini
    
            const currentHead = currentPlayer.snake[0];
    
            console.log(`Checking collisions for player ${playerId} at position (${currentHead.x}, ${currentHead.y})`);
    
            playerIds.forEach(otherPlayerId => {
                if (playerId !== otherPlayerId) {
                    const otherPlayer = roomData.players[otherPlayerId];
                    if (!otherPlayer) return; // Vérifiez si otherPlayer est défini
    
                    otherPlayer.snake.forEach(segment => {
                        console.log(`Comparing with segment of player ${otherPlayerId} at position (${segment.x}, ${segment.y})`);
                        if (currentHead.x === segment.x && currentHead.y === segment.y) {
                            console.log(`Collision detected between player ${playerId} and player ${otherPlayerId}`);
                            if (currentPlayer.snake.length <= otherPlayer.snake.length) {
                                io.to(room).emit('playerLost', playerId);
                                delete rooms[room].players[playerId];
                            } else {
                                io.to(room).emit('playerLost', otherPlayerId);
                                delete rooms[room].players[otherPlayerId];
                            }
                        }
                    });
                }
            });
        });
    }
    

    setInterval(() => {
        Object.keys(rooms).forEach((room) => {
            if (!rooms[room]) return; // Vérifiez si la salle existe
            updateGame(room);
        });
    }, 250);
};
