import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx-js-style";
import {
  Upload,
  AlertCircle,
  Star,
  Plus,
  FileText,
  Clock,
  Info,
} from "lucide-react";
import { Pub, usePubData } from "../context/PubDataContext";
import { mapsService } from "../config/maps";
import clsx from "clsx";
import FileTypeDialog from "./FileTypeDialog";
import validatePostcode from "uk-postcode-validator";

interface FileUploaderProps {
  fileType: string;
  isLoaded?: boolean;
  description?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  fileType,
  isLoaded,
  description,
  isRequired = false,
  isDisabled = false,
}) => {
  const { setUserFiles } = usePubData();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [processedPubs, setProcessedPubs] = useState<Pub[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [isFileLoaded, setIsFileLoaded] = useState(isLoaded);

  // Update internal state when isLoaded prop changes
  useEffect(() => {
    setIsFileLoaded(isLoaded);
  }, [isLoaded]);

  const processExcelFile = async (buffer: ArrayBuffer): Promise<Pub[]> => {
    try {
      const workbook = XLSX.read(buffer, { type: "array" });
      if (!workbook?.SheetNames?.length) {
        throw new Error("Invalid Excel file format");
      }

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) {
        throw new Error("Excel file is empty");
      }

      // Convert to JSON with header row mapping and track invalid rows
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
        raw: false,
        defval: "",
        header: 1, // Use 1-based array to get header row
      });

      if (jsonData.length < 2) {
        // Need at least header + one data row
        throw new Error(
          "File must contain a header row and at least one data row"
        );
      }

      // Process headers (first row)
      const headerRow = jsonData[0].map((h: any) => String(h).toLowerCase());
      const skippedRows: Array<{ row: number; reason: string }> = [];

      console.debug("Parsed Excel data:", {
        rowCount: jsonData.length,
        headers: headerRow,
      });

      const columnMappings = {
        pub: headerRow.findIndex((h) => /^(pub|name|outlet)$/i.test(h)),
        zip: headerRow.findIndex((h) => /^(zip|post.*code|postcode)$/i.test(h)),
        install_date: headerRow.findIndex((h) =>
          /^(install.*date|installation.*date)$/i.test(h)
        ),
        last_visited: headerRow.findIndex((h) =>
          /^(last.*visit|previous.*visit)$/i.test(h)
        ),
        rtm: headerRow.findIndex((h) => /^(rtm|route.*manager)$/i.test(h)),
        landlord: headerRow.findIndex((h) =>
          /^(landlord|owner|licensee)$/i.test(h)
        ),
        notes: headerRow.findIndex((h) =>
          /^(notes|comments|remarks)$/i.test(h)
        ),
      };

      console.debug("Column mappings:", columnMappings);

      if (columnMappings.pub === -1 || columnMappings.zip === -1) {
        throw new Error(
          "Required columns not found. Please ensure your Excel file has:\n" +
            '- A column for pub/outlet name (e.g., "Pub", "Name", "Outlet")\n' +
            '- A column for postcode (e.g., "Postcode", "Zip")\n\n' +
            "Found columns: " +
            headerRow.join(", ")
        );
      }

      // Process data rows (skip header row)
      const validPubs: Pub[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 1; // Excel row number (1-based)

        // Skip empty rows
        if (!row || row.every((cell: any) => !cell)) {
          skippedRows.push({ row: rowNum, reason: "Empty row" });
          continue;
        }

        const pubName = String(row[columnMappings.pub] || "").trim();
        const postcode = String(row[columnMappings.zip] || "").trim();

        // Validate required fields
        if (!pubName || !postcode) {
          skippedRows.push({
            row: rowNum,
            reason: `Missing ${!pubName ? "pub name" : ""}${
              !pubName && !postcode ? " and " : ""
            }${!postcode ? "postcode" : ""}`,
          });
          continue;
        }

        validPubs.push({
          pub: pubName,
          zip: postcode,
          install_date:
            columnMappings.install_date >= 0
              ? row[columnMappings.install_date] || null
              : null,
          last_visited:
            columnMappings.last_visited >= 0
              ? row[columnMappings.last_visited] || null
              : null,
          rtm:
            columnMappings.rtm >= 0
              ? String(row[columnMappings.rtm] || "").trim()
              : "",
          landlord:
            columnMappings.landlord >= 0
              ? String(row[columnMappings.landlord] || "").trim()
              : "",
          notes:
            columnMappings.notes >= 0
              ? String(row[columnMappings.notes] || "").trim()
              : "",
        });
      }

      if (validPubs.length === 0) {
        throw new Error(
          `No valid pub entries found (${skippedRows.length} rows skipped).\n\nPlease ensure:\n` +
            "- The file contains pub data (not empty rows)\n" +
            "- Each pub has both a name and postcode\n" +
            "- Column headers are correctly named"
        );
      }

      if (skippedRows.length > 0) {
        console.warn("Skipped rows during import:", skippedRows);
        setError(
          `Warning: ${skippedRows.length} rows were skipped. Check console for details.`
        );
      }

      console.debug("Successfully processed pubs:", {
        total: jsonData.length,
        valid: validPubs.length,
        skipped: skippedRows.length,
        columnMappings,
      });

      return validPubs;
    } catch (error) {
      console.error("Excel processing error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to process Excel file"
      );
    }
  };

  const validatePostcodeFormat = (postcode: string): boolean => {
    try {
      // Remove spaces and convert to uppercase for consistent validation
      const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
      console.debug("Validating postcode format:", {
        original: postcode,
        cleaned: cleanPostcode,
      });

      // Try both with and without space
      const isValidWithSpace = validatePostcode(postcode);
      const isValidWithoutSpace = validatePostcode(cleanPostcode);

      if (!isValidWithSpace && !isValidWithoutSpace) {
        console.warn("Invalid postcode format:", postcode);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Postcode validation error:", { postcode, error });
      return false;
    }
  };

  const validatePostcodes = async (pubs: Pub[]): Promise<void> => {
    try {
      console.debug("Starting postcode validation for", pubs.length, "pubs");

      // First validate format
      const invalidPostcodes = pubs
        .filter((pub) => !validatePostcodeFormat(pub.zip))
        .map((pub) => ({ pub: pub.pub, postcode: pub.zip }));

      if (invalidPostcodes.length > 0) {
        console.warn("Found invalid postcodes:", invalidPostcodes);
        throw new Error(
          `Invalid postcode format found in ${invalidPostcodes.length} entries`
        );
      }

      if (!mapsService.isInitialized()) {
        console.debug("Initializing Maps service for geocoding");
        await mapsService.initialize();
        console.debug("Maps service initialized successfully");
      }

      const geocoder = mapsService.getGeocoder();
      if (!geocoder) {
        console.error("Geocoder not available after initialization");
        throw new Error(
          "Geocoding service not available - please check API key and enabled services"
        );
      }

      // Validate first postcode as a test
      if (pubs.length > 0 && pubs[0].zip) {
        console.debug("Testing geocoding with first postcode:", pubs[0].zip);
        await new Promise((resolve, reject) => {
          const cleanPostcode = pubs[0].zip.replace(/\s+/g, " ").trim();
          geocoder.geocode(
            {
              address: cleanPostcode,
              region: "GB",
              componentRestrictions: { country: "GB" },
            },
            (results, status) => {
              if (status === "OK") {
                console.debug("Geocoding test successful");
                resolve(results);
              } else if (status === "ZERO_RESULTS") {
                console.warn("No results found for postcode:", cleanPostcode);
                resolve([]);
              } else {
                console.error("Geocoding test failed:", status);
                reject(new Error(`Geocoding failed: ${status}`));
              }
            }
          );
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown validation error";
      console.error("Postcode validation failed:", errorMessage);
      throw new Error(`Postcode validation failed: ${errorMessage}`);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Prevent file drops if disabled
      if (isDisabled) {
        return;
      }

      if (acceptedFiles.length === 0) {
        setError("Please select a valid Excel file");
        console.warn("No files accepted in drop");
        return;
      }

      setIsProcessing(true);
      setError(null);

      const file = acceptedFiles[0];
      console.debug("Processing file:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      setCurrentFileName(file.name);
      const reader = new FileReader();

      reader.onload = async (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        if (!buffer) {
          console.error("Failed to read file buffer");
          setError("Failed to read file");
          setIsProcessing(false);
          return;
        }

        try {
          const pubs = await processExcelFile(buffer);
          console.debug("Successfully processed pubs:", {
            count: pubs.length,
            sample: pubs[0],
          });

          if (fileType === "masterfile") {
            const fileId = crypto.randomUUID();
            const uploadTime = Date.now();
            const enhancedPubs = pubs.map((pub) => ({
              ...pub,
              fileName: file.name,
              uploadTime,
              fileId,
              Priority: "Masterfile",
              listType: "masterhouse",
            }));
            console.debug("Enhanced masterfile pubs:", {
              count: enhancedPubs.length,
              sample: enhancedPubs[0],
            });
            setUserFiles((prev) => ({
              files: [
                ...prev.files,
                {
                  fileId,
                  fileName: file.name,
                  type: "masterhouse",
                  uploadTime,
                },
              ],
              pubs: [...prev.pubs, ...enhancedPubs],
            }));
            setIsFileLoaded(true);
          } else {
            setProcessedPubs(pubs);
            setShowTypeDialog(true);
          }
        } catch (error) {
          console.error("File processing error:", error);
          setError(
            error instanceof Error ? error.message : "Failed to process file"
          );
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        console.error("FileReader error:", reader.error);
        setError("Failed to read file");
        setIsProcessing(false);
      };

      reader.readAsArrayBuffer(file);
    },
    [isDisabled, fileType, setUserFiles, isFileLoaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    disabled: isDisabled || isProcessing || isFileLoaded,
    multiple: false,
  });

  const handleTypeDialogSubmit = (
    type: string,
    deadline?: string,
    priorityLevel?: number,
    followUpDays?: number
  ) => {
    const fileId = crypto.randomUUID();
    const uploadTime = Date.now();

    setUserFiles((prev) => ({
      files: [
        ...prev.files,
        {
          fileId,
          fileName: currentFileName,
          type,
          uploadTime,
          ...(deadline && { deadline }),
          ...(priorityLevel && { priorityLevel }),
          ...(followUpDays && { followUpDays }),
        },
      ],
      pubs: [
        ...prev.pubs,
        ...processedPubs.map((pub) => ({
          ...pub,
          fileName: currentFileName,
          fileId,
          uploadTime,
          listType: type,
          Priority:
            type === "wins"
              ? "RepslyWin"
              : type === "hitlist"
              ? "Wishlist"
              : type === "unvisited"
              ? "Unvisited"
              : "Masterfile",
          ...(deadline && { deadline }),
          ...(priorityLevel && { priorityLevel }),
          ...(followUpDays && { followUpDays }),
        })),
      ],
    }));

    setIsFileLoaded(true);
    setShowTypeDialog(false);
    setProcessedPubs([]);
    setCurrentFileName("");
  };

  return (
    <div
      className={clsx(
        "animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg w-full overflow-hidden",
        isDisabled && "opacity-75 pointer-events-none"
      )}
    >
      <div
        {...getRootProps()}
        className={`
          relative cursor-pointer group h-[72px]
          rounded-md border border-dashed overflow-hidden
          transition-all duration-300 transform hover:scale-[1.02]
          ${
            isDragActive
              ? "border-neon-purple bg-eggplant-800/50"
              : "border-eggplant-700 hover:border-neon-purple"
          }
          ${isFileLoaded ? "bg-green-900/20" : "bg-dark-900/50"}
          ${isRequired ? "ring-2 ring-neon-purple ring-opacity-50" : ""}
        `}
      >
        <input {...getInputProps()} />

        <div className="p-2 text-center relative z-10">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-purple"></div>
              <p className="mt-1 text-[10px] text-eggplant-200">
                Processing...
              </p>
            </div>
          ) : isFileLoaded ? (
            <div className="space-y-2">
              <div className="flex flex-col items-center justify-center text-green-200">
                <Upload className="h-4 w-4" />
                <span className="text-[10px] mt-1">✨ {currentFileName}</span>
                <span className="text-[10px] text-green-300">
                  Drop to replace
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload
                className={`
                  h-4 w-4 transition-all duration-300 transform
                  ${
                    isDragActive
                      ? "text-neon-purple scale-105"
                      : "text-eggplant-400"
                  }
                  group-hover:text-neon-purple group-hover:scale-110
                `}
              />
              <p
                className={clsx(`
                text-xs font-medium
                ${
                  isDragActive
                    ? "text-neon-purple"
                    : isFileLoaded
                    ? "text-green-200"
                    : "text-eggplant-100"
                }
              `)}
              >
                {isDragActive
                  ? "✨ Drop to Upload ✨"
                  : isFileLoaded
                  ? `✨ ${currentFileName} ✨`
                  : "Upload Excel File"}
              </p>
              {description && (
                <p className="text-[10px] text-eggplant-200">{description}</p>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="text-[10px] text-eggplant-300 hover:text-neon-purple transition-colors flex items-center gap-1"
              >
                <Info className="h-2 w-2" />
                {showDetails ? "Hide options" : "Show options"}
              </button>
              {showDetails && (
                <div className="text-[10px] text-eggplant-300 mt-1">
                  <p>• Set priority levels (1-3)</p>
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
          className={`
            absolute inset-0 bg-gradient-radial from-neon-purple/5 via-transparent to-transparent
            transition-opacity duration-300
            ${isDragActive || isFileLoaded ? "opacity-100" : "opacity-0"}
          `}
        />

        {error && (
          <div className="absolute -bottom-16 left-0 right-0 p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-200 flex items-start gap-2">
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
        }}
        onSubmit={handleTypeDialogSubmit}
        error={error}
        setError={setError}
        fileType={fileType}
        currentFileName={currentFileName}
      />
    </div>
  );
};

export default FileUploader;
