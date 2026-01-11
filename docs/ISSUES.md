Purpose:
Bugs / risks / weirdness
Capture everything that is wrong, unclear, duplicated, or risky. Issues are: not tasks, not promises, signals requiring later decision.

Categories:

- Bugs
- Structural Debt
- Semantic Ambiguity
- Legacy/Transitional Code
- Doc Debt

Examples (Seed Items):

- Follow-up logic partially scaffolded but gated
- Mock geo boundaries not strictly enforced
- Potential dedupe data loss
- Encoding corruption in UI strings
- Multiple map abstractions without clear ownership
- Scheduling logic duplicated across layers
- Single source of truth for scheduling driver labels
- Consolidation of scheduling logic across: planner, display, export
- Explicit mock vs real API boundary enforcement
- Deterministic test fixtures for scheduling
- Removal or isolation of legacy fields
- Reduction of duplicated heuristics
- Debug / explainability consolidation
- Establish authoritative documentation system (current task)
- Map codebase end-to-end before further feature work
- Eliminate duplicated logic before adding complexity
- Create explainability guarantees
- Reduce cognitive load of the codebase
