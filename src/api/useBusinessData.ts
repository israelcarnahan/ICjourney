import { useEffect, useMemo, useState } from "react";
import { BusinessData, ProviderChain } from "./types";
import { fallbackProvider } from "./fallbackProvider";
import { nominatimProvider } from "./nominatimProvider";
import { postcodesProvider } from "./postcodesProvider";
import { googlePlacesProvider } from "./googlePlacesProvider";
import { FLAGS } from "../config/flags";

/** simple in-memory cache per session; later you can persist to localStorage */
const cache = new Map<string, BusinessData>();

export function useBusinessData(pubId: string, seed: Partial<BusinessData>, chain?: ProviderChain) {
  const [data, setData] = useState<BusinessData | null>(null);

  const providers = useMemo(() => chain?.providers ?? [postcodesProvider, googlePlacesProvider, nominatimProvider, fallbackProvider], [chain]);

  useEffect(() => {
    let alive = true;
    async function run() {
      // serve from cache fast
      if (cache.has(pubId)) { setData(cache.get(pubId)!); }
      
      // Log provider banner
      console.debug('[providers] order Postcodes → Google → Nominatim → Fallback', FLAGS);
      
      // run providers in order
      let current: Partial<BusinessData> = { ...seed };
      for (const p of providers) {
        console.debug(`[provider] ${p.constructor.name} running for`, seed?.name, seed?.postcode);
        const next = await p.get(pubId, current);
        current = { ...current, ...mergePreferNonEmpty(current, next) };
      }
      const final = current as BusinessData;
      cache.set(pubId, final);
      if (alive) setData(final);
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
