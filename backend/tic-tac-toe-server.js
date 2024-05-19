module.exports = function(io) {
    let rooms = {};

    io.on('connection', (socket) => {
        console.log('New player connected:', socket.id);

        socket.on('joinRoom', (room) => {
            if (!rooms[room]) {
                rooms[room] = {
                    board: ['', '', '', '', '', '', '', '', ''],
                    currentPlayer: 'X',
                    gameActive: true,
                    players: []
                };
            }

            if (rooms[room].players.length < 2) {
                rooms[room].players.push(socket.id);
                socket.join(room);
                socket.emit('currentBoard', rooms[room]);
                io.to(room).emit('message', `Player ${rooms[room].players.length} joined`);
                // clearMessages(room);
            }else {
                socket.emit('message', 'Room is full');
            }

            socket.on('makeMove', (data) => {
                const roomData = rooms[room];
                if (roomData.gameActive && roomData.board[data.index] === '') {
                    roomData.board[data.index] = data.player;
                    roomData.currentPlayer = data.player === 'X' ? 'O' : 'X';
                    roomData.gameActive = !checkWin(roomData.board);

                    io.to(room).emit('moveMade', {
                        board: roomData.board,
                        currentPlayer: roomData.currentPlayer,
                        gameActive: roomData.gameActive
                    });

                    if (!roomData.gameActive) {
                        io.to(room).emit('message', `Player ${data.player} wins!`);
                    }
                }
            });

            socket.on('restartGame', () => {
                // Réinitialiser le jeu dans la même chambre
                if (rooms[room]) {
                    rooms[room].board = ['', '', '', '', '', '', '', '', ''];
                    rooms[room].currentPlayer = 'X';
                    rooms[room].gameActive = true;
            
                    io.to(room).emit('currentBoard', rooms[room]);
                    io.to(room).emit('message', 'Game restarted');
                }
            });

            socket.on('disconnect', () => {
                console.log('Player disconnected:', socket.id);
                if (rooms[room]) {
                    rooms[room].players = rooms[room].players.filter(id => id !== socket.id);
                    if (rooms[room].players.length === 0) {
                        delete rooms[room];
                    }
                }
            });
        });
    });

    // function clearMessages(room) {
    //     io.to(room).emit('clearMessages');  
    // }

    function checkWin(board) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return board[a] && board[a] === board[b] && board[a] === board[c];
        });
    }
};
