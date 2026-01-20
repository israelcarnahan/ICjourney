# Archive Code to resurrect

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

- **SYMBOL:** LocalityTier
  - **FILE:** [`src/geo/mockGeo.ts`](../../src/geo/mockGeo.ts)
  - **INTENT:** Model proximity tiers for mock distance scoring.
  - **REAL USAGE CHECK:**
    - USED CROSS-FILE?: No.
    - USED INTERNALLY?: Yes (used throughout `mockGeo.ts`).
    - TYPE-ONLY USAGE?: Yes.
    - COMMENT-ONLY REFERENCES?: No.
  - **INTENT DUPLICATION:** None noted; scoped to mock geo scoring.
  - **FUTURE VALUE:** Maybe - could be shared if proximity tiers are reused elsewhere.
  - **HIDDEN COUPLING RISK:** Low.
  - **LOGIC SALVAGE:** De-export to satisfy Knip; if needed later, move to a shared geo types module and re-export.

## ESLint Phase 1 Triage (2026-01-20)

Reports generated on branch `lint-triage`:
- `docs/audits/knip_lint/eslint_report_latest.txt`
- `docs/audits/knip_lint/knip_report_latest.txt`

Knip summary:
- Unused file: `scripts/run-schedule.mjs`
- Unused devDependencies: `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `jscpd`
- Unused exported type: `LocalityTier` in `src/geo/mockGeo.ts`

### After Phase 1 Fixes (2026-01-20)

- Lint after fixes: 89 problems (80 errors, 9 warnings).
- Remaining rule IDs: `@typescript-eslint/no-explicit-any` (79), `react-hooks/exhaustive-deps` (9), `@typescript-eslint/no-namespace` (1).
- FIX rules resolved: `@typescript-eslint/no-unused-vars`, `no-empty`, `prefer-const`, `react-refresh/only-export-components` in `src/context`, and `*.d.ts` overrides.

### ESLint Rule Frequency (Top)

| Rule ID | Count | Hotspots (top 3 files) |
| --- | ---: | --- |
| @typescript-eslint/no-explicit-any | 79 | `src/components/FileUploader.tsx` (10), `src/components/UnscheduledPubsPanel.tsx` (7), `src/utils/sourceDetails.ts` (7) |
| react-hooks/exhaustive-deps | 9 | `src/context/PubDataContext.tsx` (3), `src/api/useBusinessData.ts` (2), `src/components/DedupReviewDialog.tsx` (1) |
| @typescript-eslint/no-namespace | 1 | `src/context/PubDataContext.tsx` (1) |

Hotspot files (top 10 by total findings):
1. `src/components/FileUploader.tsx` (11)
2. `src/components/DedupReviewDialog.tsx` (7)
3. `src/components/UnscheduledPubsPanel.tsx` (7)
4. `src/utils/sourceDetails.ts` (7)
5. `src/api/useBusinessData.ts` (6)
6. `src/components/ScheduleDisplay.tsx` (6)
7. `src/components/RepStatsPanel.tsx` (5)
8. `src/context/PubDataContext.tsx` (5)
9. `src/api/http.ts` (4)
10. `src/pages/PlannerDashboard.tsx` (4)

### Classification Summary (Phase 1)

- FIX (mechanical, no behavior change):
  - `@typescript-eslint/no-unused-vars`
  - `no-empty` (add comments; keep swallow semantics)
  - `prefer-const`
- RELAX (scoped overrides only, with exit plan):
  - `@typescript-eslint/no-explicit-any` in `*.d.ts` only
  - `react-refresh/only-export-components` in `src/context` only
- POSTPONE (behavior-sensitive; backlog):
  - `react-hooks/exhaustive-deps`
  - `@typescript-eslint/no-explicit-any` in runtime code
  - `@typescript-eslint/no-namespace`

### Scoped ESLint Config Edits (Exact Patch Suggestion)

Edit `eslint.config.js`:
```js
export default tseslint.config(
  { ignores: ['_archive/**', 'dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['src/context/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  }
);
```

Exit plan:
- Replace `any` in `*.d.ts` with concrete types once upstream typings are clarified.
- Split non-component exports in `src/context` into a separate module, then re-enable `react-refresh/only-export-components`.

### FIX: Unused Vars/Params (DELETE vs UNDERSCORE)

- DELETE (safe, no behavior change):
  - `src/App.tsx:40` replace `const [_mousePosition, setMousePosition]` with `const [, setMousePosition]` to keep setter only.
  - `src/api/nominatimProvider.ts:11` replace `const [_, open, close]` with `const [, open, close]`.
  - `src/components/RouteMap.tsx:12` drop the unused parameter entirely: `const RouteMap: React.FC<RouteMapProps> = () => { ... }`.
  - `src/pages/PlannerDashboard.tsx:40` replace `const [_unscheduledPubs, setUnscheduledPubs]` with `const [, setUnscheduledPubs]`.
- DELETE (safe, no behavior change; keep call-site evaluation intact):
  - `src/components/DriveTimeBar.tsx:85` keep `_pubIndex` and add `void _pubIndex;` so the call site still evaluates the argument.
  - `src/config/maps.ts:37` keep `_query` and add `void _query;` so the call site still evaluates the argument.
- UNDERSCORE (only if signature must remain):
  - Add a local `// eslint-disable-next-line @typescript-eslint/no-unused-vars` on the parameter line, or use `void param;` with an explanatory comment.
- RELAX in `*.d.ts`:
  - `src/types/shims.d.ts:3` keep `declare namespace google` and `declare const google` (type-only usage); handle via `*.d.ts` override.

### FIX: Empty Blocks (REMOVE vs KEEP+COMMENT)

- KEEP+COMMENT (behavior-preserving swallow):
  - `src/api/nominatimProvider.ts:50` keep `catch {}` and add comment like `// Intentionally ignore network/provider errors; fallback to seed.`.
  - `src/api/postcodesProvider.ts:23` keep `catch {}` with comment (same rationale).
  - `src/components/ErrorBoundary.tsx:33` keep `catch {}` with comment (avoid crashing while logging).
  - `src/utils/sourceDetails.ts:30` keep `catch {}` with comment (defensive parsing).
  - `src/utils/storage.ts:11` keep `catch {}` with comment (localStorage can throw).
  - `src/utils/storage.ts:14` keep `catch {}` with comment (localStorage can throw).

### POSTPONE Backlog (Behavior-Sensitive)

- react-hooks/exhaustive-deps
  - `src/api/useBusinessData.ts:32` (missing `seed`, complex dep): Plan: extract dependency variables, stabilize memoization, verify effect behavior with sample data. Validate: run `npm run typecheck`, `npm run build`, smoke-test data fetch flow.
  - `src/components/DedupReviewDialog.tsx:136` (missing deps): Plan: identify stable callbacks or wrap with `useCallback`, ensure memoization is intentional. Validate: dialog flow, auto-merge, and apply actions.
  - `src/components/FileUploader.tsx:619` (missing deps): Plan: memoize `commitImport`/`processExcelFile`, confirm no infinite re-renders. Validate: upload flow for CSV/XLSX.
  - `src/components/ScheduleDisplay.tsx:466` (missing `openingHours`): Plan: confirm effect should re-run on schedule data changes. Validate: schedule panel render and open hours display.
  - `src/context/PubDataContext.tsx:316` (unstable `initialState` deps), `src/context/PubDataContext.tsx:422` (missing deps): Plan: hoist initial state into `useMemo`, review effects for stale closures. Validate: app init + state persistence.
  - `src/pages/PlannerDashboard.tsx:500` (missing deps): Plan: decide which deps are stable vs intentionally excluded. Validate: planner dashboard data refresh after uploads.
- @typescript-eslint/no-explicit-any (runtime)
  - Plan: replace with explicit types or `unknown` + narrowing once source shapes are documented.
  - Validate: run `npm run typecheck` and targeted feature smoke tests (upload flow, schedule render, API fetch).
- @typescript-eslint/no-namespace
  - `src/context/PubDataContext.tsx:17`: Plan: confirm namespace use is type-only; migrate to ES module types if safe.
  - Validate: typecheck + build; ensure no runtime changes from type re-org.

### Phase 1 Execution Checklist (Ordered)

1) Done: Add scoped ESLint overrides for `*.d.ts` and `src/context` (see patch above).
2) Done: Apply mechanical `no-unused-vars` fixes (delete unused bindings or remove unused params without changing runtime effects).
3) Done: Add intent comments to empty blocks (`no-empty`).
4) Done: Apply `prefer-const` change in `src/components/RepStatsPanel.tsx:344`.
5) Done: Re-run `npm run lint` and confirm only POSTPONE warnings remain.
6) Done: Validate with `npm run typecheck` and `npm run build`.
