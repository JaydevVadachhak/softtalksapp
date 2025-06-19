// Connect to Socket.io server
const socket = io();

// DOM elements - Authentication
const loginContainer = document.getElementById('login-container');
const emailTab = document.getElementById('email-tab');
const signupTab = document.getElementById('signup-tab');
const emailLoginForm = document.getElementById('email-login-form');
const signupForm = document.getElementById('signup-form');
const emailLoginBtn = document.getElementById('email-login-btn');
const signupBtn = document.getElementById('signup-btn');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const signupUsername = document.getElementById('signup-username');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const authError = document.getElementById('auth-error');
const authSuccess = document.getElementById('auth-success');
const forgotPassword = document.getElementById('forgot-password');

// DOM elements - Password Reset Modal
const passwordResetModal = document.getElementById('password-reset-modal');
const resetEmail = document.getElementById('reset-email');
const resetPasswordBtn = document.getElementById('reset-password-btn');
const resetMessage = document.getElementById('reset-message');
const closeModal = document.querySelector('.close-modal');

// DOM elements - Chat
const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const currentUsername = document.getElementById('current-username');
const userEmail = document.getElementById('user-email');
const userPhoto = document.getElementById('user-photo');
const usersCount = document.getElementById('users-count');
const usersList = document.getElementById('users-list');
const logoutButton = document.getElementById('logout-btn');
const messageInput = document.getElementById('msg');
const welcomeScreen = document.getElementById('welcome-screen');
const chatMessagesContainer = document.getElementById('chat-messages-container');
const chatUser = document.getElementById('chat-user');
const chatUserPhoto = document.getElementById('chat-user-photo');
const userStatus = document.getElementById('user-status');

// Current user and chat state
let currentUser = '';
let currentUserData = null;
let currentChatUser = '';
let currentChatUserUid = '';
const conversations = new Map(); // Store chat messages by username
const allUsers = new Map(); // Store all users

// Authentication tab switching
emailTab.addEventListener('click', () => {
    emailTab.classList.add('active');
    signupTab.classList.remove('active');
    emailLoginForm.style.display = 'block';
    signupForm.style.display = 'none';
    clearAuthMessages();
});

signupTab.addEventListener('click', () => {
    emailTab.classList.remove('active');
    signupTab.classList.add('active');
    emailLoginForm.style.display = 'none';
    signupForm.style.display = 'block';
    clearAuthMessages();
});

// Clear authentication messages
function clearAuthMessages() {
    authError.style.display = 'none';
    authSuccess.style.display = 'none';
    authError.textContent = '';
    authSuccess.textContent = '';
}

// Show error message
function showError(message) {
    authError.textContent = message;
    authError.style.display = 'block';
    authSuccess.style.display = 'none';
}

// Show success message
function showSuccess(message) {
    authSuccess.textContent = message;
    authSuccess.style.display = 'block';
    authError.style.display = 'none';
}

// Email login
emailLoginBtn.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }

    try {
        clearAuthMessages();
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('User logged in:', userCredential.user);
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message);
    }
});

// Sign up
signupBtn.addEventListener('click', async () => {
    const username = signupUsername.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();

    if (!username || !email || !password) {
        showError('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }

    try {
        clearAuthMessages();
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);

        // Update profile with username
        await userCredential.user.updateProfile({
            displayName: username,
            photoURL: generateDefaultAvatar(username)
        });

        console.log('User created:', userCredential.user);
        showSuccess('Account created successfully! You can now log in.');

        // Switch to login tab
        emailTab.click();
    } catch (error) {
        console.error('Signup error:', error);
        showError(error.message);
    }
});

// Password reset
forgotPassword.addEventListener('click', () => {
    passwordResetModal.style.display = 'block';
    resetEmail.value = loginEmail.value || '';
});

closeModal.addEventListener('click', () => {
    passwordResetModal.style.display = 'none';
    resetMessage.textContent = '';
    resetMessage.className = 'message';
});

resetPasswordBtn.addEventListener('click', async () => {
    const email = resetEmail.value.trim();

    if (!email) {
        resetMessage.textContent = 'Please enter your email';
        resetMessage.className = 'message error-message';
        return;
    }

    try {
        await auth.sendPasswordResetEmail(email);
        resetMessage.textContent = 'Password reset email sent. Check your inbox.';
        resetMessage.className = 'message success-message';
    } catch (error) {
        console.error('Password reset error:', error);
        resetMessage.textContent = error.message;
        resetMessage.className = 'message error-message';
    }
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === passwordResetModal) {
        passwordResetModal.style.display = 'none';
    }
});

