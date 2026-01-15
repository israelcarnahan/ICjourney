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
