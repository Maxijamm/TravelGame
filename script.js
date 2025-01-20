// Initialize the map
var map = L.map('map').setView([51.505, -0.09], 13); // Coordinates for London (you can change this)

// Add OpenStreetMap tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Marker position
var marker = L.marker([51.505, -0.09]).addTo(map)
    .bindPopup("<b>Hello world!</b><br>I am a popup.")
    .openPopup();

// Circle object
var circle;

// Function to toggle the circle around the marker
function toggleCircle() {
    if (circle) {
        // If the circle exists, remove it from the map
        map.removeLayer(circle);
        circle = null; // Set the circle to null
    } else {
        // Create a circle with 500m radius around the marker
        circle = L.circle([51.505, -0.09], {
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.3,
            radius: 500
        }).addTo(map);
    }
}

// Event listener for the button click
document.getElementById('toggle-circle-btn').addEventListener('click', toggleCircle);
