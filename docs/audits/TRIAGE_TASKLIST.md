# Knip Audit - Archived Code to resurrect

## Archived Files (10)

- **Path** `_archive` for reference when ready for resurrection work

  _ARCHIVE
  └───src
      ├───components
      │       CoverageHeatMap.tsx
      │       EnhancementSelector.tsx
      │       ProgressBar.tsx
      │       RemovePubDialog.tsx
      │       RescheduleDialog.tsx
      │
      ├───hooks
      │       useMapsService.ts
      │
      ├───services
      │       maps.ts
      │
      └───utils
              googleMaps.ts
              mapsLoader.ts
              rtmColors.ts

## Unused Exports & Types (Archived/Postponed)

**Handled** Archived in each symbols relevant file with **@ARCHIVED, JSDoc, void**, plus minimal no-op references to satisfy noUnusedLocals without changing runtime behavior. Resurrect its future value.

- **SYMBOL:** getCanonicalFieldValue
  - **FILE:** [`src/utils/lineageMerge.ts`](../../src/utils/lineageMerge.ts)
  - **INTENT:** Resolve canonical field value from lineage metadata.
  - **REAL USAGE CHECK:**
    - USED CROSS-FILE?: No.
    - USED INTERNALLY?: No.
    - TYPE-ONLY USAGE?: No.
    - COMMENT-ONLY REFERENCES?: No.
  - **INTENT DUPLICATION:** None; would complement `mergeIntoCanonical`.
  - **FUTURE VALUE:** Roadmap - likely needed if lineage UI/merge inspection returns.
  - **HIDDEN COUPLING RISK:** Med - intertwined with lineage data model.
  - **LOGIC SALVAGE:** Keep in mind for a future lineage panel; would plug into `src/utils/lineageMerge.ts` outputs.

- **SYMBOL:** collectSources
  - **FILE:** [`src/utils/lineageMerge.ts`](../../src/utils/lineageMerge.ts)
  - **INTENT:** Collect source list names from pub/visit records.
  - **REAL USAGE CHECK:**
    - USED CROSS-FILE?: No.
    - USED INTERNALLY?: No.
    - TYPE-ONLY USAGE?: No.
    - COMMENT-ONLY REFERENCES?: No.
  - **INTENT DUPLICATION:** Similar data is derived in [`src/utils/sourceDetails.ts`](../../src/utils/sourceDetails.ts).
  - **FUTURE VALUE:** Roadmap - useful for chips/summary if lineage UI returns.
  - **HIDDEN COUPLING RISK:** Med - tied to lineage shapes.
  - **LOGIC SALVAGE:** Would plug into source label/chip UI (see `getSourceDetails`).

- **SYMBOL:** optimizeRoute
  - **FILE:** [`src/utils/scheduleUtils.ts`](../../src/utils/scheduleUtils.ts)
  - **INTENT:** Route optimization routine.
  - **REAL USAGE CHECK:**
    - USED CROSS-FILE?: No.
    - USED INTERNALLY?: No.
    - TYPE-ONLY USAGE?: No.
    - COMMENT-ONLY REFERENCES?: No.
  - **INTENT DUPLICATION:** None.
  - **FUTURE VALUE:** Roadmap - potential scheduling optimization feature.
  - **HIDDEN COUPLING RISK:** Med - algorithm is large and touches schedule assumptions.
  - **LOGIC SALVAGE:** Could reattach to scheduling flow in `src/utils/scheduleUtils.ts` when route optimization is re-scoped.

- **SYMBOL:** clearMappings
  - **FILE:** [`src/services/persistence.ts`](../../src/services/persistence.ts)
  - **INTENT:** Clear persisted column mappings for a user.
  - **REAL USAGE CHECK:**
    - USED CROSS-FILE?: No.
    - USED INTERNALLY?: No.
    - TYPE-ONLY USAGE?: No.
    - COMMENT-ONLY REFERENCES?: Yes (commented TODO in [`src/context/PubDataContext.tsx`](../../src/context/PubDataContext.tsx)).
  - **INTENT DUPLICATION:** None.
  - **FUTURE VALUE:** Maybe - useful for user reset flows.
  - **HIDDEN COUPLING RISK:** Med - tied to persistence keys and reset semantics.
  - **LOGIC SALVAGE:** If reset flows return, wire into the reset path in `PubDataContext`..

