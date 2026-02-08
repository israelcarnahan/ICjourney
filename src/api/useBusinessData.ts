import { useEffect, useMemo, useState } from "react";
import { BusinessData, ProviderChain, SourceTag } from "./types";
import { fallbackProvider } from "./fallbackProvider";
import { nominatimProvider } from "./nominatimProvider";
import { postcodesProvider } from "./postcodesProvider";

/** simple in-memory cache per session; later you can persist to localStorage */
const cache = new Map<string, BusinessData>();

export function useBusinessData(pubId: string, seed: Partial<BusinessData>, chain?: ProviderChain) {
  const [data, setData] = useState<BusinessData | null>(null);

  const providers = useMemo(() => chain?.providers ?? [postcodesProvider, nominatimProvider, fallbackProvider], [chain]);
  const seedKey = makeSeedKey(seed);
  const normalizedSeed = useMemo(
    () => JSON.parse(seedKey) as Partial<BusinessData>,
    [seedKey]
  );

  useEffect(() => {
    let alive = true;
    const cacheKey = `${pubId}|${seedKey}`;
    async function run() {
      // serve from cache fast
      if (cache.has(cacheKey)) {
        setData(cache.get(cacheKey)!);
        return;
      }
      if (alive) {
        setData(toImmediateBusinessData(normalizedSeed, pubId));
      }
      // run providers in order
      let current: Partial<BusinessData> = { ...normalizedSeed };
      for (const p of providers) {
        const next = await p.get(pubId, current);
        current = { ...current, ...mergePreferNonEmpty(current, next) };
      }
      const final = current as BusinessData;
      cache.set(cacheKey, final);
      if (alive) setData(final);
    }
    run();
    return () => { alive = false; };
  }, [pubId, providers, normalizedSeed, seedKey]);

  return data;
}

function makeSeedKey(seed: Partial<BusinessData>) {
  return JSON.stringify({
    name: seed.name ?? null,
    postcode: seed.postcode ?? null,
    address: seed.address ?? null,
    town: seed.town ?? null,
    phone: seed.phone ?? null,
    email: seed.email ?? null,
    notes: seed.notes ?? null,
    openingHours: seed.openingHours ?? null,
    sources: seed.sources ?? [],
    extras: seed.extras ?? {},
  });
}

function toImmediateBusinessData(seed: Partial<BusinessData>, pubId: string): BusinessData {
  return {
    name: seed.name ?? pubId,
    postcode: seed.postcode ?? null,
    address: seed.address ?? null,
    town: seed.town ?? null,
    phone: seed.phone ?? null,
    email: seed.email ?? null,
    notes: seed.notes ?? null,
    openingHours: seed.openingHours ?? null,
    isOpenAt: seed.isOpenAt,
    sources: seed.sources ?? [],
    extras: seed.extras ?? {},
  };
}

function mergePreferNonEmpty(a: Partial<BusinessData>, b: Partial<BusinessData>) {
  const out: Partial<BusinessData> = { ...a };
  const outRecord = out as Record<string, unknown>;
  for (const k of Object.keys(b) as Array<keyof BusinessData>) {
    const v = b[k];
    const cur = out[k];
    const empty = cur == null || cur === "" || (Array.isArray(cur) && cur.length === 0);
    if (empty && v != null && v !== "") outRecord[k] = v;
    if (k === "extras" && v && typeof v === "object" && !Array.isArray(v)) {
      out.extras = { ...(a.extras || {}), ...(v as Record<string, unknown>) };
    }
    if (k === "sources" && Array.isArray(v)) {
      const acc = new Map<string, SourceTag>();
      const incoming = v as SourceTag[];
      for (const x of [...(a.sources || []), ...incoming]) {
        acc.set(`${x.listName}|${x.row ?? ""}`, x);
      }
      out.sources = [...acc.values()];
    }
  }
  return out;
}