// Generate default avatar URL based on username
function generateDefaultAvatar(username) {
    const initial = username ? username[0].toUpperCase() : 'U';
    return `https://ui-avatars.com/api/?name=${initial}&background=4f9cf6&color=fff&size=128`;
}

// Firebase auth state change listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // User is signed in
        let username = user.displayName;

        // If no display name, generate from email
        if (!username || username.trim() === '') {
            if (user.email) {
                username = user.email.split('@')[0];
            } else {
                username = `user_${Math.floor(Math.random() * 10000)}`;
            }

            // Try to update Firebase profile with generated username
            try {
                await user.updateProfile({
                    displayName: username
                });
                console.log('Updated user profile with generated username:', username);
            } catch (error) {
                console.error('Error updating user profile:', error);
            }
        }

        currentUserData = {
            uid: user.uid,
            email: user.email,
            username: username,
            photoURL: user.photoURL || generateDefaultAvatar(username)
        };

        currentUser = currentUserData.username;

        // Update UI
        currentUsername.innerText = currentUserData.username;
        userEmail.innerText = currentUserData.email || '';
        userPhoto.src = currentUserData.photoURL;

        // Show chat container, hide login
        loginContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
        welcomeScreen.style.display = 'flex';
        chatMessagesContainer.style.display = 'none';

        // Connect to chat server with user data
        socket.emit('userLogin', currentUserData);

        // Request all users
        socket.emit('getAllUsers');

        console.log('User authenticated:', currentUserData);
    } else {
        // User is signed out
        currentUser = '';
        currentUserData = null;
        currentChatUser = '';
        currentChatUserUid = '';

        // Don't clear conversations and users list - keep them for when user logs back in
        // conversations.clear();

        // Clear any previous messages
        chatMessages.innerHTML = '';

        // Show login container, hide chat
        loginContainer.style.display = 'block';
        chatContainer.style.display = 'none';

        console.log('User signed out');
    }
});

