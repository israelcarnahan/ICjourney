import { useEffect, useState } from "react";
import { BusinessData, ProviderChain } from "./types";
import { fallbackProvider } from "./fallbackProvider";
import { nominatimProvider } from "./nominatimProvider";
import { postcodesProvider } from "./postcodesProvider";
import { googlePlacesProvider } from "./googlePlacesProvider";
import { FLAGS } from "../config/flags";

/** simple in-memory cache per session; later you can persist to localStorage */
const cache = new Map<string, BusinessData>();
const inflight = new Map<string, Promise<BusinessData | null>>();

function keyOf(seed: Partial<BusinessData>) {
  return `${(seed.name || '').toLowerCase()}|${(seed.postcode || '').toUpperCase()}`;
}

async function runProviders(pubId: string, seed: Partial<BusinessData>, chain?: ProviderChain): Promise<BusinessData> {
  const providers = chain?.providers ?? [postcodesProvider, googlePlacesProvider, nominatimProvider, fallbackProvider];
  
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
      if (next) {
        current = { ...current, ...mergePreferNonEmpty(current, next) };
      }
    }
  }
  
  return current;
}

export function useBusinessData(pubId: string, seed: Partial<BusinessData>, chain?: ProviderChain) {
  const k = seed ? keyOf(seed) : null;
  const [data, setData] = useState<BusinessData | null>(null);

  useEffect(() => {
    if (!seed || !k) return;

    if (cache.has(k)) { 
      setData(cache.get(k)!); 
      return; 
    }
    if (inflight.has(k)) { 
      inflight.get(k)!.then(setData).catch(() => {}); 
      return; 
    }

    const p = runProviders(pubId, seed, chain).then((d) => {
      cache.set(k, d);
      inflight.delete(k);
      return d;
    });
    inflight.set(k, p);
    p.then(setData).catch(() => inflight.delete(k));
  }, [k, pubId, chain]);

  // for dev: clear cache
  if (typeof window !== 'undefined') {
    (window as any).__clearBizCache = () => { 
      cache.clear(); 
      inflight.clear(); 
      console.info('biz cache cleared'); 
    };
  }

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
