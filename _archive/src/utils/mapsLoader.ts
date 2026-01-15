/**
 * ARCHIVED — do not import into the app.
 *
 * Intent: Placeholder MapsLoader for postcode-only mode.
 * Real usage check: Only referenced by [see src/services/maps.ts](../../src/services/maps.ts), which is unused.
 * Intent duplication: Placeholder loader behavior already exists in [see src/config/maps.ts](../../src/config/maps.ts).
 * Hidden coupling risk: None found.
 * Logic salvage: None.
 * Verdict: ARCHIVE
 *
 * Notes: This file lives in _archive/ for reference only. Do not modify except during explicit "resurrection" work.
 * Source: docs/audits/TRIAGE_TASKLIST.md
 */
// Mock data and utilities for postcode-based calculations
export const MAPS_CONFIG = {
  version: "postcode",
  language: "en-GB",
  region: "GB"
} as const;

export class MapsLoader {
  private static instance: MapsLoader | null = null;

  private constructor() {}

  public static getInstance(): MapsLoader {
    if (!MapsLoader.instance) {
      MapsLoader.instance = new MapsLoader();
    }
    return MapsLoader.instance;
  }

  public load(): Promise<void> {
    return Promise.resolve();
  }
}
