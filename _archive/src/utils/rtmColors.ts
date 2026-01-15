/**
 * ARCHIVED — do not import into the app.
 *
 * Intent: RTM-to-color mapping for UI badges.
 * Real usage check: No imports or references found anywhere in the repo.
 * Intent duplication: None found.
 * Hidden coupling risk: None found.
 * Logic salvage: Optional: use for RTM badges in [see src/components/RepStatsPanel.tsx](../../src/components/RepStatsPanel.tsx) if that UI returns.
 * Verdict: ARCHIVE
 *
 * Notes: This file lives in _archive/ for reference only. Do not modify except during explicit "resurrection" work.
 * Source: docs/audits/TRIAGE_TASKLIST.md
 */
export const getRtmColor = (rtm: string | undefined): string => {
  if (!rtm) return '#6B7280'; // Default gray

  const normalizedRtm = rtm.toLowerCase().trim();
  
  if (normalizedRtm.includes('greene king')) {
    return normalizedRtm.includes('ift') ? '#2F6D0F' : '#16A34A'; // Made GK IFT darker
  }
  if (normalizedRtm.includes('admiral')) return '#DC2626';
  if (normalizedRtm.includes('punch')) return '#71717A';
  if (normalizedRtm.includes('stonegate')) return '#2563EB';
  if (normalizedRtm.includes('trust')) return '#F97316'; // Bright orange
  
  // Add more RTM mappings as needed
  return '#6B7280'; // Default gray for unknown RTMs
};
