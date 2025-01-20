let lat = 48.00923;
let lon = 11.59002;
let circle;
let initialMarker;
let addressMarker;  // Variable for the second marker
let routeControl;  // Variable for the route control
let routeDistance;  // Variable for the route distance
let intervalId;  // To keep track of the progress update interval
let startTime;  // To track the start time for progress calculation
let currentProgress = 0; // Start progress from 0

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
        map.removeLayer(circle);
        circle = null;
    } else {
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
                const newLat = parseFloat(data[0].lat);
                const newLon = parseFloat(data[0].lon);
                
                map.setView([newLat, newLon], 13);
                
                if (addressMarker) {
                    map.removeLayer(addressMarker);
                }
                
                addressMarker = L.marker([newLat, newLon]).addTo(map);
                
                if (routeControl) {
                    routeControl.removeFrom(map);
                }
                
                routeControl = L.Routing.control({
                    waypoints: [
                        L.latLng(lat, lon),
                        L.latLng(newLat, newLon)
                    ],
                    routeWhileDragging: true,
                    createMarker: function() { return null; }
                }).addTo(map);

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
    var routeUrl = `https://router.project-osrm.org/route/v1/walking/${startLon},${startLat};${endLon},${endLat}?overview=false&geometries=polyline`;
    
    fetch(routeUrl)
        .then(response => response.json())
        .then(data => {
            const route = data.routes[0];
            const distance = route.distance / 1000; // Convert from meters to kilometers

            routeDistance = distance; // Save the distance for progress tracking

            const travelTime = (distance / 4).toFixed(2); // Assuming walking speed of 4 km/h

            const popupContent = `
                <b>${address}</b><br>
                Latitude: ${endLat}, Longitude: ${endLon}<br>
                Distance: ${distance.toFixed(2)} km<br>
                Estimated Travel Time: ${travelTime} hours at 4 km/h<br>
                <button id="start-btn">Start</button><br>
                <progress id="progress-bar" value="0" max="100"></progress>
                <span id="progress-text">0%</span>
            `;
            
            addressMarker.bindPopup(popupContent).openPopup();

            // Add event listener to the "Start" button
            document.getElementById('start-btn').addEventListener('click', startProgress);
        })
        .catch(error => {
            console.error('Error fetching route data:', error);
            alert('Unable to fetch route data.');
        });
}

// Function to start the progress of the route
function startProgress() {
    // Reset the progress and start time
    currentProgress = 0;
    startTime = Date.now(); // Start the timer to track progress
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    // Update progress every second based on walking speed (4 km/h)
    intervalId = setInterval(() => {
        const elapsedTime = (Date.now() - startTime) / 1000 / 3600; // Time elapsed in hours
        const distanceTraveled = 4 * elapsedTime; // Distance traveled based on 4 km/h

        currentProgress = Math.min((distanceTraveled / routeDistance) * 100, 100); // Calculate progress as percentage

        progressBar.value = currentProgress;
        progressText.textContent = `${currentProgress.toFixed(2)}%`; // Update the progress text

        if (currentProgress >= 100) {
            clearInterval(intervalId); // Stop the interval once progress reaches 100%
            alert('Arrived at the destination!');
        }
    }, 1000); // Update every second
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
