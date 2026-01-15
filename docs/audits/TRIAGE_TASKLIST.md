# Audit Triage Tasklist

**Date**: 2026-01-14  
**Status**: Planning/Triage Phase - NO DELETIONS YET

## Audit Artifacts

- **Knip Output**: `docs/audits/knip/knip-2026-01-14-entryfix.txt`
- **JSCPD HTML Report**: `docs/audits/JSCPD/html/index.html`
- **JSCPD JSON Report**: `docs/audits/JSCPD/html/jscpd-report.json`
- **Knip Config**: `knip.json`

## Knip Findings Summary

### Unused Files (32) — Verified Entries

**Verification Method**: Searched `src/` for import statements, JSX usage (`<ComponentName`), and string/path mentions. Excluded matches within the file itself. Evidence shows file:line references or explicit "no references found" confirmation.

#### Unused Component Cluster

**Cluster Evidence**: These components form a dependency chain where each is only referenced by other unused components in the cluster.

- **File:** `src/components/ListCriteriaDialog.tsx`
- **Evidence:** ❌ No references found outside file
- **Intent:** Dialog for configuring list criteria (deadline, priority level, follow-up days).
- **Fate:** **Delete** (exists healthier in `src/components/FileTypeDialog.tsx`)

- **File:** `src/components/ui/button.tsx`
- **Evidence:** [`src/components/ListCriteriaDialog.tsx:5`](src/components/ListCriteriaDialog.tsx#L5) (imported by unused component)
- **Intent:** Reusable button component with default and outline variants. Wraps standard button element with consistent styling and focus states.
- **Fate:** **Delete**

- **File:** `src/components/ui/input.tsx`
- **Evidence:** [`src/components/ListCriteriaDialog.tsx:6`](src/components/ListCriteriaDialog.tsx#L6) (commented out import)
- **Intent:** Reusable input field component with consistent styling, focus states, and disabled states. Wraps standard input element.
- **Fate:** **Delete**

- **File:** `src/components/ui/label.tsx`
- **Evidence:** [`src/components/ListCriteriaDialog.tsx:7`](src/components/ListCriteriaDialog.tsx#L7) (commented out import)
- **Intent:** Reusable label component for form inputs. Provides consistent typography and disabled state styling.
- **Fate:** **Delete**

- **File:** `src/components/ui/radio-group.tsx`
- **Evidence:** ❌ No references found outside file (only imports `lib/utils.ts` internally)
- **Intent:** Radio group component wrapper around Radix UI RadioGroup. Provides styled radio button groups for form selections.
- **Fate:** **Delete**

- **File:** `src/lib/utils.ts`
- **Evidence:** [`src/components/ListCriteriaDialog.tsx:8`](src/components/ListCriteriaDialog.tsx#L8) (commented), [`src/components/ui/button.tsx:2`](src/components/ui/button.tsx#L2), [`src/components/ui/input.tsx:2`](src/components/ui/input.tsx#L2), [`src/components/ui/label.tsx:2`](src/components/ui/label.tsx#L2), [`src/components/ui/radio-group.tsx:3`](src/components/ui/radio-group.tsx#L3), [`src/components/ProgressBar.tsx:2`](src/components/ProgressBar.tsx#L2)
- **Notes:** Only used by unused components. Provides `cn` utility for className merging
- **Intent:** Utility function for merging CSS class names. Filters out falsy values and joins remaining classes into a single string.
- **Fate:** **Delete**

- **File:** `src/components/ProgressBar.tsx`
- **Evidence:** ❌ No references found outside file
- **Notes:** Imports `lib/utils.ts` for `cn` utility
- **Intent:** Displays a visual upload/scheduling progress indicator.
- **Fate:** **Archive**

#### Standalone Unused Components

- **File:** `src/components/CoverageHeatMap.tsx`
- **Evidence:** ❌ No references found outside file
- **Notes:** Component exists but not imported anywhere
- **Intent:** Visual heat map component showing coverage statistics by postcode area. Displays scheduled vs total pubs per area with color-coded intensity levels.
- **Fate:** **Archive**

- **File:** `src/components/DeleteButton.tsx`
- **Evidence:** ❌ No references found outside file
- **Intent:** Delete button component with hover tooltip. Designed for removing schedule days, appears on hover with red gradient styling and trash icon.
- **Fate:** **Delete**

- **File:** `src/components/EnhancementSelector.tsx`
- **Evidence:** [`src/pages/PlannerDashboard.tsx:833`](src/pages/PlannerDashboard.tsx#L833) (commented out)
- **Intent:** Handles file parsing, postcode validation, Google Maps place data lookup, and configuration of deadlines/priorities.
- **Proposed Fate:** **Delete** (this exists healthier in `src/components/FileUploader.tsx`. **Validate** not 100% to delete, likely so... Contains valuable logic, currently commented out in PlannerDashboard, need to review.)

- **File:** `src/components/OpeningHoursIndicator.tsx`
- **Evidence:** ❌ No references found outside file
- **Intent:** Tooltip indicator component showing pub opening hours status. Displays open/closed state with clock icon and full schedule details on hover.
- **Fate:** **Delete** (same intent exists `UnscheduledPubsPanel.tsx:273-274`, `VisitScheduler.tsx:342-353`, `DriveTimeBar.tsx:408,434`, `ScheduleDisplay.tsx:1107-1128`. These use mock data `getMockPlaceData` or real data `businessData.openingHours`, `checkPubOpeningHours`)

- **File:** `src/components/RemovePubDialog.tsx`
- **Evidence:** ❌ No references found outside file
- **Intent:** Confirmation dialog for removing a pub visit from the schedule. Includes warning message and option to find a replacement pub in the same area.
- **Fate:** **Review** (exists `ScheduleDisplay.tsx:73`1 — handleVisitReplace. but without warning message/same area option, merge logic and prove where deleted pub goes)

- **File:** `src/components/RescheduleDialog.tsx`
- **Evidence:** ❌ No references found outside file
- **Notes:** Large dialog component (623 lines) for rescheduling visits
- **Intent:** for rescheduling an entire day's visits. Allows postcode-based search and regenerates schedule with new constraints.
- **Fate:** **Review** (this this exists as another version elsewhere certaintly, but where? **Validate** and compare logic)

- **File:** `src/components/ScheduleOverview.tsx`
- **Evidence:** ❌ No references found outside file
- **Intent:** Simple display component showing the total number of days in the schedule. Minimal UI element for schedule count summary.
- **Fate:** **Delete** (exists in `src/components/RepStatsPanel.tsx:372-383`)

- **File:** `src/components/ScheduleReport.tsx`
- **Evidence:** ❌ No references found outside file
- **Intent:** report component showing scheduled vs total pubs by priority/driver buckets.
- **Fate:** **Delete** (exsists in `RepStatsPanel.tsx:126-167`)

- **File:** `src/components/SparkleButton.tsx`
- **Evidence:** ❌ No references found outside file
- **Intent:** Animated button component with sparkle particle effects on click. Generates multiple sparkle animations at click position for visual feedback.
- **Fate:** **Delete**

- **File:** `src/components/SwipeToDelete.tsx`
- **Evidence:** ❌ No references found outside file
- **Intent:** Swipe gesture component for mobile deletion interactions.
- **Fate:** **Delete**

- **File:** `src/components/TerritoryMap.tsx`
- **Evidence:** ❌ No references found outside file
- **Intent:** Map component for visualizing territory coverage. Currently contains mock data generator for place information rather than actual map rendering.
- **Proposed Fate:** **Delete** (likely delete. is this the same intent as `CoverageHeatMap.tsx`, but with mock data?)

- **File:** `src/components/icons/MonopolyIcons.tsx`
- **Evidence:** ❌ No references found outside file
- **Intent:** Custom icon set with Monopoly-themed SVG icons (boot, top hat, thimble, etc.). Provides themed visual elements for UI components.
- **Fate:** **Delete** (provided by lucide-react library)

#### Barrel Files

- **File:** `src/components/index.ts`
- **Evidence:** Exports `ListTypeDialog`, `FileUploader`, `PlannerDashboard` but no imports found
- **Intent:** Barrel file for exporting multiple components from a single import path. Provides convenience for importing multiple components from the components directory.
- **Fate:** **Delete** (Not used. Components are imported directly. If barrel files are desired, create a new one when needed.)

- **File:** `src/components/ListTypeDialog.tsx`
- **Tag:** [INFERRED]
- **Evidence:** [`src/components/index.ts:2`](src/components/index.ts#L2) (exported but index.ts not imported)
- **Intent:** Dialog component for selecting list type when uploading files.
- **Proposed Fate:** **Delete** (**Validate** exists `src/components/FileTypeDialog.tsx:38-367*`)

- **File:** `src/context/index.ts`
- **Evidence:** Exports `PubDataProvider`, `usePubData` but no imports found
- **Intent:** Barrel file for exporting context providers and hooks. Re-exports PubDataProvider and usePubData from PubDataContext.
- **Fate:** **Delete** (Not used, exports are imported directly from `PubDataContext.tsx`)

- **File:** `src/types/index.ts`
- **Evidence:** Types imported from `../types` (types.ts) not `../types/index`
- **Intent:** Barrel file for exporting TypeScript type definitions. Intended to provide centralized type exports but types are imported directly from types.ts instead.
- **Fate:** **Delete** (Not used, types are imported directly from `types.ts`)

#### Maps/Google Places Cluster (Defer Until Integration Complete)

- **File:** `src/hooks/useMapsService.ts`
- **Evidence:** ❌ No references found outside file
- **Intent:** React hook for Google Maps service singleton. Provides initialized PlacesService and Geocoder instances with error handling and loading state management.
- **Proposed Fate:** **Delete** (**Validate** `src/config/maps.ts` is actively used (`FileUploader.tsx:10` imports `mapsService` from `config/maps`).)

- **File:** `src/services/maps.ts`
- **Evidence:** ❌ No references found outside file
- **Intent:** Maps service singleton for managing Google Maps API initialization. Handles PlacesService and Geocoder setup with error handling and mock data fallback.
- **Proposed Fate:** **Delete** (**Validate** `src/config/maps.ts` is actively used `FileUploader.tsx:10`. `services/maps.ts` appears to be an older/unused versiod)

- **File:** `src/utils/googleMaps.ts`
- **Evidence:** ❌ No references found outside file
- **Intent:** Re-exports postcode-based utilities from scheduleUtils. Thin wrapper for Google Maps-related utility functions.
- **Proposed Fate:** **Delete** (**Validate** `src/utils/googleMaps.ts:2` — Re-exports from scheduleUtils (thin wrapper))

- **File:** `src/utils/mapsLoader.ts`
- **Evidence:** ❌ No references found outside file
- **Intent:** Maps loader singleton class for Google Maps API initialization. Currently returns resolved promise (postcode-based version) without actual API loading.
- **Proposed Fate:** **Delete** (**Validate** `src/config/maps.ts:4-69` — MapsService handles initialization.)

#### Utilities

- **File:** `src/utils/routeOptimization.ts`
- **Evidence:** ❌ No references found outside file
- **Notes:** Route optimization algorithms (imports `Visit` from `../types` but not imported itself)
- **Intent:** Groups visits by postcode proximity, respects scheduled time constraints, and minimizes travel distance between visits.
- **Fate:** **Delete** (exists in `src/utils/scheduleUtils.ts:812-878` — optimizeRoute)

- **File:** `src/utils/rtmColors.ts`
- **Evidence:** ❌ No references found outside file
- **Intent:** Returns hex colors for different pub chains (Greene King, Admiral, Punch, Stonegate, Trust) for UI theming.
- **Fate:** **Archive**

#### Configuration

- **File:** `src/config/environment.ts`
- **Evidence:** ❌ No references found outside file
- **Intent:** Environment configuration object for debug settings. Currently exports a debug configuration with log level, intended for build-time or runtime configuration.
- **Fate:** **Delete** (Vite's `import.meta.env` is the active pattern for environment configuration)

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
