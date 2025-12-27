import { useState } from 'react';
import { getAllExtras } from '../utils/lineageMerge';
import type { Pub } from '../context/PubDataContext';

interface OriginalValuesProps {
  pub: Pub;
  className?: string;
}

export function OriginalValues({ pub, className = '' }: OriginalValuesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!pub.sources || pub.sources.length === 0) {
    return null;
  }
  
  const allExtras = getAllExtras(pub);
  const hasFieldValues = pub.fieldValuesBySource && Object.keys(pub.fieldValuesBySource).length > 0;
  const hasExtras = Object.keys(allExtras).length > 0;
  
  if (!hasFieldValues && !hasExtras) {
    return null;
  }
  
  return (
    <div className={className}>
      <button
        type="button"
        className="inline-flex items-center gap-2 text-eggplant-200 hover:text-white text-sm"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <svg 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path d="M7 5l6 5-6 5V5z"/>
        </svg>
        Original values from all sources
      </button>
      
      {isExpanded && (
        <div className="mt-3 space-y-4">
          {/* Field values by source */}
          {hasFieldValues && (
            <div>
              <h4 className="text-sm font-medium text-eggplant-100 mb-2">Field Values by Source</h4>
              <div className="space-y-2">
                {Object.entries(pub.fieldValuesBySource || {}).map(([field, values]) => (
                  <div key={field} className="bg-eggplant-800/30 rounded-lg p-3">
                    <div className="text-sm font-medium text-eggplant-200 mb-1">{field}</div>
                    <div className="space-y-1">
                      {values.map((value, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <span className="text-eggplant-400">
                            {pub.sources?.find(s => s.sourceId === value.sourceId)?.fileName || 'Unknown'}
                          </span>
                          <span className="text-eggplant-300">:</span>
                          <span className="text-eggplant-200">{value.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Extras by source */}
          {hasExtras && (
            <div>
              <h4 className="text-sm font-medium text-eggplant-100 mb-2">Additional Fields by Source</h4>
              <div className="space-y-2">
                {Object.entries(allExtras).map(([key, values]) => (
                  <div key={key} className="bg-eggplant-800/30 rounded-lg p-3">
                    <div className="text-sm font-medium text-eggplant-200 mb-1">{key}</div>
                    <div className="space-y-1">
                      {values.map((value, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <span className="text-eggplant-400">
                            {pub.sources?.find(s => s.sourceId === pub.mergedExtras?.[key]?.[index]?.sourceId)?.fileName || 'Unknown'}
                          </span>
                          <span className="text-eggplant-300">:</span>
                          <span className="text-eggplant-200">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
