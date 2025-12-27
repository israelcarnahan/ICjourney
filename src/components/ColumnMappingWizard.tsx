import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ColumnMapping, CanonicalField } from '../types/import';
import { CANONICAL_ORDER, autoGuessMapping } from '../utils/columnSynonyms';

const NONE = "__none__"; // sentinel to represent "Not present"

// Field configuration
const REQUIRED = ['name', 'postcode'] as const;
const OPTIONAL_VISIBLE = ['rtm', 'notes', 'address', 'town', 'phone', 'email'] as const;
// Note: lat/lng fields are hidden from UI but preserved in mapping state
const VISIBLE_FIELDS = [...REQUIRED, ...OPTIONAL_VISIBLE];

type Props = {
  headers: string[];            // lowercased, trimmed
  storedMapping?: ColumnMapping | null;
  onCancel: () => void;
  onConfirm: (mapping: ColumnMapping) => void;
  fileName?: string;            // Optional file name to display in header
};

const FIELD_LABELS: Record<CanonicalField, string> = {
  name: 'Business Name',
  postcode: 'Postcode',
  rtm: 'Route to Market',
  address: 'Address',
  town: 'Town/City',
  phone: 'Phone',
  email: 'Email',
  lat: 'Latitude',
  lng: 'Longitude',
  notes: 'Notes',
};

const FIELD_HELPERS: Record<CanonicalField, string> = {
  name: 'Tip: choose the header from your file that best matches "Business Name".',
  postcode: 'Tip: choose the header from your file that best matches "Postcode".',
  rtm: 'Tip: choose the header from your file that best matches "Route to Market".',
  address: 'Tip: choose the header from your file that best matches "Address".',
  town: 'Tip: choose the header from your file that best matches "Town/City".',
  phone: 'Tip: choose the header from your file that best matches "Phone".',
  email: 'Tip: choose the header from your file that best matches "Email".',
  lat: 'Tip: choose the header from your file that best matches "Latitude".',
  lng: 'Tip: choose the header from your file that best matches "Longitude".',
  notes: 'Tip: choose the header from your file that best matches "Notes".',
};

