import {
  Pub,
  BusinessHours,
  Coordinates,
  Route,
  LatLng,
  MapboxGeocodingResponse,
  MapboxDirectionsResponse,
  EnhancedBusinessDetails,
} from "../types";
import { getConfig, setConfig } from "../config";

// Configuration
let USE_MOCK_API =
  process.env.NODE_ENV === "test" || process.env.VITE_USE_MOCK_API === "true";

// For testing purposes
export const setMockApiEnabled = (enabled: boolean) => {
  USE_MOCK_API = enabled;
};

// Export configuration check
export const isMockApiEnabled = () => USE_MOCK_API;

// Log mock API status
if (USE_MOCK_API) {
  console.log("🔧 Mock API is active - Using simulated data");
}

// Helper functions for generating mock data
const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number, decimals = 2) =>
  Number((Math.random() * (max - min) + min).toFixed(decimals));

/**
 * Simulates network delay and potential API failures
 * @param minDelay Minimum delay in milliseconds
 * @param maxDelay Maximum delay in milliseconds
 * @param failureChance Probability of failure (0-1)
 * @returns Promise that resolves after delay or rejects with error
 */
const simulateApiCall = async (
  minDelay: number,
  maxDelay: number,
  failureChance: number = 0.1
) => {
  await new Promise((resolve) =>
    setTimeout(resolve, getRandomInt(minDelay, maxDelay))
  );

  if (Math.random() < failureChance) {
    throw new Error("Service temporarily unavailable");
  }
};

/**
 * Generates a mock business hours object in the format expected by the enhanced API
 */
const generateEnhancedBusinessHours = () => {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const periods: Array<{
    open: { day: number; time: string };
    close: { day: number; time: string };
  }> = [];
  const weekdayText: string[] = [];

  days.forEach((day, index) => {
    if (day === "monday" && Math.random() < 0.3) {
      weekdayText.push(`${day}: Closed`);
      return;
    }

    const openHour = getRandomInt(8, 12);
    const openMinute = getRandomInt(0, 59);
    const closeHour = getRandomInt(17, 26);
    const closeMinute = getRandomInt(0, 59);

    const openTime = `${openHour.toString().padStart(2, "0")}:${openMinute
      .toString()
      .padStart(2, "0")}`;
    const closeTime = `${closeHour.toString().padStart(2, "0")}:${closeMinute
      .toString()
      .padStart(2, "0")}`;

    periods.push({
      open: { day: index, time: openTime },
      close: { day: index, time: closeTime },
    });

    weekdayText.push(`${day}: ${openTime} - ${closeTime}`);
  });

  return { periods, weekday_text: weekdayText };
};

/**
 * Mock implementation of Mapbox Geocoding API
 * Returns location data in the exact format of Mapbox's geocoding API
 * @param query - Location query string (e.g., "London, UK" or "SW1A 1AA")
 * @returns Promise<MapboxGeocodingResponse> - Mock geocoding response matching Mapbox format
 */
export const getCoordinatesFromQuery = async (
  query: string
): Promise<MapboxGeocodingResponse> => {
  if (!USE_MOCK_API) {
    throw new Error("Mock API is disabled");
  }

  try {
    console.log(`🔍 Mock API: Geocoding query "${query}"`);
    await simulateApiCall(200, 500, 0.1);

    const isPostcode = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/i.test(query);
    const lat = isPostcode
      ? getRandomFloat(51.3, 55.8)
      : getRandomFloat(49.9, 58.7);
    const lng = getRandomFloat(-8.6, 1.8);

    return {
      type: "FeatureCollection",
      query: [query],
      features: [
        {
          id: `place.${getRandomInt(1000000, 9999999)}`,
          type: "Feature",
          place_name: query,
          relevance: getRandomFloat(0.7, 1.0),
          properties: {
            accuracy: "point",
          },
          text: query.split(",")[0],
          place_type: ["place"],
          center: [lng, lat],
          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          context: [
            { id: "place.123", text: query.split(",")[0] },
            { id: "country.456", text: "United Kingdom", short_code: "gb" },
          ],
        },
      ],
      attribution: "© 2024 Mapbox, © OpenStreetMap",
    };
  } catch (error) {
    console.error("❌ Mock API Error (Geocoding):", error);
    throw new Error("Failed to geocode location");
  }
};

/**
 * Mock implementation of Mapbox Directions API
 * Returns route data in the exact format of Mapbox's directions API
 * @param coordsArray - Array of coordinates to route through
 * @returns Promise<MapboxDirectionsResponse> - Mock directions response matching Mapbox format
 * Note: Distance is converted from meters to miles (meters / 1609.34)
 *       Duration is converted from seconds to minutes (seconds / 60)
 */
