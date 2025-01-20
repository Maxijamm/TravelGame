let lat = 48.00923;
let lon = 11.59002;
let circle;
let marker;

// Initialize the map
var map = L.map('map').setView([lat, lon], 13); // Default coordinates (initial location)

// Add OpenStreetMap tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Initialize the marker at the initial coordinates
marker = L.marker([lat, lon]).addTo(map)
    .bindPopup("<b>Initial Location</b><br>Latitude: " + lat + ", Longitude: " + lon)
    .openPopup();

// Function to toggle the circle around the marker
function toggleCircle() {
    if (circle) {
        // If the circle exists, remove it from the map
        map.removeLayer(circle);
        circle = null; // Set the circle to null
    } else {
        // Create a circle with a 500m radius around the marker
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
                const newLat = parseFloat(data[0].lat);
                const newLon = parseFloat(data[0].lon);
                
                // Set the view to the new coordinates
                map.setView([newLat, newLon], 13);
                
                // Update the marker position
                marker.setLatLng([newLat, newLon]).addTo(map)
                      .bindPopup(`<b>${address}</b><br>Latitude: ${newLat}, Longitude: ${newLon}`)
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

// Function to get the closest 3 train stations using Overpass API
function getNearbyTrainStations(lat, lon) {
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];(node(around:5000,${lat},${lon})[railway=station];);out body;`;

    fetch(overpassUrl)
        .then(response => response.json())
        .then(data => {
            const stations = data.elements;
            
            // Sort stations by distance from the current position
            stations.sort((a, b) => {
                const distanceA = getDistance(lat, lon, a.lat, a.lon);
                const distanceB = getDistance(lat, lon, b.lat, b.lon);
                return distanceA - distanceB;
            });
            
            // Take the closest 3 stations
            const closestStations = stations.slice(0, 3);
            
            // Display the closest stations in the console or as a list in the HTML
            const stationsList = document.getElementById('stations-list');
            stationsList.innerHTML = ''; // Clear the list before adding new items

            closestStations.forEach(station => {
                const li = document.createElement('li');
                li.textContent = `${station.tags.name || 'Unnamed station'} (Distance: ${Math.round(getDistance(lat, lon, station.lat, station.lon))} meters)`;
                stationsList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Unable to fetch train station data.');
        });
}

// Helper function to calculate the distance between two geographic points (in meters)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
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

// Event listener for the button click to toggle the circle
document.getElementById('toggle-circle-btn').addEventListener('click', toggleCircle);

function updateTime() {
    const currentTimeElement = document.getElementById('current-time');
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    currentTimeElement.textContent = `${hours}:${minutes}:${seconds}`;
}

// Update the time immediately and then every second
updateTime();
setInterval(updateTime, 1000);
