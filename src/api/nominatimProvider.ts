import { BusinessData, BusinessDataProvider, OpeningHours } from "./types";
import { API_CFG } from "../config/api";
import { getJson } from "./http";

const CONTACT_EMAIL = "support@example.com"; // replace later

function parseOpeningHours(s?: string): OpeningHours|null {
  if (!s) return null;
  const m = s.match(/(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})/);
  if (!m) return null;
  const [, open, close] = m;
  const weekly = Array(7).fill(null).map(() => [open, close] as [string,string]);
  return { weekly: weekly as any };
}

const buildQuery = (name: string, postcode?: string|null, town?: string|null) =>
  [name, postcode, town].filter(Boolean).join(", ");

class NominatimProvider implements BusinessDataProvider {
  async get(_pubId: string, seed: Partial<BusinessData>): Promise<BusinessData> {
    const out: BusinessData = { ...(seed as any) };
    const name = seed.name?.trim();
    if (!name) return out;

    try {
      const u = new URL(API_CFG.endpoints.nominatim);
      u.searchParams.set("q", buildQuery(name, seed.postcode ?? undefined, seed.town ?? undefined));
      u.searchParams.set("format", "json");
      u.searchParams.set("addressdetails", "1");
      u.searchParams.set("extratags", "1");
      u.searchParams.set("limit", "1");
      u.searchParams.set("email", CONTACT_EMAIL); // identify app (browser-safe)

      const arr = await getJson(u.toString(), { "Accept-Language": "en" }) as any[];
      const hit = Array.isArray(arr) ? arr[0] : null;
      if (!hit) return out;

      const tags = hit.extratags || {};
      out.phone ||= tags.phone || tags["contact:phone"] || null;
      out.email ||= tags.email || tags["contact:email"] || null;
      if (!out.openingHours) out.openingHours = parseOpeningHours(tags.opening_hours || tags["opening_hours"]);

      const addr = hit.address || {};
      out.address ||= [addr.house_number, addr.road, addr.suburb].filter(Boolean).join(" ") || null;
      out.town ||= addr.town || addr.city || addr.village || addr.hamlet || null;

      out.extras ||= {};
      out.extras["nominatim_id"] ??= hit.osm_id;
      out.extras["nominatim_type"] ??= hit.osm_type;
    } catch {
      // Intentionally ignore provider errors; fallback to seed data.
    }
    return out;
  }
}

export const nominatimProvider = new NominatimProvider();
