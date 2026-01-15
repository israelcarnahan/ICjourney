# Audit Triage Tasklist

**Date**: 2026-01-14  
**Status**: Planning/Triage Phase - NO DELETIONS YET

## Audit Artifacts

- **Knip Output**: `docs/audits/knip/knip-2026-01-14-entryfix.txt`
- **JSCPD HTML Report**: `docs/audits/JSCPD/html/index.html`
- **JSCPD JSON Report**: `docs/audits/JSCPD/html/jscpd-report.json`
- **Knip Config**: `knip.json`

## Knip Findings Summary

### Unused Files (30)

**Verification Method**: Searched `src/` for import statements, JSX usage (`<ComponentName`), and string/path mentions. Excluded matches within the file itself. Evidence shows file:line references or explicit "no references found" confirmation.

#### DELETE

- **File:** `src/components/SparkleButton.tsx`

  - **INTENT:** Click-triggered sparkle animation button for visual feedback.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** None found.
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: reuse sparkle animation logic for CTAs in [`src/components/FileUploader.tsx`](../../src/components/FileUploader.tsx).
  - **VERDICT:** DELETE

- **File:** `src/components/SwipeToDelete.tsx`

  - **INTENT:** Swipe/drag-to-delete wrapper for mobile interactions.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** None found.
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: reuse touch + mouse gesture handling for list items in [`src/components/ScheduleDisplay.tsx`](../../src/components/ScheduleDisplay.tsx).
  - **VERDICT:** DELETE

- **File:** `src/components/DeleteButton.tsx`

  - **INTENT:** Hover-revealed delete button with tooltip.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** None found; active delete actions are inline.
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: reuse tooltip + hover affordance for delete actions in [`src/components/ScheduleDisplay.tsx`](../../src/components/ScheduleDisplay.tsx).
  - **VERDICT:** DELETE

- **File:** `src/components/icons/MonopolyIcons.tsx`

  - **INTENT:** Custom Monopoly-themed SVG icons.
  - **REAL USAGE CHECK:** No imports found; only a text mention in [`src/pages/PlannerDashboard.tsx`](../../src/pages/PlannerDashboard.tsx).
  - **INTENT DUPLICATION:** None; `lucide-react` is used elsewhere for icons.
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** None.
  - **VERDICT:** DELETE

- **File:** `src/components/TerritoryMap.tsx`

  - **INTENT:** Mock place data generator (misnamed as territory map).
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** Equivalent mock data helper exists in [`src/utils/mockData.ts`](../../src/utils/mockData.ts).
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** None.
  - **VERDICT:** DELETE

- **File:** `src/components/ScheduleOverview.tsx`

  - **INTENT:** Minimal N days planned schedule summary.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** Covered by the richer schedule overview in [`src/components/RepStatsPanel.tsx`](../../src/components/RepStatsPanel.tsx).
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** None.
  - **VERDICT:** DELETE

- **File:** `src/components/ScheduleReport.tsx`

  - **INTENT:** Scheduled vs total pubs report by list buckets.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** Similar reporting exists in [`src/components/RepStatsPanel.tsx`](../../src/components/RepStatsPanel.tsx).
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: reuse bucket config or status messaging in [`src/components/RepStatsPanel.tsx`](../../src/components/RepStatsPanel.tsx).
  - **VERDICT:** DELETE

- **File:** `src/components/OpeningHoursIndicator.tsx`

  - **INTENT:** Tooltip badge for opening-hours status with mock data.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** Opening-hours handling is active in [`src/components/ScheduleDisplay.tsx`](../../src/components/ScheduleDisplay.tsx) and status cues appear in [`src/components/DriveTimeBar.tsx`](../../src/components/DriveTimeBar.tsx) and [`src/components/UnscheduledPubsPanel.tsx`](../../src/components/UnscheduledPubsPanel.tsx).
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: reuse tooltip copy in [`src/components/ScheduleDisplay.tsx`](../../src/components/ScheduleDisplay.tsx).
  - **VERDICT:** DELETE

