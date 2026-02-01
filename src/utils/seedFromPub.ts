import { BusinessData, OpeningHours, SourceTag } from "../api/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asOpeningHours = (value: unknown): OpeningHours | null => {
  if (!isRecord(value)) return null;
  const weekly = value.weekly;
  if (!Array.isArray(weekly)) return null;
  const valid = weekly.every((entry) => {
    if (entry === null) return true;
    return Array.isArray(entry) && entry.length === 2 && entry.every((item) => typeof item === "string");
  });
  return valid ? { weekly: weekly as OpeningHours["weekly"] } : null;
};

export function seedFromPub(pub: unknown): Partial<BusinessData> {
  const safePub = isRecord(pub) ? pub : {};
  const sourceList = Array.isArray(safePub.sources)
    ? safePub.sources
    : Array.isArray(safePub.sourceLists)
      ? safePub.sourceLists
      : [];
  const sources: SourceTag[] = sourceList.map((source) => {
    const safeSource = isRecord(source) ? source : {};
    return {
      listName: String(safeSource.listName ?? safeSource.fileName ?? safeSource.name ?? source ?? "Unknown"),
      row: typeof safeSource.row === "number" ? safeSource.row : null,
    };
  });

  // extras: merge arbitrary columns across lists if you kept them
  const extras = isRecord(safePub.extras) ? { ...safePub.extras } : {};

  return {
    name: asString(safePub.name) ?? asString(safePub.pub) ?? "",
    postcode: asString(safePub.postcode) ?? asString(safePub.zip) ?? "",
    address: asString(safePub.address) ?? asString(safePub.street) ?? "",
    town: asString(safePub.town) ?? asString(safePub.city) ?? "",
    phone: asString(safePub.phone) ?? null,
    email: asString(safePub.email) ?? null,
    notes: asString(safePub.notes) ?? null,
    openingHours: asOpeningHours(safePub.openingHours),
    sources,
    extras,
  };
}
