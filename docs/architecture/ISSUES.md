# ISSUES - Risks, Gaps, Ambiguities

## Purpose

This is the source-of-truth ledger for issues, risks, ambiguities, and improvement wishes.

Rules:

- Issues are not tasks.
- Do not invent facts.
- Use `UNKNOWN` / `NEEDS VALIDATION` when evidence is incomplete.
- Execution details belong in `docs/audits/TRIAGE_TASKLIST.md` and must link back to issue slugs.

---

## Categories

- Bugs
- Structural Debt
- Semantic Ambiguity
- Legacy / Transitional Code
- Data Risk
- Testing Gap
- Security Risk
- Documentation Debt

---

## ISSUES Snapshot

- Last updated: 2026-02-08
- Open counts: High 9, Med 19, Low 6
- Resolved count: 0

Top 5 Highest Severity Open:

1. `bug-deadline-bucket-conflict` - Deadline bucket summary shows contradictory counts
2. `bug-schedule-determinism` - Same inputs can yield different schedule ordering
3. `data-risk-provenance-merge-loss` - Potential dedupe/lineage data loss risk
4. `data-risk-business-data-404-delay` - Business-data calls can stall and spam network errors
5. `structural-debt-scheduling-duplication` - Scheduling logic duplicated across layers

Top 5 Longest Pending Open (by Created date):

1. `bug-deadline-bucket-conflict` (Created 2026-02-08)
2. `structural-debt-large-orchestrators` (Created 2026-02-08)
3. `semantic-constraints-vs-locality` (Created 2026-02-08)
4. `legacy-mock-real-boundary` (Created 2026-02-08)
5. `testing-gap-no-automated-suite` (Created 2026-02-08)

Note: many existing issues had no prior created date; defaulted to 2026-02-08 per governance rule.

---

## Bugs

### Open (6)

### bug-deadline-bucket-conflict — Deadline bucket summary conflicts after date edits
- Category: Bugs
- Severity: High
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Deadline summary cards can show contradictory bucket counts after deadline edits even when export is correct.
- Repro:
1. Load same dataset.
2. Generate schedule over longer range.
3. Change a list deadline to a much earlier date.
4. Compare summary cards vs export output.
- Evidence: Existing manual repro notes in this file; export path appears consistent while summary aggregation can diverge.
- Suspected cause: Grouping key mismatch or stale derived state in summary aggregation.
- Options: normalize bucket keys; audit memo/effect dependencies; align summary derivation with export derivation.
- Acceptance criteria: single bucket per label/date, counts match export, deterministic updates after deadline edits.
- Last updated details: 2026-02-08 - retained as active high-severity bug.
- Related links: `src/components/RepStatsPanel.tsx`, `src/utils/sourceDetails.ts`, `docs/audits/TRIAGE_TASKLIST.md`

### bug-schedule-determinism — Schedule output not guaranteed deterministic
- Category: Bugs
- Severity: High
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Scheduling order may vary across runs for same inputs, increasing debugging and trust cost.
- Repro / Evidence: Historical behavior notes; no deterministic fixture suite exists.
- Suspected cause: tie-breaking and heuristic ordering paths not fully normalized.
- Options: deterministic tie-break keys; fixed fixtures; debug trace assertions.
- Acceptance criteria: stable output for fixed fixtures and settings.
- Last updated details: 2026-02-08 - no code-verified determinism contract yet.
- Related links: `src/utils/scheduleUtils.ts`, `docs/audits/TRIAGE_TASKLIST.md`

### bug-encoding-corruption-ui — Some UI strings show encoding artifacts
- Category: Bugs
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Several docs/UI strings contain mojibake artifacts that reduce readability.
- Repro / Evidence: Observed in docs and rendered text snippets.
- Suspected cause: mixed encoding handling across edits.
- Options: normalize file encoding; targeted string cleanup.
- Acceptance criteria: no visible encoding artifacts in key UI/docs.
- Last updated details: 2026-02-08 - cataloged; cleanup deferred.
- Related links: `docs/architecture/ISSUES.md`, `src/components/*`

