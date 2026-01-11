# SYSTEM — IC Journey Planner (As-Is)

## Purpose

This document describes the current, observable behavior of the IC Journey Planner as implemented in the main branch.

It is factual, code-backed, and non-aspirational.

---

## High-Level Overview

IC Journey Planner is a browser-based planning tool for field sales representatives.  
It ingests Excel files containing account data, normalizes and deduplicates records, and produces a multi-day visit schedule using heuristic prioritization and locality logic.

All state is client-side.

---

## Technology Stack (Current)

- React 18 + TypeScript
- Vite 6.4.1
- Tailwind CSS
- React Context API
- localStorage persistence
- xlsx-js-style (Excel ingestion)
- date-fns (date handling)

### API / Mapping / Geo

- Mock distance + locality heuristics in main
- Google Maps / Places integration exists only in paused branch
- No live routing or turn-by-turn optimization
- Multi-provider business data enrichment chain:
  - Postcodes API (UK postcode data)
  - Google Places API (in development branch)
  - Nominatim/OpenStreetMap (geocoding)
  - Fallback provider (defaults)
- Opening hours detection and display
- Business information enrichment (phone, website, ratings)

---

## Core Capabilities (As Implemented)

### User accounts `all must be improved / configured`

- Persisting user login
- Master House List auto applied to x user
- CRM / Repsly visited auto applied to x user
-
- Generated schedule saves unless user request to 'start over'

### File Ingestion

- Excel upload (Masterfile + optional lists)
- Column Mapping Wizard
- Required fields enforced (name, postcode)
- Extras preserved
- Postcode validation & review step

### Deduplication & Lineage

- Fuzzy matching on key fields
- Canonical pub record with source lineage
- Effective scheduling plan derived from merged sources

### Scheduling

- Driver buckets: deadline → follow-up (gated) → priority → baseline
- Deadline semantics: scheduled on or before target date where possible
- Locality clustering via mock geo truth
- Configurable visits per day
- Business/weekdays calculation
- Home address-based route planning `logic test`
- Configurable search radius planning `logic test`
- Heuristic, not deterministic routing `what does this mean`
- Capacity-based day filling
- Account within OPEN hours `flags fake hours, doesn't honor`

### Schedule Interaction

- Schedule display (daily / weekly)
- Drag-and-drop rescheduling `dont think so - logic test`
- Replacement / regeneration / deletion `logic improvement`
  - Unscheduled pubs panel `where/how`
  - Nearby pubs panel `used to exist, logic/where`
- Daily Drive time calculations `remove/update lying placeholder`
- Visit notes
- Visit book anytime / specific time
- Daily HOME BY X TIME configuration `logic improvement`
- Daily journey maps link `daily? all visits? in order?`

### Export & Reporting

- Styled Excel export
- ICS calendar export
- Coverage heat maps Patch / RTM `did exist but where now?`
- Rep Stats Panel
  - Request vs Scheduled days / visits
  - Icon flags unexpected effected days (with why)
  - Full schedule milage counter `remove/update lying placeholder`

---

## Data Model & Persistence

- All user data stored in localStorage
- User-scoped persistence keys
- No backend sync
- Schedule persisted separately from raw data

---

## Source Structure (Condensed)

- `src/pages/PlannerDashboard.tsx` — orchestration
- `src/utils/scheduleUtils.ts` — scheduling logic
- `src/context/PubDataContext.tsx` — data & state
- `src/utils/dedupe.ts` — deduplication
- `src/api/*` — enrichment providers
- `src/services/persistence.ts` — storage

---

## Known Gaps (As-Is Facts)

- Follow-up-by-date logic is gated / deferred
- Determinism not guaranteed across runs
- No automated test coverage
- No backend or auth-scoped persistence

(See `docs/ISSUES.md` for risks.)
