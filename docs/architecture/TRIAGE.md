# TRIAGE TASKLIST — IC Journey Planner

This is the **single source-of-truth** for all issues, tasks, and the active execution plan.
There is no separate issue ledger file — all issue detail lives here.

Rules:

- Reference tasks by code (C1, I3, N4, A2) in commits and discussions.
- When a task is completed: move to Completed Archive with resolution date + commit ref + acceptance outcome.
- Update only tasks directly touched by current work — do not churn unrelated entries.
- Do not duplicate task bodies in other docs.
- When a new issue is discovered: add it here with severity, status, and evidence.

---

## Completed Task Archive

### 2026-05-18 — C1: Documentation consolidation

- **Resolution**: Complete.
- **What changed**: Merged `AI_CONTEXT.md` + `CODEX_RULES.md` → `CLAUDE.md`. Absorbed `ISSUES.md` and `PROJECT_SUMMARY.md` into this file. Deleted `docs/architecture/README.md`, `docs/architecture/ISSUES.md`, `docs/architecture/PROJECT_SUMMARY.md`, `AI_CONTEXT.md`, `docs/architecture/CODEX_RULES.md`. Updated `README.md` docs table. Updated `SYSTEM.md` with improvement themes. Added top note to `BRANCH_SUMMARY_feat-api-google-places.md`.
- **Resolved slug**: `documentation-debt-doc-routing` — contributor routing inconsistency resolved by consolidation.
- **Result**: 9 live docs → 4 live docs (`CLAUDE.md`, `SYSTEM.md`, `PRD.md`, `TRIAGE_TASKLIST.md`).

### 2026-02-08 — Documentation system refactor

- Governance rules, issue ledger, triage, SYSTEM, PRD, PROJECT_SUMMARY, README all restructured and cross-linked in this pass.

### 2026-02-01 — ESLint Phase 2 + build warning triage

- ESLint Phase 2 completed — lint findings reduced to zero at that snapshot.
- Build warning triage completed for `devLog` chunking warning.

### 2026-01-20 — ESLint Phase 1

- ESLint Phase 1 completed — mechanical fixes + scoped lint policy choices applied.

---

## 🔴 CRITICAL

---

### C2 — Remove fake data from UnscheduledPubsPanel

- **Issue slug**: New (audit finding — no prior slug)
- **Severity**: High
- **Status**: OPEN
- **Created**: 2026-05-18

**Summary**: `getMockPlaceData()` in `src/utils/mockData.ts` generates fake deterministic ratings, phone numbers, and contact data from the pub name string. This data is rendered live in `UnscheduledPubsPanel` with no indication it is fabricated. Users may trust or act on it.

**Repro**: Load any pubs, view the Unscheduled Pubs panel, inspect phone/rating display.

**Suspected cause**: Mock data was added during early development and never removed or labelled.

**Options**: Remove the rating/contact display entirely from the unscheduled panel; or replace with a clear "data unavailable — open visit to fetch live details" message.

**Goal**: Ensure no fake data is ever presented to users as if it were real. Only real data or clearly labelled placeholders.

**Scope**: `UnscheduledPubsPanel.tsx` display only. Do not change the visit dialog (which fetches real data via provider chain).

**Acceptance criteria**:

1. No fake ratings or phone numbers displayed in the unscheduled panel.
2. If a placeholder is shown, it is unambiguously labelled (e.g. "Open visit for live details").
3. `getMockPlaceData` is either deleted or restricted to explicitly marked dev/test contexts only.

**Checks**:

1. `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
2. `npm run typecheck`
3. `npm run build`
4. Dev smoke: confirm unscheduled panel shows no fake data.

**Dependencies**: None.

**Key files**: [`src/components/UnscheduledPubsPanel.tsx`](../../src/components/UnscheduledPubsPanel.tsx), [`src/utils/mockData.ts`](../../src/utils/mockData.ts)

**Needs validation**: No

---

### C3 — Clean up .env.example

- **Issue slug**: New (audit finding — no prior slug)
- **Severity**: High
- **Status**: OPEN
- **Created**: 2026-05-18

**Summary**: `.env.example` contains three dead/aspirational variables that do not affect any code in main: `VITE_API_BASE_URL`, `VITE_API_VERSION`, `VITE_ENABLE_ANALYTICS`. A new developer could reasonably assume a backend server is required, or spend time investigating analytics instrumentation that does not exist.

**Repro**: Open `.env.example` and cross-reference each variable against the codebase — none of the three are referenced in any source file.

**Suspected cause**: Variables were added speculatively during early setup and never removed.

**Options**: Delete the three dead variables; or retain them with a clear `# ASPIRATIONAL — not yet active` inline comment.

**Goal**: `.env.example` is honest and accurate. Every variable listed either does something now or is unambiguously marked as future/aspirational.

**Scope**: `.env.example` only. No code changes needed.

**Acceptance criteria**:

1. No variable in `.env.example` is silently dead.
2. `VITE_ENABLE_AUTH` remains documented with its current effect.
3. README env table stays in sync with the updated file.

**Checks**: Manual review only — no build/lint impact.

**Dependencies**: None.

**Key files**: [`.env.example`](../../.env.example), [`README.md`](../../README.md)

**Needs validation**: No

---

### C4 — Phase 0: Validate all MITIGATED bugs in browser

- **Issue slugs**: `bug-visit-dialog-update-depth`, `bug-radix-dialog-description`, `data-risk-business-data-404-delay`, `data-risk-from-your-lists-visibility`, `documentation-debt-devtools-form-a11y`
- **Severity**: High
- **Status**: NEEDS VALIDATION
- **Created**: 2026-02-08 | **Last touched**: 2026-02-08

**Summary**: Five items were mitigated in code but never confirmed working in a real browser session. Until confirmed, these are effectively unknown — the mitigations may or may not be working.

**Per-item detail**:

- `bug-visit-dialog-update-depth` — Visit dialog previously risked `Maximum update depth exceeded` errors. Mitigation: stabilised `useBusinessData` dependency key and removed duplicate hook call in `VisitScheduler`. **Suspected cause**: unstable effect dependency + duplicated hook usage. **Repro**: Open visit dialog, watch console for max-depth warning.
- `bug-radix-dialog-description` — Dialogs lacked explicit Radix `Dialog.Description` wiring, risking console warnings. Mitigation: `aria-describedby` or explicit description added. **Repro**: Open modal flows, inspect console for Radix description warnings.
- `data-risk-business-data-404-delay` — External enrichment calls could fail slow/noisy, causing long loading states. Mitigation: fail-fast timeout + immediate seed state added. **Repro**: Open visit dialog with invalid/difficult postcode, watch network tab + loading behaviour.
- `data-risk-from-your-lists-visibility` — Imported fields (landlord, last_visited, visitNotes) were not consistently surfaced in the visit dialog. Mitigation: rendering updated in seed/display mapping. **Repro**: Import a file with landlord/last_visited columns, open a visit, confirm fields appear.
- `documentation-debt-devtools-form-a11y` — DevTools Issues panel reported form input id/name/label warnings. **Repro**: Open visit dialog, inspect DevTools Issues panel for remaining form metadata warnings.

