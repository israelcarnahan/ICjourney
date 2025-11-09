import type { CanonicalField } from "../types/import";

// all regex are case-insensitive; match common header variants
export const SYNONYMS: Record<CanonicalField, RegExp[]> = {
  name: [/^(pub|name|venue|business|account|outlet)$/i],
  postcode: [/^(zip|postcode|post\s*code|postal\s*code|zip\s*code)$/i],
  rtm: [/^(rtm|route\s*to\s*market|channel|tier)$/i],
  address: [/^(address|addr|street|line1|line\s*1)$/i],
  town: [/^(city|town|locality)$/i],
  lat: [/^(lat|latitude)$/i],
  lng: [/^(lng|long|longitude)$/i],
  phone: [/^(phone|telephone|tel|mobile|cell)$/i],
  email: [/^(email|e-mail)$/i],
  notes: [/^(notes|comment|remarks|memo)$/i],
};

export const CANONICAL_ORDER: CanonicalField[] = [
  'name', 'postcode', 'rtm', 'address', 'town', 'phone', 'email', 'lat', 'lng', 'notes'
];

export const REQUIRED_FIELDS: CanonicalField[] = ['name', 'postcode'];

export function autoGuessMapping(headers: string[]): Partial<Record<CanonicalField, string>> {
  const result: Partial<Record<CanonicalField, string>> = {};
  for (const field of Object.keys(SYNONYMS) as CanonicalField[]) {
    const guess = headers.find(h => SYNONYMS[field].some(rx => rx.test(h)));
    if (guess) result[field] = guess;
  }
  return result;
}
