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

type DriverBucket = 'deadline' | 'followup' | 'priority' | 'master';

export function formatPriorityForUser(meta: any): string | null {
  // Keep logic consistent with FileTypeDialog: priority|deadline|followup
  // Return human labels the user expects.
  // Example fallbacks are OK if a given meta is missing.
  try {
    const priorityLevel = meta?.priorityLevel ?? meta?.priority;
    if (meta?.schedulingMode === 'priority' && priorityLevel)
      return `Priority ${priorityLevel}`;
    if (meta?.schedulingMode === 'deadline' && meta?.deadline)
      return `Visit by ${meta.deadline}`;
    if (meta?.schedulingMode === 'followup' && meta?.followUpDays)
      return `Follow-up ${meta.followUpDays}d`;
  } catch {}
  return null;
}

const formatPrimaryLabel = (bucket: DriverBucket, meta: any): string => {
  if (bucket === 'deadline' && meta?.deadline) return `Visit by ${meta.deadline}`;
  if (bucket === 'followup' && meta?.followUpDays != null) return `Follow-up ${meta.followUpDays}d`;
  if (bucket === 'priority' && meta?.priorityLevel) return `Priority ${meta.priorityLevel}`;
  return meta?.Priority || 'Masterfile';
};

function getPrimaryDriverInfo(pubOrVisit: any): {
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

const normalizeLabel = (label?: string | null): string => label && label.length > 0 ? label : 'Masterfile';

const getLabelOrder = (label: string): number => {
  if (label.startsWith('Visit by ')) return 1;
  if (label.startsWith('Follow-up ')) return 2;
  if (label.startsWith('Priority ')) {
    const parts = label.split(' ');
    const level = Number(parts[1]);
    return Number.isFinite(level) ? 3 + level : 99;
  }
  if (label === 'Masterfile') return 20;
  return 99;
};

export function getDriverSummary(pubOrVisit: any): {
  primary: string;
  otherCount: number;
  others: string[];
} {
  const primary = getPrimaryDriverLabel(pubOrVisit);
  const details = getSourceDetails(pubOrVisit).details;
  const labels = new Set<string>();

  details.forEach((d) => {
    labels.add(normalizeLabel(d.priorityLabel));
  });
  labels.add(normalizeLabel(primary));

  const ordered = Array.from(labels).sort((a, b) => getLabelOrder(a) - getLabelOrder(b));
  const others = ordered.filter((l) => l !== primary);

  return {
    primary,
    otherCount: others.length,
    others,
  };
}

export function getListSummary(pubOrVisit: any): {
  primary: string;
  otherCount: number;
  others: string[];
  details: SourceDetail[];
} {
  const { details } = getSourceDetails(pubOrVisit);
  if (details.length === 0) {
    return { primary: '', otherCount: 0, others: [], details: [] };
  }
  const primaryLabel = getPrimaryDriverLabel(pubOrVisit);
  const normalizedDetails = details.map((d) => ({
    ...d,
    priorityLabel: normalizeLabel(d.priorityLabel),
  }));
  const orderedDetails = [...normalizedDetails].sort((a, b) => {
    const aOrder = getLabelOrder(a.priorityLabel || 'Masterfile');
    const bOrder = getLabelOrder(b.priorityLabel || 'Masterfile');
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.fileName.localeCompare(b.fileName);
  });

  const primaryDetail =
    normalizedDetails.find((d) => d.priorityLabel === primaryLabel) ||
    orderedDetails[0];
  const primary = primaryDetail?.fileName || 'Unknown list';

  const seen = new Set<string>();
  const others = orderedDetails
    .map((d) => d.fileName)
    .filter((name) => {
      if (name === primary || seen.has(name)) return false;
      seen.add(name);
      return true;
    });

  return {
    primary,
    otherCount: others.length,
    others,
    details: orderedDetails,
  };
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
