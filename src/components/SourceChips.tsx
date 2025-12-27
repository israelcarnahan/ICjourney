
import { getSourceInfo } from '../utils/lineageMerge';
import type { Pub } from '../context/PubDataContext';

interface SourceChipsProps {
  pub: Pub;
  className?: string;
}

export function SourceChips({ pub, className = '' }: SourceChipsProps) {
  const sourceInfo = getSourceInfo(pub);
  
  if (sourceInfo.count === 0) {
    return null;
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-eggplant-300">
        Sources ({sourceInfo.count})
      </span>
      <div className="flex flex-wrap gap-1">
        {sourceInfo.fileNames.map((fileName, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-eggplant-700/50 text-eggplant-200 border border-eggplant-600/50"
            title={`From: ${fileName}`}
          >
            {fileName}
          </span>
        ))}
      </div>
    </div>
  );
}