- **SYMBOL:** BusinessHours
  - **FILE:** [`src/types.ts`](../../src/types.ts)
  - **INTENT:** Business hours type (open/close time).
  - **REAL USAGE CHECK:**
    - USED CROSS-FILE?: No.
    - USED INTERNALLY?: No.
    - TYPE-ONLY USAGE?: No.
    - COMMENT-ONLY REFERENCES?: No.
  - **INTENT DUPLICATION:** Similar types exist in [`src/context/PubDataContext.tsx`](../../src/context/PubDataContext.tsx) and [`src/components/DriveTimeBar.tsx`](../../src/components/DriveTimeBar.tsx).
  - **FUTURE VALUE:** Maybe - could become a shared domain type if consolidated.
  - **HIDDEN COUPLING RISK:** Med - type consolidation could affect multiple components.
  - **LOGIC SALVAGE:** If standardizing domain types, relocate to a single shared types module later.

- **SYMBOL:** YourListField
  - **FILE:** [`src/api/types.ts`](../../src/api/types.ts)
  - **INTENT:** Allowed field names from "Your Lists" ingest.
  - **REAL USAGE CHECK:**
    - USED CROSS-FILE?: No.
    - USED INTERNALLY?: No.
    - TYPE-ONLY USAGE?: No.
    - COMMENT-ONLY REFERENCES?: No.
  - **INTENT DUPLICATION:** None explicit; validation happens ad hoc.
  - **FUTURE VALUE:** Maybe - could be used for validation/typing in upload flow.
  - **HIDDEN COUPLING RISK:** Med - would influence ingest validation expectations.
  - **LOGIC SALVAGE:** Reintroduce if upload validation is formalized in [`src/components/FileUploader.tsx`](../../src/components/FileUploader.tsx).

# Lint Triage + Lint Rules (must read rules before action)

## Rules to follow (MUST READ AND ABIDE)

**RULE 1** Whenever lint is run, redirect output into the repo’s canonical audit file at `docs/audits/knip_lint/eslint_report_latest.txt`.

**RULE 2** 
  - As each is resolved:
    - update/replace the relevant sections, keeping the same output format as others in each related section(s). 
      - remove from backlog
      - add to the relevant Phases Completed section (with any notes)
        - update/replace with current date in the sections name. 

