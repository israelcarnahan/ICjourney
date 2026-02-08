# ISSUES — Risks, Gaps, Ambiguities

## Purpose

This document captures **everything that is wrong, unclear, duplicated, risky, or semantically unresolved** in the IC Journey Planner.

ISSUES are:

- ❌ not tasks
- ❌ not promises
- ❌ not a roadmap

They are **signals** that require future decisions.

---

## Categories

Each issue should fall into one or more of the following categories:

- Bugs
- Structural Debt
- Semantic Ambiguity
- Legacy / Transitional Code
- Data Risk
- Testing Gap
- Security Risk
- Documentation Debt

---

## Structural Debt

- Large orchestration components increase coupling and cognitive load
- Scheduling logic is spread across multiple utilities and layers
- Scheduling heuristics duplicated across planner, display, and export paths
- Multiple map abstractions exist without clear ownership or authority
- Legacy fields coexist with newer normalized fields
- Reduction of duplicated heuristics not yet enforced
  - **HIGHT IMPACT** Maps service duplication across hook + util + mock data; unclear single source of truth.
  - **HIGHT IMPACT** Clones inside `src/utils/scheduleUtils.ts`. **This usually means one of these:**
    - the same “scoring / selection” logic got copied into a second function
    - debug logic got duplicated
    - threshold/urgency logic exists twice
    - or two code paths that “should be one” (and probably diverged)
  - **MEDIUM IMPACT**`PostcodeFixesDialog.tsx` duplicated with `PostcodeReviewDialog.tsx` **Many clones**
  - **LOW IMPACT** Basically harmless duplication.
    - MonopolyIcons.tsx repeated blocks (icons usually copy/paste)
    - About.tsx repeated markup
    - small repeated snippets in DedupReviewDialog.tsx
    - EnhancementSelector.tsx repeated block
    - RepStatsPanel.tsx repeated block
    - DriveTimeBar.tsx with VehicleSelector.tsx (shared display snippet)
- Codebase size and structure not yet rationalized end-to-end

### Structural Check:

Dependency Cruiser found no circular dependencies or structural import violations.
This suggests cleanup focus should be on semantic duplication rather than dependency structure.

---

## Semantic Ambiguity

- Deadline enforcement is heuristic rather than strictly constrained
- Replacement logic edge cases are unclear
- Single source of truth for scheduling driver labels is not explicit
- Mock geo boundaries are not strictly enforced
- Priority vs locality tradeoffs are implicit rather than defined
- Follow-up semantics are partially scaffolded but gated

---

## Bugs & Data Integrity Risks

- Potential dedupe data loss during lineage merge
- Encoding corruption present in some UI strings
- Invalid or edge-case postcodes may behave inconsistently
- Schedule determinism not guaranteed across runs
- Replacement/regeneration may surface unexpected ordering behavior

## Deadline bucket summary duplicates / shows conflicting counts after changing deadline range after schedule is generated.

Context:
- Seen on main, port/mock-geo-truth, and feat/mock-geo-truth
- Scheduler/export output appears correct; UI summary/devlog appears inconsistent

Repro:
1. Load same dataset
2. Set schedule range to ~3 months
3. Set a deadline list with a deadline near end -> behaves
4. Shorten the deadline date significantly (e.g. half the range) while keeping same schedule range
5. Observe deadline summary cards: one shows "All X scheduled" while another shows "None scheduled" for the same list/date bucket
6. Export shows all deadline accounts scheduled; mismatch is display/aggregation, not scheduler

Expected:
Single deadline bucket with correct scheduled count (and consistent between UI summary + export)

Actual:
Duplicate/contradictory deadline bucket summaries; one shows scheduled, one shows none, despite export showing all scheduled

Notes / Hypotheses:
- Likely derived grouping key mismatch when deadline changes (e.g. key includes date object/string formatting differences or stale persisted state)
- Possibly merges/lineage list-id differences causing same "label" to appear twice
- Investigate summary aggregation + any memoization/useEffect dependencies related to deadline lists

Acceptance criteria:
- No duplicated deadline bucket labels
- Scheduled count matches export for same selection
- Changing deadline updates summary deterministically without stale "None scheduled" bucket
---

## Legacy / Transitional Code

- Follow-up-by-date logic exists but is disabled
- Google Maps / Places integration exists only in a paused branch
- Mock vs real API boundaries are not strictly enforced
- Transitional abstractions remain after refactors
- Unclear deprecation path for older scheduling fields

---

## Data Risks

- localStorage persistence has size limits
- No backup or recovery path for user data
- In-memory caches may diverge from persisted state
- Data provenance depends on correct lineage merge behavior

---

## Testing Gaps

- No automated unit, integration, or end-to-end tests
- Deterministic scheduling fixtures do not exist
- Edge cases rely on manual validation only
- Explainability behavior is not formally tested