### bug-replacement-ordering-edges — Replace/regenerate can surface unexpected order changes
- Category: Bugs
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Replacement/regeneration flows may produce surprising ordering shifts.
- Repro / Evidence: Manual reports; no deterministic regression tests.
- Suspected cause: recomputation and sorting interactions in schedule update flow.
- Options: define expected ordering contract; add regression fixtures.
- Acceptance criteria: replacement/regenerate preserves documented ordering semantics.
- Last updated details: 2026-02-08 - no additional evidence added.
- Related links: `src/components/ScheduleDisplay.tsx`, `src/utils/scheduleUtils.ts`

### bug-visit-dialog-update-depth — Visit dialog re-render loop risk
- Category: Bugs
- Severity: High
- Status: MITIGATED
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Visit dialog previously risked effect-triggered render loops (`Maximum update depth exceeded`).
- Repro / Evidence: Code path showed unstable effect dependency + duplicated hook usage.
- Suspected cause: `useBusinessData` dependency churn and duplicate invocation in `VisitScheduler`.
- Options: stabilize dependency key, share hook result.
- Acceptance criteria: no update-depth warning on dialog open.
- Last updated details: 2026-02-08 - mitigation implemented; browser validation still `NEEDS VALIDATION`.
- Related links: `src/api/useBusinessData.ts`, `src/components/VisitScheduler.tsx`, `docs/audits/TRIAGE_TASKLIST.md`

### bug-radix-dialog-description — Some dialogs lacked explicit Radix description wiring
- Category: Bugs
- Severity: Medium
- Status: MITIGATED
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Dialog warning risk existed where `Dialog.Content` lacked explicit description semantics.
- Repro / Evidence: Modal components with missing/implicit description patterns.
- Suspected cause: inconsistent Radix dialog patterns across components.
- Options: always add `Dialog.Description` or explicit `aria-describedby={undefined}`.
- Acceptance criteria: no Radix description warnings on modal flows.
- Last updated details: 2026-02-08 - mitigation implemented; full browser warning audit `NEEDS VALIDATION`.
- Related links: `src/components/FileTypeDialog.tsx`, `src/components/PostcodeFixesDialog.tsx`, `src/components/PostcodeReviewDialog.tsx`

### Resolved (0)

---

## Structural Debt

### Open (5)

### structural-debt-large-orchestrators — Large orchestration components increase coupling
- Category: Structural Debt
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Large orchestration components increase change risk and cognitive load.
- Repro / Evidence: `PlannerDashboard` and `ScheduleDisplay` remain high-complexity integration points.
- Suspected cause: feature growth without full decomposition.
- Options: extract feature modules and view-model helpers incrementally.
- Acceptance criteria: reduced component responsibilities with stable behavior.
- Last updated details: 2026-02-08 - retained from prior structural notes.
- Related links: `src/pages/PlannerDashboard.tsx`, `src/components/ScheduleDisplay.tsx`

### structural-debt-scheduling-duplication — Scheduling heuristics duplicated across layers
- Category: Structural Debt
- Severity: High
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Similar scheduling logic appears in planner, display, and export-related paths.
- Repro / Evidence: Existing duplication findings and clone notes.
- Suspected cause: incremental additions outside shared utility boundaries.
- Options: centralize scoring/selection/tie-break utilities.
- Acceptance criteria: single authoritative heuristic path for equivalent behavior.
- Last updated details: 2026-02-08 - no consolidation completed yet.
- Related links: `src/utils/scheduleUtils.ts`, `src/components/ScheduleDisplay.tsx`

### structural-debt-map-abstractions — Map abstraction ownership is unclear
- Category: Structural Debt
- Severity: High
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Multiple map-related abstractions exist with unclear authority and transition state.
- Repro / Evidence: Placeholder maps service in main; paused API branch docs.
- Suspected cause: transitional architecture across branches.
- Options: define one authoritative map provider contract per branch/state.
- Acceptance criteria: clear ownership and documented active provider path.
- Last updated details: 2026-02-08 - still transitional.
- Related links: `src/config/maps.ts`, `docs/architecture/BRANCH_SUMMARY_feat-api-google-places.md`