**Goal**: Convert all five from `NEEDS VALIDATION` to either confirmed resolved or reopened with exact evidence.

**Scope**: Browser/DevTools verification only. No architecture changes — observation and status update only.

**Acceptance criteria**:

1. Each item explicitly marked: RESOLVED (with confirmation note) or REOPENED (with exact warning/repro captured).
2. Any reopened items promoted to active tasks with evidence attached.
3. DevTools Issues panel warnings captured for the visit dialog flow.

**Checks**: Dev smoke only — no lint/typecheck/build required for a validation pass. Run checks if any code is changed to fix a reopened item.

**Dependencies**: None.

**Key files**: [`src/api/useBusinessData.ts`](../../src/api/useBusinessData.ts), [`src/components/VisitScheduler.tsx`](../../src/components/VisitScheduler.tsx), [`src/components/FileTypeDialog.tsx`](../../src/components/FileTypeDialog.tsx), [`src/components/PostcodeFixesDialog.tsx`](../../src/components/PostcodeFixesDialog.tsx), [`src/components/PostcodeReviewDialog.tsx`](../../src/components/PostcodeReviewDialog.tsx), [`src/api/http.ts`](../../src/api/http.ts), [`src/config/api.ts`](../../src/config/api.ts)

**Needs validation**: Yes — this entire task is validation

---

### C5 — ESLint "maybe fixed" backlog validation

- **Issue slug**: ESLint Phase 1/2 backlog (see ESLint section below)
- **Severity**: High
- **Status**: NEEDS VALIDATION
- **Created**: 2026-01-20 | **Last touched**: 2026-02-01

**Summary**: ESLint Phase 1 and Phase 2 left several items marked "maybe fixed?" that were never formally confirmed. The backlog items in the ESLint section of this file remain in that limbo state.

**Goal**: Convert every "maybe fixed?" ESLint backlog item to explicitly validated (no action needed) or reopened (add as new task with evidence).

**Scope**: Validation + doc status sync only. Run lint, inspect report, update status. No architecture changes.

**Acceptance criteria**:

1. Every Phase 1/2 backlog item is marked confirmed or reopened with evidence.
2. `docs/audits/knip_lint/eslint_report_latest.txt` regenerated and current.
3. This task's entry updated with outcome.

**Checks**:

1. `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
2. `npm run typecheck`
3. `npm run build`

**Dependencies**: None.

**Key files**: [`docs/audits/knip_lint/eslint_report_latest.txt`](../audits/knip_lint/eslint_report_latest.txt), ESLint backlog section below.

**Needs validation**: Yes — this entire task is validation

---

### C6 — Fix deadline bucket summary bug

- **Issue slug**: `bug-deadline-bucket-conflict`
- **Severity**: High
- **Status**: OPEN
- **Created**: 2026-02-08 | **Last touched**: 2026-02-08

**Summary**: Deadline summary cards can show contradictory bucket counts after deadline edits even when the export output is correct.

**Repro**:

1. Load same dataset.
2. Generate schedule over a longer date range.
3. Change a list deadline to a much earlier date.
4. Compare summary cards vs export output — counts may disagree.

**Suspected cause**: Grouping key mismatch or stale derived state in summary aggregation; the summary aggregation and export derivation paths diverge.

**Options**: Normalise bucket keys; audit memo/effect dependencies in RepStatsPanel; align summary derivation with the export derivation path.

**Goal**: Summary cards and export always agree. Trust in the tool's core output is restored.

**Scope**: Summary aggregation path only. Do not change the export path unless clearly required to fix the mismatch.

**Acceptance criteria**:

1. Single bucket per label/date; card counts match export output.
2. Counts update deterministically after deadline edits with no stale state.
3. No regression in export output.

**Checks**:

1. `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
2. `npm run typecheck`
3. `npm run build`
4. Dev smoke: change a deadline date, compare summary cards vs downloaded export.

**Dependencies**: C4 + C5 complete (Phase 0 baseline confirmed before further correctness work).

**Key files**: [`src/components/RepStatsPanel.tsx`](../../src/components/RepStatsPanel.tsx), [`src/utils/sourceDetails.ts`](../../src/utils/sourceDetails.ts)

**Needs validation**: No

---

### C7 — Confirm / fix schedule determinism

- **Issue slug**: `bug-schedule-determinism`
- **Severity**: High
- **Status**: OPEN
- **Created**: 2026-02-08 | **Last touched**: 2026-02-08

**Summary**: Scheduling output order is not guaranteed deterministic — the same inputs and settings may yield different visit ordering across runs. This increases debugging cost and erodes user trust.

**Repro**: Run `planVisits()` with the same Excel input and settings on two consecutive runs; diff the output order.

**Suspected cause**: Tie-breaking and heuristic ordering paths are not fully normalised — when two pubs score equally, insertion order or floating-point variance can differ.

**Options**: Add deterministic tie-break keys (e.g. stable UUID sort as final tiebreaker); write fixed fixtures for regression comparison; add debug trace assertions.

**Goal**: Same inputs + same settings always produce identical schedule output.

**Scope**: `scheduleUtils.ts` tie-breaking logic. Fixture scripts in `scripts/`.

**Acceptance criteria**:

1. Running identical inputs twice produces byte-identical output ordering.
2. At least one fixture test (see I1) validates this contract.
3. No change to scheduling semantics — only tie-break normalisation.

**Checks**:

