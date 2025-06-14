// @ts-check
// JavaScript file for SoftTalks server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const redis = require('redis');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('dotenv').config();

// Configure logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

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

logger.info(`Connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}`);

// Create Redis publisher and subscriber clients
const redisPublisher = redis.createClient(redisConfig);
const redisSubscriber = redis.createClient(redisConfig);
const redisClient = redis.createClient(redisConfig);

// Handle Redis connection errors
redisPublisher.on('error', (err) => logger.error('Redis Publisher Error:', err));
redisSubscriber.on('error', (err) => logger.error('Redis Subscriber Error:', err));
redisClient.on('error', (err) => logger.error('Redis Client Error:', err));

// Connect to Redis
(async () => {
    try {
        await redisPublisher.connect();
        await redisSubscriber.connect();
        await redisClient.connect();
        logger.info('Connected to Redis');
    } catch (err) {
        logger.error('Redis connection error:', err);
    }
})();

// Express app setup
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.gstatic.com", "https://*.firebaseio.com", "https://*.firebase.com", "https://*.googleapis.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https://ui-avatars.com", "https://*.googleapis.com", "https://*.gstatic.com"],
            connectSrc: ["'self'", "wss://*", "https://*.firebaseio.com", "https://*.googleapis.com", "https://*.firebase.com"],
            frameSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Middleware to parse JSON
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Active users map: { socketId: { id, username, uid, email, photoURL } }
const activeUsers = new Map();
// Mapping of usernames to socket IDs: { username: socketId }
const usernameToSocketMap = new Map();
// Mapping of Firebase UIDs to socket IDs: { uid: socketId }
const uidToSocketMap = new Map();

// Store user profile in Redis
async function storeUserProfile(uid, userProfile) {
    try {
        // Ensure username is always available
        if (!userProfile.username || userProfile.username.trim() === '') {
            if (userProfile.email) {
                // Generate username from email if available
                userProfile.username = userProfile.email.split('@')[0];
            } else {
                // Generate random username as fallback
                userProfile.username = `user_${Math.floor(Math.random() * 10000)}`;
            }
        }

        // Ensure photoURL is always available
        if (!userProfile.photoURL) {
            userProfile.photoURL = generateDefaultAvatar(userProfile.username);
        }

        await redisClient.set(`user:${uid}`, JSON.stringify(userProfile));

        // Add user to the all users list
        const allUsers = await getAllUsers();
        if (!allUsers.some(user => user.uid === uid)) {
            allUsers.push(userProfile);
            await redisClient.set('all_users', JSON.stringify(allUsers));
        } else {
            // Update existing user
            const updatedUsers = allUsers.map(user =>
                user.uid === uid ? { ...user, ...userProfile, lastSeen: Date.now() } : user
            );
            await redisClient.set('all_users', JSON.stringify(updatedUsers));
        }
    } catch (err) {
        console.error('Error storing user profile:', err);
    }
}

// Get user profile from Redis
async function getUserProfile(uid) {
    try {
        const profile = await redisClient.get(`user:${uid}`);
        return profile ? JSON.parse(profile) : null;
    } catch (err) {
        console.error('Error getting user profile:', err);
        return null;
    }
}

// Get all users from Redis
async function getAllUsers() {
    try {
        const users = await redisClient.get('all_users');
        return users ? JSON.parse(users) : [];
    } catch (err) {
        console.error('Error getting all users:', err);
        return [];
    }
}

// Get user conversations from Redis
async function getUserConversations(uid) {
    try {
        const conversations = await redisClient.get(`conversations:${uid}`);
        return conversations ? JSON.parse(conversations) : [];
    } catch (err) {
        console.error('Error getting user conversations:', err);
        return [];
    }
}

// Store user conversation in Redis
async function storeUserConversation(uid1, uid2) {
    try {
        // Store for first user
        let conversations1 = await getUserConversations(uid1);
        if (!conversations1.includes(uid2)) {
            conversations1.push(uid2);
            await redisClient.set(`conversations:${uid1}`, JSON.stringify(conversations1));
        }

        // Store for second user
        let conversations2 = await getUserConversations(uid2);
        if (!conversations2.includes(uid1)) {
            conversations2.push(uid1);
            await redisClient.set(`conversations:${uid2}`, JSON.stringify(conversations2));
        }
    } catch (err) {
        console.error('Error storing user conversation:', err);
    }
}

