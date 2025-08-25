import { useState, useEffect, useRef } from 'react';
import { DedupeCandidate } from '../utils/dedupe';

interface DedupReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  autoMerge: DedupeCandidate[];
  needsReview: DedupeCandidate[];
  onConfirm: (autoMergeIds: string[], reviewMergeIds: string[]) => void;
}

interface ReviewItem {
  candidate: DedupeCandidate;
  action: 'merge' | 'skip';
}

export function DedupReviewDialog({
  isOpen,
  onClose,
  autoMerge,
  needsReview,
  onConfirm
}: DedupReviewDialogProps) {
  const [autoMergeExpanded, setAutoMergeExpanded] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [autoMergeSelected, setAutoMergeSelected] = useState<Set<string>>(new Set());
  const dialogRef = useRef<HTMLDivElement>(null);

  // Initialize review items when dialog opens
  useEffect(() => {
    if (isOpen) {
      setReviewItems(needsReview.map(candidate => ({
        candidate,
        action: 'merge' as const
      })));
      setAutoMergeSelected(new Set(autoMerge.map(c => c.incoming.uuid)));
    }
  }, [isOpen, autoMerge, needsReview]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  const handleAutoMergeToggle = (uuid: string, checked: boolean) => {
    const newSelected = new Set(autoMergeSelected);
    if (checked) {
      newSelected.add(uuid);
    } else {
      newSelected.delete(uuid);
    }
    setAutoMergeSelected(newSelected);
  };

  const handleReviewActionChange = (uuid: string, action: 'merge' | 'skip') => {
    setReviewItems(prev => prev.map(item => 
      item.candidate.incoming.uuid === uuid 
        ? { ...item, action }
        : item
    ));
  };

  const handleConfirm = () => {
    const autoMergeIds = Array.from(autoMergeSelected);
    const reviewMergeIds = reviewItems
      .filter(item => item.action === 'merge')
      .map(item => item.candidate.incoming.uuid);
    
    onConfirm(autoMergeIds, reviewMergeIds);
    onClose();
  };

  const handleSkipAll = () => {
    setReviewItems(prev => prev.map(item => ({ ...item, action: 'skip' as const })));
  };

  const selectedCount = autoMergeSelected.size + reviewItems.filter(item => item.action === 'merge').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={dialogRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
        data-testid="dedupe-dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Review Duplicate Pubs
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            We found potential duplicates in your import. Review and confirm the matches below.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {/* Auto-merge section */}
          {autoMerge.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setAutoMergeExpanded(!autoMergeExpanded)}
                className="flex items-center justify-between w-full text-left p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✅</span>
                  <span className="font-medium text-green-800">
                    Auto-merge (high confidence) - {autoMerge.length} items
                  </span>
                </div>
                <span className="text-green-600">
                  {autoMergeExpanded ? '−' : '+'}
                </span>
              </button>
              
              {autoMergeExpanded && (
                <div className="mt-3 space-y-3">
                  {autoMerge.map((candidate) => (
                    <div key={candidate.incoming.uuid} className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={autoMergeSelected.has(candidate.incoming.uuid)}
                        onChange={(e) => handleAutoMergeToggle(candidate.incoming.uuid, e.target.checked)}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {candidate.incoming.name}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="font-medium text-gray-900">
                                {candidate.existing.name}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Similarity: {(candidate.nameSim * 100).toFixed(1)}% | Score: {(candidate.score * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {candidate.reasons.map((reason, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Needs review section */}
          {needsReview.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-yellow-600">⚠️</span>
                <span className="font-medium text-yellow-800">
                  Needs review - {needsReview.length} items
                </span>
              </div>
              
              <div className="space-y-3">
                {reviewItems.map((item) => (
                  <div key={item.candidate.incoming.uuid} className="p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {item.candidate.incoming.name}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-gray-900">
                          {item.candidate.existing.name}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Similarity: {(item.candidate.nameSim * 100).toFixed(1)}% | Score: {(item.candidate.score * 100).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.candidate.reasons.map((reason, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`action-${item.candidate.incoming.uuid}`}
                          value="merge"
                          checked={item.action === 'merge'}
                          onChange={() => handleReviewActionChange(item.candidate.incoming.uuid, 'merge')}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Merge</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`action-${item.candidate.incoming.uuid}`}
                          value="skip"
                          checked={item.action === 'skip'}
                          onChange={() => handleReviewActionChange(item.candidate.incoming.uuid, 'skip')}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Skip</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {autoMerge.length === 0 && needsReview.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No duplicate candidates found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSkipAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                data-testid="dedupe-skip"
              >
                Skip all
              </button>
              <span className="text-sm text-gray-600">
                {selectedCount} items selected
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedCount === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="dedupe-merge"
              >
                Merge selected ({selectedCount})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