1. `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
2. `npm run typecheck`
3. `npm run build`
4. Run fixture twice and diff output.

**Dependencies**: C4 + C5 complete. I1 (scheduling fixture) can be developed in parallel or immediately after.

**Key files**: [`src/utils/scheduleUtils.ts`](../../src/utils/scheduleUtils.ts)

**Needs validation**: Yes — confirm whether it is actually non-deterministic before fixing

---

## 🟡 IMPORTANT

---

### I1 — Add first scheduling fixture / regression test

- **Issue slugs**: `testing-gap-no-automated-suite`, `testing-gap-deterministic-fixtures`
- **Severity**: High / Medium
- **Status**: OPEN
- **Created**: 2026-02-08 | **Last touched**: 2026-02-08

**Summary**: There are no automated tests of any kind. The core scheduling algorithm (`planVisits`) has no fixture corpus — correctness and determinism rely entirely on manual spot-checking.

**Repro / Evidence**: Absence of any test files in the repo.

**Suspected cause**: Manual-validation-first development approach.

**Options**: Start with a minimal Node script in `scripts/` that runs `planVisits()` against a fixed input and asserts expected output order. Extend to cover edge cases (deadline violations, locality fallback, empty inputs) over time.

**Goal**: Establish a baseline that makes regression visible — at minimum for determinism (C7) and deadline constraint behaviour.

**Scope**: Scheduling fixture script only. Do not introduce a full test framework yet (that is A5).

**Acceptance criteria**:

1. At least one fixture: fixed input pubs → `planVisits()` → asserts expected day/order output.
2. Script runnable via `node scripts/` or added as an npm script.
3. Fixture covers the determinism contract (same input → same output on two runs).
4. Documented in README scripts table.

**Checks**:

1. `npm run typecheck`
2. `npm run build`
3. Run fixture script and confirm it passes + is repeatable.

**Dependencies**: C7 (determinism fix should precede fixture to avoid asserting non-deterministic output).

**Key files**: [`src/utils/scheduleUtils.ts`](../../src/utils/scheduleUtils.ts), new file in [`scripts/`](../../scripts/)

**Needs validation**: No

---

### I2 — Document scripts/ and testFiles/ in README

- **Issue slug**: New (audit finding)
- **Severity**: Low
- **Status**: OPEN
- **Created**: 2026-05-18

**Summary**: `scripts/audit-dates.mjs` and `scripts/run-schedule.mjs` appear in `package.json` scripts but are not documented anywhere. `testFiles/` contains manual test Excel files with no explanation of what each file tests.

**Goal**: A returning developer or AI assistant can understand what each script does and which Excel file to use for which test scenario, without reading the source.

**Scope**: README additions only. No code changes.

**Acceptance criteria**:

1. README scripts table includes `audit:dates` and `schedule:run` with a one-line description of what each does.
2. README or inline comment notes what `testFiles/` contains and how to use the files.

**Checks**: None required (docs only).

**Dependencies**: None.

**Key files**: [`README.md`](../../README.md), [`scripts/`](../../scripts/), [`testFiles/`](../../testFiles/)

**Needs validation**: No

---

### I3 — Confirm and document mock vs real boundary + map abstraction ownership

- **Issue slugs**: `legacy-mock-real-boundary`, `structural-debt-map-abstractions`
- **Severity**: High / Medium
- **Status**: OPEN
- **Created**: 2026-02-08 | **Last touched**: 2026-02-08

**Summary**: The main branch mixes real external lookups (postcodes.io, Nominatim) with placeholder/mock services (`src/config/maps.ts`, `src/geo/mockGeo.ts`). The boundary is not explicit in code — a reader or future AI can easily mistake a mock for a real integration. Additionally, multiple map-related abstractions exist with unclear ownership: the placeholder `MapsService` in main, the paused Google Places provider in the branch, and the mock geo distance logic.

**Repro**: Trace the provider chain in `useBusinessData.ts` alongside `maps.ts` and `mockGeo.ts` — the real/mock boundary is not labelled at each call site.

**Suspected cause**: Transitional architecture across branches; real providers were added incrementally without explicitly marking the remaining mocks.

**Options**: Add explicit `// MOCK — returns hardcoded data` header comments to `maps.ts` and `mockGeo.ts`; add a "Data Source Reality Matrix" note to each file pointing to `SYSTEM.md`; define one authoritative provider contract per integration state (real / mock / paused).

**Goal**: Any reader of `maps.ts` or `mockGeo.ts` immediately knows it is mock, what it returns, and where the real replacement lives.

**Scope**: Inline comments and `SYSTEM.md` update only. No behaviour changes.

**Acceptance criteria**:

1. `src/config/maps.ts` has a clear top-of-file `// MOCK` header with description.
2. `src/geo/mockGeo.ts` has a clear top-of-file `// MOCK` header noting it is postcode-heuristic, not GPS.
3. `SYSTEM.md` Data Source Reality Matrix reflects the current state accurately.
4. Map abstraction ownership is explicitly documented: which abstraction is authoritative in main, which is paused/branch-only.

**Checks**:

1. `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
2. `npm run typecheck`
3. `npm run build`

**Dependencies**: None.

**Key files**: [`src/config/maps.ts`](../../src/config/maps.ts), [`src/geo/mockGeo.ts`](../../src/geo/mockGeo.ts), [`src/api/postcodesProvider.ts`](../../src/api/postcodesProvider.ts), [`src/api/nominatimProvider.ts`](../../src/api/nominatimProvider.ts), [`docs/architecture/SYSTEM.md`](./SYSTEM.md)

**Needs validation**: No

---

### I4 — Fix encoding artifacts in UI/docs strings

- **Issue slug**: `bug-encoding-corruption-ui`
- **Severity**: Medium
- **Status**: OPEN
- **Created**: 2026-02-08 | **Last touched**: 2026-02-08

**Summary**: Several docs and rendered UI strings contain mojibake/encoding artifacts that reduce readability. Observed in docs and rendered text snippets during prior review.

**Repro / Evidence**: Observed in docs and rendered text during the 2026-02-08 review pass. Exact affected strings require a fresh scan.

**Suspected cause**: Mixed encoding handling across edits (likely UTF-8 vs Windows-1252 collision on copy-paste).

**Options**: Normalise file encoding to UTF-8 across all source and doc files; targeted string cleanup of identified artifacts.

**Goal**: No visible encoding artifacts in key UI text or docs.

**Scope**: String/encoding cleanup only — no logic changes.

**Acceptance criteria**:

1. No mojibake visible in UI during normal use.
2. No encoding artifacts in docs (scan at least SYSTEM.md, PRD.md, this file).
3. File encoding consistent (UTF-8 without BOM).

**Checks**:

1. `npm run build`
2. Dev smoke: visually scan key UI text.

**Dependencies**: None.

**Key files**: Cross-cutting — docs + [`src/components/`](../../src/components/)

**Needs validation**: Yes — exact affected strings need a fresh scan before fixing

---

### I5 — Cache invalidation policy for useBusinessData

- **Issue slug**: `data-risk-cache-divergence`
- **Severity**: Medium
- **Status**: OPEN
- **Created**: 2026-02-08 | **Last touched**: 2026-02-08

**Summary**: The in-memory business data cache in `useBusinessData.ts` (a `Map<string, BusinessData>`) lives for the full session and is never cleared. If a pub's postcode or name is edited after its business data has been cached, the cache will serve stale data until page reload — potentially showing old enrichment details for an updated record.

**Repro / Evidence**: Edit a pub's postcode after opening its visit dialog; re-open the dialog in the same session — cached enrichment data will still reflect the old postcode.

**Suspected cause**: No cache invalidation contract tied to persistence/edit events — cache was designed for performance without a reset hook.

**Options**: Clear cache entry on pub edit (intercept in PubDataContext edit handlers); add a manual "refresh" button in the visit dialog; document the limit explicitly and accept reload-to-refresh as the behaviour for now.

**Goal**: Either implement cache invalidation on edit, or explicitly document the current cache behaviour with a user-visible "refresh" affordance.

**Scope**: `useBusinessData.ts` cache policy. No provider chain changes.

**Acceptance criteria**:

1. Editing a pub's postcode causes the cache entry to invalidate (or the user is informed to refresh).
2. Cache behaviour is explicitly commented in `useBusinessData.ts`.
3. No regression in normal visit dialog performance.

**Checks**:

1. `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
2. `npm run typecheck`
3. `npm run build`
4. Dev smoke: edit postcode, re-open visit dialog, confirm enrichment reflects new postcode.

