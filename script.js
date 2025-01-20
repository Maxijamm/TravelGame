let lat = 51.505;
let lon = -0.09;

// Initialize the map
var map = L.map('map').setView([lat, lon], 13); // Coordinates for London (you can change this)

// Add OpenStreetMap tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Marker position
var marker = L.marker([lat, lon]).addTo(map)
    .bindPopup("Aktueller Standort")
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
        circle = L.circle([lat, lon], {
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.3,
            radius: 500
        }).addTo(map);
    }
}

// Function to geocode an address and update the map view
function geocodeAddress(address) {
    var geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    
    fetch(geocodeUrl)
        .then(response => response.json())
        .then(data => {
            if (data && data[0]) {
                // Get the coordinates from the first result
                lat = data[0].lat;
                lon = data[0].lon;
                
                // Set the view to the new coordinates
                map.setView([lat, lon], 13);
                
                // Update the marker position
                marker.setLatLng([lat, lon]).addTo(map)
                      .openPopup();
            } else {
                alert('Address not found!');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Unable to geocode the address.');
        });
}

// Event listener for the "Go to Address" button click
document.getElementById('go-to-address-btn').addEventListener('click', function () {
    var address = document.getElementById('address-input').value;
    if (address) {
        geocodeAddress(address);
    } else {
        alert('Please enter an address.');
    }
});

// Event listener for the button click
document.getElementById('toggle-circle-btn').addEventListener('click', toggleCircle);
