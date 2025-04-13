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
  process.env.NODE_ENV === "test" ||
  import.meta?.env?.VITE_USE_MOCK_API === "true";

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
  const periods = [];
  const weekdayText = [];

  days.forEach((day, index) => {
    // Special handling for Monday (more likely to be closed)
    if (day === "monday" && Math.random() < 0.3) {
      weekdayText.push(`${day}: Closed`);
      return;
    }

    // Generate opening time (most open between 8am-12pm)
    const openHour = getRandomInt(8, 12);
    const openMinute = getRandomInt(0, 59);

    // Generate closing time (most close between 5pm-2am)
    const closeHour = getRandomInt(17, 26); // 26 represents 2am next day
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

// Mock coordinates generator (UK bounds)
const generateMockCoordinates = (): Coordinates => ({
  latitude: getRandomFloat(49.9, 58.7),
  longitude: getRandomFloat(-8.6, 1.8),
});

// Mock contact info generator
const generateMockContactInfo = () => ({
  phone: `+44 ${getRandomInt(1000, 9999)} ${getRandomInt(100000, 999999)}`,
  email: `pub${getRandomInt(1000, 9999)}@example.com`,
  website: `https://www.pub${getRandomInt(1000, 9999)}.co.uk`,
  googleRating: getRandomFloat(3.0, 5.0, 1),
  reviewCount: getRandomInt(10, 500),
});

// Mock route generator
const generateMockRoute = (start: Coordinates, end: Coordinates): Route => {
  const distance = getRandomFloat(0.5, 50.0); // Distance in miles
  const baseDuration = distance * 2; // Base duration in minutes
  const trafficDelay = getRandomFloat(0, baseDuration * 0.3); // Up to 30% delay
  const totalDuration = baseDuration + trafficDelay;

  return {
    distance,
    duration: totalDuration,
    coordinates: [
      start,
      {
        latitude:
          (start.latitude + end.latitude) / 2 + getRandomFloat(-0.01, 0.01),
        longitude:
          (start.longitude + end.longitude) / 2 + getRandomFloat(-0.01, 0.01),
      },
      end,
    ],
    trafficDelay,
  };
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
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, getRandomInt(200, 600)));

    // 5% chance of error to simulate API failures
    if (Math.random() < 0.05) {
      throw new Error("Geocoding service unavailable");
    }

    // Generate realistic UK coordinates based on postcode pattern
    const isPostcode = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/i.test(query);
    const lat = isPostcode
      ? getRandomFloat(51.3, 55.8) // More focused range for UK postcodes
      : getRandomFloat(49.9, 58.7); // Full UK range for place names
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
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, getRandomInt(300, 800)));

    // 5% chance of error
    if (Math.random() < 0.05) {
      throw new Error("Routing service unavailable");
    }

    // Calculate total distance and duration
    let totalDistance = 0;
    let totalDuration = 0;
    const steps = [];
    const coordinates = [];

    for (let i = 0; i < coordsArray.length - 1; i++) {
      const legDistance = getRandomFloat(1000, 50000); // 1-50km in meters
      const legDuration = legDistance * 0.06; // Roughly 60km/h average
      totalDistance += legDistance;
      totalDuration += legDuration;

      // Generate intermediate points for the route
      const start = coordsArray[i];
      const end = coordsArray[i + 1];
      const midPoint = {
        lat: (start.lat + end.lat) / 2 + getRandomFloat(-0.01, 0.01),
        lng: (start.lng + end.lng) / 2 + getRandomFloat(-0.01, 0.01),
      };

      coordinates.push([start.lng, start.lat]);
      coordinates.push([midPoint.lng, midPoint.lat]);

      steps.push({
        distance: legDistance,
        duration: legDuration,
        geometry: {
          coordinates: [
            [start.lng, start.lat],
            [midPoint.lng, midPoint.lat],
            [end.lng, end.lat],
          ],
          type: "LineString",
        },
        maneuver: {
          type: "turn",
          instruction: `Continue onto Route ${i + 1}`,
          bearing_after: getRandomInt(0, 359),
          location: [end.lng, end.lat],
        },
      });
    }

    // Add the final coordinate
    coordinates.push([
      coordsArray[coordsArray.length - 1].lng,
      coordsArray[coordsArray.length - 1].lat,
    ]);

    return {
      routes: [
        {
          distance: totalDistance,
          duration: totalDuration,
          geometry: {
            coordinates,
            type: "LineString",
          },
          legs: [
            {
              distance: totalDistance,
              duration: totalDuration,
              summary: "Main route",
              steps,
            },
          ],
        },
      ],
      waypoints: coordsArray.map((coord, index) => ({
        distance: 0,
        name: `Waypoint ${index + 1}`,
        location: [coord.lng, coord.lat],
      })),
      code: "Ok",
      uuid: `mock-${getRandomInt(1000000, 9999999)}`,
    };
  } catch (error) {
    console.error("❌ Mock API Error (Routing):", error);
    throw new Error("Failed to calculate route");
  }
};

