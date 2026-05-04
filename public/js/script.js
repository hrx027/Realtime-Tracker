const socket = io();

// Use the authenticated name from the server
const username = USER_NAME;

const map = L.map("map").setView([0, 0], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
}).addTo(map);

const markers = {};
const userListElement = document.getElementById('user-list');
const userData = {}; // To store the latest coords for each user

// Chat Elements
const chatContainer = document.getElementById('chat-container');
const chatHeader = document.getElementById('chat-header');
const toggleChatBtn = document.getElementById('toggle-chat');
const chatBadge = document.getElementById('chat-badge');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

let unreadCount = 0;
let isChatExpanded = false;

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude, username });
            map.setView([latitude, longitude], 16);
        },
        (error) => {
            console.error(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

function updateUserListUI() {
    userListElement.innerHTML = '';
    Object.keys(userData).forEach(id => {
        // Only show other people in the list, skip the current user
        if (userData[id].username === username) return;

        const li = document.createElement('li');
        li.innerHTML = `📍 <strong>${userData[id].username}</strong>`;
        li.onclick = () => {
            const { latitude, longitude } = userData[id];
            map.flyTo([latitude, longitude], 18);
            if (markers[id]) {
                markers[id].openPopup();
            }
        };
        userListElement.appendChild(li);
    });
}

function handleReceiveLocation(data) {
    const { id, latitude, longitude, username: otherUser } = data;
    
    // Store user data for the list
    userData[id] = { latitude, longitude, username: otherUser };
    updateUserListUI();

    // Style the label with a transparent background
    const labelContent = `<div style="background: rgba(255, 255, 255, 0.6); padding: 5px; border-radius: 5px; border: 1px solid rgba(0,0,0,0.1); font-weight: bold;">${otherUser}</div>`;

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
        markers[id].getPopup().setContent(labelContent);
    } else {
        markers[id] = L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(labelContent, { 
                closeButton: false, 
                autoClose: false, 
                closeOnClick: false,
                className: 'transparent-popup' 
            })
            .openPopup();
    }
}

socket.on("all-users", (allUsers) => {
    Object.keys(allUsers).forEach(id => {
        handleReceiveLocation(allUsers[id]);
    });
});

socket.on("receive-location", (data) => {
    handleReceiveLocation(data);
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
    if (userData[id]) {
        delete userData[id];
        updateUserListUI();
    }
});

// Chat Logic
chatHeader.addEventListener('click', () => {
    isChatExpanded = !isChatExpanded;
    chatContainer.classList.toggle('expanded', isChatExpanded);
    chatContainer.classList.toggle('collapsed', !isChatExpanded);
    toggleChatBtn.innerText = isChatExpanded ? '▼' : '▲';
    
    if (isChatExpanded) {
        unreadCount = 0;
        chatBadge.classList.add('hidden');
        chatBadge.innerText = '0';
        chatInput.focus();
    }
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (message) {
        socket.emit('chat-message', message);
        chatInput.value = '';
    }
});

socket.on('new-chat-message', (data) => {
    const { id, username: sender, message } = data;
    const isMe = id === socket.id;
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isMe ? 'sent' : 'received');
    
    messageDiv.innerHTML = `
        <span class="sender">${isMe ? 'You' : sender}</span>
        <span class="text">${message}</span>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (!isChatExpanded && !isMe) {
        unreadCount++;
        chatBadge.innerText = unreadCount;
        chatBadge.classList.remove('hidden');
    }
});
