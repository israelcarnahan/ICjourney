import {
  getCoordinatesFromQuery,
  getOptimizedRoute,
  getNearbyPubs,
  getBusinessDetails,
  setMockApiEnabled,
} from "../mockApi";

describe("Mock API Tests", () => {
  beforeEach(() => {
    setMockApiEnabled(true);
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getCoordinatesFromQuery", () => {
    it("should return valid geocoding response for a postcode", async () => {
      const response = await getCoordinatesFromQuery("SW1A 1AA");
      expect(response).toMatchObject({
        type: "FeatureCollection",
        query: ["SW1A 1AA"],
        features: expect.arrayContaining([
          expect.objectContaining({
            type: "Feature",
            place_name: "SW1A 1AA",
            geometry: {
              type: "Point",
              coordinates: expect.arrayContaining([
                expect.any(Number),
                expect.any(Number),
              ]),
            },
          }),
        ]),
      });
    });

    it("should handle API failures", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.05); // Force failure
      await expect(getCoordinatesFromQuery("SW1A 1AA")).rejects.toThrow(
        "Failed to geocode location"
      );
    });
  });

  describe("getOptimizedRoute", () => {
    it("should return valid route response", async () => {
      const waypoints = [
        { lat: 51.5074, lng: -0.1278 },
        { lat: 51.5136, lng: -0.1366 },
      ];
      const response = await getOptimizedRoute(waypoints);

      expect(response).toMatchObject({
        routes: expect.arrayContaining([
          expect.objectContaining({
            geometry: {
              type: "LineString",
              coordinates: expect.arrayContaining([
                expect.arrayContaining([
                  expect.any(Number),
                  expect.any(Number),
                ]),
              ]),
            },
            distance: expect.any(Number),
            duration: expect.any(Number),
            distance_miles: expect.any(Number),
            duration_minutes: expect.any(Number),
          }),
        ]),
        waypoints: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            location: expect.arrayContaining([
              expect.any(Number),
              expect.any(Number),
            ]),
          }),
        ]),
        code: "Ok",
        uuid: expect.stringMatching(/^mock-\d+$/),
      });
    });

    it("should correctly convert distance from meters to miles", async () => {
      const waypoints = [{ lat: 51.5074, lng: -0.1278 }];
      const response = await getOptimizedRoute(waypoints);
      const route = response.routes[0];

      // Verify the conversion (meters to miles)
      const expectedMiles = Number((route.distance / 1609.34).toFixed(2));
      expect(route.distance_miles).toBe(expectedMiles);
    });

    it("should correctly convert duration from seconds to minutes", async () => {
      const waypoints = [{ lat: 51.5074, lng: -0.1278 }];
      const response = await getOptimizedRoute(waypoints);
      const route = response.routes[0];

      // Verify the conversion (seconds to minutes)
      const expectedMinutes = Number((route.duration / 60).toFixed(1));
      expect(route.duration_minutes).toBe(expectedMinutes);
    });

    it("should handle edge cases (zero distance/duration)", async () => {
      const waypoints = [{ lat: 51.5074, lng: -0.1278 }];
      jest.spyOn(Math, "random").mockReturnValue(0); // Force minimum values

      const response = await getOptimizedRoute(waypoints);
      const route = response.routes[0];

      expect(route.distance_miles).toBe(0.62); // 1000 meters = 0.62 miles
      expect(route.duration_minutes).toBe(1.0); // 60 seconds = 1 minute
    });

    it("should handle edge cases (maximum distance/duration)", async () => {
      const waypoints = [{ lat: 51.5074, lng: -0.1278 }];
      jest.spyOn(Math, "random").mockReturnValue(0.999); // Force maximum values

      const response = await getOptimizedRoute(waypoints);
      const route = response.routes[0];

      expect(route.distance_miles).toBe(31.07); // 50000 meters = 31.07 miles
      expect(route.duration_minutes).toBe(50.0); // 3000 seconds = 50 minutes
    });

    it("should handle API failures", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.05); // Force failure
      await expect(
        getOptimizedRoute([{ lat: 51.5074, lng: -0.1278 }])
      ).rejects.toThrow("Failed to calculate route");
    });
  });

  describe("getNearbyPubs", () => {
    it("should return valid pub data", async () => {
      const response = await getNearbyPubs("SW1A 1AA");

      expect(response).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fsq_id: expect.stringMatching(/^mock-\d+$/),
            name: expect.stringMatching(/^Mock Pub \d+$/),
            distance: expect.any(Number),
            geocodes: {
              main: {
                latitude: expect.any(Number),
                longitude: expect.any(Number),
              },
            },
            location: {
              address: expect.stringMatching(/^\d+ Mock Street$/),
              postcode: "SW1A 1AA",
              locality: "Mock City",
              region: "Mock County",
              country: "United Kingdom",
            },
          }),
        ])
      );
    });

    it("should handle API failures", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.05); // Force failure
      await expect(getNearbyPubs("SW1A 1AA")).rejects.toThrow(
        "Failed to find nearby pubs"
      );
    });
  });

  describe("getBusinessDetails", () => {
    it("should return valid business details", async () => {
      const response = await getBusinessDetails("The Red Lion", "SW1A 1AA");

      expect(response).toMatchObject({
        phone: expect.stringMatching(/^\+44 \d{4} \d{6}$/),
        email: expect.stringMatching(/^pub\d{4}@example\.com$/),
        website: expect.stringMatching(/^https:\/\/www\.pub\d{4}\.co\.uk$/),
        openingHours: {
          periods: expect.arrayContaining([
            expect.objectContaining({
              open: {
                day: expect.any(Number),
                time: expect.stringMatching(/^\d{2}:\d{2}$/),
              },
              close: {
                day: expect.any(Number),
                time: expect.stringMatching(/^\d{2}:\d{2}$/),
              },
            }),
          ]),
          weekday_text: expect.arrayContaining([expect.any(String)]),
        },
        rating: expect.any(Number),
        reviewCount: expect.any(Number),
        photos: expect.arrayContaining([
          expect.stringMatching(/^https:\/\/example\.com\/photo\d+\.jpg$/),
        ]),
        reviews: expect.arrayContaining([
          expect.objectContaining({
            author: expect.stringMatching(/^User\d{4}$/),
            rating: expect.any(Number),
            text: "This is a mock review for testing purposes.",
            time: expect.any(String),
          }),
        ]),
      });
    });

    it("should handle API failures", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.05); // Force failure
      await expect(
        getBusinessDetails("The Red Lion", "SW1A 1AA")
      ).rejects.toThrow("Failed to get business details");
    });
  });
});
