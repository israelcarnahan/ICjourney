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

### Unused Exports & Types — Audit Results

✅ Safe Internalize Candidates
These are exported but only used internally.
Safe to remove export without changing runtime behavior.

#### Context & Providers

PubDataContext
File: src/context/PubDataContext.tsx
Intent: React context for pub data state.
Usage: No external imports; consumers use usePubData / PubDataProvider.
Risk: Low
Action: 🔒 Internalize
Order: Early

PubDataContextType
File: src/context/PubDataContext.tsx
Intent: Type for context value shape.
Usage: Internal only.
Risk: Low
Action: 🔒 Internalize
Order: Early

FallbackProvider (class)
File: src/api/fallbackProvider.ts
Intent: Best-effort business data provider.
Usage: Only the instance is imported, not the class.
Risk: Low
Action: 🔒 Internalize class (keep instance export)
Order: Early

NominatimProvider (class)
File: src/api/nominatimProvider.ts
Intent: Nominatim enrichment provider.
Usage: Instance only.
Risk: Low
Action: 🔒 Internalize
Order: Early

PostcodesProvider (class)
File: src/api/postcodesProvider.ts
Intent: Postcodes API provider.
Usage: Instance only.
Risk: Low
Action: 🔒 Internalize
Order: Early

#### Utilities & Helpers

SYNONYMS
File: src/utils/columnSynonyms.ts
Intent: Header regex map for auto-mapping.
Usage: Used only within same file.
Risk: Low
Action: 🔒 Internalize
Order: Early

buildSourceRef
File: src/utils/lineageMerge.ts
Intent: Build lineage metadata.
Usage: Internal only.
Risk: Low
Action: 🔒 Internalize
Order: Early

recomputeEffectivePlan
File: src/utils/lineageMerge.ts
Intent: Compute effective scheduling plan.
Usage: Internal only.
Risk: Low
Action: 🔒 Internalize
Order: Early

normalizePostcode
File: src/utils/postcodeUtils.ts
Intent: Normalize postcode format.
Usage: Internal; dedupe uses a different helper.
Risk: Low
Action: 🔒 Internalize
Order: Early

getPrimaryDriverInfo
File: src/utils/sourceDetails.ts
Intent: Determine primary schedule driver.
Usage: Internal only.
Risk: Low
Action: 🔒 Internalize
Order: Early

isNonEmptyString
File: src/utils/typeGuards.ts
Intent: String guard.
Usage: Used only internally.
Risk: Low
Action: 🔒 Internalize
Order: Early

generateICSFile
File: src/utils/calendarUtils.ts
Intent: Build ICS content.
Usage: Called by internal download helper.
Risk: Low
Action: 🔒 Internalize
Order: Early

extractNumericPart
File: src/utils/scheduleUtils.ts
Intent: Numeric extraction for grouping.
Usage: Internal only.
Risk: Low
Action: 🔒 Internalize
Order: Early

toScheduleDay
File: src/utils/scheduleMappers.ts
Intent: Map loose → strict schedule day.
Usage: Used by exported function in same file.
Risk: Low
Action: 🔒 Internalize
Order: Early

extractTokens
File: src/utils/fuzzy.ts
Intent: Tokenization helper.
Usage: Internal only.
Risk: Low
Action: 🔒 Internalize
Order: Early

#### Components & Types

VisitScheduler (named export)
File: src/components/VisitScheduler.tsx
Intent: Scheduler component.
Usage: Only default import is used.
Risk: Low
Action: 🔒 Remove named export (keep default)
Order: Early

DriverBucket
File: src/utils/sourceDetails.ts
Intent: Driver bucket union type.
Usage: Internal only.
Risk: Low
Action: 🔒 Internalize
Order: Early

DaySchedule
File: src/utils/scheduleMappers.ts
Intent: Loose schedule day shape.
Usage: Internal only.
Risk: Low
Action: 🔒 Internalize
Order: Early

PostcodeReviewDialogProps
File: src/components/PostcodeReviewDialog.tsx
Intent: Props typing.
Usage: Internal only.
Risk: Low
Action: 🔒 Internalize
Order: Early

#### Delete Candidates (After Internalize Pass)

**Notice** Safe to delete once internalization is complete.

notNil — src/utils/typeGuards.ts

getPriorityOrder — src/utils/scheduleUtils.ts

ScheduleEntry — src/types.ts

EnhancedScheduleDay — src/types.ts

SuggestionResult — src/utils/dedupe.ts

REQUIRED_FIELDS — src/utils/columnSynonyms.ts

#### Medium / Future-facing deletions (do later, intentionally)

**Notice** Delete only if you’re confident the feature won’t be revived soon.

collectSources — src/utils/lineageMerge.ts

getCanonicalFieldValue — src/utils/lineageMerge.ts

optimizeRoute — src/utils/scheduleUtils.ts

clearMappings — src/services/persistence.ts

BusinessHours — src/types.ts

YourListField — src/api/types.ts

## Safety Ritual (Before Any Move/Delete)

Before moving or deleting any file:

1. Run `npm run typecheck` and `npm run build` — verify no breakage
2. Run `npx knip -c knip.json` — confirm file still flagged as unused
3. Commit in small batches — one cluster or logical group per commit
4. Test after each commit — ensure app still works

**Dependency cleanup**: Wait until all file deletions are complete and verified. Then review unused dependencies from Knip output and remove via `npm uninstall`.

## Next: JSCPD Review Steps

1. Open HTML report: `docs/audits/JSCPD/html/index.html`
2. Identify top duplicate code clusters
3. Record findings in a short summary (no refactors yet)
