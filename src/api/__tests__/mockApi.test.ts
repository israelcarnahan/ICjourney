import {
  getCoordinatesFromQuery,
  getOptimizedRoute,
  getNearbyPubs,
  getBusinessDetails,
} from "../mockApi";

// Mock environment variable
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.VITE_USE_MOCK_API = "true";
});

afterEach(() => {
  process.env = originalEnv;
});

describe("Mock API Functions", () => {
  describe("getCoordinatesFromQuery", () => {
    it("should return valid coordinates for a postcode", async () => {
      const result = await getCoordinatesFromQuery("SW1A 1AA");
      expect(result).toHaveProperty("lat");
      expect(result).toHaveProperty("lng");
      expect(result.lat).toBeGreaterThanOrEqual(51.3);
      expect(result.lat).toBeLessThanOrEqual(55.8);
      expect(result.lng).toBeGreaterThanOrEqual(-8.6);
      expect(result.lng).toBeLessThanOrEqual(1.8);
    });

    it("should return valid coordinates for a place name", async () => {
      const result = await getCoordinatesFromQuery("London, UK");
      expect(result).toHaveProperty("lat");
      expect(result).toHaveProperty("lng");
      expect(result.lat).toBeGreaterThanOrEqual(49.9);
      expect(result.lat).toBeLessThanOrEqual(58.7);
    });
  });

  describe("getOptimizedRoute", () => {
    it("should return a valid route between points", async () => {
      const coords = [
        { lat: 51.5074, lng: -0.1278 }, // London
        { lat: 53.4808, lng: -2.2426 }, // Manchester
      ];
      const result = await getOptimizedRoute(coords);

      expect(result).toHaveProperty("distance");
      expect(result).toHaveProperty("duration");
      expect(result).toHaveProperty("polyline");
      expect(result).toHaveProperty("legs");
      expect(result.legs).toHaveLength(1);
      expect(result.distance).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe("getNearbyPubs", () => {
    it("should return an array of pubs near a postcode", async () => {
      const result = await getNearbyPubs("SW1A 1AA");

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result.length).toBeLessThanOrEqual(20);

      result.forEach((pub) => {
        expect(pub).toHaveProperty("name");
        expect(pub).toHaveProperty("coordinates");
        expect(pub).toHaveProperty("address");
        expect(pub.address.postcode).toBe("SW1A 1AA");
      });
    });
  });

  describe("getBusinessDetails", () => {
    it("should return business details for a valid pub", async () => {
      const result = await getBusinessDetails("The Red Lion", "SW1A 1AA");

      expect(result).toHaveProperty("phone");
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("openingHours");
      expect(result).toHaveProperty("googleRating");
      expect(result).toHaveProperty("reviewCount");
      expect(result.googleRating).toBeGreaterThanOrEqual(3.0);
      expect(result.googleRating).toBeLessThanOrEqual(5.0);
    });
  });

  describe("Error Handling", () => {
    it("should throw error when mock API is disabled", async () => {
      process.env.VITE_USE_MOCK_API = "false";

      await expect(getCoordinatesFromQuery("SW1A 1AA")).rejects.toThrow(
        "Mock API is disabled"
      );
    });

    it("should handle service unavailability", async () => {
      // Mock Math.random to force an error
      const originalRandom = Math.random;
      Math.random = () => 0.01; // Force error condition

      await expect(
        getBusinessDetails("The Red Lion", "SW1A 1AA")
      ).rejects.toThrow("Business details service unavailable");

      Math.random = originalRandom;
    });
  });
});