---

## Security Risks

- Client-side API keys (branch-only risk)
- Input validation may be incomplete
- No formal audit of XSS or injection risks

---

## Documentation Debt

- SYSTEM.md must be updated when scheduling semantics change
- PRD.md and SYSTEM.md drift risk if not updated together
- Legacy documentation exists outside canonical docs
- Codebase not yet fully mapped end-to-end
- Explainability guarantees not yet documented formally

---

## Issues Log (2026-02-08)

### Issue: Visit dialog can trigger `Maximum update depth exceeded`
- Category: Bugs
- Severity: High
- Repro steps:
1. Generate a schedule.
2. Open an individual visit dialog from `ScheduleDisplay`.
3. Observe repeated re-renders and console warning about maximum update depth (NEEDS VALIDATION in-browser for exact stack/warning text in this branch state).
- Suspected cause:
1. `useBusinessData` effect depends on `seed` object identity (`[pubId, providers, seed]`) in `src/api/useBusinessData.ts:32`.
2. `VisitScheduler` builds `seed` inline on each render, then calls `useBusinessData` in two places (main component and `SourceDetailsPanel`), creating repeated effect runs and duplicated fetch work:
`src/components/VisitScheduler.tsx:130-131`, `src/components/VisitScheduler.tsx:34-38`.
3. Effect calls `setData` (`src/api/useBusinessData.ts:19`, `src/api/useBusinessData.ts:28`) which feeds the re-render cycle.
- Impacted files/lines:
1. `src/api/useBusinessData.ts:15-32`
2. `src/components/VisitScheduler.tsx:33-38`
3. `src/components/VisitScheduler.tsx:129-132`
- Options:
1. Memoize seed in caller and/or stabilize effect dependency key (preferred).
2. Stop calling hook twice in the same dialog tree; pass shared result to subpanel.
3. Add guard to skip `setData` when resolved object is unchanged.
- Acceptance criteria:
1. Opening visit dialog no longer produces `Maximum update depth exceeded`.
2. Business data request flow runs once per visit per open (or bounded/cached equivalent).

### Issue: Radix dialog description warning risk in active codebase
- Category: Bugs
- Severity: Medium
- Repro steps:
1. Open dialogs using `@radix-ui/react-dialog`.
2. Observe console warnings where content lacks proper description wiring (exact dialog instance for current report NEEDS VALIDATION).
- Suspected cause:
1. Some dialog contents include neither `<Dialog.Description>` nor explicit `aria-describedby={undefined}`.
2. Confirmed at least one content in `src/components/PostcodeFixesDialog.tsx:93` has no visible `Dialog.Description`.
3. `VisitScheduler` itself appears correctly wired (`src/components/VisitScheduler.tsx:292-305`), so reported warning likely originates from another dialog instance unless runtime evidence proves otherwise.
- Impacted files/lines:
1. `src/components/PostcodeFixesDialog.tsx:93`
2. `src/components/VisitScheduler.tsx:290-305` (reference: appears compliant)
- Options:
1. Add `<Dialog.Description className="sr-only">...`.
2. Explicitly set `aria-describedby={undefined}` where no description is intended.
- Acceptance criteria:
1. No Radix “missing Description/aria-describedby” warning in console during dialog usage paths.
2. Dialog accessibility semantics remain valid.

### Issue: Business data pipeline can produce repeated 404/error spam and long loading
- Category: Data Risk
- Severity: High
- Repro steps:
1. Open visit dialog for rows with invalid/unresolvable postcode or ambiguous name.
2. Observe `Loading business data...` and network errors/404s (NEEDS VALIDATION for exact URLs from current runtime data).
- Suspected cause:
1. Provider chain always attempts external endpoints when seed has name/postcode:
`src/api/useBusinessData.ts:13`, `src/api/useBusinessData.ts:21-24`.
2. Postcode requests hit `https://api.postcodes.io/postcodes/{postcode}` (`src/config/api.ts:5`, `src/api/postcodesProvider.ts:30`) and failures are swallowed (`src/api/postcodesProvider.ts:45-47`) without surfacing terminal state to UI.
3. Nominatim requests are throttled queue-based (`src/api/http.ts:6-17`, 1100ms host delay), which can magnify perceived delay when many requests queue.
4. Dialog shows loading until hook resolves (`src/components/VisitScheduler.tsx:41-46`).
- Impacted files/lines:
1. `src/api/useBusinessData.ts:13-32`
2. `src/api/postcodesProvider.ts:30-47`
3. `src/api/nominatimProvider.ts:44-53`
4. `src/api/http.ts:6-17`
5. `src/components/VisitScheduler.tsx:41-46`
- Options:
1. Gate enrichment calls when feature is paused or unavailable in main.
2. Add bounded attempts/fail-fast state for dialog UI.
3. Keep fallback provider but stop long-loading spinner once seed-only/fallback data is available.
- Acceptance criteria:
1. Dialog does not remain in “Loading business data...” for multi-minute periods.
2. Requests are bounded (no repeated spam loop).
3. If upstream is unavailable, UI settles quickly without fake external values.

