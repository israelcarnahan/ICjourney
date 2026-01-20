import { BusinessData, BusinessDataProvider, OpeningHours } from "./types";
import { API_CFG } from "../config/api";
import { getJson } from "./http";

const CONTACT_EMAIL = "support@example.com"; // replace later

type NominatimTags = Record<string, unknown>;
type NominatimAddress = Record<string, unknown>;
type NominatimHit = {
  extratags?: unknown;
  address?: unknown;
  osm_id?: unknown;
  osm_type?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

function parseOpeningHours(s?: string): OpeningHours | null {
  if (!s) return null;
  const m = s.match(/(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})/);
  if (!m) return null;
  const [, open, close] = m;
  const weekly: OpeningHours["weekly"] = Array.from(
    { length: 7 },
    () => [open, close] as const
  );
  return { weekly };
}

const buildQuery = (name: string, postcode?: string|null, town?: string|null) =>
  [name, postcode, town].filter(Boolean).join(", ");

class NominatimProvider implements BusinessDataProvider {
  async get(_pubId: string, seed: Partial<BusinessData>): Promise<BusinessData> {
    const out = { ...seed } as BusinessData;
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

      const arr = await getJson(u.toString(), { "Accept-Language": "en" });
      const hit = Array.isArray(arr) ? arr[0] : null;
      if (!isRecord(hit)) return out;

      const tags = isRecord(hit.extratags) ? (hit.extratags as NominatimTags) : {};
      const phone = readString(tags["phone"]) ?? readString(tags["contact:phone"]);
      const email = readString(tags["email"]) ?? readString(tags["contact:email"]);
      if (!out.phone && phone) out.phone = phone;
      if (!out.email && email) out.email = email;
      if (!out.openingHours) {
        const opening = readString(tags["opening_hours"]);
        out.openingHours = parseOpeningHours(opening ?? undefined);
      }

      const addr = isRecord(hit.address) ? (hit.address as NominatimAddress) : {};
      const addressParts = [
        readString(addr["house_number"]),
        readString(addr["road"]),
        readString(addr["suburb"]),
      ].filter(Boolean);
      if (!out.address) out.address = addressParts.join(" ") || null;
      if (!out.town) {
        out.town =
          readString(addr["town"]) ??
          readString(addr["city"]) ??
          readString(addr["village"]) ??
          readString(addr["hamlet"]) ??
          null;
      }

      out.extras ||= {};
      const osmId = (hit as NominatimHit).osm_id;
      const osmType = (hit as NominatimHit).osm_type;
      if (osmId != null) out.extras["nominatim_id"] ??= osmId;
      if (osmType != null) out.extras["nominatim_type"] ??= osmType;
    } catch {
      // Intentionally ignore provider errors; fallback to seed data.
    }
    return out;
  }
}

export const nominatimProvider = new NominatimProvider();
