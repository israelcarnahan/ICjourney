import type { BusinessData, BusinessDataProvider } from './types';

export class GooglePlacesProvider implements BusinessDataProvider {
  name = 'GooglePlacesProvider';

  async get(_pubId: string, seed: Partial<BusinessData>): Promise<BusinessData | null> {
    const name = seed?.name?.trim();
    const postcode = seed?.postcode?.trim();
    if (!name || !postcode) return null;

    const q = `${name}, ${postcode}, UK`;
    console.debug('[google] query:', q);

    try {
      // 1) FIND
      const r = await fetch(`/api/places/find?q=${encodeURIComponent(q)}`);
      const payload = await r.json();
      console.debug('[google] find payload', payload);
      
      if (payload?.error) {
        console.debug('[google] find error:', payload.error);
        return null; // bail; let other providers run
      }
      
      const place = payload?.places?.[0];
      if (!place?.id) {
        console.debug('[google] find result empty');
        return null;
      }

      // 2) DETAILS
      const d = await fetch(`/api/places/details?id=${encodeURIComponent(place.id)}`);
      const details = await d.json();
      console.debug('[google] details payload', details);
      
      if (details?.error) {
        console.debug('[google] details error:', details.error);
        return null;
      }

      // Map fields
      const phone = details.internationalPhoneNumber || details.nationalPhoneNumber || null;
      const hours = details.currentOpeningHours?.weekdayDescriptions ?? null;
      const website = details.websiteUri ?? null;
      const lat = details.location?.latitude ?? null;
      const lng = details.location?.longitude ?? null;

      const patch: BusinessData = { 
        ...seed,
        phone: phone || undefined,
        extras: {
          ...(seed.extras || {}),
          ...(website ? { website } : {}),
          ...(hours ? { google_opening_hours_text: hours } : {}),
          ...(lat && lng ? { lat, lng } : {}),
          ...(details.rating ? { google_rating: details.rating } : {}),
          ...(Number.isFinite(details.userRatingCount) ? { google_ratings_count: details.userRatingCount } : {}),
        },
        meta: {
          ...(seed.meta || {}),
          provenance: {
            ...(seed.meta?.provenance || {}),
            ...(phone ? { phone: 'google' } : {}),
            ...(website ? { website: 'google' } : {}),
            ...(hours ? { openingHours: 'google' } : {}),
            google: true,
          }
        }
      } as BusinessData;
      
      return patch;
    } catch (error) {
      console.debug('[google] provider error:', error);
      return null; // Do not throw; return null on errors so other providers can try
    }
  }
}

export const googlePlacesProvider = new GooglePlacesProvider();
export default googlePlacesProvider;
