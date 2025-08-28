import { useEffect, useMemo, useState } from "react";
import { BusinessData, ProviderChain } from "./types";
import { fallbackProvider } from "./fallbackProvider";
import { nominatimProvider } from "./nominatimProvider";
import { postcodesProvider } from "./postcodesProvider";
import { GooglePlacesProvider } from "./googlePlacesProvider";
import { FLAGS } from "../config/flags";

/** simple in-memory cache per session; later you can persist to localStorage */
const cache = new Map<string, BusinessData>();

// Expose cache clearing for dev testing
if (typeof window !== 'undefined') {
  (window as any).__clearBizCache = () => {
    cache.clear();
    console.debug('[cache] cleared');
  };
}

export function useBusinessData(pubId: string, seed: Partial<BusinessData>, chain?: ProviderChain) {
  const [data, setData] = useState<BusinessData | null>(null);

  const providers = useMemo(() => chain?.providers ?? [postcodesProvider, GooglePlacesProvider, nominatimProvider, fallbackProvider], [chain]);

  useEffect(() => {
    let alive = true;
    async function run() {
      // serve from cache fast
      if (cache.has(pubId)) { setData(cache.get(pubId)!); }
      
      // Log provider banner
      console.debug('[providers] order Postcodes → Google → Nominatim → Fallback', FLAGS);
      
      // run providers in order
      let current: BusinessData = { 
        ...seed,
        sources: seed.sources || [],
        extras: seed.extras || {},
      } as BusinessData;
      
      for (const p of providers) {
        const providerName = (p as any).name || p.constructor.name;
        console.debug('[provider]', providerName, 'for', seed?.name, seed?.postcode);
        
        if ((p as any).enrich) {
          // Use new enrichment pattern
          current = await (p as any).enrich(seed, current, { pubId });
        } else {
          // Use legacy get pattern
          const next = await p.get(pubId, current);
          current = { ...current, ...mergePreferNonEmpty(current, next) };
        }
      }
      
      cache.set(pubId, current);
      if (alive) setData(current);
    }
    run();
    return () => { alive = false; };
  }, [pubId, providers, JSON.stringify(seed)]);

  return data;
}

function mergePreferNonEmpty(a: Partial<BusinessData>, b: Partial<BusinessData>) {
  const out: Partial<BusinessData> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const cur = (out as any)[k];
    const empty = cur == null || cur === "" || (Array.isArray(cur) && cur.length === 0);
    if (empty && v != null && v !== "") (out as any)[k] = v;
    if (k === "extras" && v && typeof v === "object") {
      out.extras = { ...(a.extras || {}), ...(b as any).extras };
    }
    if (k === "sources" && Array.isArray(v)) {
      const acc = new Map<string, any>();
      for (const x of [...(a.sources || []), ...v]) acc.set(`${x.listName}|${x.row ?? ""}`, x);
      out.sources = [...acc.values()];
    }
  }
  return out;
}
