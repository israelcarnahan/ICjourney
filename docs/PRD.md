# PRD — IC Journey Planner (Intended Behavior)

## Product Goal

Enable reps to generate explainable, constraint-aware visit schedules that respect deadlines, follow-ups, priorities, and locality.

---

## Intended User Flow

1. Login
2. Upload Masterfile
3. Upload optional lists (Masterfile, Priority hitlists etc.)
4. Map columns
5. Resolve duplicates & Postcode issues
6. Configure schedule settings
7. Review & adjust
8. Export

---

## Scheduling Semantics (Intended)

### Deadline (Visit-By)

- A constraint, not a “schedule first at all costs”
- Visits may occur any day on or before the date
- Violations must be explainable

### Follow-Up-By (Deferred)

- Follow-up derived from last-visited + offset from settings
- Explicitly deferred in main branch

### Priority

- Relative ordering only
- Must not override hard constraints

### Locality

- Prefer closer visits where constraints allow
- Never violate deadlines to optimize distance alone

---

## Deferred / Future

- Follow-up-by-date scheduling[](followup-by-date.md)
- Real maps & routing [](BRANCH_SUMMARY_feat-api-google-places.md)
- Backend persistence
