import type { BusinessData, BusinessDataProvider } from './types';

export class GooglePlacesProvider implements BusinessDataProvider {
  async get(_pubId: string, seed: Partial<BusinessData>): Promise<BusinessData> {
    const out: BusinessData = { ...(seed as any) };
    const name = (seed.name || '').trim();
    const postcode = (seed.postcode || '').trim();
    if (!name) return out;

    try {
      const q = [name, postcode].filter(Boolean).join(', ');
      console.debug('[places] query:', q);

      // 1) FIND
      const findRes = await fetch(`/api/places/find?q=${encodeURIComponent(q)}`);
      console.debug('[places] find result', findRes);
      if (!findRes.ok) {
        console.debug('[places] find failed', findRes.status);
        return out;
      }
      const find = await findRes.json();
      const place = find?.places?.[0];
      console.debug('[places] find result', place);
      if (!place?.id) return out;

      // 2) DETAILS (v1, via proxy)
      console.debug('[places] details → id', place?.id);
      const detRes = await fetch(`/api/places/details?id=${encodeURIComponent(place.id)}`);
      if (!detRes.ok) {
        console.debug('[places] details failed', detRes.status);
        return out;
      }
      const r = await detRes.json();
      console.debug('[places] details payload', detRes);

      // after we fetch details JSON into `r`
      const phone =
        r.nationalPhoneNumber ||
        r.internationalPhoneNumber ||
        undefined;

      const website = r.websiteUri || undefined;

      // v1 "weekdayDescriptions" is an array of strings like
      // ["Monday: 9:00 AM – 5:00 PM", ...]
      const hoursText: string[] = r.currentOpeningHours?.weekdayDescriptions ?? [];

      const lat = r.location?.latitude;
      const lng = r.location?.longitude;

      const patch: Partial<BusinessData> = { extras: { ...seed.extras } };

      if (phone) {
        patch.phone = seed.phone || phone;
        patch.meta = patch.meta ?? { provenance: {} as any };
        patch.meta.provenance = { ...(patch.meta.provenance || {}), phone: 'google', google: true };
      }
      if (website) {
        patch.extras!.website = website;
        patch.meta = patch.meta ?? { provenance: {} as any };
        patch.meta.provenance = { ...(patch.meta.provenance || {}), website: 'google', google: true };
      }
      if (hoursText.length) {
        // keep hours as text list; we only show it when provenance is google
        patch.extras!.google_opening_hours_text = hoursText;
        patch.meta = patch.meta ?? { provenance: {} as any };
        patch.meta.provenance = { ...(patch.meta.provenance || {}), openingHours: 'google', google: true };
      }
      if (typeof lat === 'number' && typeof lng === 'number') {
        patch.extras!.lat = lat;
        patch.extras!.lng = lng;
        patch.meta = patch.meta ?? { provenance: {} as any };
        patch.meta.provenance = { ...(patch.meta.provenance || {}), google: true };
      }

      // rating is non-sensitive and just informational
      if (typeof r.rating === 'number') {
        patch.extras!.google_rating = r.rating;
      }
      if (typeof r.userRatingCount === 'number') {
        patch.extras!.google_ratings_count = r.userRatingCount;
      }

      console.debug('[google] mapped', {
        phone: patch.phone,
        website: patch.extras?.website,
        hours: patch.extras?.google_opening_hours_text,
        lat: patch.extras?.lat, lng: patch.extras?.lng,
        rating: patch.extras?.google_rating
      });

      // Merge the patch into the output
      Object.assign(out, patch);
    } catch (e) {
      console.debug('[places] provider error', e);
    }

    return out;
  }
}

export const googlePlacesProvider = new GooglePlacesProvider();