// Store messages in Redis
async function storeMessage(sender, receiver, message) {
    try {
        // Create a consistent conversation ID (alphabetically sorted)
        const users = [sender, receiver].sort();
        const conversationId = `conversation:${users[0]}:${users[1]}`;

        // Store message in a list for the conversation
        await redisClient.rPush(`messages:${conversationId}`, JSON.stringify(message));
        // Keep only last 100 messages per conversation
        await redisClient.lTrim(`messages:${conversationId}`, -100, -1);

        // Store the conversation link for both users
        const senderUser = await getUserProfile(message.fromUid);
        const receiverUser = await getUserProfile(message.toUid);

        if (senderUser && receiverUser) {
            await storeUserConversation(senderUser.uid, receiverUser.uid);
        }
    } catch (err) {
        console.error('Error storing message:', err);
    }
}

// Get messages from Redis
async function getMessages(user1, user2) {
    try {
        // Create a consistent conversation ID (alphabetically sorted)
        const users = [user1, user2].sort();
        const conversationId = `conversation:${users[0]}:${users[1]}`;

        const messages = await redisClient.lRange(`messages:${conversationId}`, 0, -1);
        return messages.map(msg => JSON.parse(msg));
    } catch (err) {
        console.error('Error getting messages:', err);
        return [];
    }
}

// Get all active users
function getAllActiveUsers() {
    const users = [];
    activeUsers.forEach((user) => {
        users.push({
            id: user.id,
            username: user.username,
            email: user.email,
            photoURL: user.photoURL || generateDefaultAvatar(user.username),
            uid: user.uid,
            isOnline: true
        });
    });
    return users;
}

// Generate default avatar URL based on username
function generateDefaultAvatar(username) {
    const initial = username ? username[0].toUpperCase() : 'U';
    return `https://ui-avatars.com/api/?name=${initial}&background=4f9cf6&color=fff&size=128`;
}

// Update active users list for all clients
async function updateActiveUsers() {
    // Get active users
    const activeUsersList = getAllActiveUsers();

    // Get all users from Redis
    let allUsers = await getAllUsers();

    // Mark active users as online
    const activeUserIds = activeUsersList.map(user => user.uid);
    allUsers = allUsers.map(user => ({
        ...user,
        isOnline: activeUserIds.includes(user.uid),
        photoURL: user.photoURL || generateDefaultAvatar(user.username)
    }));

    // Send the combined list to all clients
    io.emit('activeUsers', allUsers);
}

