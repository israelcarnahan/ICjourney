import { Pub, BusinessHours, Coordinates, Route } from "../types";

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

// Mock API functions
export const mockApi = {
  // Get business hours with fallback
  getBusinessHours: async (pubId: string): Promise<BusinessHours> => {
    if (!USE_MOCK_API) {
      throw new Error("Mock API is disabled");
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, getRandomInt(100, 500)));

    // 10% chance of missing data
    if (Math.random() < 0.1) {
      throw new Error("Business hours not available");
    }

    return generateMockBusinessHours();
  },

  // Get route with traffic simulation
  getRoute: async (start: Coordinates, end: Coordinates): Promise<Route> => {
    if (!USE_MOCK_API) {
      throw new Error("Mock API is disabled");
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, getRandomInt(200, 800)));

    return generateMockRoute(start, end);
  },

  // Get pub details with contact info
  getPubDetails: async (pubId: string): Promise<Pub> => {
    if (!USE_MOCK_API) {
      throw new Error("Mock API is disabled");
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, getRandomInt(150, 600)));

    // 5% chance of missing data
    if (Math.random() < 0.05) {
      throw new Error("Pub details not available");
    }

    return {
      id: pubId,
      name: `Mock Pub ${getRandomInt(1, 1000)}`,
      coordinates: generateMockCoordinates(),
      businessHours: generateMockBusinessHours(),
      contactInfo: generateMockContactInfo(),
      address: {
        street: `${getRandomInt(1, 100)} Mock Street`,
        city: "Mock City",
        postcode: `M${getRandomInt(10, 99)} ${getRandomInt(1, 9)}${getRandomInt(
          10,
          99
        )}`,
      },
    };
  },

  // Get nearby pubs
  getNearbyPubs: async (
    location: Coordinates,
    radius: number
  ): Promise<Pub[]> => {
    if (!USE_MOCK_API) {
      throw new Error("Mock API is disabled");
    }

    // Simulate API delay
    await new Promise((resolve) =>
      setTimeout(resolve, getRandomInt(300, 1000))
    );

    const count = getRandomInt(5, 20);
    return Array.from({ length: count }, (_, i) => ({
      id: `mock-pub-${i}`,
      name: `Nearby Pub ${i + 1}`,
      coordinates: {
        latitude: location.latitude + getRandomFloat(-0.1, 0.1),
        longitude: location.longitude + getRandomFloat(-0.1, 0.1),
      },
      businessHours: generateMockBusinessHours(),
      contactInfo: generateMockContactInfo(),
      address: {
        street: `${getRandomInt(1, 100)} Nearby Street`,
        city: "Mock City",
        postcode: `M${getRandomInt(10, 99)} ${getRandomInt(1, 9)}${getRandomInt(
          10,
          99
        )}`,
      },
    }));
  },
};

// Export configuration
export const isMockApiEnabled = () => USE_MOCK_API;
