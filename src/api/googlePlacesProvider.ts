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
      // 1) Find place_id by text ("Name, Postcode")
      const q = makeQuery(name, seed.postcode ?? undefined);
      const find = await getJson(`/api/places/find?q=${encodeURIComponent(q)}`);
      if (find?.status !== "OK" || !find?.candidates?.[0]?.place_id) return out;
      const pid = find.candidates[0].place_id as string;

      // 2) Details: phone, website, opening_hours, rating, count (+ geometry lat/lng)
      const det = await getJson(`/api/places/details?place_id=${encodeURIComponent(pid)}`);
      if (det?.status !== "OK" || !det?.result) return out;
      const r = det.result;

      // Non-clobbering fills:
      out.phone ||= r.formatted_phone_number ?? null;
      out.email ||= null; // Google typically doesn't provide email
      out.extras ||= {};
      if (r.website && !out.extras["website"]) out.extras["website"] = r.website;

      // Opening hours
      if (!out.openingHours && r.opening_hours?.weekday_text) {
        // Google returns verbose weekday_text; keep as-is in extras and approximate
        out.extras["google_opening_hours_text"] = r.opening_hours.weekday_text;
      }

      // Rating
      if (r.rating != null)  out.extras["google_rating"] = r.rating;
      if (r.user_ratings_total != null) out.extras["google_ratings_count"] = r.user_ratings_total;

      // Geometry (better than postcode centroid if present)
      const lat = r.geometry?.location?.lat;
      const lng = r.geometry?.location?.lng;
      if (lat != null && lng != null) {
        if (out.extras["lat"] == null) out.extras["lat"] = lat;
        if (out.extras["lng"] == null) out.extras["lng"] = lng;
      }

      // mark provenance (for UI labels and non-export)
      out.extras["google_places"] = true;
    } catch {
      // swallow & stay graceful
    }
    return out;
  }
}

export const googlePlacesProvider = new GooglePlacesProvider();
