import type { ListType } from '../context/PubDataContext';

// Lightweight view model for schedule dialog
export type SourceDetail = {
  fileName: string;                 // e.g. "GK San Miguel.xlsx"
  listType?: ListType | null;       // 'hitlist' | 'wins' | ...
  priorityLabel?: string | null;    // "Priority 1/2/3" | "Deadline: 2025-09-12" | "Follow-up: 14 days"
  mapped: Partial<{
    rtm: string; address: string; town: string; phone: string; email: string;
    notes: string; postcode: string; // helpful in dialog
  }>;
  // Everything else we ingested that isn't one of the canonical fields
  extras: Record<string, string | number | boolean | null | undefined>;
};

export function formatPriorityForUser(meta: any): string | null {
  // Keep logic consistent with FileTypeDialog: priority|deadline|followup
  // Return human labels the user expects.
  // Example fallbacks are OK if a given meta is missing.
  try {
    if (meta?.schedulingMode === 'priority' && meta?.priorityLevel)
      return `Priority ${meta.priorityLevel}`;
    if (meta?.schedulingMode === 'deadline' && meta?.deadline)
      return `Deadline: ${meta.deadline}`;
    if (meta?.schedulingMode === 'followup' && meta?.followUpDays)
      return `Follow-up: ${meta.followUpDays} days`;
  } catch {}
  return null;
}

/**
 * Build per-source details for a given pub/visit using what we've already
 * persisted (file metadata, mapping, extras). Non-destructive; no storage writes.
 */
export function getSourceDetails(pubOrVisit: any): {
  fileNames: string[];                  // unique list names for the chip row
  details: SourceDetail[];
} {
  // This function should look in the merged pub/visit object for any fields we already
  // store about origin files, e.g. pub.sources, visit.sourceFiles, visit.fileName, etc.
  // Fall back gracefully if some fields don't exist in older data.
  const out: SourceDetail[] = [];
  const fileNames: string[] = [];

  // Heuristics that usually exist in this project:
  // - A top-level `sources` array of {fileName, listType?, priorityLevel?, schedulingMode?, followUpDays?, deadline?, mapped?, extras?}
  // - Or a single `fileName` on the record, if only one.
  const sources = Array.isArray(pubOrVisit?.sources) ? pubOrVisit.sources : [];

  if (sources.length === 0 && pubOrVisit?.fileName) {
    sources.push({
      fileName: pubOrVisit.fileName,
      listType: pubOrVisit.listType,
      schedulingMode: pubOrVisit.schedulingMode,
      priorityLevel: pubOrVisit.priorityLevel,
      followUpDays: pubOrVisit.followUpDays,
      deadline: pubOrVisit.deadline,
      mapped: {
        rtm: pubOrVisit.rtm, address: pubOrVisit.address, town: pubOrVisit.town,
        phone: pubOrVisit.phone, email: pubOrVisit.email, notes: pubOrVisit.notes,
        postcode: pubOrVisit.postcode,
      },
      extras: pubOrVisit.extras ?? {},
    });
  }

  for (const s of sources) {
    const fileName = String(s.fileName ?? 'Unknown list');
    if (!fileNames.includes(fileName)) fileNames.push(fileName);

    out.push({
      fileName,
      listType: s.listType ?? pubOrVisit?.listType ?? null,
      priorityLabel: formatPriorityForUser(s),
      mapped: {
        rtm: s?.mapped?.rtm ?? pubOrVisit?.rtm ?? undefined,
        address: s?.mapped?.address ?? pubOrVisit?.address ?? undefined,
        town: s?.mapped?.town ?? pubOrVisit?.town ?? undefined,
        phone: s?.mapped?.phone ?? pubOrVisit?.phone ?? undefined,
        email: s?.mapped?.email ?? pubOrVisit?.email ?? undefined,
        notes: s?.mapped?.notes ?? pubOrVisit?.notes ?? undefined,
        postcode: s?.mapped?.postcode ?? pubOrVisit?.postcode ?? undefined,
      },
      extras: s?.extras ?? {},
    });
  }

  return { fileNames, details: out };
}