/**
 * Mock implementation of pub search by postcode
 * @param zipCode - UK postcode to search near
 * @returns Promise<Pub[]> - Array of nearby pubs
 */
export const getNearbyPubs = async (zipCode: string): Promise<Pub[]> => {
  if (!USE_MOCK_API) {
    throw new Error("Mock API is disabled");
  }

  try {
    // Simulate API delay
    await new Promise((resolve) =>
      setTimeout(resolve, getRandomInt(400, 1000))
    );

    // 5% chance of error
    if (Math.random() < 0.05) {
      throw new Error("Pub search service unavailable");
    }

    const count = getRandomInt(5, 20);
    return Array.from({ length: count }, (_, i) => ({
      id: `mock-pub-${i}`,
      name: `Nearby Pub ${i + 1}`,
      coordinates: {
        latitude: getRandomFloat(51.3, 55.8),
        longitude: getRandomFloat(-0.5, 0.5),
      },
      businessHours: generateEnhancedBusinessHours(),
      contactInfo: generateMockContactInfo(),
      address: {
        street: `${getRandomInt(1, 100)} Nearby Street`,
        city: "Mock City",
        postcode: zipCode,
      },
    }));
  } catch (error) {
    console.error("Mock pub search error:", error);
    throw new Error("Failed to find nearby pubs");
  }
};

/**
 * Mock implementation of business details lookup
 * Returns enhanced business details including ratings and reviews
 * @param name - Business name
 * @param postcode - UK postcode
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
    console.log(`🏪 Mock API: Fetching details for "${name}"`);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, getRandomInt(300, 700)));

    // 5% chance of error
    if (Math.random() < 0.05) {
      throw new Error("Business details service unavailable");
    }

    // 10% chance of not finding the business
    if (Math.random() < 0.1) {
      throw new Error("Business not found");
    }

    const rating = getRandomFloat(3.0, 5.0, 1);
    const reviewCount = getRandomInt(10, 500);

    return {
      phone: `+44 ${getRandomInt(1000, 9999)} ${getRandomInt(100000, 999999)}`,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      openingHours: generateEnhancedBusinessHours(),
      rating: {
        google: {
          stars: rating,
          count: reviewCount,
        },
        yelp: {
          stars: getRandomFloat(3.0, 5.0, 1),
          count: getRandomInt(5, 200),
        },
      },
      website: `https://www.${name.toLowerCase().replace(/\s+/g, "-")}.co.uk`,
      photos: Array.from(
        { length: getRandomInt(3, 10) },
        (_, i) =>
          `https://example.com/photos/${name
            .toLowerCase()
            .replace(/\s+/g, "-")}-${i + 1}.jpg`
      ),
      reviews: Array.from({ length: getRandomInt(3, 10) }, () => ({
        author: `User${getRandomInt(1000, 9999)}`,
        rating: getRandomFloat(3.0, 5.0, 1),
        text: "Great place! Would visit again.",
        time: new Date(
          Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
      })),
    };
  } catch (error) {
    console.error("❌ Mock API Error (Business Details):", error);
    throw new Error("Failed to fetch business details");
  }
};
