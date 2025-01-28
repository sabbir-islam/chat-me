const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static('public'));

const users = new Map();

io.on('connection', (socket) => {
    // Handle new user
    socket.on('join', (username) => {
        users.set(socket.id, username);
        io.emit('onlineCount', users.size);
        socket.broadcast.emit('message', {
            username: 'System',
            message: `${username} has joined the chat`,
            time: Date.now()
        });
    });

    // Handle messages
    socket.on('message', (message) => {
        const username = users.get(socket.id);
        io.emit('message', {
            username,
            message,
            time: Date.now()
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        users.delete(socket.id);
        io.emit('onlineCount', users.size);
        socket.broadcast.emit('message', {
            username: 'System',
            message: `${username} has left the chat`,
            time: Date.now()
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});