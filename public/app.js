const socket = io();
const messageInput = document.getElementById('messageInput');
const messagesDiv = document.getElementById('messages');

// Prompt for username
const username = prompt('Enter your username:') || 'Anonymous';

// Join chat
socket.emit('join', username);

// Receive messages
socket.on('message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `
        <strong>${data.username}</strong>: ${data.message}
        <div class="time">${new Date(data.time).toLocaleTimeString()}</div>
    `;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Update online count
socket.on('onlineCount', (count) => {
    document.querySelector('.online-count').textContent = `Online: ${count}`;
});

// Send message
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('message', message);
        messageInput.value = '';
    }
}

// Send message on Enter key
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});