- **File:** `src/components/ListTypeDialog.tsx`

  - **INTENT:** Basic list-type selection dialog for uploads.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** Replaced by [`src/components/FileTypeDialog.tsx`](../../src/components/FileTypeDialog.tsx), which is actively used.
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** None.
  - **VERDICT:** DELETE

- **File:** `src/components/index.ts`

  - **INTENT:** Barrel exports for components/pages.
  - **REAL USAGE CHECK:** No imports found for this barrel in the repo.
  - **INTENT DUPLICATION:** Direct imports are the active pattern.
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** None.
  - **VERDICT:** DELETE

- **File:** `src/context/index.ts`

  - **INTENT:** Barrel exports for context provider/hook.
  - **REAL USAGE CHECK:** No imports found for this barrel in the repo.
  - **INTENT DUPLICATION:** Direct imports from [`src/context/PubDataContext.tsx`](../../src/context/PubDataContext.tsx) are used.
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** None.
  - **VERDICT:** DELETE

- **File:** `src/types/index.ts`

  - **INTENT:** Barrel types for visits/schedule models.
  - **REAL USAGE CHECK:** No imports of this barrel; imports resolve to [`src/types.ts`](../../src/types.ts) or [`src/types/import.ts`](../../src/types/import.ts).
  - **INTENT DUPLICATION:** Types are already defined in [`src/types.ts`](../../src/types.ts).
  - **HIDDEN COUPLING RISK:** Low; note the folder/file name collision, but there are no references to the barrel.
  - **LOGIC SALVAGE:** None.
  - **VERDICT:** DELETE

- **File:** `src/components/ui/button.tsx`

  - **INTENT:** Styled button wrapper with variants.
  - **REAL USAGE CHECK:** No imports found outside the unused cluster.
  - **INTENT DUPLICATION:** Active components use inline button styling instead of wrappers.
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** None.
  - **VERDICT:** DELETE

- **File:** `src/components/ui/input.tsx`

  - **INTENT:** Styled input wrapper.
  - **REAL USAGE CHECK:** No imports found outside the unused cluster (only commented reference).
  - **INTENT DUPLICATION:** Inputs are styled inline in active components.
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** None.
  - **VERDICT:** DELETE

- **File:** `src/components/ui/label.tsx`

  - **INTENT:** Styled label wrapper.
  - **REAL USAGE CHECK:** No imports found outside the unused cluster (only commented reference).
  - **INTENT DUPLICATION:** Labels are styled inline in active components.
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** None.
  - **VERDICT:** DELETE

- **File:** `src/components/ui/radio-group.tsx`

  - **INTENT:** Styled Radix RadioGroup wrapper.
  - **REAL USAGE CHECK:** No imports found anywhere in the repo.
  - **INTENT DUPLICATION:** Radix RadioGroup is used directly in [`src/components/FileTypeDialog.tsx`](../../src/components/FileTypeDialog.tsx).
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: reuse styling in [`src/components/FileTypeDialog.tsx`](../../src/components/FileTypeDialog.tsx) if standardizing.
  - **VERDICT:** DELETE

- **File:** `src/components/ListCriteriaDialog.tsx`

  - **INTENT:** Criteria dialog for hitlist/wins scheduling (priority/deadline/follow-up).
  - **REAL USAGE CHECK:** No imports or references found outside this file.
  - **INTENT DUPLICATION:** Covered by the active upload flow in [`src/components/FileTypeDialog.tsx`](../../src/components/FileTypeDialog.tsx).
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: reuse the priority grid or follow-up messaging in [`src/components/FileTypeDialog.tsx`](../../src/components/FileTypeDialog.tsx).
  - **VERDICT:** DELETE

- **File:** `src/lib/utils.ts`

  - **INTENT:** `cn` utility for className joining.
  - **REAL USAGE CHECK:** No imports found outside unused components; only a type shim reference in [`src/types/shims.d.ts`](../../src/types/shims.d.ts).
  - **INTENT DUPLICATION:** `clsx` is used in active components such as [`src/components/UnscheduledPubsPanel.tsx`](../../src/components/UnscheduledPubsPanel.tsx).
  - **HIDDEN COUPLING RISK:** Type-only module declaration at [`src/types/shims.d.ts`](../../src/types/shims.d.ts); no runtime usage.
  - **LOGIC SALVAGE:** None.
  - **VERDICT:** DELETE

