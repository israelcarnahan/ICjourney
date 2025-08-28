import type { BusinessData, BusinessDataProvider } from './types';

export class GooglePlacesProvider implements BusinessDataProvider {
  name = 'GooglePlacesProvider';

  async get(_pubId: string, seed: Partial<BusinessData>): Promise<BusinessData> {
    const name = seed?.name?.trim();
    const postcode = seed?.postcode?.trim();
    if (!name || !postcode) return seed as BusinessData;

    const q = `${name}, ${postcode}, UK`;
    console.debug('[google] query:', q);

    // 1) FIND
    const findRes = await fetch(`/api/places/find?q=${encodeURIComponent(q)}`, { method: 'GET' });
    if (!findRes.ok) {
      console.debug('[google] find failed', findRes.status);
      return seed as BusinessData;
    }
    const findJson: any = await findRes.json().catch(() => ({}));
    console.debug('[google] find payload', findJson);

    const fid: string | undefined = findJson?.places?.[0]?.id;
    if (!fid) {
      console.debug('[google] find result empty');
      return seed as BusinessData;
    }

    // 2) DETAILS
    const detRes = await fetch(`/api/places/details?id=${encodeURIComponent(fid)}`, { method: 'GET' });
    if (!detRes.ok) {
      console.debug('[google] details failed', detRes.status);
      return seed as BusinessData;
    }
    const r: any = await detRes.json().catch(() => ({}));
    console.debug('[google] details payload', r);

    const phone = r.internationalPhoneNumber ?? r.nationalPhoneNumber ?? null;
    const website = r.websiteUri ?? null;
    const hoursText: string | null =
      Array.isArray(r?.currentOpeningHours?.weekdayDescriptions)
        ? r.currentOpeningHours.weekdayDescriptions.join(' · ')
        : null;

    const patch: Partial<BusinessData> = {
      ...seed,
      phone: phone ?? seed.phone,
      extras: {
        ...(seed.extras || {}),
        ...(website ? { website } : {}),
        ...(phone ? { phone } : {}),
        ...(hoursText ? { google_opening_hours_text: hoursText } : {}),
        ...(r?.location?.latitude && r?.location?.longitude
          ? { lat: r.location.latitude, lng: r.location.longitude }
          : {}),
        google_rating: r?.rating ?? undefined,
        google_ratings_count: r?.userRatingCount ?? undefined,
      },
      meta: {
        ...(seed.meta || {}),
        provenance: {
          ...(seed.meta?.provenance || {}),
          ...(phone || website || hoursText ? {
            phone: phone ? 'google' : undefined,
            website: website ? 'google' : undefined,
            openingHours: hoursText ? 'google' : undefined,
            google: true,
          } : {})
        }
      }
    };

    return patch as BusinessData;
  }
}

export const googlePlacesProvider = new GooglePlacesProvider();
export default googlePlacesProvider;
