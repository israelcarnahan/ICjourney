# Audit Triage Tasklist

**Date**: 2026-01-14  
**Status**: Triage Phase

## Audit Artifacts

- **Knip Output**: `docs/audits/knip/knip-2026-01-14-entryfix.txt`
- **JSCPD HTML Report**: `docs/audits/JSCPD/html/index.html`
- **JSCPD JSON Report**: `docs/audits/JSCPD/html/jscpd-report.json`
- **Knip Config**: `knip.json`

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

### Unused Dependencies (13)

- `@googlemaps/js-api-loader`
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-label`
- `@radix-ui/react-popover`
- `@radix-ui/react-progress`
- `@radix-ui/react-switch`
- `class-variance-authority`
- `react-virtualized`
- `tailwind-merge`
- `tailwindcss-animate`
- `uk-postcode-validator`
- `uuid`
- `yup`

### Unused devDependencies (6)

- `@types/react-virtualized`
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `dependency-cruiser`
- `jscpd` (note: used for audits, but not in runtime)
- `madge`

### Unlisted Dependencies (2)

- `@eslint/js` - used in `eslint.config.js:1:17`
- `globals` - used in `eslint.config.js:2:22`

### Unused Exports (22)

See full list in `docs/audits/knip/knip-2026-01-14-entryfix.txt` (lines 58-80)

### Unused Exported Types (9)

See full list in `docs/audits/knip/knip-2026-01-14-entryfix.txt` (lines 81-90)

## Verification Summary

All 32 files from Knip's "Unused files" list have been verified against the codebase. See the [Verified Entries](#unused-files-32--verified-entries) section above for detailed evidence.

### Key Findings

**Confirmed Unused Cluster** (can be archived together):

- `ListCriteriaDialog.tsx` → `ui/button.tsx` → `lib/utils.ts` → `ui/input.tsx`, `ui/label.tsx`, `ui/radio-group.tsx` → `ProgressBar.tsx`
- All components in this cluster are only referenced within the cluster itself (mostly commented references)
- Safe to archive as a group if desired

**Notable Exceptions**:

- `EnhancementSelector.tsx`: [VERIFIED: commented reference] in [`PlannerDashboard.tsx:833`](src/pages/PlannerDashboard.tsx#L833) - contains valuable logic, consider **Restore**
- `xlsx-js-style.d.ts`: [VERIFIED: live reference] - actively used by 3 components - **Keep**
- `types/index.ts`: Not used (types imported from `types.ts` directly) - safe to archive
- `components/index.ts` and `context/index.ts`: Barrel files not imported - may be intentional for future use

**Maps/Google Places Cluster** (defer until integration complete):

- `services/maps.ts`, `utils/googleMaps.ts`, `utils/mapsLoader.ts`, `hooks/useMapsService.ts`
- Related to incomplete Google Places integration (see `feat/api-google-places` branch)
- Archive after integration is complete or confirmed abandoned

## Safety Ritual (Before Any Move/Delete)

Before moving or deleting any file:

1. Run `npm run typecheck` and `npm run build` — verify no breakage
2. Run `npx knip -c knip.json` — confirm file still flagged as unused
3. Commit in small batches — one cluster or logical group per commit
4. Test after each commit — ensure app still works

**Dependency cleanup**: Wait until all file deletions are complete and verified. Then review unused dependencies from Knip output and remove via `npm uninstall`.

**ESLint fix**: Update `package.json` lint script to remove `--ext` flag (flat config doesn't support it). Add missing deps: `npm install --save-dev @eslint/js globals`.

## Next: JSCPD Review Steps

1. Open HTML report: `docs/audits/JSCPD/html/index.html`
2. Identify top duplicate code clusters
3. Record findings in a short summary (no refactors yet)

## How to Re-run Audits

### Knip

**Command**:

```bash
npx knip -c knip.json
```

**Save output**:

```bash
# PowerShell
npx knip -c knip.json | Tee-Object -FilePath "docs/audits/knip/knip-$(Get-Date -Format 'yyyy-MM-dd').txt"

# Bash
npx knip -c knip.json | tee "docs/audits/knip/knip-$(date +%Y-%m-%d).txt"
```

**What it does**: Analyzes unused files, dependencies, exports, and types in the codebase.

**Config**: `knip.json` specifies entry point (`src/main.tsx`) and ignore patterns.

### JSCPD

**Command**:

```bash
npx jscpd src/ --reporters html --reporters json --output docs/audits/JSCPD/html
```

**Alternative** (if configured in package.json):

```bash
npm run jscpd
```

**What it does**: Detects code duplication (copy-paste detection) across the codebase.

**Output**: HTML report at `docs/audits/JSCPD/html/index.html` and JSON report at `docs/audits/JSCPD/html/jscpd-report.json`.

**Note**: `jscpd` is listed as a devDependency but may not have a script in package.json. Add one if needed:

```json
"jscpd": "jscpd src/ --reporters html --reporters json --output docs/audits/JSCPD/html"
```

## Next Actions

1. ✅ Complete triage document (this file)
2. ⏳ Review JSCPD HTML report for duplicate clusters
3. ⏳ Fix ESLint lint script (remove `--ext` flag) and add missing dependencies
4. ⏳ Begin execution: Restore EnhancementSelector.tsx
5. ⏳ Archive ListCriteriaDialog cluster
6. ⏳ Archive standalone components
7. ⏳ Clean up dependencies after file deletions are complete
