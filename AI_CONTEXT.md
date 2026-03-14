# AI_CONTEXT.md — IC Journey Planner

> Read this first at the start of every AI session. ~400 words. Last updated: 2026-03-14.

---

## What this is

A **frontend-only** React + TypeScript visit-scheduling tool for a UK field sales rep.
Core flow: upload Excel lists → map columns → dedupe/postcode review → generate schedule → export.
No backend. No database. All state in browser localStorage.

Stack: React 18, TypeScript 5, Vite 6, Tailwind CSS, Radix UI, xlsx-js-style, date-fns, ics.
Node version: 24.11.0 (see `package.json engines`).

---

## Working features (main branch)

- Excel file upload + column mapping wizard (fuzzy matching)
- UK postcode validation and review flow
- Duplicate venue detection and merge
- Heuristic visit scheduling (deadline/priority/locality balancing)
- Business data enrichment via postcodes.io + Nominatim (OpenStreetMap)
- Visit dialog with notes, time, imported data display
- Excel export + ICS calendar export
- Stats/deadline summary panel
- localStorage persistence (per guest user ID)

---

## NOT yet built (deferred)

- **Follow-up-by-date scheduling** — gated; design in `docs/architecture/followup-by-date.md`
- **Google Places API** — paused branch (`feat/api-google-places`); needs backend before merging
- **Real maps/routing** — `src/config/maps.ts` and `src/geo/mockGeo.ts` are explicit mocks
- **Auth / login** — scaffolded (`LoginGate.tsx`, `AuthContext.tsx`) but disabled; future Supabase
- **Backend/sync** — no server; all data is client-side only

---

## Archived docs (do not edit)

- `docs/architecture/BRANCH_SUMMARY_feat-api-google-places.md` — paused Google Places branch notes
- `docs/architecture/followup-by-date.md` — deferred follow-up scheduling design

---

## Canonical doc routing

| What | Where |
|------|-------|
| Operating rules | `docs/architecture/CODEX_RULES.md` |
| Current behavior (as-is) | `docs/architecture/SYSTEM.md` |
| Intended behavior | `docs/architecture/PRD.md` |
| Issue ledger | `docs/architecture/ISSUES.md` |
| Execution queue | `docs/audits/TRIAGE_TASKLIST.md` |

---

## How to help

### Before any implementation
1. Read `docs/architecture/CODEX_RULES.md` (always)
2. Check `docs/architecture/ISSUES.md` for related open issues
3. State goal, files touched, risks, options — get approval before executing

### Coding conventions
- **File naming**: PascalCase for components (`ScheduleDisplay.tsx`), camelCase for utils/hooks
- **Component location**: `src/components/` (UI), `src/pages/` (route-level), `src/hooks/` (custom hooks)
- **Utilities**: `src/utils/` — pure functions; no React imports
- **API/data**: `src/api/` — providers implement `BusinessDataProvider` interface
- **State**: React Context only (`src/context/`); no Redux, no Zustand
- **Styling**: Tailwind utility classes only; no inline styles, no CSS modules
- **Logging**: `devLog()` from `src/utils/devLog.ts` — dev-only; never `console.log` directly
- **Types**: Prefer extending existing types in `src/types.ts`, `src/api/types.ts`, `src/context/PubDataContext.tsx`

### Key architectural facts
- `PubDataContext.tsx` is the app's single source of truth for all pub/schedule state
- `scheduleUtils.ts:planVisits()` is the core scheduling algorithm — handle with care
- `src/config/maps.ts` is a **mock** — do not use it for real data
- `src/geo/mockGeo.ts` powers all distance calculations with postcode-based heuristics — not real GPS
- `zip` field on `Pub` is the legacy postcode field; `postcodeMeta.normalized` is authoritative
- `ListType = 'wins'` means "follow-up by" list (confusing name — do not change without migrating localStorage keys)

### Definition of done (every task)
```
npm run lint > docs/audits/knip_lint/eslint_report_latest.txt
npm run typecheck
npm run build
```
Dev smoke test if UI flows changed.

---

## Do NOT modify without discussion

| Path | Why |
|------|-----|
| `_archive/src/` | Archived code — intentionally preserved, not dead |
| `docs/architecture/BRANCH_SUMMARY_feat-api-google-places.md` | Archived doc — paused work |
| `docs/architecture/followup-by-date.md` | Archived doc — deferred design |
| `src/services/persistence.ts` + storage keys (`jp.v1.*`) | Changing storage keys breaks existing user data |
| `src/context/PubDataContext.tsx` — `ListType` values | Used as localStorage keys; renaming silently breaks persistence |
| `vite.config.ts` proxy section | Google Places proxy config — branch only, do not activate without backend |
