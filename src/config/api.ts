export const API_CFG = {
  cacheTTLms: 5 * 60 * 1000, // 5 minutes
  requestTimeoutMs: 5000,
  endpoints: {
    nominatim: "https://nominatim.openstreetmap.org/search",
    postcodes: "https://api.postcodes.io/postcodes",
  },
} as const;
