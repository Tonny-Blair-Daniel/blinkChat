const socket = io();

const user = JSON.parse(localStorage.getItem('user')) || {};
const messageBox = document.getElementById('message_box');
const chatMessages = document.getElementById('chatMessages');
const friendList = document.getElementById('friendList');
const otherUsers = document.getElementById('otherUsers');
const currentChatUser = document.getElementById('currentChatUser');
const chatForm = document.getElementById('chatForm');
const searchBar = document.getElementById('searchBar');
const currentUserNameDisplay = document.getElementById('currentUserNameDisplay');
const currentUserAvatarLetter = document.getElementById('currentUserAvatarLetter');
const sidebar = document.getElementById("sidebar");
const toggleSidebar = document.getElementById("toggleSidebar");
const currentChatUserDesktop = document.getElementById("currentChatUserDesktop");

toggleSidebar?.addEventListener("click", () => {
    sidebar.classList.toggle("-translate-x-full");
});
       
function syncChatUserDisplay(username) {
    currentChatUser.textContent = username;  
    currentChatUserDesktop.textContent = username;  

    const avatarLetter = username?.charAt(0)?.toUpperCase() || '?';
    document.getElementById('currentChatUserAvatarMobile').textContent = avatarLetter;
    document.getElementById('currentChatUserAvatarDesktop').textContent = avatarLetter;
}

document.addEventListener("click", (e) => {
     if (
        !sidebar.contains(e.target) &&
        !toggleSidebar.contains(e.target) &&
        window.innerWidth < 768
    ) {
        sidebar.classList.add("-translate-x-full");
        }
});

let currentChatId = null;
let currentChatUsername = '';
const onlineUsersStatus = {};
let persistentUnreadCounts = {};

async function validateUser() {
    if (!user.id) {
        console.error('No user ID found in localStorage');
        window.location.href = 'login.html';
        return false;
    }
    try {
        console.log(`Validating user ID: ${user.id}`);
        const res = await fetch(`/api/user/validate/${user.id}`);
        const data = await res.json();
        if (!res.ok) {
            console.error('User validation failed:', data.msg || 'Unknown error');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return false;
        }
        console.log('User validated successfully:', user.id);
        return true;
    } catch (err) {
        console.error('Network error validating user:', err);
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return false;
    }
}

if (user.id && user.username) {
    currentUserNameDisplay.textContent = user.username;
    currentUserAvatarLetter.textContent = user.username.charAt(0).toUpperCase();
    socket.emit('setUserId', user.id);
    validateUser().then(isValid => {
        if (isValid) fetchUnreadCounts();
    });
} else {
    console.error('Missing user data:', user);
    window.location.href = 'login.html';
}

async function fetchUnreadCounts() {
    try {
        console.log(`Fetching unread counts for user: ${user.id}`);
        const res = await fetch(`/api/message/unread/${user.id}`);
        if (res.ok) {
            persistentUnreadCounts = await res.json();
            console.log("Fetched unread counts:", persistentUnreadCounts);
            loadFriends();
            loadOtherUsers();
        } else {
            console.error("Failed to fetch unread counts:", await res.json());
        }
    } catch (err) {
        console.error("Network error fetching unread counts:", err);
    }
}

async function loadFriends() {
    try {
        const res = await fetch(`/api/user/friends/${user.id}`);
        const friends = await res.json();
        friendList.innerHTML = '';
        friends.forEach(f => {
            const li = document.createElement('li');
            const isOnline = onlineUsersStatus[f._id] ? 'text-green-500' : 'text-gray-400';
            const unread = persistentUnreadCounts[f._id] || 0;
            const unreadBadge = unread > 0 ? `<span class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">${unread}</span>` : '';

            li.className = 'flex justify-between items-center p-2 hover:bg-gray-100 rounded cursor-pointer';
            li.setAttribute('data-user-id', f._id);
            li.innerHTML = `
                <div class="flex items-center justify-between flex-1" onclick="startChat('${f._id}', '${f.username}')">
                    <span>${f.username}</span>
                    <div class="flex items-center space-x-2">
                        <span class="text-xs ${isOnline}">•</span>
                        ${unreadBadge}
                    </div>
                </div>
                <button onclick="removeFriend('${f._id}')" class="text-red-500 hover:text-red-700 ml-2">❌</button>
            `;
            friendList.appendChild(li);
        });
    } catch (err) {
        console.error('Error loading friends:', err);
    }
}

async function loadOtherUsers() {
    try {
        const res = await fetch(`/api/user/others/${user.id}`);
        const users = await res.json();
        otherUsers.innerHTML = '';
        users.forEach(u => {
            const li = document.createElement('li');
            const isOnline = onlineUsersStatus[u._id] ? 'text-green-500' : 'text-gray-400';
            li.className = 'flex justify-between items-center p-2 hover:bg-gray-100 rounded';
            li.innerHTML = `
                <span>${u.username}</span>
                <span class="text-xs ${isOnline}">•</span>
                <button onclick="addFriend('${u._id}')" class="text-green-500 hover:text-green-700 ml-2">➕</button>
            `;
            otherUsers.appendChild(li);
        });
    } catch (err) {
        console.error('Error loading other users:', err);
    }
}