### structural-debt-legacy-field-overlap — Legacy and normalized fields coexist
- Category: Structural Debt
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Legacy fields and newer normalized shapes coexist, increasing mapping complexity.
- Repro / Evidence: zip/postcode and source metadata coexistence patterns.
- Suspected cause: backward compatibility retained without full deprecation plan.
- Options: explicit migration map and deprecation timeline.
- Acceptance criteria: clear field authority per domain concept.
- Last updated details: 2026-02-08 - deprecation path still undefined.
- Related links: `src/context/PubDataContext.tsx`, `src/utils/seedFromPub.ts`

### structural-debt-clone-hotspots — Dialog and utility clone hotspots remain
- Category: Structural Debt
- Severity: Low
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Clone hotspots were identified (including postcode dialogs and utility snippets).
- Repro / Evidence: Existing JSCPD and prior triage notes.
- Suspected cause: copy-forward iteration under delivery pressure.
- Options: targeted dedup passes with behavior lock tests.
- Acceptance criteria: hotspot reduction without behavior regressions.
- Last updated details: 2026-02-08 - tracked for planned cleanup.
- Related links: `docs/audits/JSCPD/html/jscpd-report.json`, `src/components/PostcodeFixesDialog.tsx`, `src/components/PostcodeReviewDialog.tsx`

### Resolved (0)

---

## Semantic Ambiguity

### Open (5)

### semantic-deadline-constraint-interpretation — Deadline semantics are not fully explicit
- Category: Semantic Ambiguity
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Deadline behavior is intended as a constraint but edge handling is not fully explicit in docs/tests.
- Repro / Evidence: Mixed narrative language across docs and behavior reports.
- Suspected cause: evolving semantics without single canonical examples.
- Options: add strict examples and fixture-backed acceptance.
- Acceptance criteria: docs and behavior agree on edge cases.
- Last updated details: 2026-02-08 - pending semantic clarification pass.
- Related links: `docs/architecture/PRD.md`, `src/utils/scheduleUtils.ts`

### semantic-driver-source-truth — Driver label/source authority is unclear
- Category: Semantic Ambiguity
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Single source of truth for scheduling driver labels is not explicit.
- Repro / Evidence: Multiple label derivation points and fallback paths.
- Suspected cause: lineage/effective-plan transition complexity.
- Options: codify one label derivation contract.
- Acceptance criteria: consistent labels across UI/export/debug.
- Last updated details: 2026-02-08 - unresolved.
- Related links: `src/utils/sourceDetails.ts`, `src/components/RepStatsPanel.tsx`

### semantic-constraints-vs-locality — Priority/locality tradeoffs are implicit
- Category: Semantic Ambiguity
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Locality and priority/deadline tradeoffs are mostly heuristic and not fully formalized.
- Repro / Evidence: Existing notes and heuristic-driven scheduler.
- Suspected cause: optimization logic grew before policy formalization.
- Options: explicit precedence matrix in docs + fixture tests.
- Acceptance criteria: documented precedence and matching behavior.
- Last updated details: 2026-02-08 - still implicit.
- Related links: `src/utils/scheduleUtils.ts`, `docs/architecture/PRD.md`

### semantic-mock-geo-boundaries — Mock geo boundary behavior not fully specified
- Category: Semantic Ambiguity
- Severity: Low
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Mock geo behavior exists, but strict boundary semantics are not fully documented.
- Repro / Evidence: Docs mention mock geo but without full edge policy.
- Suspected cause: focus on execution over semantic spec.
- Options: boundary examples and explicit fallback policies.
- Acceptance criteria: deterministic boundary behavior documented and testable.
- Last updated details: 2026-02-08 - open.
- Related links: `src/utils/scheduleUtils.ts`, `docs/architecture/SYSTEM.md`

### semantic-followup-definition-gap — Follow-up semantics partially scaffolded but gated
- Category: Semantic Ambiguity
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Follow-up by date is deferred; semantic expectations remain partially defined.
- Repro / Evidence: Deferred design doc exists; runtime flow is gated.
- Suspected cause: missing reliable visit-history input policy.
- Options: lock parser policy and re-enable plan only with validated data.
- Acceptance criteria: re-enable only after parser/ambiguity policy is codified.
- Last updated details: 2026-02-08 - deferred.
- Related links: `docs/architecture/followup-by-date.md`, `src/components/FileTypeDialog.tsx`

