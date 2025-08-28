import type { BusinessData, BusinessDataProvider, ProviderContext } from './types';

const log = (...a: any[]) => console.debug('[google]', ...a);

async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) { log('fetch failed', url, res.status); return null; }
    return await res.json() as T;
  } catch (e) {
    log('fetch error', url, e);
    return null;
  }
}

// v1 searchText via our dev proxy: GET /api/places/find?q=...
type FindResponse = { places?: Array<{ id: string; formattedAddress?: string; displayName?: { text: string } }> };
// v1 details payload we requested via FieldMask:
type DetailsResponse = {
  id?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude?: number; longitude?: number };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  currentOpeningHours?: { weekdayDescriptions?: string[] };
};

export const GooglePlacesProvider: BusinessDataProvider = {
  name: 'google-places-v1',

  async get(pubId: string, seed: Partial<BusinessData>): Promise<BusinessData> {
    // Legacy compatibility - convert to enrichment pattern
    const prev: BusinessData = {
      ...seed,
      sources: seed.sources || [],
      extras: seed.extras || {},
    } as BusinessData;
    return enrichGooglePlaces(seed, prev, { pubId });
  },

  async enrich(seed, prev, _ctx: ProviderContext): Promise<BusinessData> {
    return enrichGooglePlaces(seed, prev, _ctx);
  },
};

async function enrichGooglePlaces(seed: Partial<BusinessData>, prev: BusinessData, _ctx: ProviderContext): Promise<BusinessData> {
    if (!seed?.name || !seed?.postcode) return prev;

    const q = `${seed.name}, ${seed.postcode}, UK`;
    log('query:', q);

    // 1) Find place id
    const find = await getJSON<FindResponse>(`/api/places/find?q=${encodeURIComponent(q)}`);
    if (!find?.places?.length || !find.places[0]?.id) {
      log('find result empty');
      return prev;
    }
    const id = find.places[0].id;
    log('details → id', id);

    // 2) Get details for that place id
    const det = await getJSON<DetailsResponse>(`/api/places/details?id=${encodeURIComponent(id)}`);
    if (!det) {
      log('details payload empty');
      return prev;
    }
    log('details payload', det);

    const patch: BusinessData = {
      ...prev,
      extras: { ...(prev.extras ?? {}) },
      meta: {
        ...(prev.meta ?? {}),
        provenance: {
          ...(prev.meta?.provenance ?? {}),
        },
      },
    };

    // Website
    if (det.websiteUri && !patch.extras!.website) {
      patch.extras!.website = det.websiteUri;
      patch.meta!.provenance!.website = 'google';
    }

    // Phone (prefer national, fall back to international)
    const phone = det.nationalPhoneNumber || det.internationalPhoneNumber;
    if (phone && !patch.phone) {
      patch.phone = phone;
      patch.meta!.provenance!.phone = 'google';
    }
    // also mirror phone in extras for the "Your lists" panel (optional but helpful)
    if (phone && !patch.extras!.phone) {
      patch.extras!.phone = phone;
    }

    // Hours (text block)
    const hours = det.currentOpeningHours?.weekdayDescriptions;
    if (hours && (!patch.extras!.google_opening_hours_text || !Array.isArray(patch.extras!.google_opening_hours_text))) {
      patch.extras!.google_opening_hours_text = hours;
      patch.meta!.provenance!.openingHours = 'google';
    }

    // Rating
    if (typeof det.rating === 'number') {
      patch.extras!.google_rating = det.rating;
    }
    if (typeof det.userRatingCount === 'number') {
      patch.extras!.google_ratings_count = det.userRatingCount;
    }

    // Coordinates (these are better than postcode centroids)
    if (det.location?.latitude != null && det.location?.longitude != null) {
      if (patch.extras!.lat == null) patch.extras!.lat = det.location.latitude;
      if (patch.extras!.lng == null) patch.extras!.lng = det.location.longitude;
    }

    // Helpful marker that Google contributed something
    patch.meta!.provenance!.google = true;

    return patch;
}
export default GooglePlacesProvider;