### Issue: Business hours source-of-truth ambiguity (real vs fallback vs placeholder)
- Category: Legacy / Transitional Code
- Severity: Medium
- Repro steps:
1. Compare “Business Hours” shown in visit dialog with network behavior.
2. Observe hours can appear even when external lookups fail.
- Suspected cause:
1. Fallback provider synthesizes default opening hours immediately (`src/api/fallbackProvider.ts:5-13`, `src/api/fallbackProvider.ts:52-58`).
2. Separate maps/opening-hours utility uses placeholder mock maps service (`src/config/maps.ts:1`, `src/config/maps.ts:54-58`, `src/config/maps.ts:70-89`).
3. Paused Google Places branch summary exists in docs, but provider file is absent on current branch (no `src/api/googlePlacesProvider.ts` in `src/api`).
- Impacted files/lines:
1. `src/api/fallbackProvider.ts:5-13`
2. `src/api/fallbackProvider.ts:52-58`
3. `src/config/maps.ts:54-89`
4. `docs/architecture/BRANCH_SUMMARY_feat-api-google-places.md`
- Options:
1. Document and gate transitional paths explicitly.
2. Label fallback-derived hours in UI.
3. Disable enrichment path on main until API branch is resumed and validated.
- Acceptance criteria:
1. Team can clearly answer which fields are real API, fallback-derived, or placeholder.
2. UI and docs do not imply external truth where values are synthesized.

### Issue: DevTools accessibility warnings for input metadata in visit dialog
- Category: Documentation Debt
- Severity: Medium
- Repro steps:
1. Open visit dialog and inspect DevTools Issues panel.
2. Observe warnings for missing input `id`/`name` and label association (NEEDS VALIDATION for exact browser wording/count).
- Suspected cause:
1. Inputs in `VisitScheduler` use `<label>` wrappers without `htmlFor` + explicit control `id`.
2. Inputs also omit `name`, which can trigger autofill/forms diagnostics.
- Impacted files/lines:
1. `src/components/VisitScheduler.tsx:373-382` (checkbox)
2. `src/components/VisitScheduler.tsx:386-401` (time input)
3. `src/components/VisitScheduler.tsx:425-433` (textarea)
- Options:
1. Add stable `id`/`name` attributes and `htmlFor` linkage.
2. Keep visual behavior unchanged.
- Acceptance criteria:
1. DevTools Issues no longer reports missing label/input association for this dialog.
2. No behavior regression in scheduling form submission/editing.

### Issue: "From your lists" fields may exist in import but not display in visit dialog
- Category: Data Risk
- Severity: Medium
- Repro steps:
1. Import list containing fields such as `landlord`, `last_visited`, `visit_notes`.
2. Open visit dialog "From your lists" panel.
3. Observe subset shown (`phone`, `email`, `notes`, and `extras` only), with some expected fields absent depending on where they are stored.
- Suspected cause:
1. `seedFromPub` forwards only selected top-level fields + `extras`; it does not map `landlord`/`last_visited` into first-class business fields (`src/utils/seedFromPub.ts:38-49`).
2. `SourceDetailsPanel` renders only specific core fields plus `extras` (`src/components/VisitScheduler.tsx:80-86`, `src/components/VisitScheduler.tsx:98-109`).
3. Import path stores some fields on top-level pub (`landlord`, `last_visited`) and not guaranteed in `extras` (`src/components/FileUploader.tsx:298-301`, `src/components/FileUploader.tsx:350-353`), so they may not appear unless promoted or copied into extras.
- Impacted files/lines:
1. `src/utils/seedFromPub.ts:38-49`
2. `src/components/VisitScheduler.tsx:80-86`
3. `src/components/VisitScheduler.tsx:98-109`
4. `src/components/FileUploader.tsx:298-301`
5. `src/components/FileUploader.tsx:350-353`
- Options:
1. Confirm canonical display contract for “From your lists” and map selected fields explicitly.
2. Preserve additional raw extras under a dev-only or collapsible section.
3. If fields are dropped upstream, trace and patch mapping/persistence path.
- Acceptance criteria:
1. For chosen supported fields, if present at runtime they are visible in dialog.
2. If missing, issue path documents exact drop stage with evidence.

---

## Meta-Level Risks

- Adding new features before resolving duplication increases complexity
- Lack of determinism complicates debugging and testing
- Cognitive load may slow future contributors
- Without strict documentation discipline, drift will recur
