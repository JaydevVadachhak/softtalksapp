// @ts-check
// JavaScript file for SoftTalks server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const redis = require('redis');
const path = require('path');
require('dotenv').config();

// Redis setup
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

// Create Redis client configuration
const redisConfig = {
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`
};

// Only add password if it's actually set
if (REDIS_PASSWORD) {
    redisConfig.password = REDIS_PASSWORD;
}

console.log(`Connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}`);

// Create Redis publisher and subscriber clients
const redisPublisher = redis.createClient(redisConfig);
const redisSubscriber = redis.createClient(redisConfig);
const redisClient = redis.createClient(redisConfig);

// Handle Redis connection errors
redisPublisher.on('error', (err) => console.error('Redis Publisher Error:', err));
redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
redisClient.on('error', (err) => console.error('Redis Client Error:', err));

// Connect to Redis
(async () => {
    try {
        await redisPublisher.connect();
        await redisSubscriber.connect();
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Redis connection error:', err);
    }
})();

// Express app setup
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Active users map: { socketId: { id, username, room } }
const activeUsers = new Map();

// Store messages in Redis
async function storeMessage(room, message) {
    try {
        // Store message in a list for the room
        await redisClient.rPush(`messages:${room}`, JSON.stringify(message));
        // Keep only last 50 messages per room
        await redisClient.lTrim(`messages:${room}`, -50, -1);
    } catch (err) {
        console.error('Error storing message:', err);
    }
}

// Store private messages in Redis
async function storePrivateMessage(sender, receiver, message) {
    try {
        // Create a consistent private room ID (alphabetically sorted)
        const users = [sender, receiver].sort();
        const privateRoomId = `private:${users[0]}:${users[1]}`;

        // Store message in a list for the private room
        await redisClient.rPush(`messages:${privateRoomId}`, JSON.stringify(message));
        // Keep only last 50 messages per private room
        await redisClient.lTrim(`messages:${privateRoomId}`, -50, -1);
    } catch (err) {
        console.error('Error storing private message:', err);
    }
}

// Get messages from Redis
async function getMessages(room) {
    try {
        const messages = await redisClient.lRange(`messages:${room}`, 0, -1);
        return messages.map(msg => JSON.parse(msg));
    } catch (err) {
        console.error('Error getting messages:', err);
        return [];
    }
}

// Get private messages from Redis
async function getPrivateMessages(user1, user2) {
    try {
        // Create a consistent private room ID (alphabetically sorted)
        const users = [user1, user2].sort();
        const privateRoomId = `private:${users[0]}:${users[1]}`;

        const messages = await redisClient.lRange(`messages:${privateRoomId}`, 0, -1);
        return messages.map(msg => JSON.parse(msg));
    } catch (err) {
        console.error('Error getting private messages:', err);
        return [];
    }
}

// Get users in a room
function getUsersInRoom(room) {
    const users = [];
    activeUsers.forEach((user) => {
        if (user.room === room) {
            users.push({ id: user.id, username: user.username });
        }
    });
    return users;
}

// Update room users
function updateRoomUsers(room) {
    const users = getUsersInRoom(room);
    console.log(`Updating users for room ${room}:`, users);
    io.to(room).emit('roomUsers', { room, users });
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // Join a room
    socket.on('joinRoom', async (data) => {
        const { username, room } = data;
        socket.join(room);
        console.log(`User ${socket.id} (${username}) joined room: ${room}`);

        // Add user to active users
        activeUsers.set(socket.id, { id: socket.id, username, room });

        // Subscribe to Redis channel for this room
        await redisSubscriber.subscribe(`chat:${room}`, (message) => {
            const messageData = JSON.parse(message);
            // Broadcast to all clients in the room
            io.to(room).emit('message', messageData);
        });

        // Send join notification to the room
        socket.to(room).emit('message', {
            user: 'System',
            text: `${username} has joined the room.`,
            time: new Date().toLocaleTimeString()
        });

        // Send previous messages to the user
        const previousMessages = await getMessages(room);
        if (previousMessages.length > 0) {
            socket.emit('previousMessages', previousMessages);
        }

        // Update and send the list of users in the room
        updateRoomUsers(room);
    });

    // Leave a room
    socket.on('leaveRoom', async (room) => {
        socket.leave(room);
        const user = activeUsers.get(socket.id);

        if (user) {
            console.log(`User ${socket.id} (${user.username}) left room: ${room}`);

            // Unsubscribe from Redis channel for this room
            await redisSubscriber.unsubscribe(`chat:${room}`);

            // Send leave notification to the room
            socket.to(room).emit('message', {
                user: 'System',
                text: `${user.username} has left the room.`,
                time: new Date().toLocaleTimeString()
            });

            // Remove user from active users
            activeUsers.delete(socket.id);

            // Update and send the list of users in the room
            updateRoomUsers(room);
        }
    });

    // Handle chat messages
    socket.on('sendMessage', async (data) => {
        const { room, user, text } = data;
        const messageData = {
            user,
            text,
            time: new Date().toLocaleTimeString()
        };

        // Store message in Redis
        await storeMessage(room, messageData);

        // Publish message to Redis
        await redisPublisher.publish(`chat:${room}`, JSON.stringify(messageData));
    });

    // Handle private message initialization
    socket.on('initPrivateChat', async ({ targetUser }) => {
        const currentUser = activeUsers.get(socket.id);

        if (!currentUser) return;

        // Get previous messages between these users
        const previousMessages = await getPrivateMessages(currentUser.username, targetUser);

        // Send previous messages to the user
        socket.emit('previousPrivateMessages', {
            withUser: targetUser,
            messages: previousMessages
        });
    });

    // Handle private messages
    socket.on('sendPrivateMessage', async (data) => {
        const { to, text } = data;
        const fromUser = activeUsers.get(socket.id);

        if (!fromUser) return;

        const toSocketId = findSocketIdByUsername(to);

        if (!toSocketId) {
            // Target user not found or offline
            socket.emit('privateMessageError', {
                message: 'User is offline or not found',
                to
            });
            return;
        }

        const messageData = {
            from: fromUser.username,
            to,
            text,
            time: new Date().toLocaleTimeString()
        };

        // Store private message in Redis
        await storePrivateMessage(fromUser.username, to, messageData);

        // Send to sender and receiver
        socket.emit('privateMessage', messageData);
        io.to(toSocketId).emit('privateMessage', messageData);
    });

    // Helper function to find a socket ID by username
    function findSocketIdByUsername(username) {
        for (const [socketId, user] of activeUsers.entries()) {
            if (user.username === username) {
                return socketId;
            }
        }
        return null;
    }

    // Handle disconnection
    socket.on('disconnect', () => {
        const user = activeUsers.get(socket.id);

        if (user) {
            console.log(`User disconnected: ${socket.id} (${user.username})`);

            // Send leave notification to the room
            socket.to(user.room).emit('message', {
                user: 'System',
                text: `${user.username} has left the room.`,
                time: new Date().toLocaleTimeString()
            });

            // Remove user from active users
            activeUsers.delete(socket.id);

            // Update and send the list of users in the room
            updateRoomUsers(user.room);
        } else {
            console.log(`User disconnected: ${socket.id}`);
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 