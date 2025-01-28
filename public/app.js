const socket = io();
const messageInput = document.getElementById('messageInput');
const messagesDiv = document.getElementById('messages');

// Get validated username
let username;
do {
    username = prompt('Enter your username (3-15 characters):') || 'Anonymous';
} while (username.length < 3 || username.length > 15);

socket.emit('join', username);

// Handle message history FIRST
socket.on('messageHistory', (history) => {
    history.forEach(data => {
        addMessageToDOM(data);
    });
});

// Then handle new messages
socket.on('message', (data) => {
    addMessageToDOM(data);
});

// Online count update
socket.on('onlineCount', (count) => {
    document.querySelector('.online-count').textContent = `Online: ${count}`;
});

function addMessageToDOM(data) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `
        <strong>${data.username}</strong>: ${data.message}
        <div class="time">${new Date(data.time).toLocaleTimeString()}</div>
    `;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTo({
        top: messagesDiv.scrollHeight,
        behavior: 'smooth'
    });
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('message', message);
        messageInput.value = '';
        messageInput.focus();
    }
}

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});