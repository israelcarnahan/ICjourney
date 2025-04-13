import {
  Pub,
  BusinessHours,
  Coordinates,
  Route,
  LatLng,
  GeocodingResponse,
  DirectionsResponse,
  BusinessDetails,
} from "../types";

// Configuration
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

// Log mock API status
if (USE_MOCK_API) {
  console.log("🔧 Mock API is active - Using simulated data");
}

// Helper functions for generating mock data
const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number, decimals = 2) =>
  Number((Math.random() * (max - min) + min).toFixed(decimals));

// Mock business hours generator
const generateMockBusinessHours = (): BusinessHours => {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const hours: BusinessHours = {};

  days.forEach((day) => {
    // Special handling for Monday (more likely to be closed)
    if (day === "monday" && Math.random() < 0.3) {
      hours[day] = { isOpen: false };
      return;
    }

    // Generate opening time (most open between 8am-12pm)
    const openHour = getRandomInt(8, 12);
    const openMinute = getRandomInt(0, 59);

    // Generate closing time (most close between 5pm-2am)
    const closeHour = getRandomInt(17, 26); // 26 represents 2am next day
    const closeMinute = getRandomInt(0, 59);

    hours[day] = {
      isOpen: true,
      open: `${openHour.toString().padStart(2, "0")}:${openMinute
        .toString()
        .padStart(2, "0")}`,
      close: `${closeHour.toString().padStart(2, "0")}:${closeMinute
        .toString()
        .padStart(2, "0")}`,
    };
  });

  return hours;
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
 * @param query - Location query string (e.g., "London, UK" or "SW1A 1AA")
 * @returns Promise<GeocodingResponse> - Mock geocoding response matching Mapbox format
 */
export const getCoordinatesFromQuery = async (
  query: string
): Promise<GeocodingResponse> => {
  if (!USE_MOCK_API) {
    throw new Error("Mock API is disabled");
  }

  try {
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
      lat,
      lng,
      place_name: query,
      context: [
        { id: "place.123", text: query.split(",")[0] },
        { id: "country.456", text: "United Kingdom" },
      ],
    };
  } catch (error) {
    console.error("Mock geocoding error:", error);
    throw new Error("Failed to geocode location");
  }
};

/**
 * Mock implementation of Mapbox Directions API
 * @param coordsArray - Array of coordinates to route through
 * @returns Promise<DirectionsResponse> - Mock directions response matching Mapbox format
 */
export const getOptimizedRoute = async (
  coordsArray: LatLng[]
): Promise<DirectionsResponse> => {
  if (!USE_MOCK_API) {
    throw new Error("Mock API is disabled");
  }

  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, getRandomInt(300, 800)));

    // 5% chance of error
    if (Math.random() < 0.05) {
      throw new Error("Routing service unavailable");
    }

    // Calculate total distance and duration
    let totalDistance = 0;
    let totalDuration = 0;
    const legs = [];

    for (let i = 0; i < coordsArray.length - 1; i++) {
      const legDistance = getRandomFloat(1000, 50000); // 1-50km
      const legDuration = legDistance * 0.06; // Roughly 60km/h average
      totalDistance += legDistance;
      totalDuration += legDuration;
      legs.push({
        distance: legDistance,
        duration: legDuration,
        summary: `Leg ${i + 1}`,
      });
    }

    // Generate a mock polyline (simplified)
    const polyline = coordsArray
      .map((coord) => `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`)
      .join(";");

    return {
      distance: totalDistance,
      duration: totalDuration,
      polyline,
      legs,
    };
  } catch (error) {
    console.error("Mock routing error:", error);
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
      businessHours: generateMockBusinessHours(),
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
 * @param name - Business name
 * @param postcode - UK postcode
 * @returns Promise<BusinessDetails> - Business details including contact info and hours
 */
export const getBusinessDetails = async (
  name: string,
  postcode: string
): Promise<BusinessDetails> => {
  if (!USE_MOCK_API) {
    throw new Error("Mock API is disabled");
  }

  try {
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

    return {
      phone: `+44 ${getRandomInt(1000, 9999)} ${getRandomInt(100000, 999999)}`,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      openingHours: generateMockBusinessHours(),
      googleRating: getRandomFloat(3.0, 5.0, 1),
      reviewCount: getRandomInt(10, 500),
      website: `https://www.${name.toLowerCase().replace(/\s+/g, "-")}.co.uk`,
    };
  } catch (error) {
    console.error("Mock business details error:", error);
    throw new Error("Failed to fetch business details");
  }
};

// Export configuration
export const isMockApiEnabled = () => USE_MOCK_API;
