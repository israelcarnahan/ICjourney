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



// fields we always show under the name row
const PRIMARY_FIELDS: Array<{ key: 'postcode'|'rtm'|'address'|'town'; label: string }> = [
  { key: 'postcode', label: 'Postcode' },
  { key: 'rtm',      label: 'RTM'      },
  { key: 'address',  label: 'Address'  },
  { key: 'town',     label: 'Town/City'},
];

// Normalize + pretty print helpers
const norm = (v?: string | null) => (v ?? '').trim();
const isEqual = (a?: string|null, b?: string|null) => norm(a).toLowerCase() === norm(b).toLowerCase();

// build a union of all keys to show in the "More details" section
function buildExtraKeys(existing: Pub, incoming: { extras: Record<string,string> }) {
  const base = new Set<string>(Object.keys(incoming.extras || {}));
  // include known optional fields that may live on the pub
  ['phone','email','notes','list_name','priority','dueBy','followUpDays'].forEach(k => base.add(k));
  // include any extras we've already accumulated on the canonical pub (if you store them)
  if ((existing as any).extras) Object.keys((existing as any).extras).forEach(k => base.add(k));
  // drop any we already render as primary
  PRIMARY_FIELDS.forEach(f => base.delete(f.key));
  base.delete('name');
  base.delete('postcode'); // already primary but just in case
  return Array.from(base).sort();
}

// Make a reusable row renderer for comparisons
function FieldRow({
  label, left, right,
}: { label:string; left?:string|null; right?:string|null }) {
  const same = isEqual(left, right);
  return (
    <div className="grid grid-cols-3 gap-3 text-sm items-start py-1 border-b border-eggplant-700/30 last:border-0">
      <div className="text-eggplant-300">{label}</div>
      <div className={`truncate ${same ? 'text-eggplant-200' : 'text-yellow-300'}`} title={norm(left)}>{norm(left) || '—'}</div>
      <div className={`truncate ${same ? 'text-eggplant-200' : 'text-yellow-300'}`} title={norm(right)}>{norm(right) || '—'}</div>
    </div>
  );
}

