import type { BusinessData, BusinessDataProvider } from './types';

export class GooglePlacesProvider implements BusinessDataProvider {
  async get(_pubId: string, seed: Partial<BusinessData>): Promise<BusinessData> {
    const out: BusinessData = { ...(seed as any) };
    const name = (seed.name || '').trim();
    const postcode = (seed.postcode || '').trim();
    if (!name) return out;

    console.debug('[provider] google running for', seed?.name, seed?.postcode);

    try {
      // 1) Find
      const q = [name, postcode].filter(Boolean).join(', ');
      console.info('[places] query:', q); // dev-only
      const findRes = await fetch(`/api/places/find?q=${encodeURIComponent(q)}`);
      if (!findRes.ok) return out;
      const find = await findRes.json();
      const place = find?.places?.[0];
      if (!place?.id) return out;

      // 2) Details
      const detRes = await fetch(`/api/places/details?id=${encodeURIComponent(place.id)}`);
      if (!detRes.ok) return out;
      const det = await detRes.json();
      const r = det || {};

      // Map: v1 fields
      // phone
      if (!out.phone && r.formattedPhoneNumber) {
        out.phone = r.formattedPhoneNumber;
        (out as any).meta ||= {}; (out as any).meta.provenance ||= {};
        (out as any).meta.provenance.phone = 'google';
        (out as any).meta.provenance.google = true;
      }

      // website
      if (r.websiteUri) {
        out.extras ||= {};
        if (!out.extras['website']) out.extras['website'] = r.websiteUri;
        (out as any).meta ||= {}; (out as any).meta.provenance ||= {};
        (out as any).meta.provenance.website = 'google';
        (out as any).meta.provenance.google = true;
      }

      // opening hours (text only for now)
      const weekday = r.currentOpeningHours?.weekdayDescriptions;
      if (!out.openingHours && Array.isArray(weekday) && weekday.length) {
        out.extras ||= {};
        out.extras['google_opening_hours_text'] = weekday; // keep text
        (out as any).meta ||= {}; (out as any).meta.provenance ||= {};
        (out as any).meta.provenance.openingHours = 'google';
        (out as any).meta.provenance.google = true;
      }

      // rating
      if (r.rating != null) {
        out.extras ||= {};
        out.extras['google_rating'] = r.rating;
      }
      if (r.userRatingCount != null) {
        out.extras ||= {};
        out.extras['google_ratings_count'] = r.userRatingCount;
      }

      // geometry (preferred lat/lng)
      const lat = r.location?.latitude;
      const lng = r.location?.longitude;
      if (lat != null && lng != null) {
        out.extras ||= {};
        if (out.extras['lat'] == null) out.extras['lat'] = lat;
        if (out.extras['lng'] == null) out.extras['lng'] = lng;
        (out as any).meta ||= {}; (out as any).meta.provenance ||= {};
        (out as any).meta.provenance.google = true;
      }
    } catch { /* swallow to keep UI smooth */ }

    return out;
  }
}

export const googlePlacesProvider = new GooglePlacesProvider();