**Dependencies**: None.

**Key files**: [`src/api/useBusinessData.ts`](../../src/api/useBusinessData.ts), [`src/services/persistence.ts`](../../src/services/persistence.ts), [`src/context/PubDataContext.tsx`](../../src/context/PubDataContext.tsx)

**Needs validation**: Yes — confirm the divergence scenario is reproducible first

---

### I6 — PRD/SYSTEM staleness review + deadline semantics + locality tradeoff

- **Issue slugs**: `documentation-debt-system-prd-sync`, `documentation-debt-unproven-contradictions`, `semantic-deadline-constraint-interpretation`, `semantic-constraints-vs-locality`
- **Severity**: Low / Medium
- **Status**: OPEN / UNKNOWN
- **Created**: 2026-02-08 | **Last touched**: 2026-02-08

**Summary**: `SYSTEM.md` and `PRD.md` were last formally verified on 2026-02-08. Commits through March 2026 may have introduced gaps. Additionally, two semantic ambiguities are unresolved: deadline constraint edge cases (what happens when today is the deadline? when two pubs share one?) and the priority-vs-locality tradeoff (when should a close-but-low-priority pub beat a far-but-high-priority one?).

**Repro / Evidence**: Compare commit history since 2026-02-08 against SYSTEM.md claims. Test scheduler edge cases against PRD.md stated semantics.

**Suspected cause**: Behaviour changes not always reflected in paired docs; semantic decisions made implicitly in code without written policy.

**Options**: Line-by-line review of both docs vs current code; annotate gaps with `NEEDS VALIDATION`; write explicit one-paragraph policy decisions for the two semantic ambiguities in PRD.md.

**Goal**: Both docs are accurate or explicitly annotated where uncertain. The two semantic ambiguities become explicit documented decisions.

**Scope**: Read-and-annotate pass on `SYSTEM.md` and `PRD.md`. Code changes only if a clear contradiction is confirmed.

**Acceptance criteria**:

1. Any stale SYSTEM.md claim is either corrected or marked `NEEDS VALIDATION`.
2. PRD.md has an explicit statement on deadline edge cases (same-day, tied deadlines).
3. PRD.md has an explicit precedence statement: when locality yields to deadline/priority.
4. No unverified rewrites — only confirmed changes or explicit `NEEDS VALIDATION` annotations.

**Checks**: No lint/build required (docs only unless code is touched).

**Dependencies**: None.

**Key files**: [`docs/architecture/SYSTEM.md`](./SYSTEM.md), [`docs/architecture/PRD.md`](./PRD.md), [`src/utils/scheduleUtils.ts`](../../src/utils/scheduleUtils.ts)

**Needs validation**: Yes — requires a fresh code-vs-doc comparison pass

---

### I7 — Resolve VehicleSelector inconsistency

- **Issue slug**: New (audit finding)
- **Severity**: Low
- **Status**: OPEN
- **Created**: 2026-05-18

**Summary**: `VehicleSelector` is commented out in `PlannerDashboard.tsx` with a note "unused for now; retained for planned review/cleanup" — but it is actively imported and rendered in `GenerateControls.tsx`, which means it IS in the live UI. The comment is misleading and the component's intended status is ambiguous.

**Repro**: Search for `VehicleSelector` across the codebase — two contradictory references exist simultaneously.

**Goal**: One clear decision: VehicleSelector is in the UI intentionally, or it is not. Remove the misleading comment or remove the active render.

**Scope**: One comment removal or one import/render removal. No logic changes.

**Acceptance criteria**:

1. `VehicleSelector` has a single clear status in the codebase.
2. The misleading comment in `PlannerDashboard.tsx` is either removed or corrected.

**Checks**:

1. `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
2. `npm run typecheck`
3. `npm run build`

**Dependencies**: None.

**Key files**: [`src/pages/PlannerDashboard.tsx`](../../src/pages/PlannerDashboard.tsx), [`src/components/planner/GenerateControls.tsx`](../../src/components/planner/GenerateControls.tsx), [`src/components/VehicleSelector.tsx`](../../src/components/VehicleSelector.tsx)

**Needs validation**: No

---

### I8 — Harden lineage merge data integrity

- **Issue slug**: `data-risk-provenance-merge-loss`
- **Severity**: High
- **Status**: OPEN
- **Created**: 2026-02-08 | **Last touched**: 2026-02-08

**Summary**: The dedupe/merge flow may silently drop or overwrite provenance-sensitive fields (landlord, last_visited, visitNotes, mapped extras) when two records for the same pub are merged. No fixture coverage exists to catch regressions.

**Repro**: Import two files with overlapping pub records; one with landlord/last_visited populated, one without. Merge via dedupe dialog. Inspect the merged record for field preservation.

**Suspected cause**: Merge heuristics and source-field precedence logic in `lineageMerge.ts` may prioritise one source's fields without preserving the other's non-empty values for non-conflicting fields.

**Options**: Add fixture-based lineage assertions (import two overlapping records → merge → assert all non-conflicting fields preserved); implement non-destructive merge check that logs any field being dropped.

**Goal**: Confidence that no user data is silently lost during the dedup/merge flow.

**Scope**: `lineageMerge.ts` merge path + `DedupReviewDialog` output. Add assertions/fixtures. No UI changes required.

**Acceptance criteria**:

1. Lineage merge with overlapping non-conflicting fields preserves all populated values.
2. At least one fixture or manual test documents the merge behaviour for key fields (landlord, last_visited, visitNotes, extras).
3. Any field genuinely overwritten during merge is explicit (logged or documented as intended behaviour).

**Checks**:

1. `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
2. `npm run typecheck`
3. `npm run build`
4. Dev smoke: import overlap scenario, confirm fields are preserved post-merge.

**Dependencies**: None (independent of C6/C7 correctness work).

**Key files**: [`src/utils/lineageMerge.ts`](../../src/utils/lineageMerge.ts), [`src/components/DedupReviewDialog.tsx`](../../src/components/DedupReviewDialog.tsx)

**Needs validation**: Yes — confirm the data loss scenario is reproducible before fixing

---

