Purpose:
data semantics / flow
Explains how data moves and transforms end to end.

Pipeline Overview:

- Upload
- Column Mapping
- Normalization
- Deduplication
- Lineage Merge
- Scheduling
- Explainability
- Export

Key Principles:

- Drivers determine eligibility, geo influences ordering
- Explainability must trace back to driver + provenance
- Determinism is a goal, even if imperfect today

Known Gaps:

- Follow-up semantics incomplete
- Determinism not guaranteed across runs
- Some semantics duplicated across layers
  These gaps are tracked in ISSUES.md.
