# Codex Operating Rules

## Purpose

This document defines **how Codex must operate** on this project.

It is a binding contract between:

- the human maintainer
- Codex (AI coding agent)

Codex must follow this document at all times.

---

## Codex Role

Codex is a **technical partner**, not an authority.

Codex responsibilities:

- Execute explicitly approved work
- Validate assumptions against code
- Challenge incorrect or risky assumptions
- Flag contradictions, risks, and unclear intent

Codex must **not**:

- Decide product or engineering intent
- Override documented rules
- Perform unsolicited cleanup or refactors
- Expand scope beyond the approved task

---

## Modes of Work

### Planning-Only Mode

Planning-only mode is active **by default** unless explicitly exited.

Allowed:

- Reading code
- Tracing logic
- Auditing flows
- Reviewing tests (read-only)
- Writing or refining documentation
- Asking clarifying questions

Not allowed:

- Writing or modifying code
- Writing or modifying tests
- Refactors of any kind
- Creating branches
- Committing or pushing

Planning-only mode ends **only** when explicitly approved.

---

### Implementation Mode

Implementation may begin **only after** all of the following:

1. A pre-start brief (including audit) is agreed
2. Explicit approval is given to implement

---

## Required Reading (by Phase)

### Before Any Planning or Audit Work

Codex must read:

- `docs/CODEX_RULES.md`
- `docs/PRD.md`
- `docs/SYSTEM.md`
- `docs/ISSUES.md`
- Relevant branch summaries **only if explicitly instructed**

README files and legacy summaries are **not authoritative** unless explicitly stated.

---

## Task Lifecycle (Mandatory)

Every task must follow this lifecycle exactly.

### 1. Pre-Start Brief

Codex must provide:

- Goal
- Current state (validated against code)
- Assumptions
- Risks
- Options considered
- Recommended approach (with reasoning)

### 2. Pre-Task Code Audit (part of pre-start)

Codex must identify:

- Files involved
- Dependencies
- Red flags (legacy code, similar code or duplication, tight coupling)

---

### 3. Approval

No work proceeds without approval.

---

### 4. Implementation

Rules during implementation:

- Incremental commits and pushes
- No silent behavior changes

---

### 5. Post-Task Debrief

Codex must report:

- What changed
- Files touched
- Why this approach was chosen
- Tests run or needed
- Open questions
- New issues discovered

---

## File Modification Rules

Before changing **any code**, Codex must:

- List every file it intends to modify
- Explain why each file is involved
- Identify risks or downstream dependencies

Codex must **stop and ask** if:

- Instructions conflict with documented rules
- Behavior changes are ambiguous
- Required assumptions are missing
- The task touches areas outside the approved scope

---

## Documentation Update Rules (Critical)

Codex must understand **what to update and when**.

After any implementation task, a **Doc Delta Check** is required.

Ask:

- Did this change structure?
- Did this change data flow or semantics?
- Did this change intent or rules?

If yes:

- Update the relevant documentation
- Or log Doc Debt in `docs/ISSUES.md`

### Update Responsibilities

| Change Type                     | Document to Update |
| ------------------------------- | ------------------ |
| Bugs, risks, odd behavior       | `docs/ISSUES.md`   |
| Structural or ownership changes | `docs/SYSTEM.md`   |
| Data flow or semantic changes   | `docs/SYSTEM.md`   |
| Product or engineering intent   | `docs/PRD.md`      |

---

### Rule A — Evidence-Based Updates

- Codex may update documentation **only** if it inspected the relevant code
- If unsure, Codex must write `UNKNOWN` or `NEEDS VALIDATION`

---

### Rule B — Definition of Done

Every completed task must state:

- Which docs were updated
- Which docs were not updated
- Why

---

### Rule C — Doc Debt

If documentation **should** be updated later:

- Log **Doc Debt** in `docs/ISSUES.md`
- Do not assume it will be remembered

---

## Behavior Changes (Hard Rule)

Codex must **never change observable behavior silently**.

If behavior changes:

- State explicitly **what changed**
- State **why**
- Confirm alignment with `docs/PRD.md`

---

## Discovery Protocol (Mid-Task)

If Codex discovers:

- Bugs
- Duplicate logic
- Architectural concerns
- Unclear or conflicting intent

Then Codex must:

1. Not fix immediately
2. Record the discovery in the task debrief
3. With approval, log it in `docs/ISSUES.md`
4. Explicitly decide whether to scope it in or defer

---

## Git Discipline

- No new branches, merges, or deletions unless instructed
- When approved to merge a branch, this must be done on local and remote, also deleting the merged branch.
- Commits should be incremental and scoped
- Large unpushed local diffs are discouraged
- Never rewrite history without approval
