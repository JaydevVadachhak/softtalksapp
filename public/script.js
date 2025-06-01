// Connect to Socket.io server
const socket = io();

// DOM elements
const joinContainer = document.getElementById('join-container');
const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const roomName = document.getElementById('room-name');
const usersCount = document.getElementById('users-count');
const usersList = document.getElementById('users-list');
const joinButton = document.getElementById('join-btn');
const leaveButton = document.getElementById('leave-btn');
const usernameInput = document.getElementById('username');
const roomSelect = document.getElementById('room');
const messageInput = document.getElementById('msg');

// Private chat elements
const privateChat = document.getElementById('private-chat');
const privateChatUser = document.getElementById('private-chat-user');
const privateChatMessages = document.getElementById('private-chat-messages');
const privateChatForm = document.getElementById('private-chat-form');
const privateMessageInput = document.getElementById('private-msg');
const closePrivateChatButton = document.getElementById('close-private-chat');

// Current room, username, and private chat state
let currentRoom = '';
let currentUser = '';
let currentPrivateChatUser = '';
const privateChats = new Map(); // Store private chat messages by username

// Join a chat room
joinButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const room = roomSelect.value;

    if (!username) {
        alert('Please enter a username!');
        return;
    }

    // Set current room and username
    currentRoom = room;
    currentUser = username;

    // Join the room via socket with user data
    socket.emit('joinRoom', { username, room });

    // Update UI
    roomName.innerText = room;
    joinContainer.style.display = 'none';
    chatContainer.style.display = 'flex';

    // Clear any previous messages
    chatMessages.innerHTML = '';
    usersList.innerHTML = '';

    // Add welcome message
    addMessage({
        user: 'System',
        text: `Welcome to SoftTalks, ${username}!`,
        time: new Date().toLocaleTimeString()
    });

    console.log(`Joined room ${room} as ${username}`);
});

// Leave the chat room
leaveButton.addEventListener('click', () => {
    if (currentRoom) {
        // Leave the room via socket
        socket.emit('leaveRoom', currentRoom);

        // Reset current states
        currentRoom = '';
        currentUser = '';
        currentPrivateChatUser = '';
        privateChats.clear();

        // Update UI
        joinContainer.style.display = 'block';
        chatContainer.style.display = 'none';
        privateChat.style.display = 'none';
    }
});

// Send message to room
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const message = messageInput.value.trim();

    if (message) {
        // Emit message to server
        socket.emit('sendMessage', {
            room: currentRoom,
            user: currentUser,
            text: message
        });

        // Clear input field
        messageInput.value = '';
        messageInput.focus();

        // Add message to UI (optimistic rendering)
        addMessage({
            user: currentUser,
            text: message,
            time: new Date().toLocaleTimeString()
        }, true);
    }
});

// Send private message
privateChatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const message = privateMessageInput.value.trim();

    if (message && currentPrivateChatUser) {
        // Emit private message to server
        socket.emit('sendPrivateMessage', {
            to: currentPrivateChatUser,
            text: message
        });

        // Clear input field
        privateMessageInput.value = '';
        privateMessageInput.focus();

        // Optimistically add message to UI
        addPrivateMessage({
            from: currentUser,
            to: currentPrivateChatUser,
            text: message,
            time: new Date().toLocaleTimeString()
        }, true);
    }
});

// Display all private messages with a specific user
function displayPrivateChat(username) {
    currentPrivateChatUser = username;
    privateChatUser.textContent = username;

    // Clear previous messages
    privateChatMessages.innerHTML = '';

    // Get previous messages if any
    socket.emit('initPrivateChat', { targetUser: username });

    // Show private chat UI, hide room chat
    chatMessages.style.display = 'none';
    privateChat.style.display = 'flex';

    // Focus input
    privateMessageInput.focus();

    console.log('Opened private chat with:', username);
}

// Close private chat
closePrivateChatButton.addEventListener('click', () => {
    privateChat.style.display = 'none';
    chatMessages.style.display = 'block';
    currentPrivateChatUser = '';
    console.log('Closed private chat');
});

