window.onload = function() {
var map = L.map('map').setView([44.439663, 26.096306], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
  
    let startPoint = {lat: 0, lng: 0};
    let endPoint = {lat: 0, lng: 0};
    let switchPoint = false;

    const redIcon = L.icon({
        iconUrl: '/assets/red-pin.png', // Red marker icon
        //shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',   // Marker shadow
        iconSize: [47, 47],  // Default size
        iconAnchor: [22, 41], // Anchor point of the icon
        popupAnchor: [1, -34], // Popup position relative to icon
        shadowSize: [41, 41]  // Shadow size
    });

    const blueIcon = L.icon({
        iconUrl: '/assets/blue-pin.png', // Red marker icon
        //shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',   // Marker shadow
        iconSize: [40, 40],  // Default size
        iconAnchor: [20, 41], // Anchor point of the icon
        popupAnchor: [1, -34], // Popup position relative to icon
        shadowSize: [41, 41]  // Shadow size
    })

    let startMarker;
    let endMarker;
    map.on('click', (event) => {
        if(switchPoint === false) {
            startPoint.lat = event.latlng.lat;
            startPoint.lng = event.latlng.lng;
            switchPoint = true;
            if (startMarker) {
                map.removeLayer(startMarker);
            }
            startMarker = L.marker([startPoint.lat, startPoint.lng], {
                icon: redIcon
            }).addTo(map);
            console.log('Start point: ', startPoint);
        } else {
            endPoint.lat = event.latlng.lat;
            endPoint.lng = event.latlng.lng;
            switchPoint = false;
            if (endMarker) {
                map.removeLayer(endMarker);
            }
            endMarker = L.marker([endPoint.lat, endPoint.lng], {
                icon: blueIcon
            }).addTo(map);

            console.log('End point: ', endPoint);
        }   
    });

    // L.Routing.control({
    //     waypoints: [
    //         L.latLng(45.26, 25.27),
    //         L.latLng(45.4, 25.53)
    //     ],
    //     routeWhileDragging: true
    // }).addTo(map);
}