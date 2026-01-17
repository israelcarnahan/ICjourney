# Audit Triage Task list

## Knip Findings Summary

### Archived Files (10)

- **Path** Now lives in project root `_archive` for reference when ready for resurrection work

### Guardrails: Do Not Delete Yet

**⚠️ CRITICAL**: These TypeScript declaration files (`.d.ts`) are required for type checking and build processes. **DO NOT DELETE** without first verifying via `npm run typecheck` and `npm run build` after removal. These files provide essential type definitions that may not be detected by static analysis tools.

- **File:** `src/types/shims.d.ts`
- **Tag:** [GUARDRAIL]
- **Evidence:** TypeScript declaration file (build-time dependency)
- **Notes:** Provides type shims for build process. Required for TypeScript compilation.
- **Intent:** TypeScript declaration file providing type definitions for external libraries without types. Includes shims for Google Maps API, Radix UI Progress, and path aliases to prevent build-time type errors.
- **Proposed Fate:** **Keep** (verify via typecheck/build before considering removal)

- **File:** `src/types/xlsx-js-style.d.ts`
- **Tag:** [VERIFIED: live reference]
- **Evidence:** [`src/components/FileUploader.tsx:3`](src/components/FileUploader.tsx#L3), [`_archive/src/components/EnhancementSelector.tsx:9`](_archive/src/components/EnhancementSelector.tsx#L9), [`src/components/ScheduleDisplay.tsx:18`](src/components/ScheduleDisplay.tsx#L18)
- **Notes:** Type definitions for `xlsx-js-style` library (actively used by 3 components)
- **Intent:** TypeScript declaration file for xlsx-js-style library. Provides type definitions for Excel file reading/writing operations including WorkBook, WorkSheet, and utility functions.
- **Proposed Fate:** **Keep**

### Unused Exports & Types

#### C) POSTPONE / ROADMAP (future value; revisit intentionally)

- **SYMBOL:** getCanonicalFieldValue
  - **FILE:** [`src/utils/lineageMerge.ts`](../../src/utils/lineageMerge.ts)
  - **INTENT:** Resolve canonical field value from lineage metadata.
  - **REAL USAGE CHECK:**
    - USED CROSS-FILE?: No.
    - USED INTERNALLY?: No.
    - TYPE-ONLY USAGE?: No.
    - COMMENT-ONLY REFERENCES?: No.
  - **INTENT DUPLICATION:** None; would complement `mergeIntoCanonical`.
  - **FUTURE VALUE:** Roadmap � likely needed if lineage UI/merge inspection returns.
  - **HIDDEN COUPLING RISK:** Med � intertwined with lineage data model.
  - **LOGIC SALVAGE:** Keep in mind for a future lineage panel; would plug into `src/utils/lineageMerge.ts` outputs.
  - **RECOMMENDATION:** POSTPONE / ROADMAP.
  - **SAFEST EXECUTION ORDER:** 26 � defer until lineage roadmap is clear.

- **SYMBOL:** collectSources
  - **FILE:** [`src/utils/lineageMerge.ts`](../../src/utils/lineageMerge.ts)
  - **INTENT:** Collect source list names from pub/visit records.
  - **REAL USAGE CHECK:**
    - USED CROSS-FILE?: No.
    - USED INTERNALLY?: No.
    - TYPE-ONLY USAGE?: No.
    - COMMENT-ONLY REFERENCES?: No.
  - **INTENT DUPLICATION:** Similar data is derived in [`src/utils/sourceDetails.ts`](../../src/utils/sourceDetails.ts).
  - **FUTURE VALUE:** Roadmap � useful for chips/summary if lineage UI returns.
  - **HIDDEN COUPLING RISK:** Med � tied to lineage shapes.
  - **LOGIC SALVAGE:** Would plug into source label/chip UI (see `getSourceDetails`).
  - **RECOMMENDATION:** POSTPONE / ROADMAP.
  - **SAFEST EXECUTION ORDER:** 27 � defer until UI plan is clear.

- **SYMBOL:** optimizeRoute
  - **FILE:** [`src/utils/scheduleUtils.ts`](../../src/utils/scheduleUtils.ts)
  - **INTENT:** Route optimization routine.
  - **REAL USAGE CHECK:**
    - USED CROSS-FILE?: No.
    - USED INTERNALLY?: No.
    - TYPE-ONLY USAGE?: No.
    - COMMENT-ONLY REFERENCES?: No.
  - **INTENT DUPLICATION:** None.
  - **FUTURE VALUE:** Roadmap � potential scheduling optimization feature.
  - **HIDDEN COUPLING RISK:** Med � algorithm is large and touches schedule assumptions.
  - **LOGIC SALVAGE:** Could reattach to scheduling flow in `src/utils/scheduleUtils.ts` when route optimization is re-scoped.
  - **RECOMMENDATION:** POSTPONE / ROADMAP.
  - **SAFEST EXECUTION ORDER:** 28 � hold until roadmap.

- **SYMBOL:** clearMappings
  - **FILE:** [`src/services/persistence.ts`](../../src/services/persistence.ts)
  - **INTENT:** Clear persisted column mappings for a user.
  - **REAL USAGE CHECK:**
    - USED CROSS-FILE?: No.
    - USED INTERNALLY?: No.
    - TYPE-ONLY USAGE?: No.
    - COMMENT-ONLY REFERENCES?: Yes (commented TODO in [`src/context/PubDataContext.tsx`](../../src/context/PubDataContext.tsx)).
  - **INTENT DUPLICATION:** None.
  - **FUTURE VALUE:** Maybe � useful for user reset flows.
  - **HIDDEN COUPLING RISK:** Med � tied to persistence keys and reset semantics.
  - **LOGIC SALVAGE:** If reset flows return, wire into the reset path in `PubDataContext`.
  - **RECOMMENDATION:** POSTPONE / ROADMAP.
  - **SAFEST EXECUTION ORDER:** 29 � wait for reset UX decision.

- **SYMBOL:** BusinessHours
  - **FILE:** [`src/types.ts`](../../src/types.ts)
  - **INTENT:** Business hours type (open/close time).
  - **REAL USAGE CHECK:**
    - USED CROSS-FILE?: No.
    - USED INTERNALLY?: No.
    - TYPE-ONLY USAGE?: No.
    - COMMENT-ONLY REFERENCES?: No.
  - **INTENT DUPLICATION:** Similar types exist in [`src/context/PubDataContext.tsx`](../../src/context/PubDataContext.tsx) and [`src/components/DriveTimeBar.tsx`](../../src/components/DriveTimeBar.tsx).
  - **FUTURE VALUE:** Maybe � could become a shared domain type if consolidated.
  - **HIDDEN COUPLING RISK:** Med � type consolidation could affect multiple components.
  - **LOGIC SALVAGE:** If standardizing domain types, relocate to a single shared types module later.
  - **RECOMMENDATION:** POSTPONE / ROADMAP.
  - **SAFEST EXECUTION ORDER:** 30 � defer until type consolidation is planned.

- **SYMBOL:** YourListField
  - **FILE:** [`src/api/types.ts`](../../src/api/types.ts)
  - **INTENT:** Allowed field names from "Your Lists" ingest.
  - **REAL USAGE CHECK:**
    - USED CROSS-FILE?: No.
    - USED INTERNALLY?: No.
    - TYPE-ONLY USAGE?: No.
    - COMMENT-ONLY REFERENCES?: No.
  - **INTENT DUPLICATION:** None explicit; validation happens ad hoc.
  - **FUTURE VALUE:** Maybe � could be used for validation/typing in upload flow.
  - **HIDDEN COUPLING RISK:** Med � would influence ingest validation expectations.
  - **LOGIC SALVAGE:** Reintroduce if upload validation is formalized in [`src/components/FileUploader.tsx`](../../src/components/FileUploader.tsx).
  - **RECOMMENDATION:** POSTPONE / ROADMAP.
  - **SAFEST EXECUTION ORDER:** 31 � defer until upload validation is planned.

