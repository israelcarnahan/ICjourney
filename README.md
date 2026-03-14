# IC Journey Planner

A frontend-only visit-scheduling tool for UK field sales representatives. Upload your Excel lists, resolve postcodes and duplicates, and generate a constraint-aware day-by-day schedule — then export to Excel or calendar.

---

## Contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Architecture overview](#architecture-overview)
- [Documentation](#documentation)
- [Known issues and roadmap](#known-issues-and-roadmap)

---

## What it does

1. **Upload** — drag-and-drop `.xlsx` files (masterfile, priority lists, follow-up lists, unvisited targets)
2. **Map columns** — a fuzzy-matching wizard guesses which column is "pub name", "postcode", etc; you confirm
3. **Review** — resolve invalid UK postcodes and merge duplicate venues across files
4. **Schedule** — a heuristic algorithm builds a day-by-day visit plan that respects deadlines, priorities, and geographic locality
5. **Inspect** — click any visit to see enriched business data (phone, address, opening hours) fetched live from postcodes.io and OpenStreetMap
6. **Export** — download as `.xlsx` or `.ics` (imports into Outlook, Google Calendar, Apple Calendar)

All data is stored in the browser (`localStorage`). There is no server, no database, and no sign-in required.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 + TypeScript 5 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 3 |
| Components | Radix UI (dialogs, tooltips, radio groups) |
| Routing | React Router DOM 6 |
| Excel I/O | xlsx-js-style |
| Calendar export | ics |
| Date math | date-fns |
| Icons | lucide-react |
| External APIs | [postcodes.io](https://postcodes.io) (free, no key), [Nominatim/OpenStreetMap](https://nominatim.org) (free, no key) |

---

## Prerequisites

- **Node.js** `24.11.0` — version is pinned in `package.json` `engines` field. Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to switch versions.
- **npm** — comes with Node; no Yarn or pnpm required.

---

## Getting started

```bash
# 1. Clone the repo
git clone <repo-url>
cd icjourney

# 2. Install dependencies
npm install

# 3. Copy the environment file and review it
cp .env.example .env

# 4. Start the development server
npm run dev
```

The app runs at `http://localhost:5173` by default.

No API keys are required to run the app. The only external calls are to free public APIs (postcodes.io and Nominatim).

---

## Available scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript compile + Vite production build |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run `tsc --noEmit` without building (fast type check) |
| `npm run lint` | Run ESLint across all source files |
| `npm run audit:dates` | Run the date audit script (`scripts/audit-dates.mjs`) |
| `npm run schedule:run` | Run the schedule script (`scripts/run-schedule.mjs`) via tsx |

### Definition of done (for every code change)

Run all three before committing and report results:

```bash
npm run lint > docs/audits/knip_lint/eslint_report_latest.txt
npm run typecheck
npm run build
```

A pre-push hook runs `typecheck` automatically. Do not skip it.

---

## Environment variables

Copy `.env.example` to `.env`. The only variable that affects runtime behaviour is:

| Variable | Default | Effect |
|----------|---------|--------|
| `VITE_ENABLE_AUTH` | `false` | Set to `true` to show the login gate (currently a placeholder for future Supabase auth). Leave `false` for normal guest-mode use. |

All other variables in `.env.example` are either cosmetic or reserved for future use and have no current effect on the app.

> **Note:** There is no backend server. `VITE_API_BASE_URL` in the example file is aspirational and is not called by any code in `main`.

---

## Project structure

```
icjourney/
├── src/
│   ├── api/              # External data providers (postcodes.io, Nominatim, fallback)
│   ├── components/       # Reusable UI components
│   │   └── planner/      # Sub-components scoped to the planner page
│   ├── config/           # App-level config (maps placeholder, API config)
│   ├── context/          # React Context providers (PubDataContext, AuthContext)
│   ├── geo/              # Postcode-based proximity/distance logic (mock, not GPS)
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Route-level page components
│   ├── services/         # localStorage persistence layer
│   ├── types/            # TypeScript type declarations and shims
│   └── utils/            # Pure utility functions (scheduling, dedup, lineage, etc.)
├── docs/
│   ├── architecture/     # Design docs: SYSTEM, PRD, ISSUES, CODEX_RULES
│   └── audits/           # Lint reports, JSCPD clone reports, triage task list
├── testFiles/            # Manual test Excel files (not automated tests)
├── _archive/src/         # Deliberately archived components and utilities
├── scripts/              # Node utility scripts (audit-dates, run-schedule)
├── AI_CONTEXT.md         # AI assistant context file — read at start of every AI session
├── .env.example          # Environment variable template
└── vite.config.ts        # Vite build and dev-server configuration
```

### Key files to know

| File | Role |
|------|------|
| `src/pages/PlannerDashboard.tsx` | Main orchestrator — the heart of the app |
| `src/context/PubDataContext.tsx` | Single source of truth for all pub and schedule state |
| `src/utils/scheduleUtils.ts` | Core scheduling algorithm (`planVisits`) |
| `src/api/useBusinessData.ts` | Provider chain hook (postcodes → Nominatim → fallback) |
| `src/services/persistence.ts` | localStorage read/write with versioned keys (`jp.v1.*`) |
| `src/geo/mockGeo.ts` | Postcode proximity scoring — **not real GPS, heuristic only** |
| `src/config/maps.ts` | Maps service — **placeholder/mock, returns hardcoded data** |

---

## Architecture overview

The app is entirely frontend. There is no backend.

```
Browser
│
├── React Context (PubDataContext)  ←── localStorage (jp.v1.*)
│       │
│       ├── FileUploader → ColumnMappingWizard → PostcodeReviewDialog → DedupReviewDialog
│       │         (import pipeline)
│       │
│       ├── PlannerDashboard → scheduleUtils.planVisits()
│       │         (scheduling engine — heuristic, postcode-based)
│       │
│       ├── ScheduleDisplay → VisitScheduler dialog
│       │         (schedule view + visit editing)
│       │
│       └── RepStatsPanel + UnscheduledPubsPanel
│                 (summary stats)
│
└── External APIs (called per-visit on dialog open)
        ├── postcodes.io  (postcode → lat/lng, region)
        └── Nominatim/OSM (name + postcode → address, phone)
```

**Data lives in the browser only.** Clearing browser storage clears all your data. Use the Excel export as your backup before clearing.

### What is and isn't real

| Feature | Status |
|---------|--------|
| Postcode lookup (postcodes.io) | ✅ Real external API |
| Address/phone lookup (Nominatim) | ✅ Real external API |
| Distance calculations | ⚠️ Heuristic (postcode proximity, not GPS routing) |
| Opening hours | ⚠️ Synthesised fallback — not real |
| Maps/routing | ❌ Placeholder — `src/config/maps.ts` returns hardcoded data |
| Google Places enrichment | 🔒 Paused branch — not in `main` |

---

## Documentation

All design and operational documentation lives in [`docs/architecture/`](docs/architecture/).

| Document | Purpose |
|----------|---------|
| [`docs/architecture/CODEX_RULES.md`](docs/architecture/CODEX_RULES.md) | Operating rules for AI-assisted and human development — **read this before any code change** |
| [`docs/architecture/SYSTEM.md`](docs/architecture/SYSTEM.md) | Current code-backed behaviour (as-is reference) |
| [`docs/architecture/PRD.md`](docs/architecture/PRD.md) | Intended product behaviour and scheduling semantics |
| [`docs/architecture/ISSUES.md`](docs/architecture/ISSUES.md) | Source-of-truth issue ledger (bugs, debt, risks) |
| [`docs/audits/TRIAGE_TASKLIST.md`](docs/audits/TRIAGE_TASKLIST.md) | Active execution queue and attack plan |
| [`docs/architecture/PROJECT_SUMMARY.md`](docs/architecture/PROJECT_SUMMARY.md) | High-level orientation summary |
| [`AI_CONTEXT.md`](AI_CONTEXT.md) | Compact context file for AI assistants — load at session start |

### Deferred / archived docs (do not edit)

- [`docs/architecture/BRANCH_SUMMARY_feat-api-google-places.md`](docs/architecture/BRANCH_SUMMARY_feat-api-google-places.md) — notes for paused Google Places branch
- [`docs/architecture/followup-by-date.md`](docs/architecture/followup-by-date.md) — deferred follow-up scheduling design

---

## Known issues and roadmap

There are currently **34 open issues** tracked in [`docs/architecture/ISSUES.md`](docs/architecture/ISSUES.md). Top priorities:

| Issue | Severity | Summary |
|-------|----------|---------|
| `bug-deadline-bucket-conflict` | 🔴 High | Summary stats can show wrong deadline counts after date edits |
| `bug-schedule-determinism` | 🔴 High | Same inputs may produce different schedule ordering across runs |
| `data-risk-provenance-merge-loss` | 🔴 High | Dedupe merge may silently drop imported field data |
| `testing-gap-no-automated-suite` | 🔴 High | No automated tests — all validation is manual |
| `structural-debt-scheduling-duplication` | 🔴 High | Scheduling logic duplicated across utility and display layers |

See [`docs/audits/TRIAGE_TASKLIST.md`](docs/audits/TRIAGE_TASKLIST.md) for the phased attack plan.

### On the roadmap (not yet built)

- Follow-up-by-date scheduling (design complete, gated on data quality)
- Google Places API enrichment (branch exists, needs backend proxy before merge)
- Real routing and drive-time calculations
- Backend persistence / multi-device sync (Supabase planned)

---

## Development guidelines

- Follow the task lifecycle in [`docs/architecture/CODEX_RULES.md`](docs/architecture/CODEX_RULES.md) for all changes
- Use `devLog()` (not `console.log`) for all debug output
- Do not modify `_archive/src/` — archived files are preserved intentionally
- Do not change localStorage key prefixes (`jp.v1.*`) without a migration plan
- Do not change `ListType` string values without auditing all persistence paths
- Always run lint + typecheck + build and report results before marking a task done

---

*Built by Israel Carnahan — original algorithm and business logic.*