**RULE 3** 
  - After rule 2 is completed:
    - rerun ESLINT (SEE RULE 1)
    - confirm no resolved actions from rule 2 remain in output
    - update each relevant section of this doc, keeping the same output format as others in the related section(s). 
      - update 'Current lint after fixes ('DATE')' section:
        - replace date in named section with current date
        - update and replace:
          - lint (counts) after fixes
          - remaining rule ids
          - fix rules resolved (appending a quick blurb from the above Rule #2's work)
      - update 'current eslint rule frequency ('DATE')' section: 
        - update named sections date to current date
        - update/replace table of rule id/count/hotspots table

## Current Lint After Fixes (2026-01-20)

- Lint after fixes: 74 problems (65 errors, 9 warnings).
- Remaining rule IDs: `@typescript-eslint/no-explicit-any` (64), `react-hooks/exhaustive-deps` (9), `@typescript-eslint/no-namespace` (1).
- FIX rules resolved: `@typescript-eslint/no-unused-vars`, `no-empty`, `prefer-const`, `react-refresh/only-export-components` in `src/context`, and `*.d.ts` overrides.

### Current ESLint Rule Frequency (2026-01-20)

| Rule ID | Count | Hotspots |
| --- | ---: | --- |
| @typescript-eslint/no-explicit-any | 64 | `src/components/FileUploader.tsx` (10), `src/components/UnscheduledPubsPanel.tsx` (7), `src/utils/sourceDetails.ts` (7) |
| react-hooks/exhaustive-deps | 9 | `src/context/PubDataContext.tsx` (3), `src/api/useBusinessData.ts` (2), `src/components/DedupReviewDialog.tsx` (1) |
| @typescript-eslint/no-namespace | 1 | `src/context/PubDataContext.tsx` (1) |

Hotspot files (top 10 by total findings):
1. `src/components/FileUploader.tsx` (11)
2. `src/components/DedupReviewDialog.tsx` (7)
3. `src/components/UnscheduledPubsPanel.tsx` (7)
4. `src/utils/sourceDetails.ts` (7)
5. `src/components/ScheduleDisplay.tsx` (6)
6. `src/components/RepStatsPanel.tsx` (5)
7. `src/context/PubDataContext.tsx` (5)
8. `src/pages/PlannerDashboard.tsx` (4)
9. `src/config/maps.ts` (3)
10. `src/utils/openingHours.ts` (3)

## ESLint Phase 1 (Completed, 2026-01-20)

- Status: Completed (runtime `@typescript-eslint/no-explicit-any` remains `error`, Option 1).

### Phase 1 Completed Notes

**Classification Summary (Phase 1)**
- FIX (mechanical, no behavior change): `@typescript-eslint/no-unused-vars`, `no-empty`, `prefer-const`.
- RELAX (scoped overrides only, with exit plan): `@typescript-eslint/no-explicit-any` in `*.d.ts` only; `react-refresh/only-export-components` in `src/context` only.
- POSTPONE (behavior-sensitive; moved to Phase 2 backlog): `react-hooks/exhaustive-deps`, runtime `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-namespace`.

**Scoped ESLint Config Edits (Applied)**
- Exit plan: replace `any` in `*.d.ts` with concrete types once upstream typings are clarified; split non-component exports in `src/context` into a separate module, then re-enable `react-refresh/only-export-components`.

**FIX: Unused Vars/Params (Decisions Applied)**
- DELETE (safe, no behavior change):
  - `src/App.tsx:40` replace `const [_mousePosition, setMousePosition]` with `const [, setMousePosition]` to keep setter only.
  - `src/api/nominatimProvider.ts:11` replace `const [_, open, close]` with `const [, open, close]`.
  - `src/components/RouteMap.tsx:12` drop the unused parameter entirely: `const RouteMap: React.FC<RouteMapProps> = () => { ... }`.
  - `src/pages/PlannerDashboard.tsx:40` replace `const [_unscheduledPubs, setUnscheduledPubs]` with `const [, setUnscheduledPubs]`.
- DELETE (safe, no behavior change; keep call-site evaluation intact):
  - `src/components/DriveTimeBar.tsx:85` keep `_pubIndex` and add `void _pubIndex;` so the call site still evaluates the argument.
  - `src/config/maps.ts:37` keep `_query` and add `void _query;` so the call site still evaluates the argument.
- UNDERSCORE (only if signature must remain): add a local `// eslint-disable-next-line @typescript-eslint/no-unused-vars` on the parameter line, or use `void param;` with an explanatory comment.
- RELAX in `*.d.ts`: `src/types/shims.d.ts:3` keep `declare namespace google` and `declare const google` (type-only usage); handle via `*.d.ts` override.

**FIX: Empty Blocks (Decisions Applied)**
- KEEP+COMMENT (behavior-preserving swallow):
  - `src/api/nominatimProvider.ts:50` keep `catch {}` and add comment like `// Intentionally ignore network/provider errors; fallback to seed.`.
  - `src/api/postcodesProvider.ts:23` keep `catch {}` with comment (same rationale).
  - `src/components/ErrorBoundary.tsx:33` keep `catch {}` with comment (avoid crashing while logging).
  - `src/utils/sourceDetails.ts:30` keep `catch {}` with comment (defensive parsing).
  - `src/utils/storage.ts:11` keep `catch {}` with comment (localStorage can throw).
  - `src/utils/storage.ts:14` keep `catch {}` with comment (localStorage can throw).

**Phase 1 Execution Checklist (Completed)**
1) Add scoped ESLint overrides for `*.d.ts` and `src/context`.
2) Apply mechanical `no-unused-vars` fixes (delete unused bindings or remove unused params without changing runtime effects).
3) Add intent comments to empty blocks (`no-empty`).
4) Apply `prefer-const` change in `src/components/RepStatsPanel.tsx:344`.
5) Re-run `npm run lint` and confirm only Phase 2 backlog warnings remain.
6) Validate with `npm run typecheck` and `npm run build`.

## ESLint Phase 2 (Active)

Ordered by lowest risk / highest payoff. Runtime `@typescript-eslint/no-explicit-any` remains `error` (Option 1).

### Phase 2 Completed Packages (2026-01-20)