export const getOptimizedRoute = async (
  coordsArray: LatLng[]
): Promise<MapboxDirectionsResponse> => {
  if (!USE_MOCK_API) {
    throw new Error("Mock API is disabled");
  }

  try {
    console.log(
      `🗺️ Mock API: Calculating route with ${coordsArray.length} waypoints`
    );
    await simulateApiCall(300, 800, 0.1);

    const routes = [];
    const waypoints = coordsArray.map((coord, index) => ({
      name: `Waypoint ${index + 1}`,
      location: [coord.lng, coord.lat],
    }));

    // Generate route geometry
    const coordinates = coordsArray.map((coord) => [coord.lng, coord.lat]);
    const distance = getRandomFloat(1000, 50000); // meters
    const duration = distance * 0.06; // seconds

    // Convert to user-friendly units
    const distance_miles = Number((distance / 1609.34).toFixed(2)); // meters to miles
    const duration_minutes = Number((duration / 60).toFixed(1)); // seconds to minutes

    routes.push({
      geometry: {
        coordinates,
        type: "LineString",
      },
      legs: [
        {
          distance,
          duration,
          summary: "Mock Route",
          steps: [
            {
              distance,
              duration,
              geometry: {
                coordinates,
                type: "LineString",
              },
              maneuver: {
                type: "depart",
                instruction: "Start at origin",
                bearing_after: 0,
              },
            },
          ],
        },
      ],
      distance,
      duration,
      distance_miles, // Add converted distance in miles
      duration_minutes, // Add converted duration in minutes
      weight_name: "routability",
      weight: duration,
    });

    return {
      routes,
      waypoints,
      code: "Ok",
      uuid: `mock-${getRandomInt(1000000, 9999999)}`,
    };
  } catch (error) {
    console.error("❌ Mock API Error (Routing):", error);
    throw new Error("Failed to calculate route");
  }
};

/**
 * Mock implementation of Places API
 * Returns nearby pubs in the format expected by the application
 * @param zipCode - Postcode to search around
 * @returns Promise<Pub[]> - Array of mock pub data
 */
export const getNearbyPubs = async (zipCode: string): Promise<Pub[]> => {
  if (!USE_MOCK_API) {
    throw new Error("Mock API is disabled");
  }

  try {
    console.log(`🍺 Mock API: Finding pubs near ${zipCode}`);
    await simulateApiCall(200, 500, 0.1);

    const numPubs = getRandomInt(5, 15);
    const pubs: Pub[] = [];

    for (let i = 0; i < numPubs; i++) {
      const lat = getRandomFloat(51.3, 55.8);
      const lng = getRandomFloat(-8.6, 1.8);
      const distance = getRandomFloat(0.1, 5.0);

      pubs.push({
        fsq_id: `mock-${getRandomInt(1000000, 9999999)}`,
        name: `Mock Pub ${i + 1}`,
        distance,
        geocodes: {
          main: {
            latitude: lat,
            longitude: lng,
          },
        },
        location: {
          address: `${getRandomInt(1, 100)} Mock Street`,
          postcode: zipCode,
          locality: "Mock City",
          region: "Mock County",
          country: "United Kingdom",
        },
      });
    }

    return pubs;
  } catch (error) {
    console.error("❌ Mock API Error (Nearby Pubs):", error);
    throw new Error("Failed to find nearby pubs");
  }
};

/**
 * Mock implementation of Business Details API
 * Returns enhanced business details in the format expected by the application
 * @param name - Business name
 * @param postcode - Business postcode
 * @returns Promise<EnhancedBusinessDetails> - Enhanced business details
 */
export const getBusinessDetails = async (
  name: string,
  postcode: string
): Promise<EnhancedBusinessDetails> => {
  if (!USE_MOCK_API) {
    throw new Error("Mock API is disabled");
  }

  try {
    console.log(`ℹ️ Mock API: Getting details for ${name}`);
    await simulateApiCall(200, 500, 0.1);

    const contactInfo = {
      phone: `+44 ${getRandomInt(1000, 9999)} ${getRandomInt(100000, 999999)}`,
      email: `pub${getRandomInt(1000, 9999)}@example.com`,
      website: `https://www.pub${getRandomInt(1000, 9999)}.co.uk`,
    };

    const openingHours = generateEnhancedBusinessHours();

    return {
      ...contactInfo,
      openingHours,
      rating: getRandomFloat(3.0, 5.0, 1),
      reviewCount: getRandomInt(10, 500),
      photos: Array(getRandomInt(1, 5))
        .fill(null)
        .map(() => `https://example.com/photo${getRandomInt(1, 1000)}.jpg`),
      reviews: Array(getRandomInt(3, 10))
        .fill(null)
        .map(() => ({
          author: `User${getRandomInt(1000, 9999)}`,
          rating: getRandomInt(1, 5),
          text: "This is a mock review for testing purposes.",
          time: new Date().toISOString(),
        })),
    };
  } catch (error) {
    console.error("❌ Mock API Error (Business Details):", error);
    throw new Error("Failed to get business details");
  }
};
