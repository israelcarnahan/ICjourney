import { BusinessData, BusinessDataProvider, OpeningHours } from "./types";

/** very light heuristics for opening hours when nothing is known */
function defaultHours(name: string): OpeningHours {
  // pubs/inns: 11–23, clubs: 09–17 fallback
  const lower = (name || "").toLowerCase();
  const isPub = /(pub|inn|tavern|bar|arms|hotel|head|bear|fox|bell|crown)/.test(lower);
  const hours: OpeningHours["weekly"] = Array(7).fill(null);
  const open = isPub ? "11:00" : "09:00";
  const close = isPub ? "23:00" : "17:00";
  for (let i = 0; i < 7; i++) hours[i] = [open, close];
  return { weekly: hours as any };
}

function makeIsOpenAt(oh?: OpeningHours | null) {
  return (when: Date) => {
    if (!oh) return true;
    const day = when.getDay(); // 0..6
    const entry = oh.weekly[day];
    if (!entry) return false;
    const [o, c] = entry;
    const pad = (n: number) => String(n).padStart(2, "0");
    const hh = pad(when.getHours());
    const mm = pad(when.getMinutes());
    const t = `${hh}:${mm}`;
    return t >= o && t <= c;
  };
}

/** Merge extras from multiple lists without losing anything */
function mergeExtras(base: Record<string, unknown>, add: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(add || {})) {
    if (v == null || v === "") continue;
    const prev = out[k];
    if (prev == null) { out[k] = v; continue; }
    // If same scalar, keep one. If different, store an array of unique values.
    const toArr = (x: unknown) => Array.isArray(x) ? x : [x];
    const arr = [...new Set([...toArr(prev), ...toArr(v)])];
    out[k] = arr.length === 1 ? arr[0] : arr;
  }
  return out;
}

export class FallbackProvider implements BusinessDataProvider {
  async get(pubId: string, seed: Partial<BusinessData>): Promise<BusinessData> {
    const name = seed.name ?? "";
    const postcode = seed.postcode ?? null;

    // 1) start from seed (which includes merged "Your Lists" fields)
    const base: BusinessData = {
      name,
      postcode: postcode ?? null,
      address: seed.address ?? null,
      town: seed.town ?? null,
      phone: seed.phone ?? null,
      email: seed.email ?? null,
      notes: seed.notes ?? null,
      openingHours: seed.openingHours ?? null,
      isOpenAt: undefined as any,
      sources: seed.sources ?? [],
      extras: seed.extras ?? {},
    };

    // 2) Opening hours: if missing, synthesize sane defaults
    const oh = base.openingHours ?? defaultHours(name);
    base.openingHours = oh;
    base.isOpenAt = makeIsOpenAt(oh);

    // 3) Merge extras from all sources that might have been attached in seed.extras
    // (seed.extras is already multi-list. Keep it as-is.)
    base.extras = seed.extras ?? {};

    // 4) Never clobber user-entered values; return best effort immediately
    return base;
  }
}

export const fallbackProvider = new FallbackProvider();
