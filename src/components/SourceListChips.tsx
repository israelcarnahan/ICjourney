import { useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface SourceListChipsProps {
  sources: string[];
  className?: string;
}

export function SourceListChips({ sources, className = '' }: SourceListChipsProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (!sources || sources.length === 0) {
    return null;
  }
  
  // Show up to 2 chips inline, with "+N more" for additional
  const displaySources = sources.slice(0, 2);
  const remainingCount = sources.length - 2;
  
  return (
    <div className={`flex items-center gap-1 ${className}`} data-testid="row-lists">
      {displaySources.map((source, index) => (
        <span
          key={`${source}-${index}`}
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-eggplant-700/50 text-eggplant-200 border border-eggplant-600/50"
          data-testid="list-chip"
        >
          {source}
        </span>
      ))}
      
      {remainingCount > 0 && (
        <Tooltip.Provider>
          <Tooltip.Root open={showTooltip} onOpenChange={setShowTooltip}>
            <Tooltip.Trigger asChild>
              <span
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-eggplant-600/30 text-eggplant-300 border border-eggplant-600/30 cursor-help"
                data-testid="list-chip"
              >
                +{remainingCount} more
              </span>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-eggplant-800 text-eggplant-100 px-3 py-2 rounded-lg shadow-lg border border-eggplant-700/50 text-sm max-w-xs"
                sideOffset={5}
              >
                <div className="space-y-1">
                  {sources.slice(2).map((source, index) => (
                    <div key={index} className="text-eggplant-200">
                      {source}
                    </div>
                  ))}
                </div>
                <Tooltip.Arrow className="fill-eggplant-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      )}
    </div>
  );
}
