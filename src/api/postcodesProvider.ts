import { BusinessData, BusinessDataProvider } from "./types";
import { API_CFG } from "../config/api";
import { getJson } from "./http";

export class PostcodesProvider implements BusinessDataProvider {
  async get(_pubId: string, seed: Partial<BusinessData>): Promise<BusinessData> {
    const out: BusinessData = { ...(seed as any) };
    const postcode = seed.postcode?.trim();
    if (!postcode) return out;

    try {
      const encodedPostcode = encodeURIComponent(postcode.trim().toUpperCase());
      let url = `${API_CFG.endpoints.postcodes}/${encodedPostcode}`;
      let data = await getJson(url) as any;
      
      // If 404, try the query endpoint as fallback
      if (!data?.result) {
        try {
          url = `${API_CFG.endpoints.postcodes}?query=${encodedPostcode}`;
          data = await getJson(url) as any;
          // Use first result if available
          if (data?.result && Array.isArray(data.result) && data.result.length > 0) {
            data = { result: data.result[0] };
          }
        } catch {}
      }
      
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
