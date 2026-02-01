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

**RULE 1** Whenever lint is run, overwrite the repo’s canonical audit file:
`npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
(Note: lint will exit non-zero while errors exist; the redirected report is still the source of truth.)

**RULE 2** 
  - As each is resolved:
    - update/replace the relevant section(s), keeping the same output format as others in each related section(s). 
      - remove from backlog
      - add to the relevant Phases Completed  section (with any notes)
        - update/replace with current date on the snapshot sections name. 

**RULE 3 (clarified)** After resolving items and regenerating the canonical lint report:
- Update the snapshot sections (date + counts + remaining rule IDs).
- Update the triage *summary* tables:
  - Rule ID totals + a few top hotspots
  - “Hotspot files (top 10)”
- Do not paste the full lint dump into this doc; the canonical lint report contains the full file-by-file detail.

## Current Lint After Fixes (2026-02-01)

- Lint after fixes: 2 problems (2 errors, 0 warnings).
- Remaining rule IDs: `@typescript-eslint/no-explicit-any` (2).
- FIX rules resolved: `@typescript-eslint/no-unused-vars`, `no-empty`, `prefer-const`, `react-refresh/only-export-components` in `src/context`, and `*.d.ts` overrides.

### Current ESLint Rule Frequency (2026-02-01)

| Rule ID | Count | Hotspots |
| --- | ---: | --- |
| @typescript-eslint/no-explicit-any | 2 | `src/context/PubDataContext.tsx` (1), `src/utils/devLog.ts` (1) |

Hotspot files (top 10 by total findings):
1. `src/context/PubDataContext.tsx` (1)
2. `src/utils/devLog.ts` (1)

## ESLint Phase 1 (Completed, 2026-01-20)

- Status: Completed (runtime `@typescript-eslint/no-explicit-any` remains `error`, Option 1).

### Phase 1 Completed Tasks

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

## ESLint Phase 2 (Active)

Ordered by lowest risk / highest payoff. Runtime `@typescript-eslint/no-explicit-any` remains `error` (Option 1).

### Phase 2 Completed Packages (2026-02-01)

- **API/http/providers:** `src/api/http.ts`, `src/api/fallbackProvider.ts`, `src/api/nominatimProvider.ts`, `src/api/postcodesProvider.ts`, `src/api/useBusinessData.ts`.
  - **Outcome:** boundary-safe types and `unknown` + guards; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-explicit-any` count reduced from 79 → 64 (net -15).
  - **Lint snapshot:** 74 problems (65 errors, 9 warnings). 

