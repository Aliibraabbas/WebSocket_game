const socket = io();
const gameBoard = document.getElementById('gameBoard');
const messages = document.getElementById('messages');
const joinRoomForm = document.getElementById('joinRoomForm');
const roomInput = document.getElementById('roomInput');

let currentPlayer = 'X';
let gameActive = true;
let board = ['', '', '', '', '', '', '', '', ''];

joinRoomForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const room = roomInput.value;
    if (room) {
        joinRoom(room);
    }
});



function joinRoom(room) {
    socket.emit('joinRoom', room);
}

socket.on('currentBoard', (currentBoard) => {
    board = currentBoard.board;
    currentPlayer = currentBoard.currentPlayer;
    gameActive = currentBoard.gameActive;
    updateBoard();
});

socket.on('moveMade', (data) => {
    board = data.board;
    currentPlayer = data.currentPlayer;
    gameActive = data.gameActive;
    updateBoard();
    checkWin();
});

socket.on('message', (message) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messages.appendChild(messageElement);
});

// socket.on('clearMessages', () => {
//     const messagesElement = document.getElementById('messages');
//     messagesElement.innerHTML = ''; 
// });

gameBoard.addEventListener('click', (event) => {
    if (!gameActive) return;
    const index = Array.from(gameBoard.children).indexOf(event.target);
    if (board[index] !== '') return;

    socket.emit('makeMove', { index, player: currentPlayer });
});

document.getElementById('restartButton').addEventListener('click', () => {
    socket.emit('restartGame');
});

function updateBoard() {
    gameBoard.innerHTML = '';
    board.forEach((cell, index) => {
        const cellElement = document.createElement('div');
        cellElement.classList.add('cell');
        cellElement.textContent = cell;
        gameBoard.appendChild(cellElement);
    });
}

function checkWin() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    winPatterns.forEach(pattern => {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            alert(`Player ${board[a]} wins!`);
            gameActive = false;
        }
    });

    if (gameActive && !board.includes('')) {
        alert('Draw!');
        gameActive = false;
    }
}
