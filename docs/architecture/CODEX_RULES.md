# Codex Operating Rules

## Purpose

This document defines how Codex and maintainers execute work in this repository.
It is authoritative for AI-assisted execution and documentation discipline.

---

## Core Principles

- Evidence first: do not invent facts.
- If uncertain, write `UNKNOWN` or `NEEDS VALIDATION`.
- Preserve behavior unless change is explicitly approved.
- Keep scope tight to the approved task.
- Keep docs and code in sync when behavior changes.

---

## Reading Tiers

Use the smallest tier that satisfies the task.

### Tier 0 (always read)

- `docs/architecture/CODEX_RULES.md`
- Relevant sections of `docs/architecture/SYSTEM.md` and `docs/architecture/PRD.md`
- Target code files being changed/audited

### Tier 1 (read relevant sections)

Read when task includes planning, diagnosis, or issue triage (read tier 0 + teir 1):

- `docs/architecture/ISSUES.md`
- `docs/audits/TRIAGE_TASKLIST.md`

### Tier 2 (full read)

Full read is required for governance/doc-refactor/planning passes (read all tiers 0-2):

- Full `docs/architecture/ISSUES.md`
- Full `docs/audits/TRIAGE_TASKLIST.md`

---

## Modes of Work

### Planning Mode

Allowed:

- Reading code and docs
- Tracing flows and risks
- Writing/refining docs
- Proposing options and tradeoffs

Not allowed without explicit approval:

- Runtime behavior changes
- Refactors beyond approved scope

### Implementation Mode

Implementation may begin only after explicit user approval to execute.

---

## Task Lifecycle

### 1. Pre-start brief

State:

- Goal (relivant issue detail, with `triage_tasklist.md`)
- Pre-task audit
  - Identify:
    - Files touched
    - Dependencies and coupling risks
    - Potential regressions
    - Any duplicated or similar logic within the codebase? If yes, code example and explanation of task/duplicated logic differences.
- Current state (current code-backed)
- Assumptions
- Risks
- Options considered
- Recommended approach

### 2. Execution

Rules:

- Incremental, scoped changes
- No silent behavior changes
- Record unknowns explicitly

### 3. Post-task debrief

Report:

- What changed
- Files touched
- Tests/checks run
- Open/new questions
- New issues/doc debt created
- Suggested next step(s)

---

## Definition of Done (implementation tasks)

Run and report all checks below unless explicitly waived by user:

1. `npm run lint > docs/audits/knip_lint/eslint_report_latest.txt`
2. `npm run typecheck`
3. `npm run build`
4. Dev smoke test when UI flows changed

Notes:

- If lint exits non-zero, the redirected report remains authoritative.
  - Follow `# Lint Triage + Lint Rules (must read rules before action)` section Rules within `docs/architecture/TRIAGE_TASKLIST.md`
- Do not claim completion without reporting check outcomes.

---

## Completion Sync Rule

When a triage item is completed:

1. Update `docs/audits/TRIAGE_TASKLIST.md`
2. Update the linked issue entry in `docs/architecture/ISSUES.md`

Required issue updates on completion:

- Status
- Resolution date
- Commit reference(s)
- Any acceptance-criteria note

Only update dependent/related issues if the completed task actually impacted them.

---

## Documentation Update Scope Rule

Only update other docs (`PRD`, `SYSTEM`, `PROJECT_SUMMARY`, `README`, branch summaries, etc.) when:

1. The current task changes the behavior/feature those docs describe, or
2. A contradiction is proven by direct code evidence

If contradiction is suspected but not proven:

- Do not rewrite the claim as fact
- Add Doc Debt issue in `docs/architecture/ISSUES.md` with `NEEDS VALIDATION`

---

## Evidence-based Documentation Rules

- Documentation updates must be backed by inspected code and/or validated outputs.
- Prefer file/line references when possible.
- Mark uncertainty explicitly with `UNKNOWN` or `NEEDS VALIDATION`.

---

## Discovery Protocol

If you discover bugs, architectural risk, duplicate logic, or unclear intent:

1. Record findings in task debrief
2. Add update issue entry in `docs/architecture/ISSUES.md`
3. Decide explicitly: in scope now or deferred

---

## Git Discipline

- No new branches, merges, or history rewrites unless instructed.
- Keep commits scoped and descriptive.
- Do not amend/rebase shared history without approval.
