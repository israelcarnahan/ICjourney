import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ColumnMapping, CanonicalField } from '../types/import';
import { CANONICAL_ORDER, REQUIRED_FIELDS, autoGuessMapping } from '../utils/columnSynonyms';

const NONE = "__none__"; // sentinel to represent "Not present"

type Props = {
  headers: string[];            // lowercased, trimmed
  storedMapping?: ColumnMapping | null;
  onCancel: () => void;
  onConfirm: (mapping: ColumnMapping) => void;
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

const ColumnMappingWizard: React.FC<Props> = ({
  headers,
  storedMapping,
  onCancel,
  onConfirm,
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

  const [showErrors, setShowErrors] = useState(false);

  // Clean and dedupe headers
  const cleanedHeaders = useMemo(() => {
    const arr = (headers ?? [])
      .map(h => String(h ?? "").trim().toLowerCase())
      .filter(h => h.length > 0 && h !== NONE);
    return Array.from(new Set(arr));
  }, [headers]);

  // Get currently selected headers
  const selectedHeaders = new Set(Object.values(mapping).filter(Boolean));
  // const availableHeaders = cleanedHeaders.filter(h => !selectedHeaders.has(h)); // TODO: Use for validation

  // Check if required fields are mapped
  const missing = REQUIRED_FIELDS.filter(field => !mapping[field]);
  // const canConfirm = missing.length === 0; // TODO: Use for confirmation logic

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
    setMapping(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
      onClick={(e) => {
        // backdrop close (ignore clicks inside the panel)
        if (e.currentTarget === e.target) onCancel();
      }}
    >
      <div
        className="w-[min(920px,calc(100vw-32px))] max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden
                   bg-gradient-to-b from-eggplant-900 via-eggplant-800 to-eggplant-900 border border-eggplant-700/60"
      >
        {/* Header (sticky) */}
        <div className="sticky top-0 z-10 px-5 py-4 bg-eggplant-900/80 backdrop-blur border-b border-eggplant-700/50">
          <h2 className="text-xl font-semibold text-white">Match your columns</h2>
          <p className="text-[13px] text-eggplant-200 mt-1">
            Match your file's headers to our fields. Required fields are marked. Everything else is saved in
            <span className="px-1 font-medium text-neon-purple">extras</span>.
          </p>
        </div>

        {/* Scrollable content */}
        <div className="px-5 py-4 overflow-y-auto max-h-[calc(85vh-128px)]">
          {/* Validation message (inside scroll area so it stays near fields) */}
          {showErrors && missing.length > 0 && (
            <div className="mt-4 text-sm text-red-200 bg-red-900/20 border border-red-700/50 rounded-lg p-3">
              Required fields missing: {missing.join(", ")}
            </div>
          )}

          {/* 2-col on md+, 1-col on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CANONICAL_ORDER.map((field) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-eggplant-100">
                  {FIELD_LABELS[field]}
                  {REQUIRED_FIELDS.includes(field) && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                </label>
                <select
                  value={mapping[field] ?? NONE}
                  onChange={(e) => handleSelect(field, e.target.value === NONE ? null : e.target.value)}
                  className="border border-eggplant-700/60 bg-eggplant-900/60 text-eggplant-100 rounded-lg px-3 py-2 text-sm focus:outline-none
                             focus:ring-2 focus:ring-neon-purple/60 focus:border-neon-purple/60"
                >
                  <option key={`opt-${NONE}`} value={NONE}>— Not present —</option>
                  {cleanedHeaders.map((h, i) => (
                    <option key={`opt-${h}-${i}`} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

        </div>

        {/* Footer (sticky) */}
        <div className="sticky bottom-0 z-10 px-5 py-3 bg-eggplant-900/80 backdrop-blur border-t border-eggplant-700/50 flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg border border-eggplant-700/70 text-eggplant-200 hover:text-white hover:border-neon-purple hover:bg-eggplant-800/50 transition"
            onClick={onCancel}
            data-testid="mapping-cancel"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-neon-purple text-white hover:brightness-110 transition"
            onClick={() => (missing.length ? setShowErrors(true) : onConfirm(mapping))}
            data-testid="mapping-confirm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ColumnMappingWizard;
