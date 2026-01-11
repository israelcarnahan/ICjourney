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
- Codebase size and structure not yet rationalized end-to-end

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
