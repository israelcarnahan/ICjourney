import { BusinessData, BusinessDataProvider } from "./types";
import { getJson } from "./http";
import { FEATURES } from "../config/flags";

function makeQuery(name: string, postcode?: string|null) {
  return [name, postcode].filter(Boolean).join(", ");
}

export class GooglePlacesProvider implements BusinessDataProvider {
  async get(_pubId: string, seed: Partial<BusinessData>): Promise<BusinessData> {
    const out: BusinessData = { ...(seed as any) };
    if (!FEATURES.liveProviders.googlePlaces) return out;

    const name = seed.name?.trim(); if (!name) return out;

    // If the dev proxy is disabled (no key), the endpoint returns 501 → we just no-op.
    try {
      // 1) Find place by text ("Name, Postcode")
      const q = makeQuery(name, seed.postcode ?? undefined);
      const find = await getJson(`/api/places/find?q=${encodeURIComponent(q)}`);
      if (!find?.places?.[0]?.id) return out;
      const placeId = find.places[0].id as string;

      // 2) Details: phone, website, opening_hours, rating, count (+ geometry lat/lng)
      const det = await getJson(`/api/places/details?id=${encodeURIComponent(placeId)}`);
      if (!det) return out;
      const r = det;

      // Non-clobbering fills:
      if (!out.phone && r.formattedPhoneNumber) {
        out.phone = r.formattedPhoneNumber;
        out.meta ||= {};
        out.meta.provenance ||= {};
        out.meta.provenance.phone = 'google';
      }
      out.email ||= null; // Google typically doesn't provide email
      out.extras ||= {};
      if (r.websiteUri && !out.extras["website"]) {
        out.extras["website"] = r.websiteUri;
        out.meta ||= {};
        out.meta.provenance ||= {};
        out.meta.provenance.website = 'google';
      }

      // Opening hours
      if (!out.openingHours && r.currentOpeningHours?.weekdayDescriptions) {
        // Google returns verbose weekday descriptions; keep as-is in extras
        out.extras["google_opening_hours_text"] = r.currentOpeningHours.weekdayDescriptions;
        out.meta ||= {};
        out.meta.provenance ||= {};
        out.meta.provenance.openingHours = 'google';
      }

      // Rating
      if (r.rating != null)  out.extras["google_rating"] = r.rating;
      if (r.userRatingCount != null) out.extras["google_ratings_count"] = r.userRatingCount;

      // Geometry (better than postcode centroid if present)
      const lat = r.location?.latitude;
      const lng = r.location?.longitude;
      if (lat != null && lng != null) {
        if (out.extras["lat"] == null) out.extras["lat"] = lat;
        if (out.extras["lng"] == null) out.extras["lng"] = lng;
      }

      // mark provenance (for UI labels and non-export)
      out.extras["google_places"] = true;
      out.meta ||= {};
      out.meta.provenance ||= {};
      out.meta.provenance.google = true;
    } catch {
      // swallow & stay graceful
    }
    return out;
  }
}

export const googlePlacesProvider = new GooglePlacesProvider();