### I9 — Fix replacement/regenerate ordering edges

- **Issue slug**: `bug-replacement-ordering-edges`
- **Severity**: Medium
- **Status**: OPEN
- **Created**: 2026-02-08 | **Last touched**: 2026-02-08

**Summary**: Replacing or regenerating a visit can produce surprising shifts in the surrounding schedule order. The expected ordering contract after a replace/regenerate is not documented, making it hard to distinguish a bug from intended behaviour.

**Repro**: Schedule a day with multiple visits. Replace one visit (using the replace action in ScheduleDisplay). Compare the order of remaining visits before and after — unexpected shuffles may occur.

**Suspected cause**: Recomputation and sorting interactions in the schedule update flow — after a replacement, the full schedule may be re-sorted rather than only the affected slot being updated.

**Options**: Define an explicit ordering contract for post-replacement state; add regression fixtures for replacement scenarios; fix ordering if it violates the documented contract.

**Goal**: Replacement and regeneration preserve documented ordering semantics. User knows what to expect.

**Scope**: Replace/regenerate flow in ScheduleDisplay + relevant scheduling helpers. Document the contract first, then fix if violated.

**Acceptance criteria**:

1. Documented expected ordering after replace/regenerate (in PRD.md or inline comment).
2. Actual behaviour matches the documented contract.
3. At least one fixture covers a replace scenario.

**Checks**:

1. `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
2. `npm run typecheck`
3. `npm run build`
4. Dev smoke: replace visits, compare order before and after.

**Dependencies**: C7 (determinism fix) should precede this — non-determinism can mask replacement ordering issues.

**Key files**: [`src/components/ScheduleDisplay.tsx`](../../src/components/ScheduleDisplay.tsx), [`src/utils/scheduleUtils.ts`](../../src/utils/scheduleUtils.ts)

**Needs validation**: Yes — confirm the ordering shift is reproducible and unintended

---

### I10 — Confirm driver label source authority

- **Issue slug**: `semantic-driver-source-truth`
- **Severity**: Medium
- **Status**: OPEN
- **Created**: 2026-02-08 | **Last touched**: 2026-02-08

**Summary**: The scheduling driver label (e.g. "deadline", "priority", "follow-up") shown in list chips, stats panel, and export may be derived from different paths — `sourceDetails.ts` and `RepStatsPanel.tsx` each have their own derivation logic. If these diverge, a pub could be labelled differently across the UI.

**Repro**: Import a mixed dataset (deadline + priority pubs). Compare the driver label shown on the schedule card vs the label in the RepStatsPanel vs the label in the export.

**Suspected cause**: Multiple label derivation points without a single canonical authority — lineage/effective-plan transition added complexity without fully unifying the label path.

**Options**: Codify one canonical `getDriverLabel()` utility in `sourceDetails.ts`; update all label references to use it.

**Goal**: Consistent driver labels across schedule cards, stats, and export.

**Scope**: Label derivation utility + all call sites. No scheduling logic changes.

**Acceptance criteria**:

1. Single canonical label derivation function used by all display surfaces.
2. Labels in schedule view, RepStatsPanel, and export file agree for the same pub.

**Checks**:

1. `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
2. `npm run typecheck`
3. `npm run build`
4. Dev smoke: compare labels across schedule/stats/export with a mixed dataset.

**Dependencies**: None.

**Key files**: [`src/utils/sourceDetails.ts`](../../src/utils/sourceDetails.ts), [`src/components/RepStatsPanel.tsx`](../../src/components/RepStatsPanel.tsx)

**Needs validation**: Yes — confirm label divergence is actually happening before refactoring

---

### I11 — Fix RouteMap.tsx placeholder UI

- **Issue slug**: New (audit finding)
- **Severity**: Medium
- **Status**: OPEN
- **Created**: 2026-05-18

**Summary**: `RouteMap.tsx` renders a grey box with the text "Map visualization coming soon." It is actively imported and rendered in `ScheduleDisplay.tsx` — this placeholder is live-visible to users with no context on what it is or when/if it will work.

**Goal**: Replace the grey placeholder with something honest and useful — e.g. a message that explains the limitation and offers an alternative action (export postcodes to use in Google Maps manually).

**Scope**: `RouteMap.tsx` display only. Do not archive it — it has a live render path. No backend or maps work required.

**Acceptance criteria**:

1. No user-visible "coming soon" text without context.
2. Replacement communicates what the user can do instead (export → Google Maps).
3. Component remains in place for when real map integration lands (N5).

**Checks**:

