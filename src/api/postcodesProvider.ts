import { BusinessData, BusinessDataProvider } from "./types";
import { API_CFG } from "../config/api";
import { getJson } from "./http";

type PostcodesApiCodes = {
  admin_district?: string;
  admin_county?: string;
};

type PostcodesApiResult = {
  latitude?: number;
  longitude?: number;
  codes?: PostcodesApiCodes | null;
};

type PostcodesApiResponse = {
  result?: PostcodesApiResult | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

class PostcodesProvider implements BusinessDataProvider {
  async get(_pubId: string, seed: Partial<BusinessData>): Promise<BusinessData> {
    const out = { ...seed } as BusinessData;
    const postcode = seed.postcode?.trim();
    if (!postcode) return out;

    try {
      const url = `${API_CFG.endpoints.postcodes}/${encodeURIComponent(postcode)}`;
      const data = await getJson(url);
      const result = isRecord(data)
        ? (data as PostcodesApiResponse).result
        : null;
      if (isRecord(result)) {
        const latitude = typeof result.latitude === "number" ? result.latitude : null;
        const longitude = typeof result.longitude === "number" ? result.longitude : null;
        const codes = isRecord(result.codes) ? (result.codes as PostcodesApiCodes) : null;
        out.extras ||= {};
        if (latitude != null) out.extras["latitude"] ??= latitude;
        if (longitude != null) out.extras["longitude"] ??= longitude;
        if (codes?.admin_district) out.extras["postcode_area"] ??= codes.admin_district;
        if (codes?.admin_county) out.extras["postcode_region"] ??= codes.admin_county;
      }
    } catch {
      // Intentionally ignore provider errors; fallback to seed data.
    }
    return out;
  }
}

export const postcodesProvider = new PostcodesProvider();
