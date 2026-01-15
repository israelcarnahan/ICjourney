/**
 * ARCHIVED — do not import into the app.
 *
 * Intent: Maps service singleton using a custom loader.
 * Real usage check: No imports or references found anywhere in the repo.
 * Intent duplication: Placeholder maps service exists at [see src/config/maps.ts](../../src/config/maps.ts).
 * Hidden coupling risk: None found.
 * Logic salvage: Optional: reuse API initialization patterns in [see src/config/maps.ts](../../src/config/maps.ts).
 * Verdict: ARCHIVE
 *
 * Notes: This file lives in _archive/ for reference only. Do not modify except during explicit "resurrection" work.
 * Source: docs/audits/TRIAGE_TASKLIST.md
 */
// Re-export postcode-based utilities
export * from '../utils/scheduleUtils';
