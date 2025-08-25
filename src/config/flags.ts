export const FEATURES = {
  liveProviders: {
    postcodes: true,
    nominatim: true,
    googlePlaces: true,  // new
  },
};

export const FLAGS = {
  PROVIDERS: { POSTCODES: true, GOOGLE_PLACES: true, NOMINATIM: true, FALLBACK: true },
  DEBUG: true,
  LOG_PROVIDERS: true,
};
// expose for debugging
// @ts-ignore
window.__FLAGS = FLAGS;
