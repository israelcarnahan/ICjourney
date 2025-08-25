import { BusinessData, SourceTag } from "../api/types";

export function seedFromPub(pub: any): Partial<BusinessData> {
  const sources: SourceTag[] = (pub?.sources || pub?.sourceLists || []).map((s: any) => ({
    listName: String(s?.name ?? s ?? "Unknown"),
    row: typeof s?.row === "number" ? s.row : null,
  }));

  // extras: merge arbitrary columns across lists if you kept them
  const extras = { ...(pub?.extras || {}) };
  
  // Mark user data provenance
  const meta: BusinessData['meta'] = {};
  if (pub?.phone || pub?.email || pub?.notes || pub?.openingHours) {
    meta.provenance = {};
    if (pub?.phone) meta.provenance.phone = 'user';
    if (pub?.email) meta.provenance.email = 'user';
    if (pub?.openingHours) meta.provenance.openingHours = 'user';
  }
  
  return {
    name: pub?.name ?? pub?.pub ?? "",
    postcode: pub?.postcode ?? pub?.zip ?? "",
    address: pub?.address ?? pub?.street ?? "",
    town: pub?.town ?? pub?.city ?? "",
    phone: pub?.phone ?? null,
    email: pub?.email ?? null,
    notes: pub?.notes ?? null,
    openingHours: pub?.openingHours ?? null,
    sources,
    extras,
    meta,
  };
}
