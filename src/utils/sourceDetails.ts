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

type MetaLike = {
  priorityLevel?: number;
  priority?: number;
  schedulingMode?: string;
  deadline?: string;
  followUpDays?: number;
  Priority?: string;
  listType?: ListType;
  fileName?: string;
  rtm?: string;
  address?: string;
  town?: string;
  phone?: string;
  email?: string;
  notes?: string;
  postcode?: string;
  sourceLists?: unknown;
  sources?: unknown;
  effectivePlan?: {
    primaryMode?: DriverBucket;
    deadline?: string;
    followUpDays?: number;
    priorityLevel?: number;
  };
  mapped?: Record<string, unknown>;
  extras?: Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asMeta = (value: unknown): Partial<MetaLike> =>
  (isRecord(value) ? value as Partial<MetaLike> : {});

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const asEffectivePlan = (value: unknown): Partial<NonNullable<MetaLike['effectivePlan']>> =>
  (isRecord(value) ? value as Partial<NonNullable<MetaLike['effectivePlan']>> : {});

export function formatPriorityForUser(meta: unknown): string | null {
  // Keep logic consistent with FileTypeDialog: priority|deadline|followup
  // Return human labels the user expects.
  // Example fallbacks are OK if a given meta is missing.
  try {
    const safeMeta = asMeta(meta);
    const priorityLevel = safeMeta.priorityLevel ?? safeMeta.priority;
    if (safeMeta.schedulingMode === 'priority' && priorityLevel)
      return `Priority ${priorityLevel}`;
    if (safeMeta.schedulingMode === 'deadline' && safeMeta.deadline)
      return `Visit by ${safeMeta.deadline}`;
    if (safeMeta.schedulingMode === 'followup' && safeMeta.followUpDays)
      return `Follow-up ${safeMeta.followUpDays}d`;
  } catch {
    // Intentionally ignore malformed metadata.
  }
  return null;
}

const formatPrimaryLabel = (bucket: DriverBucket, meta: unknown): string => {
  const safeMeta = asMeta(meta);
  if (bucket === 'deadline' && safeMeta.deadline) return `Visit by ${safeMeta.deadline}`;
  if (bucket === 'followup' && safeMeta.followUpDays != null) return `Follow-up ${safeMeta.followUpDays}d`;
  if (bucket === 'priority' && safeMeta.priorityLevel) return `Priority ${safeMeta.priorityLevel}`;
  return safeMeta.Priority || 'Masterfile';
};

function getPrimaryDriverInfo(pubOrVisit: unknown): {
  bucket: DriverBucket;
  label: string;
} {
  const safeMeta = asMeta(pubOrVisit);
  const effective = asEffectivePlan(safeMeta.effectivePlan);
  if (effective.primaryMode) {
    return {
      bucket: effective.primaryMode,
      label: formatPrimaryLabel(effective.primaryMode, effective),
    };
  }
  if (effective.deadline) {
    return { bucket: 'deadline', label: formatPrimaryLabel('deadline', effective) };
  }
  if (effective.followUpDays != null) {
    return { bucket: 'followup', label: formatPrimaryLabel('followup', effective) };
  }
  if (effective.priorityLevel) {
    return { bucket: 'priority', label: formatPrimaryLabel('priority', effective) };
  }

  if (safeMeta.schedulingMode === 'deadline' && safeMeta.deadline) {
    return { bucket: 'deadline', label: formatPrimaryLabel('deadline', safeMeta) };
  }
  if (safeMeta.schedulingMode === 'followup' && safeMeta.followUpDays != null) {
    return { bucket: 'followup', label: formatPrimaryLabel('followup', safeMeta) };
  }
  if (safeMeta.schedulingMode === 'priority' && safeMeta.priorityLevel) {
    return { bucket: 'priority', label: formatPrimaryLabel('priority', safeMeta) };
  }

  if (safeMeta.deadline) {
    return { bucket: 'deadline', label: formatPrimaryLabel('deadline', safeMeta) };
  }
  if (safeMeta.followUpDays != null) {
    return { bucket: 'followup', label: formatPrimaryLabel('followup', safeMeta) };
  }
  if (safeMeta.priorityLevel) {
    return { bucket: 'priority', label: formatPrimaryLabel('priority', safeMeta) };
  }

  return { bucket: 'master', label: formatPrimaryLabel('master', safeMeta) };
}

export function getPrimaryDriverLabel(pubOrVisit: unknown): string {
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

export function getDriverSummary(pubOrVisit: unknown): {
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

export function getListSummary(pubOrVisit: unknown): {
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
export function getSourceDetails(pubOrVisit: unknown): {
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
  const safeMeta = asMeta(pubOrVisit);
  const rawSources = Array.isArray(safeMeta.sources) ? safeMeta.sources : [];
  const sources = rawSources.map((source) => (isRecord(source) ? source : {}));
  const sourceLists = Array.isArray(safeMeta.sourceLists) ? safeMeta.sourceLists : [];

  if (sources.length === 0 && sourceLists.length > 0) {
    sourceLists.forEach((fileName) => {
      sources.push({
        fileName,
        listType: safeMeta.listType,
        schedulingMode: safeMeta.schedulingMode,
        priorityLevel: safeMeta.priorityLevel,
        followUpDays: safeMeta.followUpDays,
        deadline: safeMeta.deadline,
        mapped: {},
        extras: {},
      });
    });
  }

  if (sources.length === 0 && safeMeta.fileName) {
    sources.push({
      fileName: safeMeta.fileName,
      listType: safeMeta.listType,
      schedulingMode: safeMeta.schedulingMode,
      priorityLevel: safeMeta.priorityLevel,
      followUpDays: safeMeta.followUpDays,
      deadline: safeMeta.deadline,
      mapped: {
        rtm: safeMeta.rtm, address: safeMeta.address, town: safeMeta.town,
        phone: safeMeta.phone, email: safeMeta.email, notes: safeMeta.notes,
        postcode: safeMeta.postcode,
      },
      extras: safeMeta.extras ?? {},
    });
  }

  for (const s of sources) {
    const sourceMeta = asMeta(s);
    const fileName = String(sourceMeta.fileName ?? 'Unknown list');
    if (!fileNames.includes(fileName)) fileNames.push(fileName);

    const mapped = isRecord(sourceMeta.mapped) ? sourceMeta.mapped : {};
    const extras = isRecord(sourceMeta.extras) ? sourceMeta.extras : {};
    const getMappedValue = (key: string, fallback: unknown): string | undefined =>
      asString(mapped[key]) ?? asString(fallback);

    out.push({
      fileName,
      listType: sourceMeta.listType ?? safeMeta.listType ?? null,
      priorityLabel: formatPriorityForUser(sourceMeta),
      mapped: {
        rtm: getMappedValue('rtm', safeMeta.rtm),
        address: getMappedValue('address', safeMeta.address),
        town: getMappedValue('town', safeMeta.town),
        phone: getMappedValue('phone', safeMeta.phone),
        email: getMappedValue('email', safeMeta.email),
        notes: getMappedValue('notes', safeMeta.notes),
        postcode: getMappedValue('postcode', safeMeta.postcode),
      },
      extras: extras as SourceDetail['extras'],
    });
  }

  return { fileNames, details: out };
}