export function DedupReviewDialog({
  autoMerge,
  needsReview,
  onConfirm,
  onCancel
}: DedupReviewDialogProps) {
  // State for selections (persist by suggestion id)
  type Choice = 'merge' | 'skip' | undefined;

  const [choices, setChoices] = useState<Record<string, Choice>>(() => {
    const initial: Record<string, Choice> = {};
    // Pre-select "merge" for high-confidence suggestions
    autoMerge.forEach(s => { initial[s.id] = 'merge'; });
    // Pre-select "merge" for needs review suggestions
    needsReview.forEach(s => { initial[s.id] = 'merge'; });
    return initial;
  });

  const setChoice = (id: string, next: Choice) =>
    setChoices(prev => ({ ...prev, [id]: next }));

  // Convenience getters
  const choiceFor = (id: string) => choices[id];
  const countBy = (ids: string[], val: Choice) =>
    ids.reduce((n, id) => n + (choices[id] === val ? 1 : 0), 0);

  const [searchTerm, setSearchTerm] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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
        const mergeCount = countBy([...needsReview.map(s => s.id), ...autoMerge.map(s => s.id)], 'merge');
        if (mergeCount > 0) {
          handleApply();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [choices, onCancel]);

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

  // Search filter
  const match = (s: Suggestion) =>
    s.existing.pub.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.incoming.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.existing.zip ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.incoming.postcode ?? '').toLowerCase().includes(searchTerm.toLowerCase());

  const filteredNeedsReview = needsReview.filter(match);
  const filteredAutoMerge = autoMerge.filter(match);
  const filteredNeedsReviewIds = filteredNeedsReview.map(s => s.id);
  const filteredAutoMergeIds = filteredAutoMerge.map(s => s.id);

  // Bulk operations
  const bulkSet = (ids: string[], val: Exclude<Choice, undefined>) =>
    setChoices(prev => {
      const next = { ...prev };
      ids.forEach(id => { next[id] = val; });
      return next;
    });

  const handleApply = useCallback(() => {
    const decisions: Array<{ id: string; action: 'merge' | 'skip' }> = [];
    
    // Process all suggestions (unfiltered)
    [...needsReview, ...autoMerge].forEach(suggestion => {
      const choice = choices[suggestion.id];
      if (choice === 'merge' || choice === 'skip') {
        decisions.push({
          id: suggestion.id,
          action: choice
        });
      }
    });
    
    onConfirm(decisions);
  }, [choices, needsReview, autoMerge, onConfirm]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }, [onCancel]);

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
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', suggestion.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`p-4 bg-white/5 border border-eggplant-600/30 rounded-lg cursor-pointer transition-all hover:bg-white/10 hover:border-eggplant-500/50 ${
        choiceFor(suggestion.id) === 'merge' ? 'ring-2 ring-neon-purple/50' : ''
      }`}
      data-testid={`dedupe-card-${suggestion.id}`}
      onClick={() => setChoice(suggestion.id, choiceFor(suggestion.id) === 'merge' ? 'skip' : 'merge')}
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
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name={`choice-${suggestion.id}`}
              checked={choiceFor(suggestion.id) === 'merge'}
              onChange={() => setChoice(suggestion.id, 'merge')}
              className="h-4 w-4 text-neon-purple border-eggplant-600 focus:ring-neon-purple"
              onClick={(e) => e.stopPropagation()}
              data-testid="dedupe-merge"
            />
            <span className="text-sm text-eggplant-300">Merge</span>
          </label>
          <label className="inline-flex items-center gap-2 ml-4">
            <input
              type="radio"
              name={`choice-${suggestion.id}`}
              checked={choiceFor(suggestion.id) === 'skip'}
              onChange={() => setChoice(suggestion.id, 'skip')}
              className="h-4 w-4 text-neon-purple border-eggplant-600 focus:ring-neon-purple"
              onClick={(e) => e.stopPropagation()}
              data-testid="dedupe-skip"
            />
            <span className="text-sm text-eggplant-300">Skip</span>
          </label>
        </div>
      </div>

      {/* Primary details under names */}
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PRIMARY_FIELDS.map(f => {
          const left  = (suggestion.existing as any)[f.key] as string | undefined;
          const right = (suggestion.incoming as any)[f.key] as string | undefined
                      ?? suggestion.incoming.extras?.[f.key];
          const same = isEqual(left, right);
          return (
            <div key={`${suggestion.id}-pf-${f.key}`} className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-eggplant-700/60 text-eggplant-200">
                {f.label}
              </span>
              <span className={`text-sm ${same ? 'text-eggplant-200' : 'text-yellow-300'}`}>
                {norm(left) || '—'}
                <span className="opacity-60"> → </span>
                {norm(right) || '—'}
                {same ? <span className="ml-1 text-green-400">✓</span> : null}
              </span>
            </div>
          );
        })}
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

      {/* Expand/collapse toggle */}
      <button
        type="button"
        className="mt-3 inline-flex items-center gap-2 text-eggplant-200 hover:text-white text-sm"
        aria-expanded={!!expanded[suggestion.id]}
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(prev => ({ ...prev, [suggestion.id]: !prev[suggestion.id] }));
        }}
        data-testid={`dedupe-expand-${suggestion.id}`}
      >
        <svg className={`w-4 h-4 transition-transform ${expanded[suggestion.id] ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M7 5l6 5-6 5V5z"/></svg>
        More details
      </button>

      {expanded[suggestion.id] && (
        <div className="mt-2 rounded-lg border border-eggplant-700/50 bg-eggplant-900/40 p-3">
          <div className="grid grid-cols-3 gap-3 text-xs text-eggplant-400 mb-2">
            <div></div><div>Existing</div><div>Incoming</div>
          </div>

          {buildExtraKeys(suggestion.existing, suggestion.incoming).map(key => {
            const left  = (suggestion.existing as any)[key]
              ?? (suggestion as any).existing?.extras?.[key];
            const right = suggestion.incoming.extras?.[key];
            return (
              <FieldRow key={`${suggestion.id}-ex-${key}`} label={key} left={left} right={right} />
            );
          })}
        </div>
      )}
      
      <div className="text-xs text-eggplant-400">
        From: {suggestion.incoming.fileName} (row {suggestion.incoming.rowIndex + 1})
      </div>
    </div>
  );

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackdropClick}
      role="dialog" 
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className="w-[min(1200px,calc(100vw-32px))] max-h-[90vh] rounded-2xl overflow-hidden bg-eggplant-900 border border-eggplant-700/60 shadow-2xl"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-eggplant-900 via-eggplant-800 to-neon-purple text-white border-b border-eggplant-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
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
                Merge: {countBy([...needsReview.map(s => s.id), ...autoMerge.map(s => s.id)], 'merge')} | 
                Skip: {countBy([...needsReview.map(s => s.id), ...autoMerge.map(s => s.id)], 'skip')}
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
        </div>

        {/* Body (scroll container) */}
        <div className="overflow-hidden">
          {/* add padding bottom so footer doesn't overlap content */}
          <div className="px-4 pb-28">
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name or postcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-eggplant-800/50 border border-eggplant-600/50 rounded-lg text-eggplant-100 placeholder-eggplant-400 focus:outline-none focus:ring-2 focus:ring-neon-purple"
              />
            </div>

            {/* 2-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LEFT column - Needs review */}
              <div className="min-h-[40vh] max-h-[calc(80vh-160px)] overflow-y-auto rounded-xl border border-eggplant-700/40 bg-eggplant-900/40 p-3">
                {/* Column header with All Merge/All Skip — make header sticky */}
                <div className="sticky top-0 z-10 -mx-3 mb-2 px-3 py-2 bg-eggplant-900/90 backdrop-blur border-b border-eggplant-700/40 flex items-center justify-between">
                  <div className="font-medium text-eggplant-100">Needs review – {filteredNeedsReviewIds.length} items</div>
                  <div className="flex gap-2">
                    <button
                      className="px-2 py-1 text-xs bg-neon-purple/20 text-neon-purple rounded hover:bg-neon-purple/30"
                      onClick={() => bulkSet(filteredNeedsReviewIds, 'merge')}
                    >
                      All Merge
                    </button>
                    <button
                      className="px-2 py-1 text-xs bg-eggplant-600/50 text-eggplant-300 rounded hover:bg-eggplant-600/70"
                      onClick={() => bulkSet(filteredNeedsReviewIds, 'skip')}
                    >
                      All Skip
                    </button>
                  </div>
                </div>

                {/* Cards for the left column */}
                <div className="space-y-3">
                  {filteredNeedsReview.map((suggestion, index) => (
                    <SuggestionCard 
                      key={`review-${index}-${suggestion.id}`} 
                      suggestion={suggestion} 
                    />
                  ))}
                  
                  {filteredNeedsReview.length === 0 && (
                    <div className="text-center py-8 text-eggplant-400">
                      No items to review.
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT column - Auto merge */}
              <div className="min-h-[40vh] max-h-[calc(80vh-160px)] overflow-y-auto rounded-xl border border-eggplant-700/40 bg-eggplant-900/40 p-3">
                {/* Sticky column header */}
                <div className="sticky top-0 z-10 -mx-3 mb-2 px-3 py-2 bg-eggplant-900/90 backdrop-blur border-b border-eggplant-700/40 flex items-center justify-between">
                  <div className="font-medium text-eggplant-100">Merge (auto) – {filteredAutoMergeIds.length} items</div>
                  <div className="flex gap-2">
                    <button
                      className="px-2 py-1 text-xs bg-neon-purple/20 text-neon-purple rounded hover:bg-neon-purple/30"
                      onClick={() => bulkSet(filteredAutoMergeIds, 'merge')}
                    >
                      All Merge
                    </button>
                    <button
                      className="px-2 py-1 text-xs bg-eggplant-600/50 text-eggplant-300 rounded hover:bg-eggplant-600/70"
                      onClick={() => bulkSet(filteredAutoMergeIds, 'skip')}
                    >
                      All Skip
                    </button>
                  </div>
                </div>

                {/* Cards for the right column */}
                <div className="space-y-3">
                  {filteredAutoMerge.map((suggestion, index) => (
                    <SuggestionCard 
                      key={`auto-${index}-${suggestion.id}`} 
                      suggestion={suggestion} 
                    />
                  ))}
                  
                  {filteredAutoMerge.length === 0 && (
                    <div className="text-center py-8 text-eggplant-400">
                      No items to merge.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer (always visible) */}
        <div className="sticky bottom-0 z-10 bg-eggplant-900/90 backdrop-blur border-t border-eggplant-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-eggplant-200">
              Merge: {countBy([...filteredNeedsReviewIds, ...filteredAutoMergeIds], 'merge')} |
              Skip: {countBy([...filteredNeedsReviewIds, ...filteredAutoMergeIds], 'skip')}
            </div>
            <div className="flex gap-3">
              <button 
                className="px-4 py-2 rounded-lg border border-eggplant-700/70 text-eggplant-200 hover:text-white hover:border-neon-purple hover:bg-eggplant-800/50" 
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-eggplant-800 hover:bg-eggplant-700 text-white shadow-glow"
                onClick={handleApply}
                data-testid="dedupe-apply"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
