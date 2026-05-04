const socket = io();

let username = prompt("Please enter your name:");
while (!username || username.trim() === "") {
    username = prompt("Name is required to see the map. Please enter your name:");
}

const map = L.map("map").setView([0, 0], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
}).addTo(map);

const markers = {};

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

socket.on("receive-location", (data) => {
    const { id, latitude, longitude, username: otherUser } = data;
    
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
        markers[id].getPopup().setContent(otherUser);
    } else {
        markers[id] = L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(otherUser)
            .openPopup();
    }
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});
