import type { Pub, SourceRef, EffectivePlan } from '../context/PubDataContext';
import type { Visit } from '../types';
import { devLog } from './devLog';

/**
 * Build a SourceRef from an incoming pub row
 */
export function buildSourceRef(
  incomingPub: Pub,
  rowIndex: number,
  mappedValues: Record<string, string>,
  extras: Record<string, string>
): SourceRef {
  return {
    sourceId: incomingPub.uuid,
    fileId: incomingPub.fileId,
    fileName: incomingPub.fileName,
    rowIndex,
    schedulingMode: incomingPub.deadline ? 'deadline' : 
                   (incomingPub.followUpDays && incomingPub.followUpDays > 0) ? 'followup' : 'priority',
    priority: incomingPub.priorityLevel,
    deadline: incomingPub.deadline,
    followUpDays: incomingPub.followUpDays,
    mapped: mappedValues,
    extras
  };
}

/**
 * Recompute effective plan based on precedence rules
 */
export function recomputeEffectivePlan(
  canonicalPub: Pub,
  newSourceRef: SourceRef
): EffectivePlan {
  const allSources = [...(canonicalPub.sources || []), newSourceRef];
  const listNames = [...new Set(allSources.map(s => s.fileName))];
  
  // Precedence for primary driver: deadline -> followup -> priority
  // For deadline: earliest wins
  // For priority: highest wins
  // For followup: earliest wins
  
  let effectiveDeadline: string | undefined;
  let effectivePriority: number | undefined;
  let effectiveFollowUpDays: number | undefined;
  
  // Find earliest deadline
  const deadlines = allSources
    .map(s => s.deadline)
    .filter(Boolean)
    .sort();
  if (deadlines.length > 0) {
    effectiveDeadline = deadlines[0];
  }
  
  // Find highest priority
  const priorities = allSources
    .map(s => s.priority)
    .filter((p): p is number => p !== undefined && p > 0)
    .sort((a, b) => b - a); // Descending
  if (priorities.length > 0) {
    effectivePriority = priorities[0];
  }
  
  // Find earliest followup
  const followUps = allSources
    .map(s => s.followUpDays)
    .filter((f): f is number => f !== undefined && f > 0)
    .sort();
  if (followUps.length > 0) {
    effectiveFollowUpDays = followUps[0];
  }
  
  const primaryMode = effectiveDeadline
    ? 'deadline'
    : effectiveFollowUpDays
    ? 'followup'
    : effectivePriority
    ? 'priority'
    : 'master';

  return {
    deadline: effectiveDeadline,
    priorityLevel: effectivePriority,
    followUpDays: effectiveFollowUpDays,
    primaryMode,
    listNames
  };
}

/**
 * Merge an incoming pub into a canonical pub using append-only lineage
 */
export function mergeIntoCanonical(
  canonicalPub: Pub,
  incomingPub: Pub,
  rowIndex: number,
  mappedValues: Record<string, string>,
  extras: Record<string, string>
): Pub {
  devLog('lineage', `Merging ${incomingPub.pub} (${incomingPub.fileName}) into canonical ${canonicalPub.pub}`);
  
  // Build source reference
  const sourceRef = buildSourceRef(incomingPub, rowIndex, mappedValues, extras);
  
  // Initialize arrays if they don't exist
  const sources = [...(canonicalPub.sources || []), sourceRef];
  const fieldValuesBySource = { ...(canonicalPub.fieldValuesBySource || {}) };
  const mergedExtras = { ...(canonicalPub.mergedExtras || {}) };
  
  // Add field values by source
  Object.entries(mappedValues).forEach(([field, value]) => {
    if (!fieldValuesBySource[field]) {
      fieldValuesBySource[field] = [];
    }
    fieldValuesBySource[field].push({
      sourceId: sourceRef.sourceId,
      value
    });
  });
  
  // Add extras by source
  Object.entries(extras).forEach(([key, value]) => {
    if (!mergedExtras[key]) {
      mergedExtras[key] = [];
    }
    mergedExtras[key].push({
      sourceId: sourceRef.sourceId,
      value
    });
  });
  
  // Recompute effective plan
  const effectivePlan = recomputeEffectivePlan(canonicalPub, sourceRef);
  
  // Merge sourceLists
  const canonicalSourceLists = canonicalPub.sourceLists || [];
  const incomingSourceLists = incomingPub.sourceLists || [];
  const mergedSourceLists = [...new Set([...canonicalSourceLists, ...incomingSourceLists])];
  
  // Return updated canonical pub
  return {
    ...canonicalPub,
    // Prefer newest row for rawRow context; keep canonical fallback if missing.
    rawRow: incomingPub.rawRow ?? canonicalPub.rawRow,
    sources,
    fieldValuesBySource,
    mergedExtras,
    effectivePlan,
    sourceLists: mergedSourceLists
  };
}

/**
 * Get the canonical field value based on precedence rules
 */
export function getCanonicalFieldValue(
  pub: Pub,
  field: string
): string | undefined {
  if (!pub.fieldValuesBySource || !pub.fieldValuesBySource[field]) {
    return undefined;
  }
  
  const values = pub.fieldValuesBySource[field];
  if (values.length === 0) {
    return undefined;
  }
  
  // Precedence: masterhouse → majority → earliest-imported
  // For now, just return the first value (can be enhanced later)
  return values[0].value;
}

/**
 * Get all extras from all sources
 */
export function getAllExtras(pub: Pub): Record<string, string[]> {
  if (!pub.mergedExtras) {
    return {};
  }
  
  const result: Record<string, string[]> = {};
  Object.entries(pub.mergedExtras).forEach(([key, values]) => {
    result[key] = values.map(v => v.value);
  });
  
  return result;
}

/**
 * Get source information for display
 */
export function getSourceInfo(pub: Pub): { count: number; fileNames: string[] } {
  const sources = pub.sources || [];
  const fileNames = [...new Set(sources.map(s => s.fileName))];
  
  return {
    count: sources.length,
    fileNames
  };
}

/**
 * Collect unique source list names from visits or pub metadata
 */
export function collectSources(visitsOrPubs: Array<Pub | Visit>): string[] {
  const allSources = new Set<string>();
  
  visitsOrPubs.forEach(item => {
    // Check for sourceLists first (new field)
    if (item.sourceLists && Array.isArray(item.sourceLists)) {
      item.sourceLists.forEach(source => allSources.add(source));
    }
    
    // Check for sources array (lineage field)
    if (item.sources && Array.isArray(item.sources)) {
      item.sources.forEach(source => {
        if (typeof source === 'string') {
          allSources.add(source);
        } else if (source.fileName) {
          allSources.add(source.fileName);
        }
      });
    }
    
    // Fallback to fileName if no sources found
    if (allSources.size === 0 && item.fileName) {
      allSources.add(item.fileName);
    }
  });
  
  // Sort alphabetically but put "Masterfile" first
  const sortedSources = Array.from(allSources).sort((a, b) => {
    if (a === "Masterfile") return -1;
    if (b === "Masterfile") return 1;
    return a.localeCompare(b);
  });
  
  return sortedSources;
}