### Resolved (0)

---

## Legacy / Transitional Code

### Open (4)

### legacy-followup-gated — Follow-up-by-date remains intentionally disabled
- Category: Legacy / Transitional Code
- Severity: Low
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Follow-up logic exists conceptually but is gated in active flow.
- Repro / Evidence: UI communicates paused/deferred follow-up path.
- Suspected cause: unresolved last-visited parsing reliability.
- Options: keep gated; add parser policy before enabling.
- Acceptance criteria: explicit enable criteria documented and met before release.
- Last updated details: 2026-02-08 - unchanged.
- Related links: `docs/architecture/followup-by-date.md`, `src/components/FileTypeDialog.tsx`

### legacy-google-places-paused — Google Places integration is paused branch-only
- Category: Legacy / Transitional Code
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Google Places provider is documented in branch summary but not present in current main branch source.
- Repro / Evidence: `src/api` in main contains postcodes/nominatim/fallback only.
- Suspected cause: paused branch work not merged.
- Options: keep explicitly paused in docs; gate references in main docs.
- Acceptance criteria: docs clearly distinguish main vs paused branch capabilities.
- Last updated details: 2026-02-08 - main branch state verified.
- Related links: `src/api/`, `docs/architecture/BRANCH_SUMMARY_feat-api-google-places.md`

### legacy-mock-real-boundary — Mock vs real boundary is not explicit enough
- Category: Legacy / Transitional Code
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Main branch mixes real external lookups with placeholder map/opening-hour services.
- Repro / Evidence: Real postcodes/nominatim providers plus placeholder `mapsService`.
- Suspected cause: transitional migration state.
- Options: explicit runtime boundary matrix in SYSTEM docs.
- Acceptance criteria: each data source marked real/mock/fallback/paused.
- Last updated details: 2026-02-08 - still transitional.
- Related links: `src/api/postcodesProvider.ts`, `src/api/nominatimProvider.ts`, `src/config/maps.ts`, `docs/architecture/SYSTEM.md`

### legacy-deprecation-path-unclear — Deprecated scheduling fields lack explicit removal plan
- Category: Legacy / Transitional Code
- Severity: Low
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Older scheduling fields and transitional metadata remain without retirement milestones.
- Repro / Evidence: Mixed models in context and mapper layers.
- Suspected cause: compatibility-first evolution.
- Options: deprecation checklist + migration constraints.
- Acceptance criteria: documented field lifecycle and cleanup milestones.
- Last updated details: 2026-02-08 - no deprecation plan yet.
- Related links: `src/context/PubDataContext.tsx`, `src/utils/scheduleMappers.ts`

### Resolved (0)

---

## Data Risk

### Open (5)

### data-risk-business-data-404-delay — Business data enrichment can fail noisy/slow
- Category: Data Risk
- Severity: High
- Status: MITIGATED
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: External enrichment calls can fail and previously caused long loading states.
- Repro / Evidence: External provider chain plus swallowed errors and host queue delay.
- Suspected cause: repeated calls + slow external responses + delayed fallback visibility.
- Options: fail-fast timeout, immediate seed data, bounded fetch behavior.
- Acceptance criteria: bounded requests and fast UI settlement without fake values.
- Last updated details: 2026-02-08 - timeout + immediate seed state added; runtime network profile `NEEDS VALIDATION`.
- Related links: `src/api/http.ts`, `src/api/useBusinessData.ts`, `src/config/api.ts`

### data-risk-provenance-merge-loss — Potential dedupe/lineage merge data loss
- Category: Data Risk
- Severity: High
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Dedupe/lineage merge flow may drop or overwrite provenance-sensitive fields.
- Repro / Evidence: Existing concern documented; no full fixture coverage.
- Suspected cause: merge heuristics and source-field precedence complexity.
- Options: fixture-based lineage assertions and non-destructive merge checks.
- Acceptance criteria: lineage and mapped extras preserved across merge scenarios.
- Last updated details: 2026-02-08 - still open.
- Related links: `src/utils/lineageMerge.ts`, `src/components/DedupReviewDialog.tsx`

