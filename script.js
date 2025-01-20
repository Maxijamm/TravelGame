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

// Function to get nearby train stations using Overpass API
function getNearbyStations(lat, lon) {
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];(node["railway"="station"](around:5000,${lat},${lon}););out;`;

    fetch(overpassUrl)
        .then(response => response.json())
        .then(data => {
            const stationsList = document.getElementById('stations-list');
            stationsList.innerHTML = ''; // Clear the current list

            if (data && data.elements) {
                // Loop through each station found and add to the list
                data.elements.forEach(station => {
                    const stationName = station.tags.name || "Unnamed Station";
                    const listItem = document.createElement('li');
                    listItem.textContent = `${stationName} (Lat: ${station.lat}, Lon: ${station.lon})`;
                    stationsList.appendChild(listItem);
                });
            } else {
                const noStationsItem = document.createElement('li');
                noStationsItem.textContent = 'No nearby train stations found.';
                stationsList.appendChild(noStationsItem);
            }
        })
        .catch(error => {
            console.error('Error fetching train stations:', error);
            const stationsList = document.getElementById('stations-list');
            const errorItem = document.createElement('li');
            errorItem.textContent = 'Error fetching nearby stations.';
            stationsList.appendChild(errorItem);
        });
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
                    createMarker: function() { return null; },
                    showAlternatives: false,
                    showInstructions: false,
                    instructions: false,
                    draggableWaypoints: false
                }).addTo(map);

                calculateRouteDetails(lat, lon, newLat, newLon, addressMarker, address);

                // Fetch and display the nearby train stations after the address is geocoded
                getNearbyStations(newLat, newLon);
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

            routeDistance = distance;

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
    currentProgress = 0;
    startTime = Date.now();
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    intervalId = setInterval(() => {
        const elapsedTime = (Date.now() - startTime) / 1000 / 3600; // Time elapsed in hours
        const distanceTraveled = 4 * elapsedTime; // Distance traveled based on 4 km/h

        currentProgress = Math.min((distanceTraveled / routeDistance) * 100, 100);

        progressBar.value = currentProgress;
        progressText.textContent = `${currentProgress.toFixed(2)}%`;

        if (currentProgress >= 100) {
            clearInterval(intervalId);
            alert('Arrived at the destination!');
        }
    }, 1000);
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

updateTime();
setInterval(updateTime, 1000);