- **File:** `src/utils/routeOptimization.ts`

  - **INTENT:** Route optimization using postcode proximity and schedule constraints.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** Another `optimizeRoute` exists in [`src/utils/scheduleUtils.ts`](../../src/utils/scheduleUtils.ts).
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: if preferred, merge postcode grouping logic into [`src/utils/scheduleUtils.ts`](../../src/utils/scheduleUtils.ts).
  - **VERDICT:** DELETE

- **File:** `src/config/environment.ts`
  - **INTENT:** Static debug configuration export.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** Environment checks use `import.meta.env` in [`src/utils/devLog.ts`](../../src/utils/devLog.ts) and [`src/context/LoginGate.tsx`](../../src/context/LoginGate.tsx).
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** None.
  - **VERDICT:** DELETE

#### ARCHIVE

- **File:** `src/components/CoverageHeatMap.tsx`

  - **INTENT:** Coverage heat map by postcode area.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** None found; no active heatmap component exists.
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: reuse area grouping + color scaling in [`src/components/RepStatsPanel.tsx`](../../src/components/RepStatsPanel.tsx).
  - **VERDICT:** ARCHIVE

- **File:** `src/components/ProgressBar.tsx`

  - **INTENT:** Radix-based progress indicator.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** None found.
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: wire into long-running flows in [`src/components/FileUploader.tsx`](../../src/components/FileUploader.tsx).
  - **VERDICT:** ARCHIVE

- **File:** `src/components/RemovePubDialog.tsx`

  - **INTENT:** Confirm-and-replace dialog for removing a visit.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** Replacement logic exists without dialog UI in [`src/components/ScheduleDisplay.tsx`](../../src/components/ScheduleDisplay.tsx).
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: reuse the dialog UX with `handleVisitReplace` in [`src/components/ScheduleDisplay.tsx`](../../src/components/ScheduleDisplay.tsx).
  - **VERDICT:** ARCHIVE

- **File:** `src/components/RescheduleDialog.tsx`

  - **INTENT:** Reschedule dialog with postcode-based regeneration.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** None found; no active reschedule UI exists.
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: integrate with day actions in [`src/components/ScheduleDisplay.tsx`](../../src/components/ScheduleDisplay.tsx).
  - **VERDICT:** ARCHIVE

- **File:** `src/components/EnhancementSelector.tsx`

  - **INTENT:** Legacy upload flow with list options, Excel parsing, postcode validation, and file configuration.
  - **REAL USAGE CHECK:** Only a commented-out JSX reference in [`src/pages/PlannerDashboard.tsx`](../../src/pages/PlannerDashboard.tsx); no live imports.
  - **INTENT DUPLICATION:** Active upload flow is [`src/components/FileUploader.tsx`](../../src/components/FileUploader.tsx) with selection UI in [`src/components/FileTypeDialog.tsx`](../../src/components/FileTypeDialog.tsx).
  - **HIDDEN COUPLING RISK:** Low; references [`src/config/maps.ts`](../../src/config/maps.ts) which is already used elsewhere.
  - **LOGIC SALVAGE:** Optional: reuse the option-card UX or simplified parser in [`src/components/FileUploader.tsx`](../../src/components/FileUploader.tsx).
  - **VERDICT:** ARCHIVE

- **File:** `src/utils/rtmColors.ts`

  - **INTENT:** RTM-to-color mapping for UI badges.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** None found.
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: use for RTM badges in [`src/components/RepStatsPanel.tsx`](../../src/components/RepStatsPanel.tsx) if that UI returns.
  - **VERDICT:** ARCHIVE

- **File:** `src/hooks/useMapsService.ts`

  - **INTENT:** Real Google Maps loader/service singleton with error handling.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** Placeholder service is active in [`src/config/maps.ts`](../../src/config/maps.ts) (used by [`src/components/FileUploader.tsx`](../../src/components/FileUploader.tsx)).
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: reuse error handling and real API init in [`src/config/maps.ts`](../../src/config/maps.ts) if integration resumes.
  - **VERDICT:** ARCHIVE