### data-risk-local-persistence-limits — localStorage persistence has scale/recovery limits
- Category: Data Risk
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: localStorage-only persistence has quota and recovery limitations.
- Repro / Evidence: Client-only persistence design and no backup path.
- Suspected cause: no backend sync/recovery layer.
- Options: export/import backups; eventual backend persistence.
- Acceptance criteria: documented limits and safe recovery path.
- Last updated details: 2026-02-08 - unchanged.
- Related links: `src/services/persistence.ts`, `src/context/PubDataContext.tsx`

### data-risk-cache-divergence — In-memory and persisted views may diverge
- Category: Data Risk
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Session caches and persisted state can diverge without explicit reconciliation.
- Repro / Evidence: separate runtime cache in business data hook and storage persistence.
- Suspected cause: no cache invalidation contract tied to persistence events.
- Options: cache key invalidation policy, explicit reset hooks.
- Acceptance criteria: predictable cache behavior across reload/edit cycles.
- Last updated details: 2026-02-08 - unresolved.
- Related links: `src/api/useBusinessData.ts`, `src/services/persistence.ts`

### data-risk-from-your-lists-visibility — Some imported fields are not consistently visible
- Category: Data Risk
- Severity: Medium
- Status: MITIGATED
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Dialog did not consistently display selected imported fields.
- Repro / Evidence: top-level import fields vs rendered business panel mismatch.
- Suspected cause: seed/display mapping omitted selected fields.
- Options: render stable subset; keep raw extras behind dev toggle.
- Acceptance criteria: selected supported fields render when present.
- Last updated details: 2026-02-08 - landlord/last_visited/visitNotes surfaced; dataset-level validation `NEEDS VALIDATION`.
- Related links: `src/components/VisitScheduler.tsx`, `src/components/FileUploader.tsx`, `src/utils/seedFromPub.ts`

### Resolved (0)

---

## Testing Gap

### Open (2)

### testing-gap-no-automated-suite — No unit/integration/e2e baseline
- Category: Testing Gap
- Severity: High
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: There is no automated regression suite for core scheduler and dialog flows.
- Repro / Evidence: repository lacks test harness and fixtures for critical behaviors.
- Suspected cause: manual-validation-first development.
- Options: start with deterministic scheduling fixtures + key UI smoke tests.
- Acceptance criteria: baseline automated checks for scheduling and import critical paths.
- Last updated details: 2026-02-08 - still open.
- Related links: `docs/audits/TRIAGE_TASKLIST.md`, `package.json`

### testing-gap-deterministic-fixtures — Deterministic scheduling fixtures absent
- Category: Testing Gap
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Determinism and edge cases rely on manual checks.
- Repro / Evidence: no fixture corpus for same-input/same-output assertions.
- Suspected cause: no explicit fixture strategy.
- Options: snapshot fixture sets and schedule comparison utilities.
- Acceptance criteria: repeatable fixture validation for major scheduling rules.
- Last updated details: 2026-02-08 - unchanged.
- Related links: `src/utils/scheduleUtils.ts`, `docs/architecture/PRD.md`

### Resolved (0)

---

## Security Risk

### Open (3)

### security-risk-client-side-keys — Client-side API key exposure risk in branch work
- Category: Security Risk
- Severity: High
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Branch-level API integrations may expose key handling risks.
- Repro / Evidence: branch summary references dev proxy/API key setup.
- Suspected cause: frontend-first prototyping before backend boundary.
- Options: server-side key handling only; usage monitoring.
- Acceptance criteria: no production client exposure of sensitive keys.
- Last updated details: 2026-02-08 - still branch risk.
- Related links: `docs/architecture/BRANCH_SUMMARY_feat-api-google-places.md`