- **Storage/persistence:** `src/services/persistence.ts`.
  - **Outcome:** persisted mappings now typed with `unknown` + guards; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-explicit-any` count reduced from 64 ƒ+' 62 (net -2).
  - **Lint snapshot:** 72 problems (63 errors, 9 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **FileUploader boundary:** `src/components/FileUploader.tsx`.
  - **Outcome:** boundary rows now typed with `unknown` + guards; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-explicit-any` count reduced from 62 ƒ+' 52 (net -10).
  - **Lint snapshot:** 62 problems (53 errors, 9 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **Parsing/sourceDetails:** `src/utils/sourceDetails.ts`, `src/utils/openingHours.ts`, `src/utils/normalizeFile.ts`, `src/utils/scheduleMappers.ts`, `src/utils/seedFromPub.ts`, `src/utils/calendarUtils.ts`, `src/utils/dedupe.ts`.
  - **Outcome:** boundary parsing now typed with `unknown` + guards; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-explicit-any` count reduced from 52 ƒ+' 35 (net -17).
  - **Lint snapshot:** 45 problems (36 errors, 9 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **UI panel: UnscheduledPubsPanel:** `src/components/UnscheduledPubsPanel.tsx`.
  - **Outcome:** scheduled/nearby pub boundaries now typed with `unknown` + guards; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-explicit-any` count reduced from 35 ƒ+' 28 (net -7).
  - **Lint snapshot:** 38 problems (29 errors, 9 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **UI panel: DedupReviewDialog:** `src/components/DedupReviewDialog.tsx`.
  - **Outcome:** existing/incoming comparison fields now typed with `unknown` + guards; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-explicit-any` count reduced from 28 ƒ+' 22 (net -6).
  - **Lint snapshot:** 32 problems (23 errors, 9 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **UI panel: ScheduleDisplay:** `src/components/ScheduleDisplay.tsx`.
  - **Outcome:** schedule updates now use typed day/visit helpers and safe casts; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-explicit-any` count reduced from 22 ƒ+' 17 (net -5).
  - **Lint snapshot:** 27 problems (18 errors, 9 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **UI panel: RepStatsPanel:** `src/components/RepStatsPanel.tsx`.
  - **Outcome:** stats list and selected details now typed with safe null handling; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-explicit-any` count reduced from 17 to 12 (net -5).
  - **Lint snapshot:** 22 problems (13 errors, 9 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **UI panel: PlannerDashboard:** `src/pages/PlannerDashboard.tsx`.
  - **Outcome:** file dialog and priority tracking now use typed inputs; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-explicit-any` count reduced from 12 to 9 (net -3).
  - **Lint snapshot:** 19 problems (10 errors, 9 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **UI panel: DriveTimeBar:** `src/components/DriveTimeBar.tsx`.
  - **Outcome:** optimized visit time lookup now uses safe string checks; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-explicit-any` count reduced from 9 to 7 (net -2).
  - **Lint snapshot:** 17 problems (8 errors, 9 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **UI panel: PostcodeReviewDialog:** `src/components/PostcodeReviewDialog.tsx`.
  - **Outcome:** raw row payload now typed with unknown boundary; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-explicit-any` count reduced from 7 to 6 (net -1).
  - **Lint snapshot:** 16 problems (7 errors, 9 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **UI panel: VisitScheduler:** `src/components/VisitScheduler.tsx`.
  - **Outcome:** visit details panel now uses typed schedule visits; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-explicit-any` count reduced from 6 to 5 (net -1).
  - **Lint snapshot:** 15 problems (6 errors, 9 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **Maps/config edge:** `src/config/maps.ts`.
  - **Outcome:** mock geocoder and place details now use minimal typed shapes; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-explicit-any` count reduced from 5 to 2 (net -3).
  - **Lint snapshot:** 12 problems (3 errors, 9 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **Hooks deps: useBusinessData:** `src/api/useBusinessData.ts`.
  - **Outcome:** hook dependencies now include seed directly; no runtime behavior changes intended.
  - **Package completed:** `react-hooks/exhaustive-deps` count reduced from 9 to 7 (net -2).
  - **Lint snapshot:** 10 problems (3 errors, 7 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **Hooks deps: DedupReviewDialog:** `src/components/DedupReviewDialog.tsx`.
  - **Outcome:** escape key handler now tracks dependencies via memoized helpers; no runtime behavior changes intended.
  - **Package completed:** `react-hooks/exhaustive-deps` count reduced from 7 to 6 (net -1).
  - **Lint snapshot:** 9 problems (3 errors, 6 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **Hooks deps: FileUploader:** `src/components/FileUploader.tsx`.
  - **Outcome:** drop handler dependencies now memoized for stability; no runtime behavior changes intended.
  - **Package completed:** `react-hooks/exhaustive-deps` count reduced from 6 to 5 (net -1).
  - **Lint snapshot:** 8 problems (3 errors, 5 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **Hooks deps: ScheduleDisplay:** `src/components/ScheduleDisplay.tsx`.
  - **Outcome:** opening-hours effect now tracks its cache dependency; no runtime behavior changes intended.
  - **Package completed:** `react-hooks/exhaustive-deps` count reduced from 5 to 4 (net -1).
  - **Lint snapshot:** 7 problems (3 errors, 4 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **Hooks deps: PubDataContext:** `src/context/PubDataContext.tsx`.
  - **Outcome:** initialization and reset dependencies now memoized; no runtime behavior changes intended.
  - **Package completed:** `react-hooks/exhaustive-deps` count reduced from 4 to 1 (net -3).
  - **Lint snapshot:** 4 problems (3 errors, 1 warning).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **Hooks deps: PlannerDashboard:** `src/pages/PlannerDashboard.tsx`.
  - **Outcome:** uploaded-files effect now depends on memoized pub lists; no runtime behavior changes intended.
  - **Package completed:** `react-hooks/exhaustive-deps` count reduced from 1 to 0 (net -1).
  - **Lint snapshot:** 3 problems (3 errors, 0 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

- **Namespace cleanup:** `src/types/env.d.ts`.
  - **Outcome:** NodeJS ProcessEnv global moved to a type-only module; no runtime behavior changes intended.
  - **Package completed:** `@typescript-eslint/no-namespace` count reduced from 1 to 0 (net -1).
  - **Lint snapshot:** 2 problems (2 errors, 0 warnings).
  - **Validation:** `npm run lint`, `npm run typecheck`, `npm run build`.

### Phase 2 Backlog

#### Runtime `any` backlog packages (grouped by boundary)

- **UI panels:** (none remaining).
  - **Plan:** define props/view models; replace `any` with typed interfaces and derived types. 
  - **Validate:** dialog flows + scheduler panels.

- **Maps/config edge:** (none remaining).
  - **Plan:** define a minimal `PlaceDetails` shape for mock returns. 
  - **Validate:** maps-dependent UI still renders.

#### react-hooks/exhaustive-deps backlog (0 warnings)

## Phase 3 Triage (Build Warnings)

- **Vite devLog chunking warning:** `src/components/ErrorBoundary.tsx` dynamically imports `src/utils/devLog.ts` but the same module is statically imported elsewhere. 
  - **Plan:** pick one import strategy (all static or all dynamic) to avoid mixed chunking; confirm no logging behavior changes. 
  - **Validate:** `npm run build` and inspect chunk report for the warning.

- **Optional: Chunk size warning:** `PlannerDashboard` chunk > 1 MB. 
  - **Plan:** consider code-splitting heavy panels or data transforms. 
  - **Validate:** `npm run build` and check chunk sizes.
