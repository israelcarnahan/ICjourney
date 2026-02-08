# PRD - IC Journey Planner (Intended Behavior)

## Purpose

This document captures intended product behavior and target semantics.
For current code-backed behavior, see `docs/architecture/SYSTEM.md`.

---

## Canonical Docs Routing

- Operating rules: `docs/architecture/CODEX_RULES.md`
- Issue ledger: `docs/architecture/ISSUES.md`
- Execution queue: `docs/audits/TRIAGE_TASKLIST.md`

---

## Product Goal

Enable reps to generate explainable, constraint-aware visit schedules that respect deadlines, follow-ups, priorities, and locality.

---

## Intended User Flow

1. Login
2. Upload Masterfile
3. Upload optional lists
4. Map columns
5. Resolve duplicates and postcode issues
6. Configure schedule settings
7. Review and adjust
8. Export

---

## Scheduling Semantics (Intended)

### Deadline (Visit-by)

- A constraint, not "schedule first at all costs"
- Visits may occur any day on or before the date
- Violations must be explainable

### Follow-up-by (Deferred)

- Follow-up derived from `last_visited` plus list-level offset
- Explicitly deferred in main branch

### Priority

- Relative ordering only
- Must not override hard constraints

### Locality

- Prefer closer visits where constraints allow
- Must not violate deadline constraints solely for distance optimization

---

## Deferred / Future

- Follow-up-by-date scheduling: `docs/architecture/followup-by-date.md`
- Real maps/routing integration path: `docs/architecture/BRANCH_SUMMARY_feat-api-google-places.md`
- Backend persistence
