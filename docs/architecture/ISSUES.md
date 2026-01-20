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

## Meta-Level Risks

- Adding new features before resolving duplication increases complexity
- Lack of determinism complicates debugging and testing
- Cognitive load may slow future contributors
- Without strict documentation discipline, drift will recur
