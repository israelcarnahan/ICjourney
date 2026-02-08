# IC Journey Planner - Project Summary

## Purpose

This is a high-level orientation summary.
Authoritative execution and behavior references are:

- `docs/architecture/CODEX_RULES.md`
- `docs/architecture/SYSTEM.md`
- `docs/architecture/ISSUES.md`
- `docs/audits/TRIAGE_TASKLIST.md`

---

## Current Snapshot (code-backed)

- Frontend: React + TypeScript + Vite.
- State: React Context + localStorage/persistence helpers.
- Core planner flow: upload -> mapping -> dedupe/postcode review -> schedule generation -> export.
- Business-data enrichment in main uses:
  - Postcodes API
  - Nominatim/OpenStreetMap
  - Fallback provider
- Maps service in main is placeholder/mock (`src/config/maps.ts`).
- Google Places integration is paused branch work, not active in current main source.

---

## What this file is not

- Not a source-of-truth issue ledger (use `ISSUES.md`).
- Not an active execution queue (use `TRIAGE_TASKLIST.md`).
- Not operating rules (use `CODEX_RULES.md`).

---

## Active Improvement Themes

- Reduce scheduler/orchestration complexity and duplication.
- Improve deterministic behavior and fixture-backed validation.
- Clarify mock vs real boundaries in docs and implementation.
- Maintain strict completion sync between TRIAGE and ISSUES.

See open items and statuses in `docs/architecture/ISSUES.md`.
