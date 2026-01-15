/**
 * ARCHIVED — do not import into the app.
 *
 * Intent: Radix-based progress indicator.
 * Real usage check: No imports or references found anywhere in the repo.
 * Intent duplication: None found.
 * Hidden coupling risk: None found.
 * Logic salvage: Optional: wire into long-running flows in [see src/components/FileUploader.tsx](../../src/components/FileUploader.tsx).
 * Verdict: ARCHIVE
 *
 * Notes: This file lives in _archive/ for reference only. Do not modify except during explicit "resurrection" work.
 * Source: docs/audits/TRIAGE_TASKLIST.md
 */
import * as Progress from "@radix-ui/react-progress";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

export function ProgressBar({ value, max = 100, className }: ProgressBarProps) {
  const progress = Math.min(100, (value / max) * 100);

  return (
    <Progress.Root
      className={[
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Progress.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - progress}%)` }}
      />
    </Progress.Root>
  );
}
