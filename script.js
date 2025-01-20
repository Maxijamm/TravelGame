let lat = 48.00923;
let lon = 11.59002;
let circle;
let initialMarker;
let addressMarker;  // Variable for the second marker
let routeControl;  // Variable for the route control

// Initialize the map
var map = L.map('map').setView([lat, lon], 13); // Default coordinates (initial location)

// Add OpenStreetMap tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Initialize the initial marker at the initial coordinates
initialMarker = L.marker([lat, lon]).addTo(map)
    .bindPopup("<b>Initial Location</b><br>Latitude: " + lat + ", Longitude: " + lon)
    .openPopup();

// Function to toggle the circle around the initial marker
function toggleCircle() {
    if (circle) {
        // If the circle exists, remove it from the map
        map.removeLayer(circle);
        circle = null; // Set the circle to null
    } else {
        // Create a circle with a 500m radius around the initial marker
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
                
                // Create a new marker for the entered address
                if (addressMarker) {
                    map.removeLayer(addressMarker); // Remove the old address marker if it exists
                }
                
                addressMarker = L.marker([newLat, newLon]).addTo(map);
                
                // Remove any existing route if it exists
                if (routeControl) {
                    routeControl.removeFrom(map);
                }
                
                // Create a walking route between the initial marker and the address marker
                routeControl = L.Routing.control({
                    waypoints: [
                        L.latLng(lat, lon),  // Starting point
                        L.latLng(newLat, newLon)  // Destination point
                    ],
                    routeWhileDragging: true,
                    createMarker: function() { return null; } // Do not create markers along the route
                }).addTo(map);

                // Calculate and display the distance and travel time
                calculateRouteDetails(lat, lon, newLat, newLon, addressMarker, address);
            } else {
                alert('Address not found!');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Unable to geocode the address.');
        });
}

// Function to calculate the route details
function calculateRouteDetails(startLat, startLon, endLat, endLon, addressMarker, address) {
    // Fetch the route data from the OpenStreetMap (OSM) API
    var routeUrl = `https://router.project-osrm.org/route/v1/walking/${startLon},${startLat};${endLon},${endLat}?overview=false&geometries=polyline`;
    
    fetch(routeUrl)
        .then(response => response.json())
        .then(data => {
            const route = data.routes[0];
            const distance = route.distance / 1000; // Convert from meters to kilometers
            const duration = route.duration / 3600; // Convert from seconds to hours

            // Calculate travel time at 4 km/h
            const travelTime = (distance / 4).toFixed(2); // Assuming walking speed of 4 km/h

            // Update the popup with distance and travel time
            const popupContent = `
                <b>${address}</b><br>
                Latitude: ${endLat}, Longitude: ${endLon}<br>
                Distance: ${distance.toFixed(2)} km<br>
                Estimated Travel Time: ${travelTime} hours at 4 km/h
            `;

            addressMarker.bindPopup(popupContent).openPopup();
        })
        .catch(error => {
            console.error('Error fetching route data:', error);
            alert('Unable to fetch route data.');
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

// Event listener for the button click to toggle the circle
document.getElementById('toggle-circle-btn').addEventListener('click', toggleCircle);

// Time update function
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