const ColumnMappingWizard: React.FC<Props> = ({
  headers,
  storedMapping,
  onCancel,
  onConfirm,
  fileName,
}) => {
  const [mapping, setMapping] = useState<ColumnMapping>(() => {
    // Initialize with stored mapping or auto-guess
    const initial: ColumnMapping = {} as ColumnMapping;
    CANONICAL_ORDER.forEach(field => {
      initial[field] = null;
    });

    if (storedMapping) {
      Object.assign(initial, storedMapping);
    }

    return initial;
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");

  // Stable signature for React keys
  const sigId = useMemo(() => `wizard-${Date.now()}`, []);

  // Clean and dedupe headers
  const cleanedHeaders = useMemo(() => {
    const arr = (headers ?? [])
      .map(h => String(h ?? "").trim().toLowerCase())
      .filter(h => h.length > 0 && h !== NONE);
    return Array.from(new Set(arr));
  }, [headers]);

  // Filter headers based on search query
  const filteredHeaders = useMemo(() => {
    const q = headerQuery.trim().toLowerCase();
    if (!q) return cleanedHeaders;
    return cleanedHeaders.filter(h => h.toLowerCase().includes(q));
  }, [cleanedHeaders, headerQuery]);

  // Required fields status tracking
  const requiredMappedCount = REQUIRED.reduce((n, f) => {
    const v = mapping[f];
    return n + (v && v !== NONE ? 1 : 0);
  }, 0);
  const requiredComplete = requiredMappedCount === REQUIRED.length;

  // All visible fields status tracking (for the optional chip)
  const allMappedCount = VISIBLE_FIELDS.reduce((n, f) => {
    const v = mapping[f];
    return n + (v && v !== NONE ? 1 : 0);
  }, 0);
  const allComplete = allMappedCount === VISIBLE_FIELDS.length;

  // Confirm button is enabled only when required fields are mapped
  const canConfirm = requiredComplete;

  // Auto-guessed fields
  const autoGuessed = useMemo(() => autoGuessMapping(cleanedHeaders), [cleanedHeaders]);

  // Initialize mapping with auto-guesses if no stored mapping
  useEffect(() => {
    if (!storedMapping) {
      setMapping(prev => {
        const updated = { ...prev };
        Object.assign(updated, autoGuessed);
        return updated;
      });
    }
  }, [storedMapping, autoGuessed]);

  // Prevent background scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleSelect = (field: CanonicalField, value: string | null) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setMapping(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const onDropToField = (field: string, e: React.DragEvent) => {
    e.preventDefault();
    const header = e.dataTransfer.getData('text/plain');
    if (!header) return;
    handleSelect(field as CanonicalField, header);
    setHoveredField(null);
  };

  const onDragOver = (field: string, e: React.DragEvent) => {
    e.preventDefault();
    setHoveredField(field);
  };

  const onDragLeave = () => {
    setHoveredField(null);
  };

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(mapping);
    } else {
      setShowErrors(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canConfirm) {
      handleConfirm();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  // Get display file name
  const displayFileName = fileName || "This file";

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      data-testid="mapping-wizard"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        // backdrop close (ignore clicks inside the panel)
        if (e.currentTarget === e.target) onCancel();
      }}
    >
      <div
        className="w-[min(1000px,calc(100vw-32px))] max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden
                   bg-gradient-to-b from-eggplant-900 via-eggplant-800 to-eggplant-900 border border-eggplant-700/60"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-eggplant-900 via-eggplant-800 to-neon-purple text-white border-b border-eggplant-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Match your columns</h2>
              <p className="text-sm text-eggplant-200 mt-1">
                Mapping: <span className="font-medium">{displayFileName}</span>
              </p>
              <p className="text-[13px] text-eggplant-200 mt-1">
                Drag a header from your file onto a field or pick from the dropdown. Required fields are marked.
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-eggplant-200 hover:text-white transition-colors"
              aria-label="Close mapping wizard"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row max-h-[calc(85vh-140px)] overflow-hidden">
          {/* Left Pane - Excel-like headers */}
          <div className="w-full md:w-1/3 p-4 border-r border-eggplant-700/50 bg-eggplant-900/40">
            <div className="rounded-xl border border-eggplant-700/50 p-4 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-eggplant-100">
                  Your File Headers <span className="opacity-60">({cleanedHeaders.length})</span>
                </h3>
                <input
                  type="text"
                  value={headerQuery}
                  onChange={e => setHeaderQuery(e.target.value)}
                  placeholder="Filter headers…"
                  aria-label="Filter headers"
                  className="text-sm px-2 py-1 rounded-md border border-eggplant-700/60 bg-eggplant-900/60 text-eggplant-100 focus:outline-none focus:ring focus:ring-neon-purple/60"
                />
              </div>

              {/* independent scroll area for LONG lists */}
              <ul
                data-testid="header-list"
                aria-label="Your file headers"
                className="space-y-2 overflow-y-auto pr-1"
                style={{ maxHeight: "60vh" }}
              >
                {filteredHeaders.map((h, i) => (
                  <li
                    key={`${sigId}-src-${i}-${h}`}
                    className="text-sm px-3 py-2 rounded-md border border-eggplant-700/60 flex items-center gap-2 select-none cursor-grab active:cursor-grabbing hover:bg-eggplant-800/50 transition-colors text-eggplant-100 hover:text-white"
                    title={h}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", h);
                      e.dataTransfer.effectAllowed = "copyMove";
                    }}
                  >
                    <span aria-hidden className="inline-block w-2 h-2 rounded-full bg-eggplant-400" />
                    <span className="truncate">{h}</span>
                  </li>
                ))}
                {filteredHeaders.length === 0 && (
                  <li className="text-xs opacity-70 px-1 text-eggplant-300">No headers match "{headerQuery}".</li>
                )}
              </ul>
            </div>
          </div>

          {/* Right Pane - Destination fields */}
          <div className="w-full md:w-2/3 p-4 overflow-y-auto">
            {/* Validation message */}
            {showErrors && !requiredComplete && (
              <div className="mb-4 text-sm text-red-200 bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                <strong>Required fields missing:</strong> {REQUIRED.filter(field => !mapping[field]).map(field => FIELD_LABELS[field]).join(", ")}
              </div>
            )}

            {/* Field mapping grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {VISIBLE_FIELDS.map((field) => (
                <div
                  key={`${sigId}-dst-${field}`}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    hoveredField === field
                      ? 'border-neon-purple bg-neon-purple/10 shadow-glow'
                      : 'border-eggplant-700/60 bg-eggplant-900/40'
                  } ${
                    !mapping[field] && touched[field] ? 'border-red-500/60 bg-red-900/20' : ''
                  }`}
                  onDragOver={(e) => onDragOver(field, e)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDropToField(field, e)}
                >
                  <label className="block text-sm font-medium text-eggplant-100 mb-2">
                    {FIELD_LABELS[field]}
                    {(REQUIRED as readonly string[]).includes(field) && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </label>

                  <select
                    id={`field-${field}`}
                    value={mapping[field] ?? NONE}
                    onChange={(e) => handleSelect(field as CanonicalField, e.target.value === NONE ? null : e.target.value)}
                    className={`w-full border border-eggplant-700/60 bg-eggplant-900/60 text-eggplant-100 rounded-lg px-3 py-2 text-sm focus:outline-none
                               focus:ring-2 focus:ring-neon-purple/60 focus:border-neon-purple/60 transition-colors ${
                                 !mapping[field] && touched[field] ? 'border-red-500/60' : ''
                               }`}
                    aria-invalid={!mapping[field] && touched[field]}
                    aria-describedby={`${field}-helper`}
                  >
                    <option key={`${sigId}-${field}-opt-none`} value={NONE}>— Not present —</option>
                    {cleanedHeaders.map((h, i) => (
                      <option key={`${sigId}-${field}-opt-${i}-${h}`} value={h}>{h}</option>
                    ))}
                  </select>

                  <p id={`${field}-helper`} className="text-xs text-eggplant-300 mt-2">
                    {FIELD_HELPERS[field]}
                  </p>

                  {!mapping[field] && touched[field] && (
                    <p className="text-xs text-red-400 mt-1">This field is required</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 px-6 py-4 bg-eggplant-900/80 backdrop-blur border-t border-eggplant-700/50 flex justify-between items-center">
          <div className="text-xs flex items-center gap-4" aria-live="polite">
            {/* Required chip */}
            {requiredComplete ? (
              <span
                data-testid="status-required"
                className="inline-flex items-center gap-1 text-green-500"
                title="Required fields mapped"
              >
                <span aria-hidden>✓</span>
                <span>Required fields mapped</span>
              </span>
            ) : (
              <span
                data-testid="status-required"
                className="inline-flex items-center gap-1 text-red-500"
                title="Map Business Name and Postcode to proceed"
              >
                <span aria-hidden>✕</span>
                <span>
                  Required missing: {REQUIRED.length - requiredMappedCount} of {REQUIRED.length} left
                </span>
              </span>
            )}

            {/* Optional chip */}
            <span
              data-testid="status-optional"
              className={`inline-flex items-center gap-1 ${allComplete ? 'text-green-400' : 'text-white/70'}`}
              title="Optional fields are not required"
            >
              <span aria-hidden>{allComplete ? '✓' : '•'}</span>
              <span>
                Optional mapped: {allMappedCount - requiredMappedCount}/{VISIBLE_FIELDS.length - REQUIRED.length}
                <span className="ml-1 opacity-60">(not required)</span>
              </span>
            </span>
          </div>

          <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded-lg border border-eggplant-700/70 text-eggplant-200 hover:text-white hover:border-neon-purple hover:bg-eggplant-800/50 transition"
              onClick={onCancel}
              data-testid="mapping-cancel"
            >
              Cancel
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition ${
                canConfirm
                  ? 'bg-eggplant-800 hover:bg-eggplant-700 text-white shadow-glow'
                  : 'bg-eggplant-800/50 text-eggplant-400 cursor-not-allowed'
              }`}
              onClick={handleConfirm}
              disabled={!canConfirm}
              data-testid="mapping-confirm"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ColumnMappingWizard;
