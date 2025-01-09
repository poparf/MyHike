const roundToThree = (num) => Math.round(num * 1000) / 1000;
import { fetchHikingRoute } from "./services/fetchHikingRoute.js";
import { MAP_TILER_API_URL } from "./config.js";

window.onload = function () {
  // The red and blue icons are being created for the start and end points.
  const redIcon = L.icon({
    iconUrl: "/assets/red-pin.png", // Red marker icon
    //shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',   // Marker shadow
    iconSize: [47, 47], // Default size
    iconAnchor: [22, 41], // Anchor point of the icon
    popupAnchor: [1, -34], // Popup position relative to icon
    shadowSize: [41, 41], // Shadow size
  });

  const blueIcon = L.icon({
    iconUrl: "/assets/blue-pin.png", // Red marker icon
    //shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',   // Marker shadow
    iconSize: [40, 40], // Default size
    iconAnchor: [20, 41], // Anchor point of the icon
    popupAnchor: [1, -34], // Popup position relative to icon
    shadowSize: [41, 41], // Shadow size
  });

  const blueDot = L.icon({
    iconUrl: "/assets/bluedot.png",
    iconSize: [60, 60],
    iconAnchor: [20, 41],
    popupAnchor: [1, -34],
  });

  // Map is being created and Vf. Moldoveanu is displayed.
  var map = L.map("map").setView([45.601387, 24.73529], 13);

  // The map is being displayed with the help of the MapTiler API.
  L.tileLayer(MAP_TILER_API_URL, {
    // A few settings to set the zoom and the size of tiles. Asta o sa faca textul si iconitele mai mari.
    maxZoom: 19,
    tileSize: 512,
    zoomOffset: -1,
  }).addTo(map);

  let savedRoutes = [];
  // Localstorage este ca un dictionar in browser. Il folosesti ca sa pastrezi datele chiar daca iesi de pe site.
  if (localStorage.getItem("savedRoutes") !== null)
    savedRoutes = JSON.parse(localStorage.getItem("savedRoutes"));

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      // In browserul brave nu merge.
      L.marker([pos.coords.latitude, pos.coords.longitude], {
        icon: blueDot,
      }).addTo(map);
      L.circle([pos.coords.latitude, pos.coords.longitude], {
        color: "blue",
        fillOpacity: 0.2,
        radius: pos.coords.accuracy,
      }).addTo(map);
    },
    (err) => console.error(err)
  );
  
  const positionDiv = document.getElementById("position-container");
  const showRouteBtn = document.getElementById("show-route-btn");
  const saveRouteBtn = document.getElementById("save-route-btn");
  const routeInfo = document.getElementById("route-info-container");
  const closeBtn = document.getElementById("close-btn");
  const centerBtn = document.getElementById("center-btn");
  const randomMountainBtn = document.getElementById("random-mountain-btn");
  positionDiv.style.display = "none";
  showRouteBtn.style.display = "none";
  saveRouteBtn.style.display = "none";

  let geoJSONLayer;
  let routeMarkers = [];
  let allowedToPutRoutes = true;

  map.on("click", (event) => {
    if (allowedToPutRoutes === false) return;
    let markerCoord = [event.latlng.lat, event.latlng.lng];
    let icon = routeMarkers.length == 0 ? redIcon : blueIcon;

    routeMarkers.push(
      L.marker(markerCoord, { icon })
        .addTo(map)
        .on("click", (e) => {
          map.removeLayer(e.target);
          routeMarkers = routeMarkers.filter((marker) => marker !== e.target);
          if (routeMarkers.length > 0) {
            routeMarkers[0].setIcon(redIcon);
            let latestPoint = `${roundToThree(
              routeMarkers.at(-1)._latlng.lat
            )}, ${roundToThree(routeMarkers.at(-1)._latlng.lng)}`;
            routeInfo.innerHTML = `Latest point location: ${latestPoint};`;
          }
          if (routeMarkers.length == 0) {
            positionDiv.style.display = "none";
            showRouteBtn.style.display = "none";
          }
        })
    );

    if (routeMarkers.length > 1) {
      positionDiv.style.display = "block";
      showRouteBtn.style.display = "block";
    }
    if (geoJSONLayer) map.removeLayer(geoJSONLayer);

    let latestPoint = `${roundToThree(
      routeMarkers.at(-1)._latlng.lat
    )}, ${roundToThree(routeMarkers.at(-1)._latlng.lng)}`;
    routeInfo.innerHTML = `Latest point location: ${latestPoint}`;
  });

  let routeProperties;
  showRouteBtn.addEventListener("click", async (event) => {
    allowedToPutRoutes = false;
    showRouteBtn.style.display = "none";
    saveRouteBtn.style.display = "block";

    let coordsList = routeMarkers.map((marker) => [
      marker._latlng.lng,
      marker._latlng.lat,
    ]);

    const routeGeoJSON = await fetchHikingRoute(coordsList);

    if (routeGeoJSON) {
      if (geoJSONLayer) map.removeLayer(geoJSONLayer);

      geoJSONLayer = L.geoJSON(routeGeoJSON).addTo(map);

      map.fitBounds(geoJSONLayer.getBounds());

      routeProperties = routeGeoJSON.features[0].properties;

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
    routeInfo.innerHTML = "";
    allowedToPutRoutes = true;

    routeMarkers.forEach((marker) => map.removeLayer(marker));
    routeMarkers = [];
  });

  saveRouteBtn.addEventListener("click", (event) => {
    savedRoutes.push({
      coordsList: routeMarkers.map((marker) => [
        marker._latlng.lng,
        marker._latlng.lat,
      ]),
      routeInfo: routeProperties,
    });
    localStorage.removeItem("savedRoutes");
    localStorage.setItem("savedRoutes", JSON.stringify(savedRoutes));
    console.log(savedRoutes);
  });

  centerBtn.addEventListener("click", (e) => {
    navigator.geolocation.getCurrentPosition((pos) => {
      map.panTo([pos.coords.latitude, pos.coords.longitude]);
    });
  });

  let timeOut;
  const randomMountainInfo = document.getElementById("random-mountain-info");
  randomMountainInfo.style.display = "none";
  randomMountainBtn.addEventListener("mouseover", (e) => {
    timeOut = setTimeout(() => {
      randomMountainInfo.style.display = "block";
    }, 400);
  });
  randomMountainBtn.addEventListener("mouseout", (e) => {
    clearTimeout(timeOut);
    randomMountainInfo.style.display = "none";
  });

  let randomMountainMarker;

  const removeRandomMountainMarker = () => {
    if (randomMountainMarker) map.removeLayer(randomMountainMarker);
  };

  randomMountainBtn.addEventListener("click", (e) => {
    removeRandomMountainMarker();
    fetch("../data/mountains.json")
      .then((response) => response.json())
      .then((data) => {
        const randomIndex = Math.floor(Math.random() * data.peaks.length);
        const randomMountain = data.peaks[randomIndex];
        map.panTo([
          randomMountain.coordinates.latitude,
          randomMountain.coordinates.longitude,
        ]);
        randomMountainMarker = L.marker(
          [
            randomMountain.coordinates.latitude,
            randomMountain.coordinates.longitude,
          ],
          { icon: redIcon }
        )
          .addTo(map)
          .bindPopup(
            `<p class="fw-bold">${randomMountain.name}</p>
            <p>${randomMountain.mountainRange}</p>
            <p>Elevation: ${randomMountain.height} m</p>`
          )
          .openPopup()
          .on("click", (e) => {
            removeRandomMountainMarker();
          });
      })
      .catch((error) => console.error("Error fetching mountains data:", error));
  });

  const bookmarkBtn = document.getElementById("bookmark-btn");
  const bookmarkContainer = document.getElementById("bookmark-container");
  const closeBookmarkBtn = document.getElementById("close-bookmark-btn");
  bookmarkContainer.style.display = "none";

  const bookmarksContainer = document.getElementById("bookmarks-container");

  savedRoutes.forEach((route, index) => {
    let startPointName = route.routeInfo.segments[0].steps[0].name;
    // Afiseaza date despre fiecare ruta salvata.
    bookmarksContainer.innerHTML += `
    <div class="bookmark">
      <p>${startPointName}</p>
      <button class="showSavedRoute">Show</button>
    </div>
    `;
  });

  let showBookmarks = false;
  bookmarkBtn.addEventListener("click", (e) => {
    bookmarkContainer.style.display = showBookmarks ? "none" : "block";
    showBookmarks = !showBookmarks;
  });

  //aici e codul pentru afisarea unui traseu salvat in bookmarks
  const showBookmarkButton = document.querySelectorAll(".showSavedRoute");

  showBookmarkButton.forEach((button, index) => {
    button.addEventListener("click", (event) => {
      
      allowedToPutRoutes = false;
      displaySavedRoute(savedRoutes[index]);

    });
  });

  async function displaySavedRoute(route) {
    // Remove any existing route from the map
    if (geoJSONLayer) map.removeLayer(geoJSONLayer);

    // Create a new GeoJSON layer from the saved route's coordinates
    const routeGeoJSON = await fetchHikingRoute(route.coordsList);

    if (routeGeoJSON) {
      // You can add this GeoJSON to the map
      if (geoJSONLayer) map.removeLayer(geoJSONLayer); // Remove any existing layer

      geoJSONLayer = L.geoJSON(routeGeoJSON).addTo(map); // Add the new route to the map

      // Adjust the map to fit the bounds of the new route
      map.fitBounds(geoJSONLayer.getBounds());

      routeInfo.innerHTML = `
        <h4>Route Information</h4>
        <p>Distance: ${(routeGeoJSON.features[0].properties.summary.distance / 1000).toFixed(2)} km</p>
        <p>Duration: ${Math.round(routeGeoJSON.features[0].properties.summary.duration / 60)} minutes</p>
        <p>Ascent: ${routeGeoJSON.features[0].properties.ascent} m</p>
        <p>Descent: ${routeGeoJSON.features[0].properties.descent} m</p>
      `;
    }
  }
  closeBookmarkBtn.addEventListener("click", (event) => {
    bookmarkContainer.style.display = "none";
    if (geoJSONLayer) {
      map.removeLayer(geoJSONLayer);
    }
    routeInfo.innerHTML = "";
    allowedToPutRoutes = true;

    routeMarkers.forEach((marker) => map.removeLayer(marker));
    routeMarkers = [];
  });

};
