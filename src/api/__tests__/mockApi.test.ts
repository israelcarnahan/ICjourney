import {
  getCoordinatesFromQuery,
  getOptimizedRoute,
  getNearbyPubs,
  getBusinessDetails,
  isMockApiEnabled,
  setMockApiEnabled,
} from "./mockApi.mock";

beforeEach(() => {
  setMockApiEnabled(true);
});

describe("Mock API Configuration", () => {
  test("isMockApiEnabled returns true when mock API is enabled", () => {
    setMockApiEnabled(true);
    expect(isMockApiEnabled()).toBe(true);
  });

  test("isMockApiEnabled returns false when mock API is disabled", () => {
    setMockApiEnabled(false);
    expect(isMockApiEnabled()).toBe(false);
  });
});

describe("getCoordinatesFromQuery", () => {
  test("returns valid geocoding response structure", async () => {
    const result = await getCoordinatesFromQuery("Red Lion NR20 4NQ");

    // Check response structure
    expect(result).toHaveProperty("type", "FeatureCollection");
    expect(result).toHaveProperty("query");
    expect(result).toHaveProperty("features");
    expect(Array.isArray(result.features)).toBe(true);

    // Check feature structure
    const feature = result.features[0];
    expect(feature).toHaveProperty("id");
    expect(feature).toHaveProperty("type", "Feature");
    expect(feature).toHaveProperty("place_name");
    expect(feature).toHaveProperty("center");
    expect(feature).toHaveProperty("geometry");

    // Check coordinate types
    expect(typeof feature.center[0]).toBe("number"); // longitude
    expect(typeof feature.center[1]).toBe("number"); // latitude
  });

  test("handles error cases", async () => {
    // Mock random to force error
    const originalRandom = Math.random;
    Math.random = () => 0.01; // Force error (5% chance)

    await expect(getCoordinatesFromQuery("Invalid Location")).rejects.toThrow(
      "Geocoding service unavailable"
    );

    Math.random = originalRandom;
  });
});

describe("getOptimizedRoute", () => {
  test("returns valid route response structure", async () => {
    const coords = [
      { lat: 52.75, lng: 0.94 },
      { lat: 52.76, lng: 0.95 },
    ];
    const result = await getOptimizedRoute(coords);

    // Check response structure
    expect(result).toHaveProperty("routes");
    expect(Array.isArray(result.routes)).toBe(true);

    // Check route structure
    const route = result.routes[0];
    expect(route).toHaveProperty("distance");
    expect(route).toHaveProperty("duration");
    expect(route).toHaveProperty("geometry");
    expect(route).toHaveProperty("legs");

    // Check data types
    expect(typeof route.distance).toBe("number");
    expect(typeof route.duration).toBe("number");
    expect(route.geometry).toHaveProperty("coordinates");
    expect(Array.isArray(route.geometry.coordinates)).toBe(true);
  });

  test("handles error cases", async () => {
    const coords = [{ lat: 52.75, lng: 0.94 }];

    // Mock random to force error
    const originalRandom = Math.random;
    Math.random = () => 0.01; // Force error (5% chance)

    await expect(getOptimizedRoute(coords)).rejects.toThrow(
      "Routing service unavailable"
    );

    Math.random = originalRandom;
  });
});

describe("getNearbyPubs", () => {
  test("returns valid pub array structure", async () => {
    const result = await getNearbyPubs("NR20 4NQ");

    // Check array structure
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check pub structure
    const pub = result[0];
    expect(pub).toHaveProperty("id");
    expect(pub).toHaveProperty("name");
    expect(pub).toHaveProperty("coordinates");
    expect(pub).toHaveProperty("businessHours");
    expect(pub).toHaveProperty("contactInfo");
    expect(pub).toHaveProperty("address");

    // Check coordinate types
    expect(typeof pub.coordinates.latitude).toBe("number");
    expect(typeof pub.coordinates.longitude).toBe("number");
  });

  test("handles error cases", async () => {
    // Mock random to force error
    const originalRandom = Math.random;
    Math.random = () => 0.01; // Force error (5% chance)

    await expect(getNearbyPubs("Invalid Postcode")).rejects.toThrow(
      "Pub search service unavailable"
    );

    Math.random = originalRandom;
  });
});

describe("getBusinessDetails", () => {
  test("returns valid business details structure", async () => {
    // Mock random to avoid error cases
    const originalRandom = Math.random;
    Math.random = () => 0.5; // Avoid both error cases

    const result = await getBusinessDetails("Red Lion", "NR20 4NQ");

    // Check response structure
    expect(result).toHaveProperty("phone");
    expect(result).toHaveProperty("email");
    expect(result).toHaveProperty("openingHours");
    expect(result).toHaveProperty("rating");
    expect(result).toHaveProperty("website");
    expect(result).toHaveProperty("photos");
    expect(result).toHaveProperty("reviews");

    // Check rating structure
    expect(result.rating).toHaveProperty("google");
    expect(result.rating.google).toHaveProperty("stars");
    expect(result.rating.google).toHaveProperty("count");

    // Check data types
    expect(typeof result.rating.google.stars).toBe("number");
    expect(typeof result.rating.google.count).toBe("number");
    expect(Array.isArray(result.photos)).toBe(true);
    expect(Array.isArray(result.reviews)).toBe(true);

    Math.random = originalRandom;
  });

  test("handles error cases", async () => {
    // Mock random to force error
    const originalRandom = Math.random;
    Math.random = () => 0.01; // Force error (5% chance)

    await expect(getBusinessDetails("Invalid Pub", "NR20 4NQ")).rejects.toThrow(
      "Business details service unavailable"
    );

    Math.random = originalRandom;
  });

  test("handles business not found case", async () => {
    // Mock random to force "not found" error
    const originalRandom = Math.random;
    Math.random = () => 0.08; // Force "not found" (10% chance)

    await expect(
      getBusinessDetails("Non-existent Pub", "NR20 4NQ")
    ).rejects.toThrow("Business not found");

    Math.random = originalRandom;
  });
});
