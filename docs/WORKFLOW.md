Purpose:

- This document defines how work happens on this project.
- It is authoritative for humans and AI.

Modes of Work:

- Planning-Only Mode
  Planning-only mode ends only when explicitly approved.
  Allowed:
  - Reading code
  - Tracing logic
  - Auditing flows
  - Reviewing tests (read-only)
  - Writing documentation
  - Asking questions
    Not allowed:
  - Writing or modifying code
  - Writing or modifying tests
  - Refactors of any kind
  - Branching, committing, or pushing
- Implementation Mode:
  Implementation may begin only after:
  - A pre-start brief is agreed
  - A pre-task code audit is completed
  - Explicit approval is given

Task Lifecycle (Mandatory):
Every task follows this lifecycle:

1. Pre-start brief

- Goal
- Current state (validated against code)
- Assumptions
- Risks
- Options considered
- Recommended approach (with reasoning)

2. Approval
3. Pre-task code audit

- Files involved
- Dependencies
- Red flags (legacy, duplication, coupling)

4. Approval
5. Implementation

- Incremental commits and pushes encouraged
- No silent behavior changes

6. Post-task debrief

- What changed
- Files touched
- Why this approach
- Tests run / needed
- Open questions
- New issues discovered

Discovery Protocol (Mid-task):
If, during any task, we discover:

- bugs
- duplicated logic
- architectural concerns
- unclear intent
  Then:
  - Do not fix immediately
  - Record discovery in the task debrief
  - With approval, log it in ISSUES.md
  - Decide explicitly whether to scope in or defer

Git Discipline:

- No new branches, merges, or deletions unless instructed
- Commits should be incremental
- Pushes should be frequent to keep environments in sync
- Large unpushed local diffs are discouraged

Documentation as Definition of Done
After any implementation task, a Doc Delta Check is required.
Ask:

- Did this change structure?
- Did this change data flow or semantics?
- Did this change intent or rules?
  If yes, update the relevant doc or log Doc Debt.
