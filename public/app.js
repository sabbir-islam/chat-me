const socket = io();
let username = '';
let replyingTo = null;

// Emoji list
const emojis = ['😀', '😍', '😂', '😎', '😢', '👋', '🎉', '❤️', '👍', '👎'];

// Initialize emoji picker
const emojiPicker = document.getElementById('emojiPicker');
emojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn';
    btn.textContent = emoji;
    btn.onclick = () => insertEmoji(emoji);
    emojiPicker.appendChild(btn);
});

// Username modal handling
const usernameModal = document.getElementById('usernameModal');
const usernameInput = document.getElementById('usernameInput');

function setUsername() {
    username = usernameInput.value.trim() || `User${Math.floor(Math.random() * 1000)}`;
    usernameModal.style.display = 'none';
    socket.emit('join', username);
}

usernameModal.style.display = 'flex';

// Chat functionality
function insertEmoji(emoji) {
    messageInput.value += emoji;
}

function toggleEmojiPicker() {
    emojiPicker.classList.toggle('active');
}

function handleTyping() {
    socket.emit('typing');
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('message', {
            text: message,
            replyTo: replyingTo
        });
        messageInput.value = '';
        cancelReply();
    }
}

function replyToMessage(messageId, username, text) {
    replyingTo = { messageId, username, text };
    updateReplyPreview();
}

function cancelReply() {
    replyingTo = null;
    updateReplyPreview();
}

function updateReplyPreview() {
    const replyPreview = document.getElementById('replyPreview');
    if (replyingTo) {
        replyPreview.innerHTML = `
            <div class="reply-content">
                <span>Replying to <span class="reply-username">${replyingTo.username}</span>:</span>
                <span class="reply-text">${replyingTo.text}</span>
                <span class="reply-cancel" onclick="cancelReply()">✕</span>
            </div>
        `;
        replyPreview.classList.add('active');
    } else {
        replyPreview.classList.remove('active');
        replyPreview.innerHTML = '';
    }
}

function initiateVote(userId) {
    if (confirm('Are you sure you want to vote to remove this user?')) {
        socket.emit('voteToRemove', userId);
    }
}

// Socket.io listeners
socket.on('userList', users => {
    const userList = document.getElementById('userList');
    userList.innerHTML = users.map(user => `
        <div class="user-item">
            <i class="fas fa-circle" style="color: #3ba55c;"></i>
            <span class="user-name">${user.name}</span>
            <div class="vote-section">
                <span class="vote-count">${user.votes}</span>
                <button class="vote-btn" onclick="initiateVote('${user.id}')">
                    <i class="fas fa-ban"></i>
                </button>
            </div>
        </div>
    `).join('');
});

socket.on('message', data => {
    const messagesDiv = document.getElementById('messages');
    const isOwnMessage = data.username === username;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isOwnMessage ? 'own-message' : ''}`;
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-info">
                <span class="username">${data.username}</span>
                <span class="timestamp">${new Date(data.time).toLocaleTimeString()}</span>
            </div>
            ${data.replyTo ? `
                <div class="message-reply">
                    Replying to <span class="reply-username">${data.replyTo.username}</span>: 
                    ${data.replyTo.text}
                </div>
            ` : ''}
            <div class="message-text">${data.message}</div>
            ${data.username !== 'System' ? `
                <button class="reply-btn" 
                        onclick="replyToMessage('${data.id}', '${data.username}', '${data.message}')">
                    Reply
                </button>
            ` : ''}
        </div>
    `;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('messageHistory', history => {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';
    history.forEach(data => {
        const isOwnMessage = data.username === username;
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isOwnMessage ? 'own-message' : ''}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-info">
                    <span class="username">${data.username}</span>
                    <span class="timestamp">${new Date(data.time).toLocaleTimeString()}</span>
                </div>
                ${data.replyTo ? `
                    <div class="message-reply">
                        Replying to <span class="reply-username">${data.replyTo.username}</span>: 
                        ${data.replyTo.text}
                    </div>
                ` : ''}
                <div class="message-text">${data.message}</div>
            </div>
        `;
        messagesDiv.appendChild(messageElement);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('typing', data => {
    const typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.textContent = data.isTyping 
        ? `${data.username} is typing...`
        : '';
});

socket.on('onlineCount', count => {
    document.getElementById('onlineCount').textContent = count;
});

socket.on('forceDisconnect', () => {
    alert('You have been removed by community vote!');
    window.location.reload();
});

// Keyboard controls
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Close emoji picker when clicking outside
document.addEventListener('click', e => {
    if (!emojiPicker.contains(e.target) && !e.target.matches('.emoji-btn')) {
        emojiPicker.classList.remove('active');
    }
});