async function startChat(receiverId, username) {
    // Hide sidebar on mobile
    if (window.innerWidth < 768) {
        sidebar.classList.add('-translate-x-full');
    }


    if (currentChatId === receiverId) return;

    currentChatId = receiverId;
    currentChatUsername = username;
    syncChatUserDisplay(username); // Sync mobile and desktop headers
    chatMessages.innerHTML = '';

    try {
        await fetch('/api/message/markAsRead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ readerId: user.id, chatPartnerId: receiverId })
        });
        console.log("Messages marked as read.");
        persistentUnreadCounts[receiverId] = 0;
        loadFriends();
    } catch (err) {
        console.error("Failed to mark messages as read:", err);
    }

    const roomId = [user.id, receiverId].sort().join('_');
    socket.emit('joinRoom', { senderId: user.id, receiverId: receiverId });

    try {
        const res = await fetch(`/api/message/${user.id}/${receiverId}`);
        const messages = await res.json();
        messages.forEach(msg => {
            addMessageBubble(msg._id, msg.content, msg.sender === user.id ? 'sent' : 'received', msg.timestamp);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
        console.error('Error loading messages:', err);
    }
}

async function addFriend(friendId) {
    try {
        await fetch(`/api/user/friends/${user.id}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendId })
        });
        loadFriends();
        loadOtherUsers();
        fetchUnreadCounts();
    } catch (err) {
        console.error('Error adding friend:', err);
    }
}

async function removeFriend(friendId) {
    try {
        await fetch(`/api/user/friends/${user.id}/remove/${friendId}`, { method: 'DELETE' });
        loadFriends();
        loadOtherUsers();
        if (friendId === currentChatId) {
            currentChatId = null;
            currentChatUsername = '';
            currentChatUser.textContent = 'Select a user to chat';
            chatMessages.innerHTML = '';
        }
        if (persistentUnreadCounts[friendId]) {
            delete persistentUnreadCounts[friendId];
        }
    } catch (err) {
        console.error('Error removing friend:', err);
    }
}

function addMessageBubble(messageId, messageText, type, timestamp) {
    const bubble = document.createElement('div');
    bubble.className = `p-3 rounded-lg max-w-xs ${type === 'sent' ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-200 text-gray-800 mr-auto'} mb-2`;
    bubble.setAttribute('data-message-id', messageId);

    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    bubble.innerHTML = `
        <div>${messageText}</div>
        <small class="text-xs ${type === 'sent' ? 'text-blue-200' : 'text-gray-500'}">${timeString}</small>
    `;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentChatId) {
        alert('Select a user to chat with');
        return;
    }

    const text = messageBox.value.trim();
    if (!text) return;

    socket.emit('sendMessage', {
        sender: user.id,
        receiver: currentChatId,
        content: text
    });

    messageBox.value = '';
});

socket.on('receiveMessage', msg => {
    if ((msg.sender === currentChatId && msg.receiver === user.id) || (msg.sender === user.id && msg.receiver === currentChatId)) {
        addMessageBubble(msg._id, msg.content, msg.sender === user.id ? 'sent' : 'received', msg.timestamp);
        if (msg.sender === currentChatId && msg.receiver === user.id) {
            persistentUnreadCounts[msg.sender] = 0;
            loadFriends();
            fetch('/api/message/markAsRead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ readerId: user.id, chatPartnerId: msg.sender })
            }).catch(err => console.error("Error marking message as read:", err));
        }
    } else if (msg.receiver === user.id) {
        persistentUnreadCounts[msg.sender] = (persistentUnreadCounts[msg.sender] || 0) + 1;
        loadFriends();
    }
});

socket.on('updateUnreadCounts', () => {
    console.log('Received updateUnreadCounts event');
    fetchUnreadCounts();
});

socket.on('messageDeleted', ({ messageId, senderId }) => {
    console.log(`Received messageDeleted event for message ${messageId} from ${senderId}`);
    const bubble = chatMessages.querySelector(`[data-message-id="${messageId}"]`);
    if (bubble) {
        bubble.style.transition = 'opacity 0.5s';
        bubble.style.opacity = '0';
        setTimeout(() => bubble.remove(), 500);
    }
    persistentUnreadCounts[senderId] = Math.max(0, (persistentUnreadCounts[senderId] || 1) - 1);
    if (persistentUnreadCounts[senderId] === 0) {
        delete persistentUnreadCounts[senderId];
    }
    loadFriends();
});

socket.on('userOnlineStatus', (onlineUsersMap) => {
    for (const userId in onlineUsersStatus) {
        onlineUsersStatus[userId] = false;
    }
    for (const userId in onlineUsersMap) {
        onlineUsersStatus[userId] = true;
    }
    loadFriends();
    loadOtherUsers();
});

socket.on('error', ({ msg }) => {
    alert(msg);
});

searchBar.addEventListener('input', () => {
    const searchTerm = searchBar.value.toLowerCase();
    const filterList = (listElement) => {
        const items = listElement.querySelectorAll('li');
        items.forEach(item => {
            const usernameSpan = item.querySelector('.flex-1 > span:first-child') || item.querySelector('span:first-child');
            if (usernameSpan && usernameSpan.textContent.toLowerCase().includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    };
    filterList(friendList);
    filterList(otherUsers);
});