- **File:** `src/services/maps.ts`

  - **INTENT:** Maps service singleton using a custom loader.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** Placeholder maps service exists at [`src/config/maps.ts`](../../src/config/maps.ts).
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** Optional: reuse API initialization patterns in [`src/config/maps.ts`](../../src/config/maps.ts).
  - **VERDICT:** ARCHIVE

- **File:** `src/utils/googleMaps.ts`

  - **INTENT:** Thin re-export of schedule utilities for maps-related use.
  - **REAL USAGE CHECK:** No imports or references found anywhere in the repo.
  - **INTENT DUPLICATION:** Direct utilities are available in [`src/utils/scheduleUtils.ts`](../../src/utils/scheduleUtils.ts).
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** None.
  - **VERDICT:** ARCHIVE

- **File:** `src/utils/mapsLoader.ts`
  - **INTENT:** Placeholder MapsLoader for postcode-only mode.
  - **REAL USAGE CHECK:** Only referenced by [`src/services/maps.ts`](../../src/services/maps.ts), which is unused.
  - **INTENT DUPLICATION:** Placeholder loader behavior already exists in [`src/config/maps.ts`](../../src/config/maps.ts).
  - **HIDDEN COUPLING RISK:** None found.
  - **LOGIC SALVAGE:** None.
  - **VERDICT:** ARCHIVE

### Guardrails: Do Not Delete Yet

**⚠️ CRITICAL**: These TypeScript declaration files (`.d.ts`) are required for type checking and build processes. **DO NOT DELETE** without first verifying via `npm run typecheck` and `npm run build` after removal. These files provide essential type definitions that may not be detected by static analysis tools.

- **File:** `src/types/shims.d.ts`
- **Tag:** [GUARDRAIL]
- **Evidence:** TypeScript declaration file (build-time dependency)
- **Notes:** Provides type shims for build process. Required for TypeScript compilation.
- **Intent:** TypeScript declaration file providing type definitions for external libraries without types. Includes shims for Google Maps API, Radix UI Progress, and path aliases to prevent build-time type errors.
- **Proposed Fate:** **Keep** (verify via typecheck/build before considering removal)