### security-risk-input-validation — Input validation scope not formally audited
- Category: Security Risk
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Validation exists but comprehensive adversarial audit has not been completed.
- Repro / Evidence: no formal validation audit artifact.
- Suspected cause: focus on feature correctness over abuse cases.
- Options: validation matrix and malicious-input test set.
- Acceptance criteria: documented validation audit pass.
- Last updated details: 2026-02-08 - open.
- Related links: `src/components/FileUploader.tsx`, `src/utils/*`

### security-risk-no-xss-audit — No explicit XSS/injection review artifact
- Category: Security Risk
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: No formal XSS/injection audit record is maintained.
- Repro / Evidence: absence of dedicated audit documentation.
- Suspected cause: no security review workflow integrated yet.
- Options: perform targeted audit and capture outcomes in docs.
- Acceptance criteria: published security audit notes and mitigations.
- Last updated details: 2026-02-08 - open.
- Related links: `docs/audits/`, `src/components/*`

### Resolved (0)

---

## Documentation Debt

### Open (4)

### documentation-debt-devtools-form-a11y — DevTools form metadata warnings need confirmation
- Category: Documentation Debt
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: DevTools issues were reported for input id/name/label associations but exact current warnings are not re-captured post-mitigation.
- Repro / Evidence: historical report; latest browser capture not attached.
- Suspected cause: partial form metadata coverage.
- Options: run browser issue capture and document exact remaining warnings.
- Acceptance criteria: warning status captured with exact component references.
- Last updated details: 2026-02-08 - `NEEDS VALIDATION` pending browser capture.
- Related links: `src/components/VisitScheduler.tsx`, `docs/audits/TRIAGE_TASKLIST.md`

### documentation-debt-doc-routing — Contributor routing across docs was inconsistent
- Category: Documentation Debt
- Severity: Medium
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Multiple docs used inconsistent pointers for where to find rules/issues/triage.
- Repro / Evidence: conflicting and stale links across architecture docs.
- Suspected cause: organic doc growth without central governance model.
- Options: standardize routing in README/PROJECT_SUMMARY/SYSTEM.
- Acceptance criteria: consistent pointers to CODEX_RULES, ISSUES, TRIAGE across core docs.
- Last updated details: 2026-02-08 - updated this pass; follow-up spot-check still needed.
- Related links: `docs/architecture/README.md`, `docs/architecture/PROJECT_SUMMARY.md`, `docs/architecture/SYSTEM.md`

### documentation-debt-unproven-contradictions — Some legacy claims remain unproven in this pass
- Category: Documentation Debt
- Severity: Low
- Status: UNKNOWN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Some narrative claims across legacy summary docs may be stale but are not fully code-proven in this pass.
- Repro / Evidence: historical summary prose vs current codebase coverage gaps.
- Suspected cause: summary docs not maintained per execution changes.
- Options: targeted contradiction audit by section with code references.
- Acceptance criteria: each claim is either code-proven or marked `NEEDS VALIDATION`.
- Last updated details: 2026-02-08 - intentionally retained as doc debt instead of guessing.
- Related links: `docs/architecture/PROJECT_SUMMARY.md`, `docs/architecture/BRANCH_SUMMARY_feat-api-google-places.md`

### documentation-debt-system-prd-sync — System and PRD drift risk remains ongoing
- Category: Documentation Debt
- Severity: Low
- Status: OPEN
- Created: 2026-02-08
- Last touched: 2026-02-08
- Summary: Without strict update discipline, SYSTEM (as-is) and PRD (intended) can drift again.
- Repro / Evidence: prior mixed-state edits and stale references.
- Suspected cause: behavior changes not always reflected in paired docs.
- Options: enforce post-task doc delta checks and completion sync.
- Acceptance criteria: routine updates include explicit doc touch/no-touch rationale.
- Last updated details: 2026-02-08 - governance rules updated in CODEX_RULES.
- Related links: `docs/architecture/CODEX_RULES.md`, `docs/architecture/SYSTEM.md`, `docs/architecture/PRD.md`

### Resolved (0)

---

## Meta-level Risk

- Adding new features before resolving known duplication/semantics risks will increase complexity cost.
- Lack of deterministic fixtures keeps debugging expensive.
- Documentation quality will regress without strict completion-sync discipline.
