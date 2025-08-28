export type OpeningHours = {
  /** 0=Sun..6=Sat ; each entry like ["09:00","17:00"] or null for closed */
  weekly: (readonly [string, string] | null)[];
};

export type YourListField =
  | "phone"
  | "email"
  | "notes"
  | "rtm"
  | "address"
  | "town"
  | "postcode"
  | string; // allow arbitrary extras

export type SourceTag = {
  listName: string;
  row?: number | null;
};

export type BusinessData = {
  name: string;
  postcode?: string | null;
  address?: string | null;
  town?: string | null;

  // From user lists (first non-empty wins; merged arrays for extras)
  phone?: string | null;
  email?: string | null;
  notes?: string | null;

  // Derived
  openingHours?: OpeningHours | null;
  isOpenAt?: (d: Date) => boolean;

  // meta
  sources: SourceTag[];         // every list this pub merged from
  extras: Record<string, unknown>; // extra columns across lists (merged, arrays where needed)
  meta?: {
    provenance?: {
      openingHours?: 'google' | 'user' | 'fallback';
      phone?: 'google' | 'user';
      email?: 'google' | 'user';
      website?: 'google' | 'user';
      google?: boolean;
    };
  };
};

export interface ProviderContext {
  pubId: string;
}

export interface BusinessDataProvider {
  /** Must never throw — return best-effort data quickly. */
  get(pubId: string, seed: Partial<BusinessData>): Promise<BusinessData | null>;

  /** Alternative enrichment pattern */
  name?: string;
  enrich?(seed: Partial<BusinessData>, prev: BusinessData, ctx: ProviderContext): Promise<BusinessData>;
}

export type ProviderChain = {
  /** Providers run in order. Later providers can **augment** but must not clobber non-empty user fields. */
  providers: BusinessDataProvider[];
};
