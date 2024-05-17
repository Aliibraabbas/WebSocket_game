const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const messages = document.getElementById('messages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

canvas.width = 800;
canvas.height = 600;

const SNAKE_SIZE = 20;

let players = {};
let apple = { x: 0, y: 0 };
let apples = [];
let currentRoom = null;
const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange'];

document.getElementById('joinRoomForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const room = document.getElementById('roomInput').value;
    if (room) {
        joinRoom(room);
    }
});

function joinRoom(room) {
    currentRoom = room;
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

chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (chatInput.value) {
        socket.emit('chatMessage', chatInput.value);
        chatInput.value = '';
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

// Mettre à jour le jeu toutes les 250ms
setInterval(() => {
    if (currentRoom) {
        socket.emit('update');
    }
}, 250);
