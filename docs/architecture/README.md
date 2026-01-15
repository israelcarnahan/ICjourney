# IC Journey Planner

This repository is documented via canonical files in `/docs`.

## Start Here

- `SYSTEM.md` → What the system does today (facts, mechanics, current behavior)
- `PRD.md` → What the system should do (future intent, roadmap, principles)
- `ISSUES.md` → Known problems / inconsistencies / TODOs
- `CODEX_RULES.md` → How AI + tooling should behave
- `README.md` → Entry point / map / signposting
- `PROJECT_SUMMARY.md` → temporarily retained as a working consolidation reference, then archived

README is intentionally minimal.

# Code Audits

This directory contains outputs and documentation from code quality audits and analysis tools.

## Tools

### Knip

**Purpose**: Detects unused files, dependencies, exports, and types in the codebase.

**Latest Output**: `knip/knip-2026-01-14-entryfix.txt`

**How to Run**: See [TRIAGE_TASKLIST.md](./TRIAGE_TASKLIST.md#how-to-re-run-audits)

### JSCPD

**Purpose**: Detects code duplication (copy-paste detection) across the codebase.

**Latest Report**: `JSCPD/html/index.html` (open in browser)

**JSON Report**: `JSCPD/html/jscpd-report.json`

**How to Run**: See [TRIAGE_TASKLIST.md](./TRIAGE_TASKLIST.md#how-to-re-run-audits)

## Documentation

- **[TRIAGE_TASKLIST.md](./TRIAGE_TASKLIST.md)** - Current audit findings, triage plan, and action items

## Directory Structure

```
docs/audits/
├── README.md                    # This file
├── TRIAGE_TASKLIST.md          # Triage plan and findings
├── knip/                       # Knip audit outputs
│   ├── knip-2026-01-14-entryfix.txt
│   └── knip-2026-01-14-tsconfig.txt
└── JSCPD/                      # JSCPD duplicate detection reports
    └── html/
        ├── index.html          # HTML report (open in browser)
        ├── jscpd-report.json  # JSON report
        └── [assets]
```

## Quick Links

- [View Triage Plan](./TRIAGE_TASKLIST.md)
- [View JSCPD HTML Report](./JSCPD/html/index.html)
- [View Latest Knip Output](./knip/knip-2026-01-14-entryfix.txt)
