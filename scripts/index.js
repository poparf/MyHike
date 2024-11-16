const roundToThree = (num) => Math.round(num * 1000) / 1000;

window.onload = function () {
  // Replace with your OpenRouteService API key
  const ORS_API_KEY =
    "5b3ce3597851110001cf62481b38b95396a94f4ba9dd4a4a11029351";

  var map = L.map("map", {
    zoomSnap: 0.25,
    whellPxPerZoomLevel: 100,
  }).setView([45.601387, 24.73529], 13);

  L.tileLayer(
    "https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=igWHfo3P7UsrY11uVokp&style=larger_icons",
    {
      maxZoom: 19,
      tileSize: 512,
      zoomOffset: -1,
    }
  ).addTo(map);

  let savedRoutes = [];
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

  const createHikingRouteGeoJSON = async (start, end) => {
    const body = {
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ],
      preference: "recommended",
      units: "m",
      language: "en",
      instructions: true,
      geometry: true,
      elevation: true,
    };

    try {
      const response = await fetch(
        "https://api.openrouteservice.org/v2/directions/foot-hiking/geojson",
        {
          method: "POST",
          headers: {
            Authorization: ORS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error fetching route:", error);
      return null;
    }
  }

  map.on("click", (event) => {
    if (allowedToPutRoutes) {
      if (switchPoint === false) {
        console.log("placed first marker");
        startPoint.lat = event.latlng.lat;
        startPoint.lng = event.latlng.lng;
        switchPoint = true;
        if (startMarker !== undefined) {
          map.removeLayer(startMarker);
          startMarker = undefined;
        }
        startMarker = L.marker(startPoint).addTo(map);
        startPositionParagraph.innerHTML = `Start position: <span class="fw-medium">${roundToThree(
          startPoint.lat
        )}, ${roundToThree(startPoint.lng)}</span>`;
        if (endPositionParagraph.innerHTML === "")
          endPositionParagraph.innerHTML = `Click on the map to set the end position`;
        positionDiv.style.display = "block";
      } else {
        console.log("placed second marker");
        endPoint.lat = event.latlng.lat;
        endPoint.lng = event.latlng.lng;
        switchPoint = false;
        if (endMarker !== undefined) {
          map.removeLayer(endMarker);
          endMarker = undefined;
        }
        endMarker = L.marker(endPoint).addTo(map);
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

    const routeGeoJSON = await createHikingRouteGeoJSON(startPoint, endPoint);

    if (routeGeoJSON) {
      if (geoJSONLayer) map.removeLayer(geoJSONLayer);

      console.log(routeGeoJSON);

      geoJSONLayer = L.geoJSON(routeGeoJSON).addTo(map);

      map.fitBounds(geoJSONLayer.getBounds());

      const routeProperties = routeGeoJSON.features[0].properties;
      console.log("ROUTEPROPERTIES:", routeProperties);

      const distance = (routeProperties.summary.distance / 1000).toFixed(2);
      const duration = Math.round(routeProperties.summary.duration / 60);
      const ascent = Math.round(routeProperties.ascent);
      const descent = Math.round(routeProperties.descent);

      routeInfo.innerHTML = `
                <div class="mt-3">
                    <h4>Route Information</h4>
                    <p>Distance: ${distance} km</p>
                    <p>Duration: ${duration} minutes</p>
                    <p>Ascent: ${ascent} m</p>
                    <p>Descent: ${descent} m</p>
                </div>
            `;
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
