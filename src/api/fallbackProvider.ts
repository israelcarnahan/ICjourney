import { BusinessData, BusinessDataProvider, OpeningHours } from "./types";

/** very light heuristics for opening hours when nothing is known */
function defaultHours(name: string): OpeningHours {
  // pubs/inns: 11–23, clubs: 09–17 fallback
  const lower = (name || "").toLowerCase();
  const isPub = /(pub|inn|tavern|bar|arms|hotel|head|bear|fox|bell|crown)/.test(lower);
  const hours: OpeningHours["weekly"] = Array.from({ length: 7 }, () => null);
  const open = isPub ? "11:00" : "09:00";
  const close = isPub ? "23:00" : "17:00";
  for (let i = 0; i < 7; i++) hours[i] = [open, close] as const;
  return { weekly: hours };
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



class FallbackProvider implements BusinessDataProvider {
  async get(_pubId: string, seed: Partial<BusinessData>): Promise<BusinessData> {
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
      isOpenAt: undefined,
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
