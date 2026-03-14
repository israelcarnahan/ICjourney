# TRIAGE TASKLIST - Execution Plan

This file is the execution plan and active work queue.

Rules:

- `docs/architecture/ISSUES.md` is the source-of-truth issue ledger.
- TRIAGE references issues by slug and only expands implementation detail for active/planned work.
- Do not duplicate full issue bodies in TRIAGE.

---

## Completed ESLint Archive Summary

- 2026-01-20: ESLint Phase 1 completed (mechanical fixes + scoped lint policy choices).
- 2026-02-01: ESLint Phase 2 completed (lint findings reduced to zero at that snapshot).
- 2026-02-01: Build warning triage completed for `devLog` chunking warning.
- 2026-02-08: Documentation system refactor completed across CODEX_RULES/ISSUES/TRIAGE/SYSTEM/PRD/PROJECT_SUMMARY/README.

---

## Full Issues Triage Execution Plan

This is the natural attack order for active work, derived from `ISSUES.md`.

### Phase 0: Quick Wins / Unblockers

#### Task: validate recently mitigated visit-dialog risks before further feature work

- Linked issues: `bug-visit-dialog-update-depth`, `bug-radix-dialog-description`, `data-risk-business-data-404-delay`, `documentation-debt-devtools-form-a11y`
- Goal: reduce uncertainty on recently mitigated warnings before broad refactors.
- Scope: browser/devtools verification only; no architecture changes.
- Acceptance criteria:

1. Confirm whether update-depth and Radix warnings are fully gone.
2. Confirm business-data request behavior is bounded in real flow.
3. Capture exact remaining DevTools issues (if any).

- Checks:

1. `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
2. `npm run typecheck`
3. `npm run build`
4. Dev smoke on visit dialog flow with network tab + console.

- Dependencies / prerequisites: none.

#### Task: close "maybe fixed" lint backlog assumptions

- Linked legacy notes: ESLint Phase 1/2 backlog notes below.
- Goal: convert historical "maybe fixed" notes into explicit validated status.
- Scope: validation + doc status sync only.
- Acceptance criteria:

1. Backlog assumptions are marked validated or reopened with clear evidence.
2. TRIAGE + linked ISSUES entries synchronized.

- Checks: lint/typecheck/build plus targeted smoke where relevant.
- Dependencies / prerequisites: none.

### Phase 1: High Severity Items

#### Task: fix deadline summary correctness and deterministic behavior chain

- Linked issues: `bug-deadline-bucket-conflict`, `bug-schedule-determinism`, `testing-gap-no-automated-suite`, `testing-gap-deterministic-fixtures`
- Goal: restore trust in schedule summaries and deterministic outputs.
- Scope: summary aggregation + deterministic tie-breaks + minimal regression fixtures.
- Acceptance criteria:

1. Deadline summary agrees with export.
2. Stable output for same fixture input/settings.
3. Core regression checks exist for these failure modes.

- Checks: lint/typecheck/build + fixture/test run + UI smoke.
- Dependencies / prerequisites:

1. Phase 0 validation outputs for current warning baseline.

#### Task: harden data integrity around lineage merge and provider boundaries

- Linked issues: `data-risk-provenance-merge-loss`, `structural-debt-scheduling-duplication`, `structural-debt-map-abstractions`, `security-risk-client-side-keys`
- Goal: address root-cause correctness and trust boundaries before medium-level polish.
- Scope: lineage merge behavior, provider ownership boundaries, security posture notes.
- Acceptance criteria:

1. Lineage merge path has explicit non-loss assertions.
2. Provider/source-of-truth boundaries are explicit in docs and implementation plan.
3. Branch-only key exposure risk has actionable containment notes.

- Checks: lint/typecheck/build + targeted flow validation + doc sync.
- Dependencies / prerequisites:

1. Resolve open UNKNOWN/NEEDS VALIDATION blockers in provider behavior where needed.

### Phase 2: Medium Severity Items

#### Task: resolve behavior ambiguities and medium user-visible inconsistencies

- Linked issues: all medium semantic/data/doc/security items in Issue Index.
- Goal: tighten semantics and reduce medium-level regressions/uncertainty.
- Scope: driver label authority, constraint precedence, cache/persistence behavior, dialog/a11y follow-through.
- Acceptance criteria:

1. Ambiguities become explicit rules or explicit `NEEDS VALIDATION` tasks.
2. Medium regressions are fixed or downgraded with evidence.
3. ISSUES statuses and TRIAGE plan stay synchronized.

- Checks: lint/typecheck/build + targeted UI smoke for touched flows.
- Dependencies / prerequisites:

1. Phase 1 correctness work completed (root-cause first).

### Phase 3: Low Severity Polish / Wishlist

#### Task: chunk-size and deferred cleanup backlog

- Linked issues: `structural-debt-clone-hotspots`, `semantic-mock-geo-boundaries`, `legacy-followup-gated`, `legacy-deprecation-path-unclear`, `documentation-debt-unproven-contradictions`, `documentation-debt-system-prd-sync`
- Goal: improve maintainability/perf polish after high/medium correctness work.
- Scope: code-splitting follow-up, clone cleanup planning, deprecation and doc debt follow-through.
- Acceptance criteria:

1. `PlannerDashboard` chunk warning task is resolved or explicitly deferred with rationale.
2. Deferred cleanup backlog is ordered and tagged with dependencies.
3. Low-severity docs debt either closed or explicitly validated/deferred.

- Checks: lint/typecheck/build and bundle output review.
- Dependencies / prerequisites:

1. Phases 0-2 completion for core correctness.

---

## Issue Index (thin summary)

OPEN items are grouped by severity for planning. Deep context remains in `docs/architecture/ISSUES.md`.

### OPEN (34)

#### High (9)

- bug-deadline-bucket-conflict
  - Summary: Deadline bucket summary conflicts after date edits (Sev: High | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: Deadline cards can disagree with export after deadline changes.
  - Repro: generate schedule, change deadline significantly, compare cards vs export.
  - Key files/areas: `src/components/RepStatsPanel.tsx`, `src/utils/sourceDetails.ts`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#bug-deadline-bucket-conflict--deadline-bucket-summary-conflicts-after-date-edits), [Phase 1](#phase-1-high-severity-items)
  - Needs validation: No

- bug-schedule-determinism
  - Summary: Schedule output not guaranteed deterministic (Sev: High | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: Same input/settings may yield different ordering.
  - Repro: run identical fixture repeatedly and diff outputs.
  - Key files/areas: `src/utils/scheduleUtils.ts`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#bug-schedule-determinism--schedule-output-not-guaranteed-deterministic), [Phase 1](#phase-1-high-severity-items)
  - Needs validation: Yes

- bug-visit-dialog-update-depth
  - Summary: Visit dialog re-render loop risk (Sev: High | Status: MITIGATED | Last touched: 2026-02-08)
  - Thin detail: Mitigation landed; requires browser confirmation under real flow.
  - Repro: open visit dialog and watch console for max-depth warning.
  - Key files/areas: `src/api/useBusinessData.ts`, `src/components/VisitScheduler.tsx`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#bug-visit-dialog-update-depth--visit-dialog-re-render-loop-risk), [Phase 0](#phase-0-quick-wins--unblockers)
  - Needs validation: Yes

- structural-debt-scheduling-duplication
  - Summary: Scheduling heuristics duplicated across layers (Sev: High | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: Similar scheduling logic appears across utility/UI layers and can drift.
  - Repro: compare scheduler decisions across planner/display/export paths.
  - Key files/areas: `src/utils/scheduleUtils.ts`, `src/components/ScheduleDisplay.tsx`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#structural-debt-scheduling-duplication--scheduling-heuristics-duplicated-across-layers), [Phase 1](#phase-1-high-severity-items)
  - Needs validation: No

- structural-debt-map-abstractions
  - Summary: Map abstraction ownership is unclear (Sev: High | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: Placeholder maps service and paused provider strategy overlap.
  - Repro: trace map/opening-hours/business-data paths from planner and visit dialogs.
  - Key files/areas: `src/config/maps.ts`, provider docs/branch summary.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#structural-debt-map-abstractions--map-abstraction-ownership-is-unclear), [Phase 1](#phase-1-high-severity-items)
  - Needs validation: Yes

- data-risk-business-data-404-delay
  - Summary: Business data enrichment can fail noisy/slow (Sev: High | Status: MITIGATED | Last touched: 2026-02-08)
  - Thin detail: Fail-fast mitigation exists; runtime behavior still needs confirmation with real datasets.
  - Repro: open visit dialog with difficult/invalid venue/postcode records.
  - Key files/areas: `src/api/http.ts`, `src/api/useBusinessData.ts`, `src/config/api.ts`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#data-risk-business-data-404-delay--business-data-enrichment-can-fail-noisyslow), [Phase 0](#phase-0-quick-wins--unblockers)
  - Needs validation: Yes

- data-risk-provenance-merge-loss
  - Summary: Potential dedupe/lineage merge data loss (Sev: High | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: Merge precedence risks dropping provenance fields without fixture coverage.
  - Repro: dedupe merges with overlapping mapped/extras fields.
  - Key files/areas: `src/utils/lineageMerge.ts`, `src/components/DedupReviewDialog.tsx`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#data-risk-provenance-merge-loss--potential-dedupelineage-merge-data-loss), [Phase 1](#phase-1-high-severity-items)
  - Needs validation: Yes

- testing-gap-no-automated-suite
  - Summary: No unit/integration/e2e baseline (Sev: High | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: Core correctness checks depend on manual validation.
  - Repro: N/A (gap issue); verify absence of baseline suite.
  - Key files/areas: scheduler/import/visit-dialog flows.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#testing-gap-no-automated-suite--no-unitintegratione2e-baseline), [Phase 1](#phase-1-high-severity-items)
  - Needs validation: No

- security-risk-client-side-keys
  - Summary: Client-side API key exposure risk in branch work (Sev: High | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: Branch-level API experiments may normalize insecure key handling patterns.
  - Repro: inspect branch/proxy docs and env handling patterns.
  - Key files/areas: paused Google Places branch summary and provider config strategy.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#security-risk-client-side-keys--client-side-api-key-exposure-risk-in-branch-work), [Phase 1](#phase-1-high-severity-items)
  - Needs validation: Yes

#### Medium (19)

- bug-encoding-corruption-ui
  - Summary: Some UI strings show encoding artifacts (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: Mojibake/text artifacts still appear in parts of docs/UI.
  - Repro: review affected strings during normal UI/docs usage.
  - Key files/areas: cross-cutting docs/components.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#bug-encoding-corruption-ui--some-ui-strings-show-encoding-artifacts)
  - Needs validation: Yes

- bug-replacement-ordering-edges
  - Summary: Replace/regenerate can surface unexpected order changes (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: Replacement flows may shuffle order unexpectedly.
  - Repro: replace/regenerate visits repeatedly and compare order.
  - Key files/areas: `src/components/ScheduleDisplay.tsx`, scheduling helpers.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#bug-replacement-ordering-edges--replaceregenerate-can-surface-unexpected-order-changes)
  - Needs validation: Yes

- bug-radix-dialog-description
  - Summary: Some dialogs lacked explicit Radix description wiring (Sev: Medium | Status: MITIGATED | Last touched: 2026-02-08)
  - Thin detail: Mitigation merged; full warning audit still pending.
  - Repro: open modal flows and inspect console for Radix warnings.
  - Key files/areas: dialog components.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#bug-radix-dialog-description--some-dialogs-lacked-explicit-radix-description-wiring), [Phase 0](#phase-0-quick-wins--unblockers)
  - Needs validation: Yes

- structural-debt-large-orchestrators
  - Summary: Large orchestration components increase coupling (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: Planner/schedule pages remain high-complexity entry points.
  - Repro: inspect component size and mixed responsibilities.
  - Key files/areas: `src/pages/PlannerDashboard.tsx`, `src/components/ScheduleDisplay.tsx`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#structural-debt-large-orchestrators--large-orchestration-components-increase-coupling), [Phase 2](#phase-2-medium-severity-items)
  - Needs validation: No

- structural-debt-legacy-field-overlap
  - Summary: Legacy and normalized fields coexist (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: Field authority is mixed, increasing mapping complexity.
  - Repro: trace zip/postcode and source metadata pipelines.
  - Key files/areas: `src/context/PubDataContext.tsx`, `src/utils/seedFromPub.ts`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#structural-debt-legacy-field-overlap--legacy-and-normalized-fields-coexist)
  - Needs validation: No

- semantic-deadline-constraint-interpretation
  - Summary: Deadline semantics are not fully explicit (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: Edge-case semantics are not fully codified/documented.
  - Repro: compare PRD intent against scheduler edge behavior.
  - Key files/areas: `docs/architecture/PRD.md`, `src/utils/scheduleUtils.ts`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#semantic-deadline-constraint-interpretation--deadline-semantics-are-not-fully-explicit)
  - Needs validation: Yes

- semantic-driver-source-truth
  - Summary: Driver label/source authority is unclear (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: label derivation authority is split across multiple paths.
  - Repro: compare labels across list chips, stats, and exports.
  - Key files/areas: `src/utils/sourceDetails.ts`, `src/components/RepStatsPanel.tsx`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#semantic-driver-source-truth--driver-labelsource-authority-is-unclear)
  - Needs validation: Yes

- semantic-constraints-vs-locality
  - Summary: Priority/locality tradeoffs are implicit (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: constraint precedence remains heuristic and under-specified.
  - Repro: evaluate schedule decisions with conflicting locality/deadline/priority inputs.
  - Key files/areas: `src/utils/scheduleUtils.ts`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#semantic-constraints-vs-locality--prioritylocality-tradeoffs-are-implicit)
  - Needs validation: Yes

- semantic-followup-definition-gap
  - Summary: Follow-up semantics partially scaffolded but gated (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: deferred follow-up path lacks final parser and policy closure.
  - Repro: review deferred follow-up docs and gated UI behavior.
  - Key files/areas: `docs/architecture/followup-by-date.md`, `src/components/FileTypeDialog.tsx`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#semantic-followup-definition-gap--follow-up-semantics-partially-scaffolded-but-gated)
  - Needs validation: Yes

- legacy-google-places-paused
  - Summary: Google Places integration is paused branch-only (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: main branch lacks active google places provider; branch doc exists.
  - Repro: inspect `src/api` provider files in main.
  - Key files/areas: `src/api/*`, branch summary doc.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#legacy-google-places-paused--google-places-integration-is-paused-branch-only)
  - Needs validation: No

- legacy-mock-real-boundary
  - Summary: Mock vs real boundary is not explicit enough (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: real external calls coexist with placeholder map service.
  - Repro: trace provider chain and maps service calls.
  - Key files/areas: `src/api/*`, `src/config/maps.ts`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#legacy-mock-real-boundary--mock-vs-real-boundary-is-not-explicit-enough)
  - Needs validation: No

- data-risk-local-persistence-limits
  - Summary: localStorage persistence has scale/recovery limits (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: no robust recovery path if storage is lost/limited.
  - Repro: review persistence design and reset flows.
  - Key files/areas: `src/services/persistence.ts`, `src/context/PubDataContext.tsx`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#data-risk-local-persistence-limits--localstorage-persistence-has-scalerecovery-limits)
  - Needs validation: No

- data-risk-cache-divergence
  - Summary: In-memory and persisted views may diverge (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: in-memory cache lifecycle may drift from persisted edits.
  - Repro: edit/reload scenarios with enrichment cache present.
  - Key files/areas: `src/api/useBusinessData.ts`, `src/services/persistence.ts`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#data-risk-cache-divergence--in-memory-and-persisted-views-may-diverge)
  - Needs validation: Yes

- data-risk-from-your-lists-visibility
  - Summary: Some imported fields are not consistently visible (Sev: Medium | Status: MITIGATED | Last touched: 2026-02-08)
  - Thin detail: rendering improved but dataset-wide behavior still not fully confirmed.
  - Repro: import variant files and inspect "From your lists" panel.
  - Key files/areas: `src/components/VisitScheduler.tsx`, `src/components/FileUploader.tsx`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#data-risk-from-your-lists-visibility--some-imported-fields-are-not-consistently-visible), [Phase 0](#phase-0-quick-wins--unblockers)
  - Needs validation: Yes

- testing-gap-deterministic-fixtures
  - Summary: Deterministic scheduling fixtures absent (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: fixture suite needed to verify deterministic behavior quickly.
  - Repro: N/A (gap); validate absence and propose fixture set.
  - Key files/areas: scheduling test harness/backlog.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#testing-gap-deterministic-fixtures--deterministic-scheduling-fixtures-absent), [Phase 1](#phase-1-high-severity-items)
  - Needs validation: No

- security-risk-input-validation
  - Summary: Input validation scope not formally audited (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: no formal adversarial validation matrix captured.
  - Repro: inspect current import/form validation coverage.
  - Key files/areas: `src/components/FileUploader.tsx`, input utilities.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#security-risk-input-validation--input-validation-scope-not-formally-audited)
  - Needs validation: Yes

- security-risk-no-xss-audit
  - Summary: No explicit XSS/injection review artifact (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Repro: inspect docs/audits for explicit XSS review output.
  - Key files/areas: `docs/audits/`, render/input surfaces.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#security-risk-no-xss-audit--no-explicit-xssinjection-review-artifact)
  - Needs validation: Yes

- documentation-debt-devtools-form-a11y
  - Summary: DevTools form metadata warnings need confirmation (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: exact post-mitigation warning set is not yet captured.
  - Repro: open visit dialog and inspect DevTools Issues panel.
  - Key files/areas: `src/components/VisitScheduler.tsx`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#documentation-debt-devtools-form-a11y--devtools-form-metadata-warnings-need-confirmation), [Phase 0](#phase-0-quick-wins--unblockers)
  - Needs validation: Yes

- documentation-debt-doc-routing
  - Summary: Contributor routing across docs was inconsistent (Sev: Medium | Status: OPEN | Last touched: 2026-02-08)
  - Repro: navigate docs from README/summary/system.
  - Key files/areas: docs architecture set.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#documentation-debt-doc-routing--contributor-routing-across-docs-was-inconsistent)
  - Needs validation: Yes

#### Low (6)

- structural-debt-clone-hotspots
  - Summary: Dialog and utility clone hotspots remain (Sev: Low | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: clone cleanup remains a deferred maintainability task.
  - Repro: review JSCPD hotspots.
  - Key files/areas: postcode dialogs, schedule utilities, misc UI snippets.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#structural-debt-clone-hotspots--dialog-and-utility-clone-hotspots-remain), [Phase 3](#phase-3-low-severity-polish--wishlist)
  - Needs validation: No

- semantic-mock-geo-boundaries
  - Summary: Mock geo boundary behavior not fully specified (Sev: Low | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: mock boundary edge policy needs explicit documentation.
  - Repro: evaluate edge postcodes/locality partition behavior.
  - Key files/areas: `src/utils/scheduleUtils.ts` and docs.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#semantic-mock-geo-boundaries--mock-geo-boundary-behavior-not-fully-specified)
  - Needs validation: Yes

- legacy-followup-gated
  - Summary: Follow-up-by-date remains intentionally disabled (Sev: Low | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: deferred by design until reliable visit-history parsing is available.
  - Repro: attempt to configure follow-up timeline path.
  - Key files/areas: follow-up docs + file type dialog.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#legacy-followup-gated--follow-up-by-date-remains-intentionally-disabled)
  - Needs validation: No

- legacy-deprecation-path-unclear<
  - Summary: Deprecated scheduling fields lack explicit removal plan (Sev: Low | Status: OPEN | Last touched: 2026-02-08)
  - Thin detail: transitional fields remain without formal retirement plan.
  - Repro: inspect overlapping legacy/current schedule models.
  - Key files/areas: context and schedule mappers.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#legacy-deprecation-path-unclear--deprecated-scheduling-fields-lack-explicit-removal-plan)
  - Needs validation: No

- documentation-debt-unproven-contradictions
  - Summary: Some legacy claims remain unproven in this pass (Sev: Low | Status: UNKNOWN | Last touched: 2026-02-08)
  - Thin detail: unresolved doc contradiction candidates were intentionally not asserted as facts.
  - Repro: targeted contradiction audit across legacy summaries.
  - Key files/areas: `docs/architecture/PROJECT_SUMMARY.md`, branch summary docs.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#documentation-debt-unproven-contradictions--some-legacy-claims-remain-unproven-in-this-pass), [Phase 3](#phase-3-low-severity-polish--wishlist)
  - Needs validation: Yes

- documentation-debt-system-prd-sync<
  - Summary: System and PRD drift risk remains ongoing (Sev: Low | Status: OPEN | Last touched: 2026-02-08)<
  - Thin detail: requires ongoing completion-sync discipline, not one-off edits.
  - Repro: compare SYSTEM vs PRD after behavior changes.
  - Key files/areas: `docs/architecture/SYSTEM.md`, `docs/architecture/PRD.md`.
  - Links: [ISSUES slug anchor](../architecture/ISSUES.md#documentation-debt-system-prd-sync--system-and-prd-drift-risk-remains-ongoing)
  - Needs validation: No

### RESOLVED (0)

#### High (0)

- None.

#### Medium (0)

- None.

#### Low (0)

- None.

---

## Update Rules (ISSUES/TRIAGE-specific)

- Update TRIAGE Issue Index only when a linked issue is touched/updated/completed, or when an active task explicitly references it.
- Do not churn TRIAGE for unrelated issue edits.
- When user approves a new task, expand only that active task here with execution detail pulled from `ISSUES.md`.
- When a task is completed, consolidate detail into archive summary and update linked ISSUES status/resolution details.

---

## Deferred ESLint Cleanup / Legacy Backlog (Baked into Full Triage Execution Plan)

- The following historical triage blocks are retained and not deleted.
- They are now treated as deferred or validation-driven backlog sources.
- Use them only when a current task explicitly pulls them into scope.

### Legacy block references

- "ESLint Phase 3 chunk warning" -> Execution Plan Phase 3 (`build-chunk-size-followup`).
- "Phase 1/2 backlog maybe fixed" -> Execution Plan Phase 0 validation task.
- "Archived files / unused exports" -> Deferred cleanup backlog (Phase 3+).

---

### ESLint Triage + Lint Rules (must read rules before action)

- **RULE 1** Whenever lint is run, overwrite the repo’s canonical audit file:
  - `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
  - (Note: lint will exit non-zero while errors exist; the redirected report is still the source of truth.)

- **RULE 2**
  - As each is resolved:
    - update/replace the relevant section(s), keeping the same output format as others in each related section(s).
      - remove from backlog
      - add to the relevant Phases Completed section (with any notes)
        - update/replace with current date on the snapshot sections name.

- **RULE 3 (clarified)** After resolving items and regenerating the canonical lint report:
  - Update the snapshot sections (date + counts + remaining rule IDs).
  - Update the triage _summary_ tables:
    - Rule ID totals + a few top hotspots
    - “Hotspot files (top 10)”
  - Do not paste the full lint dump into this doc; the canonical lint report contains the full file-by-file detail.

#### ESLint Phase 1 Backlog (maybe fixed? check)

- **Scoped ESLint Config Edits (Applied)**
  - Exit plan: replace `any` in `*.d.ts` with concrete types once upstream typings are clarified; split non-component exports in `src/context` into a separate module, then re-enable `react-refresh/only-export-components`.

#### ESLint Phase 2 Backlog (maybe fixed? check)

##### Runtime `any` backlog packages (grouped by boundary)

- **UI panels:** (none remaining).
  - **Plan:** define props/view models; replace `any` with typed interfaces and derived types.
  - **Validate:** dialog flows + scheduler panels.

- **Maps/config edge:** (none remaining).
  - **Plan:** define a minimal `PlaceDetails` shape for mock returns.
  - **Validate:** maps-dependent UI still renders.

#### ESLint Phase 3 Triage (Build Warnings) (1)

- **Optional: Chunk size warning:** `PlannerDashboard` chunk > 1 MB.
  - **Plan:** consider code-splitting heavy panels or data transforms.
  - **Validate:** `npm run build` and check chunk sizes.

#### ESLint Archived Files (10)

- **Path** `_archive` for reference when ready for resurrection work

  \_ARCHIVE
  └───src
  ├───components
  │ CoverageHeatMap.tsx
  │ EnhancementSelector.tsx
  │ ProgressBar.tsx
  │ RemovePubDialog.tsx
  │ RescheduleDialog.tsx
  │
  ├───hooks
  │ useMapsService.ts
  │
  ├───services
  │ maps.ts
  │
  └───utils
  googleMaps.ts
  mapsLoader.ts
  rtmColors.ts

#### ESLint Unused Exports & Types (Archived/Postponed) (6)

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

</details>
