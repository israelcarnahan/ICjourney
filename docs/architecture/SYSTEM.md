# SYSTEM - IC Journey Planner (As-Is)

## Purpose

This document describes current behavior in the main branch based on inspected code.
For intended future behavior, see `docs/architecture/PRD.md`.

---

## Canonical Docs Routing

- Operating rules: `docs/architecture/CODEX_RULES.md`
- Issue ledger: `docs/architecture/ISSUES.md`
- Execution queue: `docs/audits/TRIAGE_TASKLIST.md`

---

## High-level Architecture

- Frontend-only React + TypeScript application.
- Primary orchestration in `src/pages/PlannerDashboard.tsx`.
- Core state in `src/context/PubDataContext.tsx` persisted to localStorage.
- Scheduling logic in `src/utils/scheduleUtils.ts`.
- Import/mapping/dedupe pipeline centered in `src/components/FileUploader.tsx` and lineage utilities.

---

## Data Source Reality Matrix (verified)

### Real external endpoints (main branch)

- Postcodes API: `https://api.postcodes.io/postcodes/...`
  - `src/api/postcodesProvider.ts`
- Nominatim/OpenStreetMap search:
  - `https://nominatim.openstreetmap.org/search`
  - `src/api/nominatimProvider.ts`

### Fallback/synthesized behavior

- Default opening-hours synthesis when data is missing:
  - `src/api/fallbackProvider.ts`

### Placeholder/mock behavior in main

- Maps service is placeholder/mock (geocoder + place details):
  - `src/config/maps.ts`

### Paused/branch-only behavior

- Google Places provider integration is documented in a paused branch summary and is not present as an active provider file in current main source.
  - `docs/architecture/BRANCH_SUMMARY_feat-api-google-places.md`

---

## Core Functional Areas (as implemented)

### Import and normalization

- Excel upload and column mapping wizard.
- Required mapping fields enforced (`name`, `postcode`).
- Postcode review flow and dedupe review flow.
- Source metadata and extras retained for lineage-oriented display.

### Scheduling

- Heuristic scheduling with priority/deadline/locality balancing.
- Configurable visits/day, business days, home postcode, search radius.
- Follow-up mode remains deferred/gated.

### Schedule interaction

- Day expansion, visit scheduling dialog, replace/delete/regenerate actions.
- Drive-time/mileage summaries are generated from current scheduling data paths.

### Export

- Excel export.
- ICS calendar export.

---

## Persistence

- User files and schedule state persisted client-side (localStorage and app persistence helpers).
- No backend sync in main branch.

---

## Known Gaps (code-backed)

- Deterministic scheduling guarantees are not formally test-backed.
- Follow-up-by-date is deferred.
- Automated test coverage is not established.
- Main branch still contains transitional boundaries between real endpoints and placeholder services.

Refer to `docs/architecture/ISSUES.md` for tracked severity/status/acceptance criteria.
