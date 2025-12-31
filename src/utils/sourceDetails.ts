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

export type DriverBucket = 'deadline' | 'followup' | 'priority' | 'master';

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

const formatPrimaryLabel = (bucket: DriverBucket, meta: any): string => {
  if (bucket === 'deadline' && meta?.deadline) return `Visit by ${meta.deadline}`;
  if (bucket === 'followup' && meta?.followUpDays != null) return `Follow-up ${meta.followUpDays}d`;
  if (bucket === 'priority' && meta?.priorityLevel) return `Priority ${meta.priorityLevel}`;
  return meta?.Priority || 'Masterfile';
};

export function getPrimaryDriverInfo(pubOrVisit: any): {
  bucket: DriverBucket;
  label: string;
} {
  const effective = pubOrVisit?.effectivePlan;
  if (effective?.primaryMode) {
    return {
      bucket: effective.primaryMode,
      label: formatPrimaryLabel(effective.primaryMode, effective),
    };
  }
  if (effective?.deadline) {
    return { bucket: 'deadline', label: formatPrimaryLabel('deadline', effective) };
  }
  if (effective?.followUpDays != null) {
    return { bucket: 'followup', label: formatPrimaryLabel('followup', effective) };
  }
  if (effective?.priorityLevel) {
    return { bucket: 'priority', label: formatPrimaryLabel('priority', effective) };
  }

  if (pubOrVisit?.schedulingMode === 'deadline' && pubOrVisit?.deadline) {
    return { bucket: 'deadline', label: formatPrimaryLabel('deadline', pubOrVisit) };
  }
  if (pubOrVisit?.schedulingMode === 'followup' && pubOrVisit?.followUpDays != null) {
    return { bucket: 'followup', label: formatPrimaryLabel('followup', pubOrVisit) };
  }
  if (pubOrVisit?.schedulingMode === 'priority' && pubOrVisit?.priorityLevel) {
    return { bucket: 'priority', label: formatPrimaryLabel('priority', pubOrVisit) };
  }

  if (pubOrVisit?.deadline) {
    return { bucket: 'deadline', label: formatPrimaryLabel('deadline', pubOrVisit) };
  }
  if (pubOrVisit?.followUpDays != null) {
    return { bucket: 'followup', label: formatPrimaryLabel('followup', pubOrVisit) };
  }
  if (pubOrVisit?.priorityLevel) {
    return { bucket: 'priority', label: formatPrimaryLabel('priority', pubOrVisit) };
  }

  return { bucket: 'master', label: formatPrimaryLabel('master', pubOrVisit) };
}

export function getPrimaryDriverLabel(pubOrVisit: any): string {
  return getPrimaryDriverInfo(pubOrVisit).label;
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
  const sourceLists = Array.isArray(pubOrVisit?.sourceLists) ? pubOrVisit.sourceLists : [];

  if (sources.length === 0 && sourceLists.length > 0) {
    sourceLists.forEach((fileName: string) => {
      sources.push({
        fileName,
        listType: pubOrVisit.listType,
        schedulingMode: pubOrVisit.schedulingMode,
        priorityLevel: pubOrVisit.priorityLevel,
        followUpDays: pubOrVisit.followUpDays,
        deadline: pubOrVisit.deadline,
        mapped: {},
        extras: {},
      });
    });
  }

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
