const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const messages = document.getElementById('messages');
// const chatForm = document.getElementById('chatForm');
// const chatInput = document.getElementById('chatInput');

canvas.width = 800;
canvas.height = 600;

const SNAKE_SIZE = 20;

let players = {};
let apples = [];

document.getElementById('joinRoomForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const room = document.getElementById('roomInput').value;
    if (room) {
        joinRoom(room);
    }
});

function joinRoom(room) {
    socket.emit('joinRoom', room);
}

socket.on('currentPlayers', (currentPlayers) => {
    players = currentPlayers;
    drawGame();
});

socket.on('newPlayer', (newPlayer) => {
    players[newPlayer.id] = newPlayer;
    drawGame();
});

socket.on('playerDisconnected', (playerId) => {
    delete players[playerId];
    drawGame();
});

socket.on('updatePlayers', (updatedPlayers) => {
    players = updatedPlayers;
    drawGame();
});

socket.on('appleLocation', (appleLocation) => {
    apples = appleLocation;
    drawGame();
});

socket.on('chatMessage', (message) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
});

socket.on('playerLost', (playerId) => {
    console.log(`Le joueur ${playerId} a perdu.`);
    if (playerId === socket.id) {
        alert('Game Over! Please enter room name to play again.');
        // const roomName = prompt('Enter room name:');
        // if (roomName) {
        //     window.location.href = `snake-game.html?room=${roomName}`;
        // }
    } else {
        delete players[playerId];
        drawGame();
    }
});



document.addEventListener('keydown', (event) => {
    let direction = null;
    switch(event.key) {
        case 'ArrowUp':
            direction = 'up';
            break;
        case 'ArrowDown':
            direction = 'down';
            break;
        case 'ArrowLeft':
            direction = 'left';
            break;
        case 'ArrowRight':
            direction = 'right';
            break;
    }

    if (direction) {
        socket.emit('playerMovement', { direction });
    }
});

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    Object.keys(players).forEach((playerId) => {
        const player = players[playerId];
        drawSnake(player.snake, player.color);
    });

    drawApples();
}

function drawSnake(snake, color) {
    ctx.fillStyle = color;
    snake.forEach(segment => {
        ctx.fillRect(segment.x * SNAKE_SIZE, segment.y * SNAKE_SIZE, SNAKE_SIZE, SNAKE_SIZE);
    });
}

function drawApples() {
    apples.forEach(apple => {
        ctx.fillStyle = apple.color;
        ctx.fillRect(apple.x * SNAKE_SIZE, apple.y * SNAKE_SIZE, SNAKE_SIZE, SNAKE_SIZE);
    });
}


// function checkBoundaryCollision(player) {
//     const head = player.snake[0];
//     if (head.x < 0 || head.x >= canvas.width / SNAKE_SIZE || head.y < 0 || head.y >= canvas.height / SNAKE_SIZE) {
//         alert('Game Over! Please enter room name to play again.');
//         joinRoom(prompt('Enter room name:'));
//     }
// }

// function checkSnakeCollision() {
//     Object.keys(players).forEach((playerId) => {
//         const currentPlayer = players[playerId];
//         if (playerId !== socket.id) {
//             currentPlayer.snake.forEach((segment, index) => {
//                 if (index !== 0 && segment.x === players[socket.id].snake[0].x && segment.y === players[socket.id].snake[0].y) {
//                     // Collision between snakes
//                     socket.emit('playerLost', currentPlayer.id);
//                 }
//             });
//         }
//     });
// }


// Update game every 250ms
// setInterval(() => {
//     if (currentRoom) {
//         socket.emit('update');
//     }
// }, 250);