1. `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
2. `npm run typecheck`
3. `npm run build`
4. Dev smoke: confirm replacement renders correctly in schedule view.

**Dependencies**: None.

**Key files**: [`src/components/RouteMap.tsx`](../../src/components/RouteMap.tsx), [`src/components/ScheduleDisplay.tsx`](../../src/components/ScheduleDisplay.tsx)

**Needs validation**: No

---

## 🟢 NICE TO HAVE

---

### N1 — Input validation audit

- **Issue slug**: `security-risk-input-validation`
- **Severity**: Medium
- **Status**: OPEN
- **Created**: 2026-02-08 | **Last touched**: 2026-02-08

**Summary**: Validation exists on file upload but a comprehensive adversarial audit has not been completed. No formal validation matrix or malicious-input test set exists.

**Suspected cause**: Feature-correctness-first development; abuse cases not yet formally considered.

**Goal**: Document what validation currently exists and identify any paths where malformed or adversarial input could crash or corrupt data.

**Scope**: Read and audit existing validation in FileUploader and normalise utilities. Document findings. Fix only critical gaps found.

**Acceptance criteria**:

1. A validation matrix exists (even as inline comments) covering: missing required columns, malformed postcodes, excessively large files, non-xlsx uploads.
2. Any critical gap that causes silent data corruption is fixed.

**Checks**: Lint/typecheck/build if code is changed.

**Key files**: [`src/components/FileUploader.tsx`](../../src/components/FileUploader.tsx), [`src/utils/normalizeFile.ts`](../../src/utils/normalizeFile.ts), [`src/utils/postcodeUtils.ts`](../../src/utils/postcodeUtils.ts)

**Needs validation**: Yes

---

### N2 — Clone hotspot cleanup (postcode dialogs)

- **Issue slug**: `structural-debt-clone-hotspots`
- **Severity**: Low
- **Status**: OPEN
- **Created**: 2026-02-08 | **Last touched**: 2026-02-08

**Summary**: `PostcodeFixesDialog.tsx` and `PostcodeReviewDialog.tsx` share significant duplicated logic, identified in JSCPD reporting. Additional utility-level clones exist.

**Suspected cause**: Copy-forward iteration under delivery pressure.

**Goal**: Targeted dedup of the postcode dialog pair. Shared logic extracted to a utility or shared component.

**Scope**: Postcode dialog pair only. Do not expand scope to other clone hotspots in this pass.

**Acceptance criteria**:

1. Shared logic between the two dialogs extracted to a shared utility/component.
2. Behaviour of both dialogs unchanged.

**Checks**: Lint/typecheck/build + dev smoke on both postcode flows.

**Key files**: [`src/components/PostcodeFixesDialog.tsx`](../../src/components/PostcodeFixesDialog.tsx), [`src/components/PostcodeReviewDialog.tsx`](../../src/components/PostcodeReviewDialog.tsx), [`docs/audits/JSCPD/html/`](../audits/JSCPD/html/)

**Needs validation**: No

---

### N3 — Follow-up-by-date scheduling

- **Issue slugs**: `semantic-followup-definition-gap`, `legacy-followup-gated`
- **Severity**: Medium / Low
- **Status**: OPEN (deferred by design)
- **Created**: 2026-02-08 | **Last touched**: 2026-02-08

**Summary**: Follow-up scheduling (visits driven by `last_visited` + a day offset) is intentionally gated. The design exists in `docs/architecture/followup-by-date.md` but the feature is blocked on reliable `last_visited` parsing and a defined ambiguity policy.

**Re-enable criteria** (from deferred design doc):

1. Parser utility with explicit format rules (US, UK, Excel serial, ambiguous/missing handling).
2. `followUpDueDate` computed per pub at import time.
3. Follow-up due buckets added to pressure/urgency model alongside deadlines.
4. Debug outputs for invalid or missing `last_visited`.

**Key files**: [`docs/architecture/followup-by-date.md`](./followup-by-date.md), [`src/components/FileTypeDialog.tsx`](../../src/components/FileTypeDialog.tsx), [`src/utils/scheduleUtils.ts`](../../src/utils/scheduleUtils.ts)

**Needs validation**: No (deferred — needs re-enable criteria met first)

---

### N4 — Backend persistence (Supabase)

- **Issue slugs**: `data-risk-local-persistence-limits` (interim mitigation absorbed here)
- **Severity**: Medium (persistence limits) / High (long-term need)
- **Status**: OPEN
- **Created**: 2026-02-08 (persistence risk) / 2026-05-18 (backend scope)

**Summary**: All data is currently stored in browser localStorage only (~5 MB quota). Clearing the browser wipes all user data. There is no recovery path. The full backend scope includes: user accounts/login (Supabase), server-side storage for masterfile and priority data, pre-loaded territories on login, user-adjustable priorities. Eventual home for KPI/visit-by deadline lists too.

**Interim mitigation** (do before full backend): Add a visible export-before-clearing reminder in the UI and document the localStorage quota limit clearly. This reduces the data-loss risk at low effort.

**Full scope**:

- User auth (Supabase or equivalent)
- Per-user storage of masterfile, priority data, territory mappings
- Pre-loaded data on login; user can adjust
- Google Places API key managed server-side (eliminates `security-risk-client-side-keys` — see N6)
- Future: KPI/visit-by deadline lists also in backend

**Acceptance criteria (interim)**:

1. UI has a visible "Export your data before clearing browser storage" reminder.
2. localStorage quota limit documented in README.

**Acceptance criteria (full)**:

1. Users can log in and have data pre-loaded.
2. Data persists across devices and browser clears.
3. Google Places API key never exposed client-side.

**Key files**: [`src/services/persistence.ts`](../../src/services/persistence.ts), [`src/context/PubDataContext.tsx`](../../src/context/PubDataContext.tsx), [`src/context/AuthContext.tsx`](../../src/context/AuthContext.tsx), [`src/context/LoginGate.tsx`](../../src/context/LoginGate.tsx)

**Needs validation**: No

---

### N5 — Real maps/routing integration

- **Issue slug**: `structural-debt-map-abstractions` (resolution path)
- **Severity**: High (long-term)
- **Status**: OPEN (deferred)
- **Created**: 2026-02-08

**Summary**: All distance calculations use `src/geo/mockGeo.ts` — postcode-based heuristics, not real GPS routing. `src/config/maps.ts` is a mock geocoder returning hardcoded data. Real routing requires a backend and a maps API (Google Maps, Mapbox, or similar).

**Dependencies**: N4 (backend) is a prerequisite — API keys must be server-side.

**Key files**: [`src/geo/mockGeo.ts`](../../src/geo/mockGeo.ts), [`src/config/maps.ts`](../../src/config/maps.ts), [`_archive/src/hooks/useMapsService.ts`](../../_archive/src/hooks/useMapsService.ts), [`_archive/src/utils/googleMaps.ts`](../../_archive/src/utils/googleMaps.ts)

**Needs validation**: No (deferred — backend prerequisite)

---

### N6 — Google Places API enrichment

- **Issue slugs**: `legacy-google-places-paused`, `security-risk-client-side-keys`
- **Severity**: Medium
- **Status**: OPEN (branch paused)
- **Created**: 2026-02-08

**Summary**: Branch `feat/api-google-places` implements the Google Places provider and Vite dev proxy. The branch is functional but the proxy only works in dev mode — production requires a real backend API endpoint. `GOOGLE_PLACES_KEY` must never be exposed client-side.

**Security note**: Do not activate the Vite proxy or expose `GOOGLE_PLACES_KEY` in any client bundle. The key must be handled server-side only (resolved by N4 backend).

**Dependencies**: N4 (backend) is a hard prerequisite before this branch can merge.

**Resume checklist** (from branch summary):

1. Create production API endpoints to replace Vite proxy.
2. Parse Google's opening hours text into structured `OpeningHours` type.
3. Add rate limiting.
4. Add unit tests for `GooglePlacesProvider`.
5. Add UI provenance indicators for Google-sourced data.

**Key files**: `feat/api-google-places` branch, [`docs/architecture/BRANCH_SUMMARY_feat-api-google-places.md`](../../_archive/BRANCH_SUMMARY_feat-api-google-places.md)

**Needs validation**: No (deferred — backend prerequisite)

---

### N7 — Decompose large orchestrator components

- **Issue slug**: `structural-debt-large-orchestrators`
- **Severity**: Medium
- **Status**: OPEN
- **Created**: 2026-02-08

**Summary**: `PlannerDashboard.tsx` and `ScheduleDisplay.tsx` are high-complexity single files with mixed responsibilities. Change risk and cognitive load are both elevated.

**Suspected cause**: Feature growth without full decomposition — incremental additions to the same file under delivery pressure.

**Goal**: Incrementally extract feature modules and view-model helpers. Reduce component responsibility without changing behaviour.

**Scope**: One component at a time. Start with the most isolated responsibility in each. Behaviour must be identical before and after.

**Acceptance criteria**:

1. At least one clean extraction from each orchestrator into a focused sub-module.
2. No behaviour regressions.

**Checks**: Lint/typecheck/build + full dev smoke of affected flows.

**Key files**: [`src/pages/PlannerDashboard.tsx`](../../src/pages/PlannerDashboard.tsx), [`src/components/ScheduleDisplay.tsx`](../../src/components/ScheduleDisplay.tsx)

**Needs validation**: No

---

### N8 — Code-split PlannerDashboard chunk

- **Issue slug**: ESLint Phase 3 build warning
- **Severity**: Low
- **Status**: OPEN
- **Created**: 2026-01-20

**Summary**: `PlannerDashboard` chunk exceeds 1 MB at build time. This increases initial load time on slow connections.

**Suspected cause**: Large orchestrator with many heavy dependencies bundled together (see N7).

**Options**: Lazy-load heavy sub-panels; extract data transforms to a separate chunk; investigate which imports dominate the chunk size.

**Goal**: Reduce PlannerDashboard chunk to below the warning threshold without behaviour changes.

**Acceptance criteria**:

1. `npm run build` reports no chunk size warning for PlannerDashboard.
2. No behaviour regressions.

**Checks**: Lint/typecheck/build + bundle output review.

**Dependencies**: N7 (decomposition) may naturally reduce chunk size as a side effect — consider doing N7 first.

**Key files**: [`src/pages/PlannerDashboard.tsx`](../../src/pages/PlannerDashboard.tsx), [`vite.config.ts`](../../vite.config.ts)

**Needs validation**: No

---

### N9 — New company priority code system

- **Issue slug**: New (product requirement — 2026-05-18)
- **Severity**: High (product requirement, no current users to break)
- **Status**: OPEN — requires design pass before coding
- **Created**: 2026-05-18

**Summary**: The company's Excel data now uses string priority codes per site instead of the old numeric 1–3 priority level. The new codes are:

| Tier             | Codes                        | Notes                                 |
| ---------------- | ---------------------------- | ------------------------------------- |
| Grow (highest)   | G1, G2, G3, G4               | Core priority accounts                |
| Keep             | K1, K2, K3, K4               | Second tier                           |
| Prospect         | P1, P2, P3, P4, P5           | Third tier                            |
| Managed Grow     | M_G1, M_G2, M_G3, M_G4       | Excluded by default — opt-in per week |
| Managed Prospect | M_P1, M_P2, M_P3, M_P4, M_P5 | Excluded by default — opt-in per week |

Codes are attached **per site** in the masterfile (not per list). The user can still import their own personal priority lists and choose whether those rank as ultimate highest priority or slot into the tier ordering. Deadline and follow-up logic remain unchanged and override all priority tiers. M\_ accounts are excluded from schedule generation by default and shown as an opt-in toggle ("management wants me to visit these this week").

**Required design pass before coding** (agree these decisions before writing a line):

1. Internal priority weight table: what numeric score maps to G1 vs K1 vs P1 (e.g. G1=100, G2=95... K1=80... P1=60... M\_=excluded/0)?
2. M* account toggle UX: where does the user opt M* accounts in for a given week?
3. User-list priority interaction: if user uploads their own list and marks it "ultimate highest priority", how does it interact with G1 accounts from the masterfile?
4. Column mapping: new `priority_code` column — how does the fuzzy matcher recognise it?
5. Stats panel: how do tier groups (Grow/Keep/Prospect/Managed) appear alongside existing deadline buckets?
6. Old numeric 1–3: folded into user-list priority only (user can assign priority 1–3 to their own imported list). No migration needed (no current users).

**Scope**: Large — touches column mapping, data model, scheduling algorithm, UI display, stats, export.

**Acceptance criteria** (post-design, pre-coding):

1. Design decisions above are documented and agreed.
2. `Pub` type updated with `priorityCode?: string` field.
3. Column mapping wizard recognises `priority_code` column.
4. Scheduler assigns correct internal weight per code.
5. M\_ accounts excluded by default; toggle to include for a given week.
6. User-list priority (numeric 1–3) still available for personally imported lists.
7. Labels display new codes (G1, K2, etc.) in schedule, stats, and export.

**Checks**: Full lint/typecheck/build + dev smoke across import → schedule → export flow.

**Dependencies**: All Critical and Important tasks should be complete first — this is a large rework and adding it on top of open bugs increases risk.

**Key files**: [`src/components/ColumnMappingWizard.tsx`](../../src/components/ColumnMappingWizard.tsx), [`src/context/PubDataContext.tsx`](../../src/context/PubDataContext.tsx), [`src/utils/scheduleUtils.ts`](../../src/utils/scheduleUtils.ts), [`src/components/FileTypeDialog.tsx`](../../src/components/FileTypeDialog.tsx), [`src/components/RepStatsPanel.tsx`](../../src/components/RepStatsPanel.tsx), [`src/utils/columnSynonyms.ts`](../../src/utils/columnSynonyms.ts)

**Needs validation**: No — design pass required first

---

## 📦 ARCHIVE / DEFER

---

### A1 — Scheduling logic deduplication

- **Issue slug**: `structural-debt-scheduling-duplication`
- **Severity**: High
- **Status**: OPEN — deferred
- **Rationale**: Similar scheduling heuristics appear in `scheduleUtils.ts`, `ScheduleDisplay.tsx`, and export-related paths. Consolidating before the priority code system (N9) is built risks merging moving parts. Defer until N9 is stable.
- **Dependencies**: N9 complete and stable.
- **Key files**: [`src/utils/scheduleUtils.ts`](../../src/utils/scheduleUtils.ts), [`src/components/ScheduleDisplay.tsx`](../../src/components/ScheduleDisplay.tsx)

---

### A2 — Legacy field deprecation plan

- **Issue slugs**: `legacy-deprecation-path-unclear`, `structural-debt-legacy-field-overlap`
- **Severity**: Low / Medium
- **Status**: OPEN — deferred
- **Rationale**: `zip` (legacy) vs `postcodeMeta.normalized` (authoritative), and old scheduling fields in transitional models, remain without formal retirement milestones. No current users to break. Clean up after N9 settles the data model.
- **Dependencies**: N9 (new data model decisions may affect what gets deprecated).
- **Key files**: [`src/context/PubDataContext.tsx`](../../src/context/PubDataContext.tsx), [`src/utils/scheduleMappers.ts`](../../src/utils/scheduleMappers.ts), [`src/utils/seedFromPub.ts`](../../src/utils/seedFromPub.ts)

---

### A3 — XSS/injection formal audit

- **Issue slug**: `security-risk-no-xss-audit`
- **Severity**: Medium
- **Status**: OPEN — deferred
- **Rationale**: React's default JSX escaping covers most XSS vectors. No formal audit record exists but risk is low for a client-only app with no user-generated content rendered as HTML. Defer until approaching public/shared deployment.
- **Key files**: [`docs/audits/`](../), [`src/components/`](../../src/components/)

---

### A4 — Archived components resurrection

- **Issue slug**: ESLint Archived Files backlog
- **Severity**: Low
- **Status**: OPEN — deferred
- **Rationale**: Archived files are preserved intentionally, not dead. Do not modify `_archive/src/` without explicit resurrection scope. See ESLint Archived Files section below for per-file intent and salvage notes.
- **Key files**: [`_archive/src/`](../../_archive/src/)

---

### A5 — Full automated E2E / integration test suite

- **Issue slug**: `testing-gap-no-automated-suite` (full scope)
- **Severity**: High (long-term)
- **Status**: OPEN — deferred
- **Rationale**: A full test harness requires architecture to stabilise post-N9. Start with scheduling fixtures (I1) and expand incrementally. Do not introduce a full test framework until the data model is settled.
- **Key files**: [`src/utils/scheduleUtils.ts`](../../src/utils/scheduleUtils.ts), import/visit-dialog flows

---

## ESLint Rules (must read before acting on lint errors)

- **RULE 1** Whenever lint is run, overwrite the repo's canonical audit file:
  - `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
  - (Note: lint will exit non-zero while errors exist; the redirected report is still the source of truth.)

