/*
    This function fetches a hiking route between two points using the OpenRouteService API.
*/
import { ORS_API_KEY } from "../config.js";

export const fetchHikingRoute = async (start, end) => {

    // According to the OpenRouteService API documentation, the body of the request should contain the following properties:
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
        // Dupa directions trebuie sa specifici tipul de traseu, in cazul nostru foot-hiking
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