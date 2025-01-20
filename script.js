// Initialize the map
var map = L.map('map').setView([51.505, -0.09], 13); // Coordinates for London (you can change this)

// Add OpenStreetMap tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add a marker to the map
L.marker([51.505, -0.09]).addTo(map)
    .bindPopup("<b>Hello world!</b><br>I am a popup.")
    .openPopup();