// Add message to room chat
function addMessage(message, isSent = false) {
    const div = document.createElement('div');
    div.classList.add('message');

    // Add sent or received class based on who sent the message
    if (isSent) {
        div.classList.add('sent');
    } else if (message.user !== 'System' && message.user !== currentUser) {
        div.classList.add('received');
    }

    div.innerHTML = `
        <div class="meta">
            <span class="name">${message.user}</span>
            <span class="time">${message.time}</span>
        </div>
        <p class="text">${message.text}</p>
    `;

    chatMessages.appendChild(div);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add private message to private chat
function addPrivateMessage(message, isSent = false) {
    // Store the message in memory
    const otherUser = isSent ? message.to : message.from;
    if (!privateChats.has(otherUser)) {
        privateChats.set(otherUser, []);
    }
    privateChats.get(otherUser).push(message);

    // If this is the current open private chat, add to UI
    if (currentPrivateChatUser === otherUser) {
        const div = document.createElement('div');
        div.classList.add('private-message');
        div.classList.add(isSent ? 'sent' : 'received');

        div.innerHTML = `
            <div class="meta">
                <span class="name">${isSent ? 'You' : message.from}</span>
                <span class="time">${message.time}</span>
            </div>
            <p class="text">${message.text}</p>
        `;

        privateChatMessages.appendChild(div);

        // Scroll to bottom
        privateChatMessages.scrollTop = privateChatMessages.scrollHeight;
    }
}

// Update user list in sidebar
function updateUsersList(users) {
    usersList.innerHTML = '';
    usersCount.textContent = users.length;

    users.forEach(user => {
        if (user.username !== currentUser) {
            const li = document.createElement('li');
            li.classList.add('user-item');

            // Get first letter for avatar
            const firstLetter = user.username.charAt(0).toUpperCase();

            li.innerHTML = `
                <div class="user-avatar">${firstLetter}</div>
                <div class="user-name">${user.username}</div>
            `;

            // Add click event to open private chat
            li.addEventListener('click', () => {
                console.log(`Starting private chat with: ${user.username}`);
                displayPrivateChat(user.username);
            });

            usersList.appendChild(li);
        }
    });

    // Debug output
    console.log('Updated users list:', users);
}

// Listen for messages from server (room chat)
socket.on('message', (message) => {
    // Don't display our own messages again (already handled by optimistic rendering)
    if (message.user === currentUser && message.text) {
        return;
    }

    addMessage(message);
});

// Listen for previous messages for room chat
socket.on('previousMessages', (messages) => {
    console.log('Received previous messages:', messages.length);
    if (messages.length === 0) return;

    // Add a separator for previous messages
    const separator = document.createElement('div');
    separator.classList.add('message-separator');
    separator.innerHTML = '<p>Previous messages</p>';
    chatMessages.appendChild(separator);

    // Add each previous message
    messages.forEach(message => {
        addMessage(message);
    });

    // Add a separator after previous messages
    const endSeparator = document.createElement('div');
    endSeparator.classList.add('message-separator');
    endSeparator.innerHTML = '<p>New messages</p>';
    chatMessages.appendChild(endSeparator);
});

// Listen for private messages
socket.on('privateMessage', (message) => {
    // Don't display our messages twice (already handled by optimistic rendering)
    if (message.from === currentUser) {
        return;
    }

    // Add the message
    addPrivateMessage(message);

    // If the private chat isn't open with this user, notify them
    if (currentPrivateChatUser !== message.from) {
        // Find user in list and highlight them
        const userItems = usersList.querySelectorAll('.user-item');
        userItems.forEach(item => {
            const userName = item.querySelector('.user-name').textContent;
            if (userName === message.from) {
                item.style.backgroundColor = '#ffebee'; // Light red background

                // Add notification
                const notification = document.createElement('div');
                notification.classList.add('notification-dot');
                if (!item.querySelector('.notification-dot')) {
                    item.appendChild(notification);
                }
            }
        });
    }
});

// Listen for previous private messages
socket.on('previousPrivateMessages', ({ withUser, messages }) => {
    console.log(`Received previous private messages with ${withUser}:`, messages.length);
    if (messages.length === 0) return;

    // Store messages
    privateChats.set(withUser, messages);

    // If this user's chat is currently open, display messages
    if (currentPrivateChatUser === withUser) {
        // Add separator
        const separator = document.createElement('div');
        separator.classList.add('message-separator');
        separator.innerHTML = '<p>Previous messages</p>';
        privateChatMessages.appendChild(separator);

        // Add messages
        messages.forEach(message => {
            const div = document.createElement('div');
            div.classList.add('private-message');

            // Determine if message is sent or received
            const isSent = message.from === currentUser;
            div.classList.add(isSent ? 'sent' : 'received');

            div.innerHTML = `
                <div class="meta">
                    <span class="name">${isSent ? 'You' : message.from}</span>
                    <span class="time">${message.time}</span>
                </div>
                <p class="text">${message.text}</p>
            `;

            privateChatMessages.appendChild(div);
        });

        // Add end separator
        const endSeparator = document.createElement('div');
        endSeparator.classList.add('message-separator');
        endSeparator.innerHTML = '<p>New messages</p>';
        privateChatMessages.appendChild(endSeparator);

        // Scroll to bottom
        privateChatMessages.scrollTop = privateChatMessages.scrollHeight;
    }
});

// Listen for private message errors
socket.on('privateMessageError', ({ message, to }) => {
    console.error(`Private message error to ${to}:`, message);

    // Add error message to private chat
    const div = document.createElement('div');
    div.classList.add('private-message', 'error');
    div.innerHTML = `
        <div class="meta">
            <span class="name">System</span>
            <span class="time">${new Date().toLocaleTimeString()}</span>
        </div>
        <p class="text">Error: ${message}</p>
    `;

    privateChatMessages.appendChild(div);
});

// Listen for room users update
socket.on('roomUsers', ({ room, users }) => {
    if (room === currentRoom) {
        updateUsersList(users);
    }
});

// Handle socket connection errors
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    addMessage({
        user: 'System',
        text: 'Connection error. Please try again later.',
        time: new Date().toLocaleTimeString()
    });
});

// Focus on username input when page loads
window.addEventListener('load', () => {
    usernameInput.focus();
}); 