- **API/http/providers:** `src/api/http.ts`, `src/api/fallbackProvider.ts`, `src/api/nominatimProvider.ts`, `src/api/postcodesProvider.ts`, `src/api/useBusinessData.ts`.
  - **Outcome:** boundary-safe types and `unknown` + guards; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-explicit-any` count reduced from 79 → 64 (net -15).
  - **Lint snapshot:** 74 problems (65 errors, 9 warnings). 

### Phase 2 Backlog

#### Runtime `any` backlog packages (grouped by boundary)

- **FileUploader boundary:** `src/components/FileUploader.tsx`. 
  - **Plan:** define upload row + mapping DTOs, replace `any` with typed models or `unknown` + narrowing. - **Validate:** upload CSV/XLSX, run `npm run typecheck`, run `npm run build`.

- **Storage/persistence:** `src/services/persistence.ts`. 
  - **Plan:** define persisted shapes and key-specific interfaces; replace `any` with typed records. 
  - **Validate:** load/save flows + state reset.

- **Parsing/sourceDetails:** `src/utils/sourceDetails.ts`, `src/utils/openingHours.ts`, `src/utils/normalizeFile.ts`, `src/utils/scheduleMappers.ts`, `src/utils/seedFromPub.ts`, `src/utils/calendarUtils.ts`, `src/utils/dedupe.ts`. 
  - **Plan:** introduce parse result types + guards; narrow `unknown` instead of `any`. 
  - **Validate:** schedule mapping and opening hours parsing.

- **UI panels:** `src/components/DedupReviewDialog.tsx`, `src/components/RepStatsPanel.tsx`, `src/components/ScheduleDisplay.tsx`, `src/components/UnscheduledPubsPanel.tsx`, `src/components/PostcodeReviewDialog.tsx`, `src/components/VisitScheduler.tsx`, `src/pages/PlannerDashboard.tsx`, `src/components/DriveTimeBar.tsx`. 
  - **Plan:** define props/view models; replace `any` with typed interfaces and derived types. 
  - **Validate:** dialog flows + scheduler panels.

- **Maps/config edge:** `src/config/maps.ts`. 
  - **Plan:** define a minimal `PlaceDetails` shape for mock returns. 
  - **Validate:** maps-dependent UI still renders.

#### react-hooks/exhaustive-deps backlog (9 warnings)

- `src/api/useBusinessData.ts:32` missing dependency `seed`. 
  - **Plan:** extract dependency variables, stabilize memoization. 
  - **Validate:** business data fetch flow.

- `src/api/useBusinessData.ts:32` complex dependency expression. 
  - **Plan:** extract expression to a stable variable. 
  - **Validate:** same effect behavior across renders.

- `src/components/DedupReviewDialog.tsx:136` missing deps (`autoMerge`, `countBy`, `handleApply`, `needsReview`). 
  - **Plan:** memoize callbacks or inline carefully. 
  - **Validate:** dialog open/apply/auto-merge.

- `src/components/FileUploader.tsx:619` missing deps (`commitImport`, `processExcelFile`). 
  - **Plan:** memoize or include deps, avoid infinite re-renders. 
  - **Validate:** upload flow.

- `src/components/ScheduleDisplay.tsx:466` missing `openingHours`. 
  - **Plan:** confirm effect dependency and add if safe. 
  - **Validate:** schedule display updates.

- `src/context/PubDataContext.tsx:316` unstable `initialState` in useEffect deps. 
  - **Plan:** wrap in `useMemo`. 
  - **Validate:** app init.

- `src/context/PubDataContext.tsx:316` unstable `initialState` in useCallback deps. 
  - **Plan:** wrap in `useMemo`. 
  - **Validate:** actions and callbacks.

- `src/context/PubDataContext.tsx:422` missing deps (`businessDays`, `isInitialized`, `resetAllData`, `searchRadius`, `visitsPerDay`). 
  - **Plan:** add deps or document intentional exclusions. 
  - **Validate:** persistence and reset flows.

- `src/pages/PlannerDashboard.tsx:500` missing deps (`masterfilePubs`, `repslyDeadline`, `repslyWins`, `setUserFiles`, `unvisitedPubs`, `wishlistPubs`). 
  - **Plan:** stabilize derived lists with `useMemo`. 
  - **Validate:** dashboard refresh after uploads.

#### @typescript-eslint/no-namespace investigation (1)

- `src/context/PubDataContext.tsx:17`. 
  - **Plan:** confirm namespace use is type-only and migrate to ES module types if safe. 
  - **Validate:** `npm run typecheck` + `npm run build` with no runtime changes.

## Phase 3 Triage (Build Warnings)

- **Vite devLog chunking warning:** `src/components/ErrorBoundary.tsx` dynamically imports `src/utils/devLog.ts` but the same module is statically imported elsewhere. 
  - **Plan:** pick one import strategy (all static or all dynamic) to avoid mixed chunking; confirm no logging behavior changes. 
  - **Validate:** `npm run build` and inspect chunk report for the warning.

- **Optional: Chunk size warning:** `PlannerDashboard` chunk > 1 MB. 
  - **Plan:** consider code-splitting heavy panels or data transforms. 
  - **Validate:** `npm run build` and check chunk sizes.
