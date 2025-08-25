import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Pub } from '../context/PubDataContext';
import { X, Maximize2, Minimize2 } from 'lucide-react';

export type ReasonBadge = { 
  type: 'postcode' | 'rtm' | 'addrTokens' | 'town' | 'phone' | 'email'; 
  value?: string; 
};

export type Suggestion = {
  id: string;                      // stable (e.g., `${existingId}::${incomingRowId}`)
  existing: Pub;                   // canonical/pub card
  incoming: { 
    name: string; 
    postcode?: string; 
    extras: Record<string, string>; 
    fileName: string; 
    rowIndex: number; 
  };
  nameSim: number;                 // 0..1
  score: number;                   // 0..1
  reasons: ReasonBadge[];
  defaultAction: 'merge' | 'review'; // high-confidence → 'merge', else 'review'
};

export type DedupReviewDialogProps = {
  autoMerge: Suggestion[];         // high confidence (pre-checked)
  needsReview: Suggestion[];       // medium confidence (user decides)
  onConfirm(decisions: Array<{ id: string; action: 'merge' | 'skip' }>): void;
  onCancel(): void;
};

interface DecisionState {
  [id: string]: 'merge' | 'skip';
}

export function DedupReviewDialog({
  autoMerge,
  needsReview,
  onConfirm,
  onCancel
}: DedupReviewDialogProps) {
  const [decisions, setDecisions] = useState<DecisionState>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [autoMergeExpanded, setAutoMergeExpanded] = useState(false);
  const [dragOverZone, setDragOverZone] = useState<'merge' | 'skip' | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Initialize decisions
  useEffect(() => {
    const initialDecisions: DecisionState = {};
    
    // Auto-merge items default to merge
    autoMerge.forEach(suggestion => {
      initialDecisions[suggestion.id] = 'merge';
    });
    
    // Needs review items default to merge
    needsReview.forEach(suggestion => {
      initialDecisions[suggestion.id] = 'merge';
    });
    
    setDecisions(initialDecisions);
  }, [autoMerge, needsReview]);

  // Store previous focus and lock body scroll
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        const mergeCount = Object.values(decisions).filter(d => d === 'merge').length;
        if (mergeCount > 0) {
          handleConfirm();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [decisions, onCancel]);

  // Focus trap
  useEffect(() => {
    if (dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, []);

  const handleDecisionChange = useCallback((id: string, action: 'merge' | 'skip') => {
    setDecisions(prev => ({ ...prev, [id]: action }));
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetZone: 'merge' | 'skip') => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      handleDecisionChange(id, targetZone);
    }
    setDragOverZone(null);
  }, [handleDecisionChange]);

  const handleDragEnter = useCallback((zone: 'merge' | 'skip') => {
    setDragOverZone(zone);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverZone(null);
  }, []);

  const handleSelectAllNeedsReview = useCallback((action: 'merge' | 'skip') => {
    const newDecisions = { ...decisions };
    needsReview.forEach(suggestion => {
      newDecisions[suggestion.id] = action;
    });
    setDecisions(newDecisions);
  }, [decisions, needsReview]);

  const handleConfirm = useCallback(() => {
    const decisionsArray = Object.entries(decisions).map(([id, action]) => ({
      id,
      action
    }));
    onConfirm(decisionsArray);
  }, [decisions, onConfirm]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }, [onCancel]);

  // Filter suggestions based on search
  const filteredAutoMerge = autoMerge.filter(suggestion =>
    suggestion.existing.pub.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.incoming.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.existing.zip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.incoming.postcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNeedsReview = needsReview.filter(suggestion =>
    suggestion.existing.pub.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.incoming.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.existing.zip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.incoming.postcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mergeCount = Object.values(decisions).filter(d => d === 'merge').length;
  const skipCount = Object.values(decisions).filter(d => d === 'skip').length;

  const getReasonBadgeText = (reason: ReasonBadge): string => {
    switch (reason.type) {
      case 'postcode': return 'Postcode match';
      case 'rtm': return 'RTM match';
      case 'addrTokens': return `${reason.value} address tokens`;
      case 'town': return 'Town match';
      case 'phone': return 'Phone match';
      case 'email': return 'Email match';
      default: return reason.type;
    }
  };

  const getReasonBadgeColor = (reason: ReasonBadge): string => {
    switch (reason.type) {
      case 'postcode': return 'bg-blue-100 text-blue-800';
      case 'rtm': return 'bg-purple-100 text-purple-800';
      case 'addrTokens': return 'bg-green-100 text-green-800';
      case 'town': return 'bg-orange-100 text-orange-800';
      case 'phone': return 'bg-teal-100 text-teal-800';
      case 'email': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const SuggestionCard = ({ suggestion, isDraggable = true }: { suggestion: Suggestion; isDraggable?: boolean }) => (
    <div
      key={suggestion.id}
      draggable={isDraggable}
      onDragStart={(e) => handleDragStart(e, suggestion.id)}
      className={`p-4 bg-white/5 border border-eggplant-600/30 rounded-lg cursor-pointer transition-all hover:bg-white/10 hover:border-eggplant-500/50 ${
        decisions[suggestion.id] === 'merge' ? 'ring-2 ring-neon-purple/50' : ''
      }`}
      data-testid={`dedupe-card-${suggestion.id}`}
      onClick={() => handleDecisionChange(suggestion.id, decisions[suggestion.id] === 'merge' ? 'skip' : 'merge')}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-eggplant-100">
              {suggestion.existing.pub}
            </span>
            <span className="text-eggplant-400">→</span>
            <span className="font-medium text-eggplant-100">
              {suggestion.incoming.name}
            </span>
          </div>
          <div className="text-sm text-eggplant-300 mb-2">
            Similarity: {(suggestion.nameSim * 100).toFixed(1)}% | Score: {(suggestion.score * 100).toFixed(1)}%
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            name={`action-${suggestion.id}`}
            value="merge"
            checked={decisions[suggestion.id] === 'merge'}
            onChange={() => handleDecisionChange(suggestion.id, 'merge')}
            className="h-4 w-4 text-neon-purple border-eggplant-600 focus:ring-neon-purple"
            onClick={(e) => e.stopPropagation()}
            data-testid="dedupe-merge"
          />
          <span className="text-sm text-eggplant-300">Merge</span>
          <input
            type="radio"
            name={`action-${suggestion.id}`}
            value="skip"
            checked={decisions[suggestion.id] === 'skip'}
            onChange={() => handleDecisionChange(suggestion.id, 'skip')}
            className="h-4 w-4 text-neon-purple border-eggplant-600 focus:ring-neon-purple"
            onClick={(e) => e.stopPropagation()}
            data-testid="dedupe-skip"
          />
          <span className="text-sm text-eggplant-300">Skip</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-2">
        {suggestion.reasons.map((reason, index) => (
          <span
            key={index}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getReasonBadgeColor(reason)}`}
            title={getReasonBadgeText(reason)}
          >
            {getReasonBadgeText(reason)}
          </span>
        ))}
      </div>
      
      <div className="text-xs text-eggplant-400">
        From: {suggestion.incoming.fileName} (row {suggestion.incoming.rowIndex + 1})
      </div>
    </div>
  );

  const DropZone = ({ 
    type, 
    title, 
    count, 
    suggestions 
  }: { 
    type: 'merge' | 'skip'; 
    title: string; 
    count: number; 
    suggestions: Suggestion[] 
  }) => (
    <div
      className={`flex-1 p-4 border-2 border-dashed rounded-lg transition-all ${
        dragOverZone === type
          ? 'border-neon-purple bg-neon-purple/10 shadow-glow'
          : 'border-eggplant-600/50 bg-eggplant-800/20'
      }`}
      onDrop={(e) => handleDrop(e, type)}
      onDragOver={handleDragOver}
      onDragEnter={() => handleDragEnter(type)}
      onDragLeave={handleDragLeave}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-eggplant-100">
          {title} ({count})
        </h3>
      </div>
      
      <div className="space-y-3 max-h-[70vh] overflow-y-auto">
        {suggestions.map((suggestion, index) => (
          <SuggestionCard 
            key={`${type}-${index}-${suggestion.id}`} 
            suggestion={suggestion} 
            isDraggable={false}
          />
        ))}
        
        {suggestions.length === 0 && (
          <div className="text-center py-8 text-eggplant-400">
            {type === 'merge' ? 'No items to merge' : 'No items to skip'}
          </div>
        )}
      </div>
    </div>
  );

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={`${
          isFullScreen 
            ? 'w-screen h-screen max-h-screen rounded-none' 
            : 'w-[min(1100px,calc(100vw-32px))] max-h-[85vh] rounded-2xl'
        } overflow-hidden shadow-2xl bg-gradient-to-b from-eggplant-900 via-eggplant-800 to-eggplant-900 border border-eggplant-700/60 mx-auto`}
        role="dialog"
        aria-modal="true"
        data-testid="dedupe-dialog"
      >
        {/* Sticky Header */}
        <div className="bg-gradient-to-r from-eggplant-900 to-neon-purple p-6 border-b border-eggplant-700/60 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">
              Review possible duplicates
            </h2>
            <p className="text-eggplant-200">
              {autoMerge.length + needsReview.length} suggestions found
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-eggplant-200">
              Merge: {mergeCount} | Skip: {skipCount}
            </div>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-eggplant-200 hover:text-white hover:bg-eggplant-700/50 rounded-lg transition-colors"
              title={isFullScreen ? 'Exit full screen' : 'Full screen'}
            >
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onCancel}
              className="p-2 text-eggplant-200 hover:text-white hover:bg-eggplant-700/50 rounded-lg transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex flex-col md:flex-row gap-4 p-4 ${
          isFullScreen ? 'h-[calc(100vh-140px)]' : 'max-h-[calc(85vh-140px)]'
        }`}>
          {/* Left Column - Suggestions */}
          <div className="w-full md:w-1/2">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name or postcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-eggplant-800/50 border border-eggplant-600/50 rounded-lg text-eggplant-100 placeholder-eggplant-400 focus:outline-none focus:ring-2 focus:ring-neon-purple"
              />
            </div>

            {/* Auto-merge section */}
            {autoMerge.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setAutoMergeExpanded(!autoMergeExpanded)}
                  className="flex items-center justify-between w-full text-left p-3 bg-neon-purple/10 border border-neon-purple/30 rounded-lg hover:bg-neon-purple/20 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-neon-purple">✅</span>
                    <span className="font-medium text-neon-purple">
                      Auto-merge (high confidence) - {filteredAutoMerge.length} items
                    </span>
                  </div>
                  <span className="text-neon-purple">
                    {autoMergeExpanded ? '−' : '+'}
                  </span>
                </button>
                
                {autoMergeExpanded && (
                  <div className="mt-3 space-y-3 max-h-[70vh] overflow-y-auto">
                    {filteredAutoMerge.map((suggestion, index) => (
                      <SuggestionCard 
                        key={`auto-${index}-${suggestion.id}`} 
                        suggestion={suggestion} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Needs review section */}
            {needsReview.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-400">⚠️</span>
                    <span className="font-medium text-yellow-400">
                      Needs review - {filteredNeedsReview.length} items
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSelectAllNeedsReview('merge')}
                      className="px-2 py-1 text-xs bg-neon-purple/20 text-neon-purple rounded hover:bg-neon-purple/30"
                    >
                      All Merge
                    </button>
                    <button
                      onClick={() => handleSelectAllNeedsReview('skip')}
                      className="px-2 py-1 text-xs bg-eggplant-600/50 text-eggplant-300 rounded hover:bg-eggplant-600/70"
                    >
                      All Skip
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {filteredNeedsReview.map((suggestion, index) => (
                    <SuggestionCard 
                      key={`review-${index}-${suggestion.id}`} 
                      suggestion={suggestion} 
                    />
                  ))}
                </div>
              </div>
            )}

            {autoMerge.length === 0 && needsReview.length === 0 && (
              <div className="text-center py-8 text-eggplant-400">
                No suggestions found.
              </div>
            )}
          </div>

          {/* Right Column - Drop Zones */}
          <div className="w-full md:w-1/2 flex flex-col space-y-4">
            <DropZone
              type="merge"
              title="✅ Merge"
              count={mergeCount}
              suggestions={Object.entries(decisions)
                .filter(([_, action]) => action === 'merge')
                .map(([id]) => [...autoMerge, ...needsReview].find(s => s.id === id)!)
                .filter(Boolean)}
            />
            
            <DropZone
              type="skip"
              title="⏭ Skip"
              count={skipCount}
              suggestions={Object.entries(decisions)
                .filter(([_, action]) => action === 'skip')
                .map(([id]) => [...autoMerge, ...needsReview].find(s => s.id === id)!)
                .filter(Boolean)}
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="bg-eggplant-800/50 p-6 border-t border-eggplant-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-eggplant-300">
                Selected: {mergeCount} to merge, {skipCount} to skip
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-eggplant-300 bg-eggplant-700/50 border border-eggplant-600/50 rounded-lg hover:bg-eggplant-700/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon-purple"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={mergeCount === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-neon-purple border border-transparent rounded-lg hover:bg-neon-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon-purple disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="dedupe-merge"
              >
                Merge selected ({mergeCount})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
