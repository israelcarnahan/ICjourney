export type CanonicalField =
  | "name" | "postcode" | "rtm" | "address" | "town" | "lat" | "lng"
  | "phone" | "email" | "notes";

export type ColumnMapping = Record<CanonicalField, string | null>; // source header or null

export interface HeaderSignature { headers: string[]; } // lowercased, trimmed

export interface MappedRow {
  name: string;
  postcode: string;
  rtm?: string | null;
  address?: string | null;
  town?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  extras?: Record<string, unknown>;
}
