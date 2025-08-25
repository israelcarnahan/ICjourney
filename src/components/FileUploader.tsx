import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx-js-style";
import { Upload, AlertCircle, Info } from "lucide-react";
import clsx from "clsx";
import validatePostcode from "uk-postcode-validator";

import type { ListType, Pub } from "../context/PubDataContext";
import { usePubData } from "../context/PubDataContext";
import { mapsService } from "../config/maps";

import FileTypeDialog from "./FileTypeDialog";
import ColumnMappingWizard from "./ColumnMappingWizard";
import { useColumnMapping } from "../hooks/useColumnMapping";
import type { ColumnMapping, HeaderSignature, MappedRow } from "../types/import";
import { devLog } from "../utils/devLog";
import { suggest, convertToSuggestions } from "../utils/dedupe";
import { DedupReviewDialog, type Suggestion } from "./DedupReviewDialog";
import { mergeIntoCanonical } from "../utils/lineageMerge";

// Minimal row returned from Excel (no ids/metadata yet)
type ImportedRow = {
  pub: string;
  zip: string;
  rtm?: string;
  landlord?: string;
  install_date?: string | null;
  last_visited?: string | null;
  notes?: string;
};

interface FileUploaderProps {
  /** "masterhouse" for the master list. Any other value means additional lists. */
  fileType: ListType;
  isLoaded?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  usedPriorities?: number[];
}