- **File:** `src/types/xlsx-js-style.d.ts`
- **Tag:** [VERIFIED: live reference]
- **Evidence:** [`src/components/FileUploader.tsx:3`](src/components/FileUploader.tsx#L3), [`src/components/EnhancementSelector.tsx:9`](src/components/EnhancementSelector.tsx#L9), [`src/components/ScheduleDisplay.tsx:18`](src/components/ScheduleDisplay.tsx#L18)
- **Notes:** Type definitions for `xlsx-js-style` library (actively used by 3 components)
- **Intent:** TypeScript declaration file for xlsx-js-style library. Provides type definitions for Excel file reading/writing operations including WorkBook, WorkSheet, and utility functions.
- **Proposed Fate:** **Keep**

### Unused Dependencies (13)

- `@googlemaps/js-api-loader`
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-label`
- `@radix-ui/react-popover`
- `@radix-ui/react-progress`
- `@radix-ui/react-switch`
- `class-variance-authority`
- `react-virtualized`
- `tailwind-merge`
- `tailwindcss-animate`
- `uk-postcode-validator`
- `uuid`
- `yup`

### Unused devDependencies (6)

- `@types/react-virtualized`
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `dependency-cruiser`
- `jscpd` (note: used for audits, but not in runtime)
- `madge`

### Unlisted Dependencies (2)

- `@eslint/js` - used in `eslint.config.js:1:17`
- `globals` - used in `eslint.config.js:2:22`

### Unused Exports (22)

See full list in `docs/audits/knip/knip-2026-01-14-entryfix.txt` (lines 58-80)

### Unused Exported Types (9)

See full list in `docs/audits/knip/knip-2026-01-14-entryfix.txt` (lines 81-90)

## Verification Summary

All 32 files from Knip's "Unused files" list have been verified against the codebase. See the [Verified Entries](#unused-files-32--verified-entries) section above for detailed evidence.

### Key Findings

**Confirmed Unused Cluster** (can be archived together):

- `ListCriteriaDialog.tsx` → `ui/button.tsx` → `lib/utils.ts` → `ui/input.tsx`, `ui/label.tsx`, `ui/radio-group.tsx` → `ProgressBar.tsx`
- All components in this cluster are only referenced within the cluster itself (mostly commented references)
- Safe to archive as a group if desired

**Notable Exceptions**:

- `EnhancementSelector.tsx`: [VERIFIED: commented reference] in [`PlannerDashboard.tsx:833`](src/pages/PlannerDashboard.tsx#L833) - contains valuable logic, consider **Restore**
- `xlsx-js-style.d.ts`: [VERIFIED: live reference] - actively used by 3 components - **Keep**
- `types/index.ts`: Not used (types imported from `types.ts` directly) - safe to archive
- `components/index.ts` and `context/index.ts`: Barrel files not imported - may be intentional for future use

**Maps/Google Places Cluster** (defer until integration complete):

- `services/maps.ts`, `utils/googleMaps.ts`, `utils/mapsLoader.ts`, `hooks/useMapsService.ts`
- Related to incomplete Google Places integration (see `feat/api-google-places` branch)
- Archive after integration is complete or confirmed abandoned

## Execution Order (When We Start Moving/Restoring)

**Reference**: All file details, evidence, and proposed fates are in the [Verified Entries](#unused-files-32--verified-entries) section above. This section provides the execution sequence only.

2. **Defer maps cluster**: [Maps/Google Places Cluster](#mapsgoogle-places-cluster-defer-until-integration-complete) — Wait until Google Places integration work resumes
3. **Guardrails**: Keep all files in [Guardrails section](#guardrails-do-not-delete-yet) — Do not delete `.d.ts` files without verification

## Safety Ritual (Before Any Move/Delete)

Before moving or deleting any file:

1. Run `npm run typecheck` and `npm run build` — verify no breakage
2. Run `npx knip -c knip.json` — confirm file still flagged as unused
3. Commit in small batches — one cluster or logical group per commit
4. Test after each commit — ensure app still works

**Dependency cleanup**: Wait until all file deletions are complete and verified. Then review unused dependencies from Knip output and remove via `npm uninstall`.

**ESLint fix**: Update `package.json` lint script to remove `--ext` flag (flat config doesn't support it). Add missing deps: `npm install --save-dev @eslint/js globals`.

## Next: JSCPD Review Steps

1. Open HTML report: `docs/audits/JSCPD/html/index.html`
2. Identify top duplicate code clusters
3. Record findings in a short summary (no refactors yet)

## How to Re-run Audits

### Knip

**Command**:

```bash
npx knip -c knip.json
```

**Save output**:

```bash
# PowerShell
npx knip -c knip.json | Tee-Object -FilePath "docs/audits/knip/knip-$(Get-Date -Format 'yyyy-MM-dd').txt"

# Bash
npx knip -c knip.json | tee "docs/audits/knip/knip-$(date +%Y-%m-%d).txt"
```

**What it does**: Analyzes unused files, dependencies, exports, and types in the codebase.

**Config**: `knip.json` specifies entry point (`src/main.tsx`) and ignore patterns.

### JSCPD

**Command**:

```bash
npx jscpd src/ --reporters html --reporters json --output docs/audits/JSCPD/html
```

**Alternative** (if configured in package.json):

```bash
npm run jscpd
```

**What it does**: Detects code duplication (copy-paste detection) across the codebase.

**Output**: HTML report at `docs/audits/JSCPD/html/index.html` and JSON report at `docs/audits/JSCPD/html/jscpd-report.json`.

**Note**: `jscpd` is listed as a devDependency but may not have a script in package.json. Add one if needed:

```json
"jscpd": "jscpd src/ --reporters html --reporters json --output docs/audits/JSCPD/html"
```

## Next Actions

1. ✅ Complete triage document (this file)
2. ⏳ Review JSCPD HTML report for duplicate clusters
3. ⏳ Fix ESLint lint script (remove `--ext` flag) and add missing dependencies
4. ⏳ Begin execution: Restore EnhancementSelector.tsx
5. ⏳ Archive ListCriteriaDialog cluster
6. ⏳ Archive standalone components
7. ⏳ Clean up dependencies after file deletions are complete
