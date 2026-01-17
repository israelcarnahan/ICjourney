export type PostcodeStatus = "OK" | "ODDBALL" | "INVALID";
export type FallbackReason =
  | "UNKNOWN_MACRO"
  | "UNKNOWN_SUBREGION"
  | "PARSE_FAILED"
  | "SPECIAL_CASE"
  | "USER_DEFERRED_REVIEW";

export type ParsedPostcode = {
  raw: string;
  normalized: string | null;
  areaLetters: string | null;
  outwardDistrict: number | null;
  outwardFull: string | null;
  inwardSector: string | null;
  inwardUnit: string | null;
  status: PostcodeStatus;
  fallbackReason: FallbackReason | null;
};

/*
Postcode map example (NR25 8PL):
  raw: "NR25 8PL"
  normalized: "NR25 8PL"
  areaLetters: "NR"
  outwardDistrict: 25
  outwardFull: "NR25"
  inwardSector: "8"
  inwardUnit: "PL"
*/

/*
Status flags:
  OK       = parsed successfully and conforms to expected UK format.
  ODDBALL  = special-case format (valid but not classifiable in our schema).
  INVALID  = missing/empty/broken or cannot be parsed deterministically.
*/

// Normalizes common postcode formats for parsing and display. Keeps deterministic output.
function normalizePostcode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim().toUpperCase();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[^A-Z0-9]/g, "");

  // Special-case: GIR 0AA (classic oddball). Preserve expected spacing.
  if (cleaned === "GIR0AA") return "GIR 0AA";

  // Insert a single space before inward code if possible.
  if (cleaned.length > 3) {
    return `${cleaned.slice(0, cleaned.length - 3)} ${cleaned.slice(-3)}`;
  }

  return cleaned;
}

// Parses a normalized postcode into parts used by mock distance logic.
export function parsePostcode(raw: string | null | undefined): ParsedPostcode {
  const normalized = normalizePostcode(raw);

  if (!normalized) {
    return {
      raw: String(raw ?? ""),
      normalized: null,
      areaLetters: null,
      outwardDistrict: null,
      outwardFull: null,
      inwardSector: null,
      inwardUnit: null,
      status: "INVALID",
      fallbackReason: "PARSE_FAILED",
    };
  }

  // Support GIR 0AA as ODDBALL (valid but not classifiable in our schema).
  if (normalized === "GIR 0AA") {
    return {
      raw: String(raw ?? ""),
      normalized,
      areaLetters: "GIR",
      outwardDistrict: null,
      outwardFull: "GIR",
      inwardSector: "0",
      inwardUnit: "AA",
      status: "ODDBALL",
      fallbackReason: "SPECIAL_CASE",
    };
  }

  // Basic UK postcode pattern: 1–2 letters, 1–2 digits, optional letter, space, digit, 2 letters.
  const match = normalized.match(
    /^([A-Z]{1,2})(\d{1,2}[A-Z]?)[ ](\d)([A-Z]{2})$/
  );

  if (!match) {
    return {
      raw: String(raw ?? ""),
      normalized,
      areaLetters: null,
      outwardDistrict: null,
      outwardFull: null,
      inwardSector: null,
      inwardUnit: null,
      status: "INVALID",
      fallbackReason: "PARSE_FAILED",
    };
  }

  const areaLetters = match[1];
  const outwardRaw = match[2];
  const inwardSector = match[3];
  const inwardUnit = match[4];
  const outwardDigits = outwardRaw.match(/\d+/);
  const outwardDistrict = outwardDigits ? Number(outwardDigits[0]) : null;

  return {
    raw: String(raw ?? ""),
    normalized,
    areaLetters,
    outwardDistrict,
    outwardFull: `${areaLetters}${outwardRaw}`,
    inwardSector,
    inwardUnit,
    status: "OK",
    fallbackReason: null,
  };
}