const FileUploader: React.FC<FileUploaderProps> = ({
  fileType,
  isLoaded,
  isRequired = false,
  isDisabled = false,
  usedPriorities = [],
}) => {
  const { setUserFiles } = usePubData();

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [processedPubs, setProcessedPubs] = useState<ImportedRow[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [isFileLoaded, setIsFileLoaded] = useState(isLoaded);

  // Wizard state
  const { save: saveMapping, load: loadMapping } = useColumnMapping();
  const [showMapping, setShowMapping] = useState(false);
  const [sourceHeaders, setSourceHeaders] = useState<string[]>([]);
  const [storedForWizard, setStoredForWizard] = useState<ColumnMapping | null>(null);
  const resolverRef = useRef<((m: ColumnMapping) => void) | null>(null);

  // Deduplication state
  const [showDedupDialog, setShowDedupDialog] = useState(false);
  const [dedupSuggestions, setDedupSuggestions] = useState<{ autoMerge: Suggestion[]; needsReview: Suggestion[] }>({ autoMerge: [], needsReview: [] });
  const [pendingPubs, setPendingPubs] = useState<Pub[]>([]);
  const [pendingFile, setPendingFile] = useState<any>(null);
  const [hasPendingDedup, setHasPendingDedup] = useState(false);
  const [pendingRowIndices, setPendingRowIndices] = useState<Record<string, number>>({});

  // reflect prop
  useEffect(() => setIsFileLoaded(isLoaded), [isLoaded]);

  // lock scroll while wizard is open
  useEffect(() => {
    document.body.style.overflow = showMapping ? "hidden" : "";
  }, [showMapping]);

  // ---------- helpers ----------
  function coerceNumber(val: any): number | null {
    const n = Number(String(val ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  function mapRowToCanonical(row: Record<string, any>, mapping: ColumnMapping): MappedRow {
    const pick = (field: keyof ColumnMapping) => {
      const src = mapping[field];
      if (!src) return null;
      const v = row[src];
      return typeof v === "string" ? v.trim() : (v ?? null);
    };

    const used = new Set(Object.values(mapping).filter(Boolean) as string[]);
    const out: MappedRow = {
      name: String(pick("name") ?? ""),
      postcode: String(pick("postcode") ?? ""),
      rtm: pick("rtm") as string | null,
      address: pick("address") as string | null,
      town: pick("town") as string | null,
      lat: coerceNumber(pick("lat")),
      lng: coerceNumber(pick("lng")),
      phone: pick("phone") as string | null,
      email: pick("email") as string | null,
      notes: pick("notes") as string | null,
      extras: {},
    };

    // keep anything the user didn’t map (so we never lose columns)
    for (const [k, v] of Object.entries(row)) {
      const key = String(k).trim().toLowerCase();
      if (!used.has(key)) (out.extras as any)[key] = v;
    }
    return out;
  }

  async function waitForMapping(headers: string[]): Promise<ColumnMapping> {
    const sig: HeaderSignature = { headers };
    setSourceHeaders(headers);
    setStoredForWizard(loadMapping(sig) ?? null);

    if (showTypeDialog) setShowTypeDialog(false);
    setShowMapping(true);

    return new Promise<ColumnMapping>((resolve) => {
      resolverRef.current = resolve;
    });
  }

  const validatePostcodeFormat = (postcode: string): boolean => {
    try {
      const clean = postcode.replace(/\s+/g, "").toUpperCase();
      return validatePostcode(postcode) || validatePostcode(clean);
    } catch {
      return false;
    }
  };

  const validatePostcodes = async (rows: ImportedRow[]): Promise<void> => {
    const invalid = rows.filter((p) => !validatePostcodeFormat(p.zip));
    if (invalid.length) throw new Error(`Invalid postcode format in ${invalid.length} row(s).`);

    // smoke test; do not block whole import
    try {
      if (!mapsService.isInitialized()) await mapsService.initialize();
      const geocoder = mapsService.getGeocoder();
      if (!geocoder || rows.length === 0) return;

      const sample = rows[0].zip.replace(/\s+/g, " ").trim();
      await new Promise((resolve) => {
        geocoder.geocode(
          { address: sample, region: "GB", componentRestrictions: { country: "GB" } },
          () => resolve(true)
        );
      });
    } catch {
      /* non-fatal */
    }
  };

  // ---------- main parse + map flow ----------
  const processExcelFile = async (buffer: ArrayBuffer): Promise<ImportedRow[]> => {
    const workbook = XLSX.read(buffer, { type: "array" });
    if (!workbook?.SheetNames?.length) throw new Error("Invalid Excel file format");

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) throw new Error("Excel file is empty");

    const raw = XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    }) as any[][];

    if (raw.length < 2) throw new Error("File must contain a header row and at least one data row");

    const headerRow = (raw[0] ?? []).map((h: any) => String(h ?? "").trim().toLowerCase());
    const bodyRows = raw.slice(1);

    const rowObjects: Record<string, any>[] = bodyRows.map((arr) => {
      const obj: Record<string, any> = {};
      headerRow.forEach((h, i) => (obj[h] = arr[i]));
      return obj;
    });

    // Sanitize headers before calling the wizard
    const safeHeaders = Array.from(
      new Set(
        headerRow.map(h => String(h ?? "").trim().toLowerCase()).filter(h => h.length > 0 && h !== "__none__")
      )
    );

    const mapping = await waitForMapping(safeHeaders);

    const mapped: MappedRow[] = rowObjects
      .map((r) => mapRowToCanonical(r, mapping))
      .filter((r) => r.name && r.postcode);

    if (mapped.length === 0) {
      throw new Error("No valid rows after mapping (name + postcode required).");
    }

    const rows: ImportedRow[] = mapped.map((r) => ({
      pub: r.name,
      zip: r.postcode,
      rtm: r.rtm ?? undefined,
      landlord:
        (r.extras?.landlord as string) ??
        (r.extras?.owner as string) ??
        (r.extras?.licensee as string) ??
        undefined,
      install_date: (r.extras?.install_date as string) ?? null,
      last_visited: (r.extras?.last_visited as string) ?? null,
      notes: r.notes ?? undefined,
    }));

    const dropped = rowObjects.length - rows.length;
    if (dropped > 0) {
      devLog(`Skipped ${dropped} rows due to missing required fields.`);
      setError(`Warning: ${dropped} row(s) were skipped. Check console for details.`);
    }

    return rows;
  };

  // ---------- drop handler ----------
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (isDisabled || isProcessing || showMapping) return;

      if (acceptedFiles.length === 0) {
        setError("Please select a valid Excel file");
        return;
      }

      setIsProcessing(true);
      setError(null);

      const file = acceptedFiles[0];
      setCurrentFileName(file.name);

      const reader = new FileReader();
      reader.onload = async (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        if (!buffer) {
          setError("Failed to read file");
          setIsProcessing(false);
          return;
        }

        try {
          const rows = await processExcelFile(buffer);
          await validatePostcodes(rows);

          if (fileType === "masterhouse") {
            const fileId = crypto.randomUUID();
            const uploadTime = Date.now();

            const enhanced: Pub[] = rows.map((r) => ({
              uuid: crypto.randomUUID(),
              fileId,
              fileName: file.name,
              listType: "masterhouse",
              deadline: undefined,
              priorityLevel: undefined,
              followUpDays: undefined,
              zip: r.zip,
              pub: r.pub,
              last_visited: r.last_visited ?? undefined,
              rtm: r.rtm ?? undefined,
              landlord: r.landlord ?? undefined,
              notes: r.notes ?? undefined,
              Priority: "Masterfile",
            }));

            setUserFiles((prev) => ({
              files: [
                ...prev.files,
                {
                  fileId,
                  fileName: file.name,
                  name: file.name,
                  type: "masterhouse",
                  uploadTime,
                  count: enhanced.length,
                },
              ],
              pubs: [...prev.pubs, ...enhanced],
            }));
            setIsFileLoaded(true);
          } else {
            setProcessedPubs(rows);
            setShowTypeDialog(true);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to process file");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read file");
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(file);
    },
    [isDisabled, isProcessing, showMapping, fileType, setUserFiles]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    disabled: isDisabled || isProcessing || isFileLoaded,
    multiple: false,
    noClick: true, // we’ll use our own button
    onDropRejected: (rejections) => {
      devLog("[Dropzone rejected]", rejections);
      setError("Unsupported file type. Please upload an .xlsx or .xls file.");
    },
  });

  const handleDedupConfirm = (decisions: Array<{ id: string; action: 'merge' | 'skip' }>) => {
    setUserFiles((prev) => {
      const updatedPubs = [...prev.pubs];
      const newPubs: Pub[] = [];
      
      // Track which incoming pubs have been processed
      const processedIncomingIds = new Set<string>();
      
      // Process each decision
      decisions.forEach(decision => {
        const [existingId, incomingId] = decision.id.split('::');
        processedIncomingIds.add(incomingId);
        
        if (decision.action === 'merge') {
          // Find the canonical pub and incoming pub
          const canonicalIndex = updatedPubs.findIndex(p => p.uuid === existingId);
          const incomingPub = pendingPubs.find(p => p.uuid === incomingId);
          
          if (canonicalIndex !== -1 && incomingPub) {
            // Get the original row data for mapping
            const rowIndex = pendingRowIndices[incomingId] || 0;
            const originalRow = processedPubs[rowIndex];
            
            // Build mapped values and extras
            const mappedValues: Record<string, string> = {
              pub: incomingPub.pub,
              zip: incomingPub.zip,
              landlord: incomingPub.landlord || '',
              notes: incomingPub.notes || '',
            };
            
            const extras: Record<string, string> = {};
            if (originalRow) {
              Object.entries(originalRow).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                  extras[key] = String(value);
                }
              });
            }
            
            // Add RTM to extras if it exists
            if (incomingPub.rtm) {
              extras['rtm'] = incomingPub.rtm;
            }
            
            // Merge into canonical using append-only lineage
            const updatedCanonical = mergeIntoCanonical(
              updatedPubs[canonicalIndex],
              incomingPub,
              rowIndex,
              mappedValues,
              extras
            );
            
            updatedPubs[canonicalIndex] = updatedCanonical;
          }
        } else {
          // Skip - add as new pub
          const incomingPub = pendingPubs.find(p => p.uuid === incomingId);
          if (incomingPub) {
            newPubs.push(incomingPub);
          }
        }
      });
      
      // Add any remaining pubs that weren't in the deduplication decisions
      // (these were ignored by the deduplication algorithm but should still be added)
      pendingPubs.forEach(incomingPub => {
        if (!processedIncomingIds.has(incomingPub.uuid)) {
          newPubs.push(incomingPub);
        }
      });
      
      return {
        files: [...prev.files, pendingFile],
        pubs: [...updatedPubs, ...newPubs],
      };
    });

    // Reset state
    setShowDedupDialog(false);
    setPendingPubs([]);
    setPendingFile(null);
    setPendingRowIndices({});
    setDedupSuggestions({ autoMerge: [], needsReview: [] });
    setHasPendingDedup(false);

    // Handle UI state
    if (fileType === "masterhouse") {
      setIsFileLoaded(true);
    } else {
      setIsFileLoaded(false);
      setShowDetails(false);
    }
    setShowTypeDialog(false);
    setProcessedPubs([]);
    setCurrentFileName("");
    setIsProcessing(false);
  };

  const handleTypeDialogSubmit = (
    type: ListType,
    deadline?: string,
    priorityLevel?: number,
    followUpDays?: number
  ) => {
    devLog('[Submit additional]', { type, deadline, priorityLevel, followUpDays });

    const fileId = crypto.randomUUID();
    const uploadTime = Date.now();

    // Determine scheduling mode
    const schedulingMode: 'deadline' | 'priority' | 'followup' =
      deadline ? 'deadline' :
      (Number.isFinite(followUpDays) && (followUpDays as number) > 0 ? 'followup' : 'priority');

    const enriched: Pub[] = processedPubs.map((r) => ({
      uuid: crypto.randomUUID(),
      fileId,
      fileName: currentFileName,
      listType: type,
      deadline: schedulingMode === 'deadline' ? deadline : undefined,
      priorityLevel: schedulingMode === 'priority' ? priorityLevel : undefined,
      followUpDays: schedulingMode === 'followup' ? followUpDays : undefined,
      zip: r.zip,
      pub: r.pub,
      last_visited: r.last_visited ?? undefined,
      rtm: r.rtm ?? undefined,
      landlord: r.landlord ?? undefined,
      notes: r.notes ?? undefined,
      Priority:
        type === "wins"
          ? "RepslyWin"
          : type === "hitlist"
          ? "Wishlist"
          : type === "unvisited"
          ? "Unvisited"
          : "Masterfile",
    }));

    setUserFiles((prev) => {
      // For non-master files, check for duplicates
      if (type !== "masterhouse") {
        // Convert Pub types for deduplication
        const existingPubs = prev.pubs.map(pub => ({
          uuid: pub.uuid,
          name: pub.pub,
          postcode: pub.zip,
          address: undefined,
          town: undefined,
          phone: undefined,
          email: undefined,
          rtm: pub.rtm,
        }));
        
        const incomingPubs = enriched.map(pub => ({
          uuid: pub.uuid,
          name: pub.pub,
          postcode: pub.zip,
          address: undefined,
          town: undefined,
          phone: undefined,
          email: undefined,
          rtm: pub.rtm,
        }));
        
                 const { autoMerge, needsReview } = suggest(existingPubs, incomingPubs);
         
         if (autoMerge.length > 0 || needsReview.length > 0) {
           // Build row index mapping
           const rowIndices: Record<string, number> = {};
           enriched.forEach((pub, index) => {
             rowIndices[pub.uuid] = index;
           });
           
           // Convert to suggestions format
           const autoMergeSuggestions = convertToSuggestions(autoMerge, existingPubs, incomingPubs, currentFileName, rowIndices);
           const needsReviewSuggestions = convertToSuggestions(needsReview, existingPubs, incomingPubs, currentFileName, rowIndices);
           
           // Store pending data and show compact summary
           setPendingPubs(enriched);
           setPendingRowIndices(rowIndices);
           setPendingFile({
             fileId,
             fileName: currentFileName,
             name: currentFileName,
             type,
             uploadTime,
             count: enriched.length,
             schedulingMode,
             deadline: schedulingMode === 'deadline' ? deadline : undefined,
             priority: schedulingMode === 'priority' ? priorityLevel : undefined,
             followUpDays: schedulingMode === 'followup' ? followUpDays : undefined,
           });
           setDedupSuggestions({ autoMerge: autoMergeSuggestions, needsReview: needsReviewSuggestions });
           setHasPendingDedup(true);
           return prev; // Return unchanged state
         }
      }

      // No duplicates or master file - add directly
            return {
        files: [
          ...prev.files,
          {
            fileId,
            fileName: currentFileName,
            name: currentFileName,
            type,
            uploadTime,
            count: enriched.length,
            schedulingMode,
            deadline: schedulingMode === 'deadline' ? deadline : undefined,
            priority: schedulingMode === 'priority' ? priorityLevel : undefined,
            followUpDays: schedulingMode === 'followup' ? followUpDays : undefined,
          },
        ],
        pubs: [...prev.pubs, ...enriched],
      };
    });

    if (fileType === "masterhouse") {
      // Keep Step 1 locked once loaded for masterhouse
      setIsFileLoaded(true);
    } else {
      // Re-enable the dropzone for additional lists so users can add more
      setIsFileLoaded(false);
      setShowDetails(false);
    }
    setShowTypeDialog(false);
    setProcessedPubs([]);
    setCurrentFileName("");
    setIsProcessing(false);
  };

  // Log uploader flags in useEffect to prevent spam
  useEffect(() => {
    devLog('[Uploader flags]', { fileType, isDisabled, isProcessing, isFileLoaded });
  }, [fileType, isDisabled, isProcessing, isFileLoaded]);

  return (
    <div
      className={clsx(
        "animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg w-full overflow-hidden",
        isDisabled && "opacity-75 pointer-events-none"
      )}
    >
      <div
        {...getRootProps()}
        data-testid="uploader-dropzone"
        aria-label={`Upload Excel for ${fileType}`}
        role="button"
        className={clsx(
          "relative cursor-pointer group h-[92px] rounded-md border border-dashed overflow-hidden transition-all duration-300 transform hover:scale-[1.02]",
          isDragActive
            ? "border-neon-purple bg-eggplant-800/50 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
            : "border-eggplant-700 hover:border-neon-purple",
          isFileLoaded ? "bg-green-900/20" : "bg-dark-900/50",
          isRequired && "ring-2 ring-neon-purple ring-opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="p-3 text-center relative z-10">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neon-purple"></div>
              <p className="mt-1 text-[10px] text-eggplant-200">Processing...</p>
            </div>
          ) : isFileLoaded ? (
            <div className="space-y-2">
              <div className="flex flex-col items-center justify-center text-green-200">
                <Upload className="h-4 w-4" />
                <span className="text-[10px] mt-1">✨ {currentFileName}</span>
                <span className="text-[10px] text-green-300">Drop to replace</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload
                className={clsx(
                  "h-5 w-5 transition-all duration-300 transform",
                  isDragActive ? "text-neon-purple scale-105" : "text-eggplant-400",
                  "group-hover:text-neon-purple group-hover:scale-110"
                )}
              />
              <p
                className={clsx(
                  "text-xs font-medium",
                  isDragActive ? "text-neon-purple" : isFileLoaded ? "text-green-200" : "text-eggplant-100"
                )}
              >
                {isDragActive ? "✨ Drop to Upload ✨" : isFileLoaded ? `✨ ${currentFileName} ✨` : "Upload Excel File"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                  className="text-[11px] px-2 py-1 rounded-md border border-eggplant-700/70 text-eggplant-200 hover:text-white hover:border-neon-purple hover:bg-eggplant-800/50 transition"
                >
                  Choose file…
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails((v) => !v);
                  }}
                  className="text-[10px] text-eggplant-300 hover:text-neon-purple transition-colors flex items-center gap-1"
                >
                  <Info className="h-3 w-3" />
                  {showDetails ? "Hide options" : "Show options"}
                </button>
              </div>
              {showDetails && (
                <div className="text-[10px] text-eggplant-300 mt-1">
                  <p>• Map columns first (wizard)</p>
                  <p>• Set priority levels (1–3)</p>
                  <p>• Add target dates</p>
                  <p>• Configure follow-ups</p>
                </div>
              )}
              <p className="text-[10px] text-eggplant-300">
                {isRequired ? "⚠️ Required file" : "🎉 Optional enhancement"}
              </p>
            </div>
          )}
        </div>

        <div
          className={clsx(
            "absolute inset-0 bg-gradient-radial from-neon-purple/5 via-transparent to-transparent transition-opacity duration-300",
            isDragActive || isFileLoaded ? "opacity-100" : "opacity-0"
          )}
        />

        {error && (
          <div className="absolute -bottom-20 left-0 right-0 p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-200 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      <FileTypeDialog
        isOpen={showTypeDialog}
        onClose={() => {
          setShowTypeDialog(false);
          setProcessedPubs([]);
          setCurrentFileName("");
          setIsProcessing(false);
          setIsFileLoaded(false);
          setShowDetails(false);
        }}
        onSubmit={handleTypeDialogSubmit}
        error={error}
        setError={setError}
        fileType={fileType}
        currentFileName={currentFileName}
        usedPriorities={usedPriorities}
      />

      {/* Deduplication Summary Card */}
      {hasPendingDedup && (
        <div className="mt-4 p-4 bg-gradient-to-r from-eggplant-900/90 via-eggplant-800/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg border border-eggplant-700/60">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-neon-purple mb-1">
                Duplicate Detection Results
              </h3>
              <p className="text-xs text-eggplant-200">
                Found {dedupSuggestions.autoMerge.length + dedupSuggestions.needsReview.length} potential duplicates in {pendingFile?.fileName}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-eggplant-300">
                <span>✅ Auto-merge: {dedupSuggestions.autoMerge.length}</span>
                <span>⚠️ Needs review: {dedupSuggestions.needsReview.length}</span>
              </div>
            </div>
            <button
              onClick={() => setShowDedupDialog(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-neon-purple border border-transparent rounded-lg hover:bg-neon-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon-purple"
            >
              Review duplicates
            </button>
          </div>
        </div>
      )}

      {showDedupDialog && (
         <DedupReviewDialog
           autoMerge={dedupSuggestions.autoMerge}
           needsReview={dedupSuggestions.needsReview}
           onConfirm={handleDedupConfirm}
           onCancel={() => {
             setShowDedupDialog(false);
             setPendingPubs([]);
             setPendingFile(null);
             setPendingRowIndices({});
             setDedupSuggestions({ autoMerge: [], needsReview: [] });
             setHasPendingDedup(false);
             setShowTypeDialog(false);
             setProcessedPubs([]);
             setCurrentFileName("");
             setIsProcessing(false);
             setIsFileLoaded(false);
             setShowDetails(false);
           }}
         />
       )}

      {showMapping && (
        <ColumnMappingWizard
          headers={sourceHeaders}
          storedMapping={storedForWizard}
          fileName={currentFileName}
          onCancel={() => {
            setShowMapping(false);
            resolverRef.current = null;
          }}
          onConfirm={(mapping) => {
            // persist mapping for these headers
            saveMapping({ headers: sourceHeaders }, mapping);
            setShowMapping(false);
            // continue the async flow
            resolverRef.current?.(mapping);
            resolverRef.current = null;
          }}
        />
      )}
    </div>
  );
};

export default FileUploader;