- **RULE 2** As each lint item is resolved:
  - Update/replace the relevant section(s), keeping the same output format.
  - Remove from backlog.
  - Add to the relevant Completed section (with notes).
  - Update/replace with current date on the snapshot section name.

- **RULE 3** After resolving items and regenerating the canonical lint report:
  - Update the snapshot sections (date + counts + remaining rule IDs).
  - Update the triage summary tables: rule ID totals + top hotspots + hotspot files.
  - Do not paste the full lint dump into this doc; the canonical lint report has the full file-by-file detail.

---

### ESLint Phase 1 Backlog (C5 — validate these)

- **Scoped ESLint Config Edits (Applied)**
  - Exit plan: replace `any` in `*.d.ts` with concrete types once upstream typings are clarified; split non-component exports in `src/context` into a separate module, then re-enable `react-refresh/only-export-components`.

---

### ESLint Phase 2 Backlog (C5 — validate these)

#### Runtime `any` backlog packages (grouped by boundary)

- **UI panels:** (none remaining).
  - **Plan:** define props/view models; replace `any` with typed interfaces and derived types.
  - **Validate:** dialog flows + scheduler panels.

- **Maps/config edge:** (none remaining).
  - **Plan:** define a minimal `PlaceDetails` shape for mock returns.
  - **Validate:** maps-dependent UI still renders.

