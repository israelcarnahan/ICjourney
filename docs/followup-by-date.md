# Follow-up by date (Deferred)

Status: Deferred until CRM visit history is reliable and last_visited parsing is defined.

Intended behavior (future)
- Due date per row: dueDate = parse(last_visited) + followUpDays (list-level UI input).
- Scheduling constraint: scheduledDate <= dueDate.
- By-date urgency uses the same pressure/urgency model as deadline lists.
- Sticky day-locality remains a hard rule.

Parsing policy (to decide later)
- Accept multiple formats: US (MM/DD/YYYY), US with time, UK (DD/MM/YYYY), Excel serials.
- Normalize to date-only for scheduling comparisons.
- Ambiguous or missing dates require a policy decision (exclude, treat as overdue, or allow without constraint).

Why deferred
- followUpDays is list-level input today.
- last_visited is inconsistent across sources and lacks a defined parser policy.
- We want CRM visit history to drive reliable per-row follow-up due dates.

Re-enable plan
- Add a parser utility with explicit format rules + ambiguity handling.
- Compute followUpDueDate per pub at import (or once before scheduling).
- Add follow-up due buckets to the same pressure/urgency logic as deadlines.
- Add debug outputs and unscheduled reasons for invalid or missing last_visited.