// Logout
logoutButton.addEventListener('click', async () => {
    try {
        await auth.signOut();
        socket.disconnect();
        socket.connect(); // Reconnect socket for future logins
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Send message
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const message = messageInput.value.trim();

    if (message && currentChatUser) {
        // Emit message to server
        socket.emit('sendMessage', {
            to: currentChatUser,
            toUid: currentChatUserUid,
            text: message
        });

        // Clear input field
        messageInput.value = '';
        messageInput.focus();
    }
});

// Start chat with a user
function startChat(username, uid, photoURL) {
    if (username === currentUser) return; // Can't chat with yourself

    currentChatUser = username;
    currentChatUserUid = uid;
    chatUser.textContent = username;

    // Always ensure chat user has a photo
    const userPhoto = photoURL || generateDefaultAvatar(username);
    chatUserPhoto.src = userPhoto;

    // Get user from allUsers map to check online status
    const user = allUsers.get(username);
    if (user) {
        // Update the status in the chat header to match the sidebar
        userStatus.textContent = user.isOnline ? 'Online' : `Last seen: ${formatLastSeen(user.lastSeen)}`;
        if (user.isOnline) {
            userStatus.classList.remove('offline');
        } else {
            userStatus.classList.add('offline');
        }
    }

    // Clear previous messages
    chatMessages.innerHTML = '';

    // Get previous messages if any
    socket.emit('initChat', {
        targetUser: username,
        targetUid: uid
    });

    // Show chat UI, hide welcome screen
    welcomeScreen.style.display = 'none';
    chatMessagesContainer.style.display = 'flex';

    // Focus input
    messageInput.focus();

    // Remove notification if any
    removeNotification(username);

    console.log('Started chat with:', username, uid);
}

// Add message to chat
function addMessage(message) {
    // Store the message in memory
    const otherUser = message.from === currentUser ? message.to : message.from;
    if (!conversations.has(otherUser)) {
        conversations.set(otherUser, []);
    }
    conversations.get(otherUser).push(message);

    // If this is the current open chat, add to UI
    if (currentChatUser === otherUser || message.from === currentUser) {
        const div = document.createElement('div');
        div.classList.add('message');

        // Add sent or received class
        if (message.from === currentUser) {
            div.classList.add('sent');
        } else {
            div.classList.add('received');
        }

        // Ensure message has a photo URL
        const photoURL = message.fromPhoto || generateDefaultAvatar(message.from);

        div.innerHTML = `
            <div class="message-content">
                <img class="message-avatar" src="${photoURL}" alt="${message.from}">
                <div class="message-bubble">
                    <div class="meta">
                        <span class="name">${message.from === currentUser ? 'You' : message.from}</span>
                        <span class="time">${message.time}</span>
                    </div>
                    <p class="text">${message.text}</p>
                </div>
            </div>
        `;

        chatMessages.appendChild(div);

        // Clear any floats before scrolling
        const clearDiv = document.createElement('div');
        clearDiv.style.clear = 'both';
        chatMessages.appendChild(clearDiv);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        // Add notification for message from user not currently in chat with
        addNotification(message.from);
    }
}

// Add notification to user in list
function addNotification(username) {
    const userItems = usersList.querySelectorAll('.user-item');
    userItems.forEach(item => {
        const userName = item.querySelector('.user-name').textContent;
        if (userName === username) {
            item.style.backgroundColor = '#ffebee'; // Light red background

            // Add notification dot if not already there
            if (!item.querySelector('.notification-dot')) {
                const notification = document.createElement('div');
                notification.classList.add('notification-dot');
                item.appendChild(notification);
            }
        }
    });
}

// Remove notification from user in list
function removeNotification(username) {
    const userItems = usersList.querySelectorAll('.user-item');
    userItems.forEach(item => {
        const userName = item.querySelector('.user-name').textContent;
        if (userName === username) {
            item.style.backgroundColor = ''; // Reset background

            // Remove notification dot if exists
            const dot = item.querySelector('.notification-dot');
            if (dot) {
                dot.remove();
            }
        }
    });
}

// Format time since last seen
function formatLastSeen(timestamp) {
    if (!timestamp) return 'Unknown';

    const now = Date.now();
    const diff = now - timestamp;

    // Less than a minute
    if (diff < 60000) {
        return 'Just now';
    }

    // Less than an hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    // Less than a day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }

    // More than a day
    const days = Math.floor(diff / 86400000);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

// Update users list
function updateUsersList(users) {
    usersList.innerHTML = '';

    // Update all users map
    users.forEach(user => {
        allUsers.set(user.username, user);
    });

    // Count online users
    const onlineUsers = users.filter(user => user.isOnline && user.username !== currentUser);
    usersCount.textContent = onlineUsers.length;

    // First show users with conversations
    const usersWithConversations = users.filter(user =>
        user.username !== currentUser && conversations.has(user.username)
    );

    // Then show other users
    const otherUsers = users.filter(user =>
        user.username !== currentUser && !conversations.has(user.username)
    );

    // Sort users with conversations by last message time
    usersWithConversations.sort((a, b) => {
        const aConv = conversations.get(a.username);
        const bConv = conversations.get(b.username);

        if (!aConv || aConv.length === 0) return 1;
        if (!bConv || bConv.length === 0) return -1;

        const aLastMsg = aConv[aConv.length - 1];
        const bLastMsg = bConv[bConv.length - 1];

        return (bLastMsg.timestamp || 0) - (aLastMsg.timestamp || 0);
    });

    // Create conversation section if needed
    if (usersWithConversations.length > 0) {
        const conversationsHeader = document.createElement('div');
        conversationsHeader.classList.add('users-section-header');
        conversationsHeader.textContent = 'Conversations';
        usersList.appendChild(conversationsHeader);

        // Add users with conversations
        usersWithConversations.forEach(user => addUserToList(user));
    }

    // Create other users section if needed
    if (otherUsers.length > 0) {
        const othersHeader = document.createElement('div');
        othersHeader.classList.add('users-section-header');
        othersHeader.textContent = 'Other Users';
        usersList.appendChild(othersHeader);

        // Add other users
        otherUsers.forEach(user => addUserToList(user));
    }

    console.log('Updated users list:', users);
}

// Add a single user to the users list
function addUserToList(user) {
    const li = document.createElement('li');
    li.classList.add('user-item');

    if (!user.isOnline) {
        li.classList.add('offline');
    }

    // Use photo URL or generate placeholder
    const photoURL = user.photoURL || generateDefaultAvatar(user.username);

    // Get last message if any
    let lastMessageText = '';
    if (conversations.has(user.username)) {
        const userConversation = conversations.get(user.username);
        if (userConversation.length > 0) {
            const lastMessage = userConversation[userConversation.length - 1];
            lastMessageText = `<div class="last-message">${lastMessage.text.substring(0, 20)}${lastMessage.text.length > 20 ? '...' : ''}</div>`;
        }
    }

    // Last seen info
    const lastSeenText = user.isOnline
        ? '<span class="online-status">Online</span>'
        : `<span class="last-seen">Last seen: ${formatLastSeen(user.lastSeen)}</span>`;

    li.innerHTML = `
        <img class="user-photo" src="${photoURL}" alt="${user.username}">
        <div class="user-info">
            <div class="user-name">${user.username}</div>
            ${lastMessageText}
            ${lastSeenText}
        </div>
    `;

    // Add click event to start chat
    li.addEventListener('click', () => {
        console.log(`Starting chat with: ${user.username}`);
        startChat(user.username, user.uid, user.photoURL);
    });

    usersList.appendChild(li);
}

// Listen for messages
socket.on('message', (message) => {
    addMessage(message);
});

// Listen for previous messages
socket.on('previousMessages', ({ withUser, withUid, messages }) => {
    console.log(`Received previous messages with ${withUser}:`, messages.length);
    if (messages.length === 0) return;

    // Store messages
    conversations.set(withUser, messages);

    // If this user's chat is currently open, display messages
    if (currentChatUser === withUser) {
        // Clear previous messages
        chatMessages.innerHTML = '';

        // Add separator
        const separator = document.createElement('div');
        separator.classList.add('message-separator');
        separator.innerHTML = '<p>Previous messages</p>';
        chatMessages.appendChild(separator);

        // Add messages
        messages.forEach(message => {
            const div = document.createElement('div');
            div.classList.add('message');

            // Determine if message is sent or received
            const isSent = message.from === currentUser;
            div.classList.add(isSent ? 'sent' : 'received');

            // Ensure message has a photo URL
            const photoURL = isSent
                ? (currentUserData.photoURL || generateDefaultAvatar(currentUser))
                : (message.fromPhoto || generateDefaultAvatar(message.from));

            div.innerHTML = `
                <div class="message-content">
                    <img class="message-avatar" src="${photoURL}" alt="${message.from}">
                    <div class="message-bubble">
                        <div class="meta">
                            <span class="name">${isSent ? 'You' : message.from}</span>
                            <span class="time">${message.time}</span>
                        </div>
                        <p class="text">${message.text}</p>
                    </div>
                </div>
            `;

            chatMessages.appendChild(div);

            // Add clear div after each message
            const clearDiv = document.createElement('div');
            clearDiv.style.clear = 'both';
            chatMessages.appendChild(clearDiv);
        });

        // Add end separator
        const endSeparator = document.createElement('div');
        endSeparator.classList.add('message-separator');
        endSeparator.innerHTML = '<p>New messages</p>';
        chatMessages.appendChild(endSeparator);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Update users list to show conversation
    if (allUsers.size > 0) {
        const usersArray = Array.from(allUsers.values());
        updateUsersList(usersArray);
    }
});

// Listen for conversation history
socket.on('conversationHistory', (users) => {
    console.log('Received conversation history:', users);

    // Add users to the list
    users.forEach(user => {
        if (!allUsers.has(user.username)) {
            allUsers.set(user.username, user);
        }
    });

    // Update the UI
    updateUsersList(Array.from(allUsers.values()));
});

// Listen for message status updates
socket.on('messageStatus', ({ message, to, lastSeen }) => {
    console.log(`Message status for ${to}:`, message);

    // If this is the current chat, show status
    if (currentChatUser === to) {
        userStatus.textContent = `Last seen: ${formatLastSeen(lastSeen)}`;
        userStatus.classList.add('offline');

        // Add system message
        const div = document.createElement('div');
        div.classList.add('message');
        div.classList.add('system-message');
        div.style.textAlign = 'center';
        div.style.float = 'none';
        div.style.clear = 'both';
        div.style.backgroundColor = '#f1f1f1';
        div.style.color = '#666';
        div.style.margin = '10px auto';
        div.style.maxWidth = '80%';
        div.style.padding = '5px 10px';
        div.style.borderRadius = '15px';
        div.style.fontSize = '12px';

        // System avatar
        const systemAvatar = 'https://ui-avatars.com/api/?name=S&background=777777&color=fff&size=128';

        div.innerHTML = `
            <div class="message-content">
                <img class="message-avatar system-avatar" src="${systemAvatar}" alt="System">
                <div class="message-bubble">
                    <div class="meta">
                        <span class="name">System</span>
                        <span class="time">${new Date().toLocaleTimeString()}</span>
                    </div>
                    <p class="text">${message}</p>
                </div>
            </div>
        `;

        chatMessages.appendChild(div);

        // Add clear div
        const clearDiv = document.createElement('div');
        clearDiv.style.clear = 'both';
        chatMessages.appendChild(clearDiv);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

// Listen for active users update
socket.on('activeUsers', (users) => {
    updateUsersList(users);

    // Update status of current chat user if applicable
    if (currentChatUser) {
        const currentChatUserData = users.find(user => user.username === currentChatUser);
        if (currentChatUserData) {
            const isOnline = currentChatUserData.isOnline;
            userStatus.textContent = isOnline ? 'Online' : `Last seen: ${formatLastSeen(currentChatUserData.lastSeen)}`;
            if (isOnline) {
                userStatus.classList.remove('offline');
            } else {
                userStatus.classList.add('offline');
            }
        }
    }
});

// Listen for all users
socket.on('allUsers', (users) => {
    console.log('Received all users:', users);
    updateUsersList(users);
});

// Listen for login errors
socket.on('loginError', (data) => {
    showError(data.message);
});

// Handle socket connection errors
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    showError('Connection error. Please try again later.');
});

// Listen for username change notifications
socket.on('usernameChanged', (data) => {
    console.log('Username changed:', data);

    // Update current user data
    if (currentUserData) {
        currentUserData.username = data.newUsername;
        currentUser = data.newUsername;

        // Update UI
        currentUsername.innerText = data.newUsername;
    }

    // Show notification
    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add('system-message');
    div.style.textAlign = 'center';
    div.style.float = 'none';
    div.style.clear = 'both';
    div.style.backgroundColor = '#f1f1f1';
    div.style.color = '#666';
    div.style.margin = '10px auto';
    div.style.maxWidth = '80%';
    div.style.padding = '5px 10px';
    div.style.borderRadius = '15px';
    div.style.fontSize = '12px';

    // System avatar
    const systemAvatar = 'https://ui-avatars.com/api/?name=S&background=777777&color=fff&size=128';

    div.innerHTML = `
        <div class="message-content">
            <img class="message-avatar system-avatar" src="${systemAvatar}" alt="System">
            <div class="message-bubble">
                <div class="meta">
                    <span class="name">System</span>
                    <span class="time">${new Date().toLocaleTimeString()}</span>
                </div>
                <p class="text">${data.message}</p>
            </div>
        </div>
    `;

    chatMessages.appendChild(div);

    // Add clear div
    const clearDiv = document.createElement('div');
    clearDiv.style.clear = 'both';
    chatMessages.appendChild(clearDiv);
});

// Focus on email input when page loads
window.addEventListener('load', () => {
    loginEmail.focus();
}); 