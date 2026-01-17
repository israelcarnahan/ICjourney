import { BusinessData, BusinessDataProvider } from "./types";
import { API_CFG } from "../config/api";
import { getJson } from "./http";

class PostcodesProvider implements BusinessDataProvider {
  async get(_pubId: string, seed: Partial<BusinessData>): Promise<BusinessData> {
    const out: BusinessData = { ...(seed as any) };
    const postcode = seed.postcode?.trim();
    if (!postcode) return out;

    try {
      const url = `${API_CFG.endpoints.postcodes}/${encodeURIComponent(postcode)}`;
      const data = await getJson(url) as any;
      
      if (data?.result) {
        const result = data.result;
        out.extras ||= {};
        out.extras["latitude"] ??= result.latitude;
        out.extras["longitude"] ??= result.longitude;
        out.extras["postcode_area"] ??= result.codes?.admin_district;
        out.extras["postcode_region"] ??= result.codes?.admin_county;
      }
    } catch {}
    return out;
  }
}

export const postcodesProvider = new PostcodesProvider();
