# Issues

## Deadline bucket summary duplicates / shows conflicting counts after changing deadline range after schedule is generated.

Context:
- Seen on main, port/mock-geo-truth, and feat/mock-geo-truth
- Scheduler/export output appears correct; UI summary/devlog appears inconsistent

Repro:
1. Load same dataset
2. Set schedule range to ~3 months
3. Set a deadline list with a deadline near end -> behaves
4. Shorten the deadline date significantly (e.g. half the range) while keeping same schedule range
5. Observe deadline summary cards: one shows "All X scheduled" while another shows "None scheduled" for the same list/date bucket
6. Export shows all deadline accounts scheduled; mismatch is display/aggregation, not scheduler

Expected:
Single deadline bucket with correct scheduled count (and consistent between UI summary + export)

Actual:
Duplicate/contradictory deadline bucket summaries; one shows scheduled, one shows none, despite export showing all scheduled

Notes / Hypotheses:
- Likely derived grouping key mismatch when deadline changes (e.g. key includes date object/string formatting differences or stale persisted state)
- Possibly merges/lineage list-id differences causing same "label" to appear twice
- Investigate summary aggregation + any memoization/useEffect dependencies related to deadline lists

Acceptance criteria:
- No duplicated deadline bucket labels
- Scheduled count matches export for same selection
- Changing deadline updates summary deterministically without stale "None scheduled" bucket
