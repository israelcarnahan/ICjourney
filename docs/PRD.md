Purpose:
Defines what the system is meant to do — product and engineering intent.
Semantics may evolve over time.

This document distinguishes:

- Current behavior
- Intended behavior
- Deferred / future behavior
  Temporary compromises must be explicitly labeled.

Product Goals:

- Generate plausible, explainable visit schedules
- Respect user-defined intent (deadlines, priorities)
- Preserve trust through transparency
- Prefer determinism over clever optimization

Non-Goals (Current):

- Real route optimization
- Perfect geographic accuracy
- Full follow-up-by-date support
- Black-box scheduling

User Journey (High Level):

- Upload masterfile
- Upload additional lists
- Map columns
- Deduplicate with provenance
- Define scheduling intent
- Generate schedule
- Review / adjust
- Export

Scheduling Intent (Conceptual):

- Visit By (Deadline): schedule on or before a date
- Follow-Up: deferred; scaffold exists but gated
- Priority: relative importance
- Baseline: default behavior
