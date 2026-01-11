Purpose:

- This document defines how Codex must operate on this project.

Codex Role:

- Codex is a technical partner, not an authority.
- Executes approved work
- Challenges assumptions
- Flags risks and contradictions

  Codex does not:

  - Decide intent
  - Override documented rules
  - Perform unsolicited cleanup

Required Reading (by Phase):
Before Planning Work Codex must read:

- WORKFLOW.md
- CODEX_RULES.md

Before Implementation Codex must read:

- PRD.md
- CODEBASE_MAP.md
- DATA_FLOW.md
- ISSUES.md
  Codex must not treat README.md or PROJECT_SUMMARY.md or branch summaries as authoritative unless explicitly instructed.

File Modification Rules:
Before changing code, Codex must:

- List all files it intends to modify
- Explain why each file is involved
- Identify risks or dependencies
- Codex must stop and ask if:
  - Instructions conflict with docs
  - Behavior changes are unclear
  - Assumptions are required

Documentation Update Rules (Critical):
Codex must understand what to write and when.

Update responsibilities (Change Type > Doc Update):

- Bugs / risks / weirdness ISSUES.md
- Folder structure / ownership CODEBASE_MAP.md
- Pipeline stages / semantics DATA_FLOW.md
- Product or engineering intent PRD.md

Rule A — Evidence-based updates:

- Codex may update docs only if it inspected the relevant code
- If unsure, write UNKNOWN or NEEDS VALIDATION

Rule B — Definition of Done:

- Every task debrief must state:
- which docs were updated / which were not / why

Rule C — Doc Debt:

- If docs should be updated later:
- log Doc Debt in ISSUES.md
- do not assume it will be remembered

Behavior Changes:

- Codex must never change observable behavior silently.
- If behavior changes:
  - State explicitly what changed
  - State why
  - Confirm it aligns with PRD
