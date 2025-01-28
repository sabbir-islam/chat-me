const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const MAX_HISTORY = 100;
const messageHistory = [];
const users = new Map();

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.on('join', (username) => {
        users.set(socket.id, username);
        // Send history to new user
        socket.emit('messageHistory', messageHistory);
        // Update others
        io.emit('onlineCount', users.size);
        socket.broadcast.emit('message', {
            username: 'System',
            message: `${username} joined`,
            time: Date.now()
        });
    });

    socket.on('message', (message) => {
        if(typeof message !== 'string' || message.trim() === '') return;
        const username = users.get(socket.id) || 'Anonymous';
        const msgData = {
            username,
            message: message.trim(),
            time: Date.now()
        };
        messageHistory.push(msgData);
        // Trim history
        if(messageHistory.length > MAX_HISTORY) messageHistory.shift();
        io.emit('message', msgData);
    });

    socket.on('disconnect', () => {
        const username = users.get(socket.id) || 'Anonymous';
        users.delete(socket.id);
        io.emit('onlineCount', users.size);
        socket.broadcast.emit('message', {
            username: 'System',
            message: `${username} left`,
            time: Date.now()
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});