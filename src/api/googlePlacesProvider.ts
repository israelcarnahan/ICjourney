import type { BusinessData, BusinessDataProvider } from './types';

export class GooglePlacesProvider implements BusinessDataProvider {
  async get(_pubId: string, seed: Partial<BusinessData>): Promise<BusinessData> {
    const out: BusinessData = { ...(seed as any) };
    const name = (seed.name || '').trim();
    const postcode = (seed.postcode || '').trim();
    if (!name) return out;

    try {
      const q = [name, postcode].filter(Boolean).join(', ');
      console.debug('[provider] google running for', { name, postcode, q });

      // 1) FIND
      const findRes = await fetch(`/api/places/find?q=${encodeURIComponent(q)}`);
      if (!findRes.ok) {
        console.debug('[places] find failed', findRes.status);
        return out;
      }
      const find = await findRes.json();
      const place = find?.places?.[0];
      console.debug('[places] find result', place);
      if (!place?.id) return out;

      // 2) DETAILS (v1, via proxy)
      console.debug('[places] details → id', place.id);
      const detRes = await fetch(`/api/places/details?id=${encodeURIComponent(place.id)}`);
      if (!detRes.ok) {
        console.debug('[places] details failed', detRes.status);
        return out;
      }
      const r = await detRes.json();
      console.debug('[places] details payload', r);

      // Map fields — only fill if empty; record provenance
      (out as any).meta ||= {}; (out as any).meta.provenance ||= {};
      const prov = (out as any).meta.provenance;

      // Phone
      if (!out.phone && r.formattedPhoneNumber) {
        out.phone = r.formattedPhoneNumber;
        prov.phone = 'google';
        prov.google = true;
      }

      // Website
      const website = r.websiteUri;
      if (website) {
        out.extras ||= {};
        if (!out.extras['website']) out.extras['website'] = website;
        prov.website = 'google';
        prov.google = true;
      }

      // Opening hours (keep the text; do NOT fabricate)
      const weekday = r.currentOpeningHours?.weekdayDescriptions;
      if (Array.isArray(weekday) && weekday.length) {
        out.extras ||= {};
        out.extras['google_opening_hours_text'] = weekday;
        prov.openingHours = 'google';
        prov.google = true;
      }

      // Rating
      if (r.rating != null) {
        out.extras ||= {};
        out.extras['google_rating'] = r.rating;
      }
      if (r.userRatingCount != null) {
        out.extras ||= {};
        out.extras['google_ratings_count'] = r.userRatingCount;
      }

      // Coordinates (prefer precise)
      const lat = r.location?.latitude;
      const lng = r.location?.longitude;
      if (lat != null && lng != null) {
        out.extras ||= {};
        if (out.extras['lat'] == null) out.extras['lat'] = lat;
        if (out.extras['lng'] == null) out.extras['lng'] = lng;
        prov.google = true;
      }
    } catch (e) {
      console.debug('[places] provider error', e);
    }

    return out;
  }
}

export const googlePlacesProvider = new GooglePlacesProvider();
