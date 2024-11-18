const roundToThree = (num) => Math.round(num * 1000) / 1000;
import { fetchHikingRoute } from "./services/fetchHikingRoute.js";
import { MAP_TILER_API_URL } from "./config.js";

window.onload = function () {
  // The red and blue icons are being created for the start and end points.
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

    // Map is being created and Vf. Moldoveanu is displayed.
  var map = L.map("map").setView([45.601387, 24.73529], 13);

  // The map is being displayed with the help of the MapTiler API.
  L.tileLayer(
    MAP_TILER_API_URL,
    { // A few settings to set the zoom and the size of tiles. Asta o sa faca textul si iconitele mai mari.
      maxZoom: 19,
      tileSize: 512,
      zoomOffset: -1,
    }
  ).addTo(map);

  let savedRoutes = [];
  // Localstorage este ca un dictionar in browser. Il folosesti ca sa pastrezi datele chiar daca iesi de pe site.
  if (localStorage.getItem("savedRoutes") !== null)
    savedRoutes = JSON.parse(localStorage.getItem("savedRoutes"));

  let startPoint = L.latLng(0, 0);
  let endPoint = L.latLng(0, 0);
  let switchPoint = false;
  const startPositionParagraph = document.getElementById("start-position");
  const endPositionParagraph = document.getElementById("end-position");
  const positionDiv = document.getElementById("position-container");
  const showRouteBtn = document.getElementById("show-route-btn");
  const saveRouteBtn = document.getElementById("save-route-btn");
  const routeInfo = document.getElementById("route-info-container");
  const closeBtn = document.getElementById("close-btn");
  positionDiv.style.display = "none";
  showRouteBtn.style.display = "none";
  saveRouteBtn.style.display = "none";

  let allowedToPutRoutes = true;
  let startMarker;
  let endMarker;
  let geoJSONLayer;

  map.on("click", (event) => {
    if (allowedToPutRoutes) {
      if (switchPoint === false) {
        startPoint.lat = event.latlng.lat;
        startPoint.lng = event.latlng.lng;
        switchPoint = true;
        if (startMarker !== undefined) {
          map.removeLayer(startMarker);
          startMarker = undefined;
        }
        startMarker = L.marker([startPoint.lat, startPoint.lng], {
          icon: redIcon
      }).addTo(map);
        startPositionParagraph.innerHTML = `Start position: <span class="fw-medium">${roundToThree(
          startPoint.lat
        )}, ${roundToThree(startPoint.lng)}</span>`;
        if (endPositionParagraph.innerHTML === "")
          endPositionParagraph.innerHTML = `Click on the map to set the end position`;
        positionDiv.style.display = "block";
      } else {
        endPoint.lat = event.latlng.lat;
        endPoint.lng = event.latlng.lng;
        switchPoint = false;
        if (endMarker !== undefined) {
          map.removeLayer(endMarker);
          endMarker = undefined;
        }
        endMarker = L.marker([endPoint.lat, endPoint.lng], {
          icon: blueIcon
      }).addTo(map);

        endPositionParagraph.innerHTML = `End position: <span class="fw-medium">${roundToThree(
          endPoint.lat
        )}, ${roundToThree(endPoint.lng)}</span>`;
        showRouteBtn.style.display = "block";
        saveRouteBtn.style.display = "none";
        if (geoJSONLayer) {
          map.removeLayer(geoJSONLayer);
        }
      }
    }
  });

  showRouteBtn.addEventListener("click", async (event) => {
    allowedToPutRoutes = false;
    showRouteBtn.style.display = "none";
    saveRouteBtn.style.display = "block";

    const routeGeoJSON = await fetchHikingRoute(startPoint, endPoint);

    if (routeGeoJSON) {
      if (geoJSONLayer) map.removeLayer(geoJSONLayer);

      geoJSONLayer = L.geoJSON(routeGeoJSON).addTo(map);

      map.fitBounds(geoJSONLayer.getBounds());

      const routeProperties = routeGeoJSON.features[0].properties;

      const distance = (routeProperties.summary.distance / 1000).toFixed(2);
      const duration = Math.round(routeProperties.summary.duration / 60);
      const ascent = Math.round(routeProperties.ascent);
      const descent = Math.round(routeProperties.descent);

      routeInfo.innerHTML = `
                    <h4>Route Information</h4>
                    <p>Distance: ${distance} km</p>
                    <p>Duration: ${duration} minutes</p>
                    <p>Ascent: ${ascent} m</p>
                    <p>Descent: ${descent} m</p>`;
    }
  });

  closeBtn.addEventListener("click", (event) => {
    positionDiv.style.display = "none";
    showRouteBtn.style.display = "none";
    saveRouteBtn.style.display = "none";
    if (geoJSONLayer) {
      map.removeLayer(geoJSONLayer);
    }
    if (startMarker !== undefined) {
      map.removeLayer(startMarker);
    }
    if (endMarker !== undefined) {
      map.removeLayer(endMarker);
    }
    startPoint = L.latLng(0, 0);
    endPoint = L.latLng(0, 0);
    startPositionParagraph.innerHTML = "";
    endPositionParagraph.innerHTML = "";
    routeInfo.innerHTML = "";
    switchPoint = false;
    allowedToPutRoutes = true;
  });

  saveRouteBtn.addEventListener("click", (event) => {
    savedRoutes.push({
      startPoint,
      endPoint,
    });
    localStorage.removeItem("savedRoutes");
    localStorage.setItem("savedRoutes", JSON.stringify(savedRoutes));
  });
};