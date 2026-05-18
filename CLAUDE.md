# CLAUDE.md — IC Journey Planner

> Read this at the start of every AI session. Applies to all AI assistants working in this repo: Claude, Codex, Cursor, and any future tools. ~700 words. Last updated: 2026-05-18.

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
- **Google Places API enrichment** — paused branch (`feat/api-google-places`); needs backend proxy before merging
- **Real maps/routing** — `src/config/maps.ts` and `src/geo/mockGeo.ts` are explicit mocks
- **Auth / login** — scaffolded (`LoginGate.tsx`, `AuthContext.tsx`) but disabled; future Supabase
- **Backend/sync** — no server; all data is client-side only
- **New company priority code system** — G1–G4, K1–K4, P1–P5, M_G1–M_G4, M_P1–M_P5 — tracked as N9 in `docs/architecture/TRIAGE.md`

---

## Canonical doc routing

| What | Where |
|------|-------|
| AI/dev operating rules (this file) | `CLAUDE.md` |
| Current behaviour (as-is) | `docs/architecture/SYSTEM.md` |
| Intended behaviour + roadmap | `docs/architecture/PRD.md` |
| All issues, tasks, and attack plan | `docs/architecture/TRIAGE.md` |
| Root entry point for new devs | `README.md` |

---

## Archived docs (do not edit)

- `_archive/BRANCH_SUMMARY_feat-api-google-places.md` — paused Google Places branch notes
- `docs/architecture/followup-by-date.md` — deferred follow-up scheduling design

---

## Core Principles

- Evidence first: do not invent facts.
- If uncertain, write `UNKNOWN` or `NEEDS VALIDATION`.
- Preserve behaviour unless change is explicitly approved.
- Keep scope tight to the approved task.
- Keep docs and code in sync when behaviour changes.

---

## Reading Tiers

Use the smallest tier that satisfies the task.

### Tier 0 (always read)

- `CLAUDE.md` (this file)
- Relevant sections of `docs/architecture/SYSTEM.md` and `docs/architecture/PRD.md`
- Target code files being changed/audited

### Tier 1 (read when planning, diagnosing, or triaging)

- Relevant sections of `docs/architecture/TRIAGE.md`

### Tier 2 (full read — governance, doc-refactor, or planning passes)

- Full `docs/architecture/TRIAGE.md`

---

## Modes of Work

### Planning Mode

Allowed:
- Reading code and docs
- Tracing flows and risks
- Writing/refining docs
- Proposing options and tradeoffs

Not allowed without explicit user approval:
- Runtime behaviour changes
- Refactors beyond approved scope

### Implementation Mode

Implementation may begin only after explicit user approval to execute.

---

## Task Lifecycle

### 1. Pre-start brief

State:
- Goal (relevant task code + detail from `docs/architecture/TRIAGE.md`)
- Pre-task audit:
  - Files touched
  - Dependencies and coupling risks
  - Potential regressions
  - Any duplicated or similar logic in the codebase (with code example and explanation)
- Current state (code-backed)
- Assumptions
- Risks
- Options considered
- Recommended approach

### 2. Execution

Rules:
- Incremental, scoped changes
- No silent behaviour changes
- Record unknowns explicitly

### 3. Post-task debrief

Report:
- What changed
- Files touched
- Tests/checks run
- Open/new questions
- New issues or doc debt created
- Suggested next step(s)

---

## Definition of Done

Run and report all checks below unless explicitly waived by user:

1. `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
2. `npm run typecheck`
3. `npm run build`
4. Dev smoke test when UI flows changed

Notes:
- If lint exits non-zero, the redirected report remains authoritative.
- Follow ESLint triage rules in `docs/architecture/TRIAGE.md` before acting on lint errors.
- Do not claim completion without reporting check outcomes.

---

## Completion Sync Rule

When a task is completed:

1. Update status in `docs/architecture/TRIAGE.md`
2. Move task to the Completed Archive section with:
   - Resolution date
   - Commit reference(s)
   - Acceptance-criteria outcome note

Only update dependent/related tasks if the completed work actually impacted them.

---

## Documentation Update Scope Rule

Only update other docs (`PRD`, `SYSTEM`, `README`, branch summaries, etc.) when:

1. The current task changes the behaviour/feature those docs describe, or
2. A contradiction is proven by direct code evidence

If contradiction is suspected but not proven:
- Do not rewrite the claim as fact
- Add a doc debt note in `docs/architecture/TRIAGE.md` with `NEEDS VALIDATION`

---

## Evidence-based Documentation Rules

- Documentation updates must be backed by inspected code and/or validated outputs.
- Prefer file/line references when possible.
- Mark uncertainty explicitly with `UNKNOWN` or `NEEDS VALIDATION`.

---

## Discovery Protocol

If you discover bugs, architectural risk, duplicate logic, or unclear intent:

1. Record findings in task debrief
2. Add or update a task entry in `docs/architecture/TRIAGE.md`
3. Decide explicitly: in scope now or deferred

---

## Coding Conventions

- **File naming**: PascalCase for components (`ScheduleDisplay.tsx`), camelCase for utils/hooks
- **Component location**: `src/components/` (UI), `src/pages/` (route-level), `src/hooks/` (custom hooks)
- **Utilities**: `src/utils/` — pure functions; no React imports
- **API/data**: `src/api/` — providers implement `BusinessDataProvider` interface
- **State**: React Context only (`src/context/`); no Redux, no Zustand
- **Styling**: Tailwind utility classes only; no inline styles, no CSS modules
- **Logging**: `devLog()` from `src/utils/devLog.ts` — dev-only; never `console.log` directly
- **Types**: Prefer extending existing types in `src/types.ts`, `src/api/types.ts`, `src/context/PubDataContext.tsx`

---

## Key Architectural Facts

- `PubDataContext.tsx` is the app's single source of truth for all pub/schedule state
- `scheduleUtils.ts:planVisits()` is the core scheduling algorithm — handle with care
- `src/config/maps.ts` is a **mock** — do not use it for real data
- `src/geo/mockGeo.ts` powers all distance calculations with postcode-based heuristics — not real GPS
- `zip` field on `Pub` is the legacy postcode field; `postcodeMeta.normalized` is authoritative
- `ListType = 'wins'` means "follow-up by" list (confusing name — do not change without migrating localStorage keys)

---

## Do NOT Modify Without Discussion

| Path | Why |
|------|-----|
| `_archive/src/` | Archived code — intentionally preserved, not dead |
| `_archive/BRANCH_SUMMARY_feat-api-google-places.md` | Archived doc — paused branch work |
| `docs/architecture/followup-by-date.md` | Archived doc — deferred design |
| `src/services/persistence.ts` + storage keys (`jp.v1.*`) | Changing storage keys breaks existing user data |
| `src/context/PubDataContext.tsx` — `ListType` values | Used as localStorage keys; renaming silently breaks persistence |
| `vite.config.ts` proxy section | Google Places proxy config — branch only; do not activate without backend |

---

## Git Discipline

- No new branches, merges, or history rewrites unless instructed.
- Keep commits scoped and descriptive.
- Do not amend/rebase shared history without approval.
