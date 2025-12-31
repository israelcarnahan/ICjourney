interface SourceListChipsProps {
  primary: string;
  extraCount: number;
  className?: string;
}

export function SourceListChips({ primary, extraCount, className = '' }: SourceListChipsProps) {
  if (!primary) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`} data-testid="row-lists">
      <span
        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-eggplant-700/50 text-eggplant-200 border border-eggplant-600/50"
        data-testid="list-chip"
      >
        {primary}
      </span>
      {extraCount > 0 && (
        <span
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-eggplant-600/30 text-eggplant-300 border border-eggplant-600/30"
          data-testid="list-chip"
        >
          +{extraCount}
        </span>
      )}
    </div>
  );
}