// Check if username exists in all users (both active and stored in Redis)
async function usernameExists(username) {
    // Check active users
    for (const [_, user] of activeUsers.entries()) {
        if (user.username === username) {
            return true;
        }
    }

    // Check all users in Redis
    const allUsers = await getAllUsers();
    return allUsers.some(user => user.username === username);
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // User login with Firebase authentication
    socket.on('userLogin', async (data) => {
        let { username, uid, email, photoURL } = data;

        // Ensure username is available
        if (!username || username.trim() === '') {
            if (email) {
                username = email.split('@')[0];
            } else {
                username = `user_${Math.floor(Math.random() * 10000)}`;
            }
        }

        // Check if this user already exists in Redis
        const existingUser = await getUserProfile(uid);
        if (existingUser) {
            // Use the existing username to avoid duplicates
            username = existingUser.username;
        } else {
            // For new users, check if username is already taken by any user (active or in Redis)
            const usernameIsTaken = await usernameExists(username);
            if (usernameIsTaken && !usernameToSocketMap.has(username)) {
                // If username is taken, add a suffix to make it unique
                const originalUsername = username;
                let counter = 1;
                while (await usernameExists(`${originalUsername}${counter}`)) {
                    counter++;
                }
                username = `${originalUsername}${counter}`;

                socket.emit('usernameChanged', {
                    originalUsername: originalUsername,
                    newUsername: username,
                    message: `Username "${originalUsername}" was already taken. You've been assigned "${username}" instead.`
                });
            }
        }

        console.log(`User ${socket.id} logged in as: ${username} (${email || 'No email'})`);

        // Add user to active users
        const userProfile = {
            id: socket.id,
            username,
            uid,
            email,
            photoURL: photoURL || generateDefaultAvatar(username),
            lastSeen: Date.now(),
            isOnline: true
        };

        activeUsers.set(socket.id, userProfile);
        usernameToSocketMap.set(username, socket.id);
        uidToSocketMap.set(uid, socket.id);

        // Store user profile in Redis
        await storeUserProfile(uid, userProfile);

        // Send welcome message
        socket.emit('message', {
            from: 'System',
            text: `Welcome to SoftTalks, ${username}!`,
            time: new Date().toLocaleTimeString()
        });

        // Send user's conversation history
        const conversations = await getUserConversations(uid);
        if (conversations && conversations.length > 0) {
            const conversationUsers = [];

            for (const otherUid of conversations) {
                const otherUser = await getUserProfile(otherUid);
                if (otherUser) {
                    conversationUsers.push({
                        username: otherUser.username,
                        uid: otherUser.uid,
                        photoURL: otherUser.photoURL || generateDefaultAvatar(otherUser.username),
                        email: otherUser.email,
                        lastSeen: otherUser.lastSeen || Date.now(),
                        isOnline: uidToSocketMap.has(otherUser.uid)
                    });
                }
            }

            socket.emit('conversationHistory', conversationUsers);
        }

        // Update and send the list of active users to all clients
        await updateActiveUsers();
    });

    // Initialize chat with another user
    socket.on('initChat', async ({ targetUser, targetUid }) => {
        const currentUser = activeUsers.get(socket.id);

        if (!currentUser) return;

        let messages = [];

        // If we have UIDs, use those for retrieving messages
        if (currentUser.uid && targetUid) {
            messages = await getMessages(currentUser.uid, targetUid);

            // Store this conversation for both users
            await storeUserConversation(currentUser.uid, targetUid);
        } else {
            // Fallback to usernames
            messages = await getMessages(currentUser.username, targetUser);
        }

        // Send previous messages to the user
        socket.emit('previousMessages', {
            withUser: targetUser,
            withUid: targetUid,
            messages: messages
        });
    });

    // Handle messages
    socket.on('sendMessage', async (data) => {
        const { to, toUid, text } = data;
        const fromUser = activeUsers.get(socket.id);

        if (!fromUser) return;

        const toSocketId = toUid ? uidToSocketMap.get(toUid) : usernameToSocketMap.get(to);

        const messageData = {
            from: fromUser.username,
            fromUid: fromUser.uid,
            fromEmail: fromUser.email,
            fromPhoto: fromUser.photoURL || generateDefaultAvatar(fromUser.username),
            to,
            toUid,
            text,
            time: new Date().toLocaleTimeString(),
            timestamp: Date.now()
        };

        // Store message in Redis
        await storeMessage(fromUser.uid || fromUser.username, toUid || to, messageData);

        // Send to sender
        socket.emit('message', messageData);

        // Send to receiver if online
        if (toSocketId) {
            io.to(toSocketId).emit('message', messageData);
        } else {
            // Inform sender that the user is offline
            socket.emit('messageStatus', {
                message: 'User is offline. Message will be delivered when they come online.',
                to
            });
        }
    });

    // Get all users
    socket.on('getAllUsers', async () => {
        const allUsers = await getAllUsers();
        const activeUserIds = Array.from(activeUsers.values()).map(user => user.uid);

        const usersWithStatus = allUsers.map(user => ({
            ...user,
            isOnline: activeUserIds.includes(user.uid),
            photoURL: user.photoURL || generateDefaultAvatar(user.username)
        }));

        socket.emit('allUsers', usersWithStatus);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
        const user = activeUsers.get(socket.id);

        if (user) {
            console.log(`User disconnected: ${socket.id} (${user.username})`);

            // Update user's last seen time
            const userProfile = await getUserProfile(user.uid);
            if (userProfile) {
                userProfile.lastSeen = Date.now();
                userProfile.isOnline = false;
                await storeUserProfile(user.uid, userProfile);
            }

            // Remove user from maps
            usernameToSocketMap.delete(user.username);
            uidToSocketMap.delete(user.uid);
            activeUsers.delete(socket.id);

            // Update active users list
            await updateActiveUsers();
        } else {
            console.log(`User disconnected: ${socket.id}`);
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
const server_instance = server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
    logger.info('Received shutdown signal, closing connections...');

    // Close HTTP server
    server_instance.close(() => {
        logger.info('HTTP server closed');
    });

    // Close Socket.IO connections
    io.close(() => {
        logger.info('Socket.IO connections closed');
    });

    // Close Redis connections
    try {
        await redisPublisher.quit();
        await redisSubscriber.quit();
        await redisClient.quit();
        logger.info('Redis connections closed');
    } catch (err) {
        logger.error('Error closing Redis connections:', err);
    }

    // Exit process
    setTimeout(() => {
        logger.info('Exiting process');
        process.exit(0);
    }, 1000);
} 