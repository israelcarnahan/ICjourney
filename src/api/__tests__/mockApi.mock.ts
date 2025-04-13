// Mock version of mockApi.ts for testing
let USE_MOCK_API = true;

export const setMockApiEnabled = (enabled: boolean) => {
  USE_MOCK_API = enabled;
};

export const isMockApiEnabled = () => USE_MOCK_API;

// Helper functions for generating mock data
const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number, decimals = 2) =>
  Number((Math.random() * (max - min) + min).toFixed(decimals));

// Mock API functions
export const getCoordinatesFromQuery = async (query: string) => {
  if (!USE_MOCK_API) {
    throw new Error("Mock API is disabled");
  }

  if (Math.random() < 0.05) {
    throw new Error("Geocoding service unavailable");
  }

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
        center: [getRandomFloat(-8.6, 1.8), getRandomFloat(49.9, 58.7)],
        geometry: {
          type: "Point",
          coordinates: [getRandomFloat(-8.6, 1.8), getRandomFloat(49.9, 58.7)],
        },
        context: [
          { id: "place.123", text: query.split(",")[0] },
          { id: "country.456", text: "United Kingdom", short_code: "gb" },
        ],
      },
    ],
    attribution: "© 2024 Mapbox, © OpenStreetMap",
  };
};

export const getOptimizedRoute = async (
  coords: { lat: number; lng: number }[]
) => {
  if (!USE_MOCK_API) {
    throw new Error("Mock API is disabled");
  }

  if (Math.random() < 0.05) {
    throw new Error("Routing service unavailable");
  }

  const totalDistance = getRandomFloat(1000, 50000); // 1-50km in meters
  const totalDuration = totalDistance * 0.06; // Roughly 60km/h average

  const coordinates = coords.map((coord) => [coord.lng, coord.lat]);

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
            steps: [],
          },
        ],
      },
    ],
    waypoints: coords.map((coord, index) => ({
      distance: 0,
      name: `Waypoint ${index + 1}`,
      location: [coord.lng, coord.lat],
    })),
    code: "Ok",
    uuid: `mock-${getRandomInt(1000000, 9999999)}`,
  };
};

export const getNearbyPubs = async (zipCode: string) => {
  if (!USE_MOCK_API) {
    throw new Error("Mock API is disabled");
  }

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
    businessHours: {
      monday: { isOpen: true, open: "11:00", close: "23:00" },
      tuesday: { isOpen: true, open: "11:00", close: "23:00" },
      wednesday: { isOpen: true, open: "11:00", close: "23:00" },
      thursday: { isOpen: true, open: "11:00", close: "23:00" },
      friday: { isOpen: true, open: "11:00", close: "00:00" },
      saturday: { isOpen: true, open: "11:00", close: "00:00" },
      sunday: { isOpen: true, open: "12:00", close: "22:30" },
    },
    contactInfo: {
      phone: `+44 ${getRandomInt(1000, 9999)} ${getRandomInt(100000, 999999)}`,
      email: `pub${getRandomInt(1000, 9999)}@example.com`,
      website: `https://www.pub${getRandomInt(1000, 9999)}.co.uk`,
      googleRating: getRandomFloat(3.0, 5.0, 1),
      reviewCount: getRandomInt(10, 500),
    },
    address: {
      street: `${getRandomInt(1, 100)} Nearby Street`,
      city: "Mock City",
      postcode: zipCode,
    },
  }));
};

export const getBusinessDetails = async (name: string, postcode: string) => {
  if (!USE_MOCK_API) {
    throw new Error("Mock API is disabled");
  }

  if (Math.random() < 0.05) {
    throw new Error("Business details service unavailable");
  }

  if (Math.random() < 0.1) {
    throw new Error("Business not found");
  }

  const rating = getRandomFloat(3.0, 5.0, 1);
  const reviewCount = getRandomInt(10, 500);

  return {
    phone: `+44 ${getRandomInt(1000, 9999)} ${getRandomInt(100000, 999999)}`,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    openingHours: {
      periods: [
        {
          open: { day: 0, time: "1100" },
          close: { day: 0, time: "2300" },
        },
        // ... more periods
      ],
      weekday_text: [
        "Monday: 11:00 - 23:00",
        "Tuesday: 11:00 - 23:00",
        "Wednesday: 11:00 - 23:00",
        "Thursday: 11:00 - 23:00",
        "Friday: 11:00 - 00:00",
        "Saturday: 11:00 - 00:00",
        "Sunday: 12:00 - 22:30",
      ],
    },
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
};