---

### ESLint Phase 3 Triage — Build Warnings (N8)

- **Optional: Chunk size warning:** `PlannerDashboard` chunk > 1 MB.
  - **Plan:** consider code-splitting heavy panels or data transforms (see N7 first).
  - **Validate:** `npm run build` and check chunk sizes.

---

### ESLint Archived Files (A4)

Path `_archive/` for reference when ready for resurrection work.

```
_archive/
└── src/
    ├── components/
    │   CoverageHeatMap.tsx
    │   EnhancementSelector.tsx
    │   ProgressBar.tsx
    │   RemovePubDialog.tsx
    │   RescheduleDialog.tsx
    │
    ├── hooks/
    │   useMapsService.ts
    │
    ├── services/
    │   maps.ts
    │
    └── utils/
        googleMaps.ts
        mapsLoader.ts
        rtmColors.ts
```

---

### ESLint Unused Exports (Archived/Postponed) (A4)

**Handled**: Archived in each symbol's relevant file with `@ARCHIVED`, JSDoc, void, plus minimal no-op references to satisfy `noUnusedLocals` without changing runtime behaviour. Resurrect for future value.

- **SYMBOL:** `getCanonicalFieldValue`
  - **FILE:** [`src/utils/lineageMerge.ts`](../../src/utils/lineageMerge.ts)
  - **INTENT:** Resolve canonical field value from lineage metadata.
  - **FUTURE VALUE:** Roadmap — likely needed if lineage UI/merge inspection returns.
  - **HIDDEN COUPLING RISK:** Med — intertwined with lineage data model.
  - **LOGIC SALVAGE:** Future lineage panel; plugs into `mergeIntoCanonical` outputs.

- **SYMBOL:** `collectSources`
  - **FILE:** [`src/utils/lineageMerge.ts`](../../src/utils/lineageMerge.ts)
  - **INTENT:** Collect source list names from pub/visit records.
  - **INTENT DUPLICATION:** Similar data derived in [`src/utils/sourceDetails.ts`](../../src/utils/sourceDetails.ts).
  - **FUTURE VALUE:** Roadmap — useful for chips/summary if lineage UI returns.
  - **LOGIC SALVAGE:** Would plug into source label/chip UI (see `getSourceDetails`).

- **SYMBOL:** `optimizeRoute`
  - **FILE:** [`src/utils/scheduleUtils.ts`](../../src/utils/scheduleUtils.ts)
  - **INTENT:** Route optimisation routine.
  - **FUTURE VALUE:** Roadmap — potential scheduling optimisation feature.
  - **HIDDEN COUPLING RISK:** Med — algorithm is large and touches schedule assumptions.
  - **LOGIC SALVAGE:** Reattach to scheduling flow when route optimisation is re-scoped.

- **SYMBOL:** `clearMappings`
  - **FILE:** [`src/services/persistence.ts`](../../src/services/persistence.ts)
  - **INTENT:** Clear persisted column mappings for a user.
  - **REAL USAGE:** Commented TODO in [`src/context/PubDataContext.tsx`](../../src/context/PubDataContext.tsx).
  - **FUTURE VALUE:** Maybe — useful for user reset flows.
  - **LOGIC SALVAGE:** Wire into the reset path in `PubDataContext` if reset flows return.

- **SYMBOL:** `BusinessHours`
  - **FILE:** [`src/types.ts`](../../src/types.ts)
  - **INTENT:** Business hours type (open/close time).
  - **INTENT DUPLICATION:** Similar types in [`src/context/PubDataContext.tsx`](../../src/context/PubDataContext.tsx) and [`src/components/DriveTimeBar.tsx`](../../src/components/DriveTimeBar.tsx).
  - **FUTURE VALUE:** Maybe — could become a shared domain type if consolidated.
  - **LOGIC SALVAGE:** Relocate to a single shared types module if standardising domain types.

- **SYMBOL:** `YourListField`
  - **FILE:** [`src/api/types.ts`](../../src/api/types.ts)
  - **INTENT:** Allowed field names from "Your Lists" ingest.
  - **FUTURE VALUE:** Maybe — could be used for validation/typing in upload flow.
  - **LOGIC SALVAGE:** Reintroduce if upload validation is formalised in [`src/components/FileUploader.tsx`](../../src/components/FileUploader.tsx).
