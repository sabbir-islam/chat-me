const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Data storage
const chatHistory = [];
const users = new Map();
const typingUsers = new Set();
const votes = new Map();
let messageIdCounter = 0;

// Voting constants
const VOTE_THRESHOLD = 3;
const VOTE_TIMEOUT = 120000; // 2 minutes

io.on('connection', (socket) => {
    // Send chat history to new user
    socket.emit('messageHistory', chatHistory);

    socket.on('join', (username) => {
        users.set(socket.id, {
            name: username,
            votes: new Set()
        });
        updateUserList();
        const systemMsg = systemMessage(`${username} joined the chat`);
        chatHistory.push(systemMsg);
        io.emit('message', systemMsg);
    });

    socket.on('message', (data) => {
        const user = users.get(socket.id);
        const message = {
            id: messageIdCounter++,
            username: user.name,
            message: data.text,
            time: Date.now(),
            replyTo: data.replyTo
        };
        chatHistory.push(message);
        if(chatHistory.length > 200) chatHistory.shift();
        io.emit('message', message);
    });

    socket.on('voteToRemove', (targetId) => {
        const voter = users.get(socket.id);
        const targetUser = users.get(targetId);
        
        if (!targetUser || voter.votes.has(targetId)) return;

        // Initialize vote tracking
        if (!votes.has(targetId)) {
            votes.set(targetId, {
                count: 0,
                timer: setTimeout(() => votes.delete(targetId), VOTE_TIMEOUT)
            });
        }

        const vote = votes.get(targetId);
        vote.count++;
        voter.votes.add(targetId);

        // Check if threshold reached
        if (vote.count >= VOTE_THRESHOLD) {
            io.to(targetId).emit('forceDisconnect');
            const systemMsg = systemMessage(`${targetUser.name} was removed by vote`);
            chatHistory.push(systemMsg);
            io.emit('message', systemMsg);
            clearTimeout(vote.timer);
            votes.delete(targetId);
        }

        updateUserList();
    });

    socket.on('typing', () => {
        const user = users.get(socket.id);
        typingUsers.add(user.name);
        updateTypingIndicator();
        
        setTimeout(() => {
            typingUsers.delete(user.name);
            updateTypingIndicator();
        }, 1000);
    });

    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (!user) return;

        // Clean up votes
        votes.forEach((vote, targetId) => {
            if (targetId === socket.id) {
                clearTimeout(vote.timer);
                votes.delete(targetId);
            }
        });

        users.delete(socket.id);
        typingUsers.delete(user.name);
        updateUserList();
        updateTypingIndicator();
        
        const systemMsg = systemMessage(`${user.name} left the chat`);
        chatHistory.push(systemMsg);
        socket.broadcast.emit('message', systemMsg);
    });

    function updateUserList() {
        const userArray = Array.from(users).map(([id, user]) => ({
            id,
            name: user.name,
            votes: votes.get(id)?.count || 0
        }));
        io.emit('userList', userArray);
        io.emit('onlineCount', users.size);
    }

    function updateTypingIndicator() {
        const typers = Array.from(typingUsers);
        io.emit('typing', {
            isTyping: typers.length > 0,
            username: typers[0] || ''
        });
    }

    function systemMessage(text) {
        return {
            id: messageIdCounter++,
            username: 'System',
            message: text,
            time: Date.now()
        };
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));