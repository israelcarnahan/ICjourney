import type { Pub, SourceRef, EffectivePlan } from '../context/PubDataContext';
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
  
  // Precedence: deadline → priority → followup
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
  
  return {
    deadline: effectiveDeadline,
    priorityLevel: effectivePriority,
    followUpDays: effectiveFollowUpDays,
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
  
  // Return updated canonical pub
  return {
    ...canonicalPub,
    sources,
    fieldValuesBySource,
    mergedExtras,
    effectivePlan
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
