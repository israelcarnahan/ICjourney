import React from "react";
import { Plus, Star, Target, AlertTriangle, Clock, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import { devLog } from "../utils/devLog";
import * as Switch from "@radix-ui/react-switch";
import clsx from "clsx";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx-js-style";
import validatePostcode from "uk-postcode-validator";
import { mapsService } from "../config/maps";

interface EnhancementSelectorProps {
  onFileLoaded: (type: string, pubs: any[]) => void;
  isDisabled?: boolean;
  maxFiles?: number;
  currentFiles: any[];
}

interface FileConfig {
  deadline?: string;
  priorityLevel?: number;
  followUpDays?: number;
}

const FOLLOWUP_DISABLED_MESSAGE =
  "Coming later - requires visit history/CRM import to compute per-account follow-up due dates.";
const FOLLOWUP_BLOCKED_DETAIL =
  "Follow-up scheduling isn't supported yet. Use Priority or Deadline lists for now.";

const ENHANCEMENT_OPTIONS = [
  {
    id: "wins",
    name: "Recent Wins",
    description: "Track and follow up on installations",
    icon: Star,
    color: "bg-purple-900/20 border-purple-700/50 text-purple-200",
    requiresFollowUp: true,
  },
  {
    id: "hitlist",
    name: "Hit Lists",
    description: "KPI Targets and warm leads",
    icon: Target,
    color: "bg-blue-900/20 border-blue-700/50 text-blue-200",
    requiresPriority: true,
  },
];

const EnhancementSelector: React.FC<EnhancementSelectorProps> = ({
  onFileLoaded,
  isDisabled = false,
  maxFiles = 5,
  currentFiles,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [currentFileName, setCurrentFileName] = React.useState("");
  const [processedPubs, setProcessedPubs] = React.useState<any[]>([]);
  const [selectedOption, setSelectedOption] = React.useState<
    (typeof ENHANCEMENT_OPTIONS)[0] | null
  >(null);
  const [config, setConfig] = React.useState<FileConfig>({
    deadline: "",
    priorityLevel: 1,
    followUpDays: 12,
  });
  const [needsDeadline, setNeedsDeadline] = React.useState(false);

  // Track used priority levels
  const usedPriorityLevels = React.useMemo(() => {
    return currentFiles
      .filter((file) => file.type === "hitlist" && !file.deadline)
      .map((file) => file.priority)
      .filter((priority): priority is number => priority !== undefined);
  }, [currentFiles]);

  // Calculate actual file count by type
  const fileCountByType = React.useMemo(() => {
    return currentFiles.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [currentFiles]);

  const processExcelFile = async (buffer: ArrayBuffer): Promise<any[]> => {
    try {
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      const pubs = jsonData.map((row: any) => ({
        pub: row.pub || row.Pub || row.name || row.Name || "",
        zip: row.zip || row.Zip || row.postcode || row.Postcode || "",
        install_date:
          row.install_date ||
          row.InstallDate ||
          row.installation_date ||
          row.InstallationDate ||
          null,
        last_visited: row.last_visited || row.LastVisited || null,
        rtm: row.rtm || row.RTM || "",
        landlord: row.landlord || row.Landlord || "",
        notes: row.notes || row.Notes || "",
      }));

      if (pubs.some((pub) => !pub.pub || !pub.zip)) {
        throw new Error("Some entries are missing pub name or postcode");
      }

      // Validate install_date for Repsly wins
      if (
        selectedOption?.id === "wins" &&
        pubs.some((pub) => !pub.install_date)
      ) {
        throw new Error("Some Repsly wins are missing installation dates");
      }

      return pubs;
    } catch (error) {
      throw new Error("Failed to process Excel file");
    }
  };

  const validatePostcodes = async (pubs: any[]): Promise<void> => {
    try {
      const invalidPostcodes = pubs
        .filter(
          (pub) => !validatePostcode(pub.zip.replace(/\s+/g, "").toUpperCase())
        )
        .map((pub) => ({ pub: pub.pub, postcode: pub.zip }));

      if (invalidPostcodes.length > 0) {
        throw new Error(
          `Invalid postcode format found in ${invalidPostcodes.length} entries`
        );
      }

      await mapsService.initialize();
    } catch (error) {
      throw new Error(
        `Postcode validation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      if (!selectedOption || isDisabled) return;

      if (acceptedFiles.length === 0) {
        setError("Please select a valid Excel file");
        return;
      }

      setIsProcessing(true);
      setError(null);

      const file = acceptedFiles[0];
      setCurrentFileName(file.name);

      try {
        const buffer = await file.arrayBuffer();
        const pubs = await processExcelFile(buffer);
        await validatePostcodes(pubs);
        setProcessedPubs(pubs);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to process file"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedOption, isDisabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled: !selectedOption || isDisabled,
  });

  const handleSubmit = () => {
    if (!selectedOption || !processedPubs.length) return;

    try {
      const fileId = crypto.randomUUID();
      const uploadTime = Date.now();

      const enhancedPubs = processedPubs.map((pub) => {
        const basePub = {
          ...pub,
          fileName: currentFileName,
          fileId,
          uploadTime,
          listType: selectedOption.id,
        };

        // Add type-specific properties
        if (selectedOption.id === "wins") {
          return {
            ...basePub,
            Priority: "RecentWin",
            followUpDays: config.followUpDays,
          };
        } else if (selectedOption.id === "hitlist") {
          return {
            ...basePub,
            Priority: "Wishlist",
            ...(needsDeadline && config.deadline
              ? { deadline: config.deadline }
              : { priorityLevel: config.priorityLevel }),
          };
        } else if (selectedOption.id === "unvisited") {
          return {
            ...basePub,
            Priority: "Unvisited",
          };
        }

        return basePub;
      });

      onFileLoaded(selectedOption.id, enhancedPubs);
      handleClose();
    } catch (error) {
      devLog("Error processing file:", error);
      setError("Failed to process file. Please try again.");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedOption(null);
    setProcessedPubs([]);
    setCurrentFileName("");
    setError(null);
    setConfig({
      deadline: "",
      priorityLevel: 1,
      followUpDays: 12,
    });
    setNeedsDeadline(false);
  };

  // Check if we've reached the file limit
  const isFileLimitReached = React.useMemo(() => {
    // Don't count masterhouse files in the limit
    const additionalFilesCount = Object.entries(fileCountByType)
      .filter(([type]) => type !== "masterhouse")
      .reduce((sum, [_, count]) => sum + (count as number), 0);
    return additionalFilesCount >= maxFiles;
  }, [fileCountByType, maxFiles]);

  // Show warning if limit is reached
  if (isFileLimitReached) {
    return (
      <button
        className={clsx(
          "w-full h-[72px] rounded-md border border-dashed",
          "transition-all duration-300 transform",
          "flex items-center justify-center gap-2",
          "bg-eggplant-800/20 border-eggplant-700/30 cursor-not-allowed"
        )}
        disabled={true}
      >
        <Plus className="h-4 w-4 text-eggplant-400" />
        <span className="text-xs font-medium text-eggplant-400">
          Add Your Lists
        </span>
        <span className="text-xs text-eggplant-300 ml-2">
          (
          {Object.entries(fileCountByType)
            .filter(([type]) => type !== "masterhouse")
            .reduce((sum, [_, count]) => sum + (count as number), 0)}
          /{maxFiles})
        </span>
      </button>
    );
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className={clsx(
            "w-full h-[72px] rounded-md border border-dashed",
            "transition-all duration-300 transform",
            "flex items-center justify-center gap-2",
            isDisabled
              ? "bg-eggplant-800/20 border-eggplant-700/30 cursor-not-allowed"
              : "bg-dark-900/50 border-eggplant-700 hover:border-neon-purple hover:scale-[1.02]"
          )}
          disabled={isDisabled}
        >
          <Plus
            className={clsx(
              "h-4 w-4 transition-colors",
              isDisabled ? "text-eggplant-400" : "text-neon-purple"
            )}
          />
          <span
            className={clsx(
              "text-xs font-medium",
              isDisabled ? "text-eggplant-400" : "text-eggplant-100"
            )}
          >
            Add Your Lists
          </span>
          <span className="text-xs text-eggplant-300 ml-2">
            (
            {Object.entries(fileCountByType)
              .filter(([type]) => type !== "masterhouse")
              .reduce((sum, [_, count]) => sum + (count as number), 0)}
            /{maxFiles})
          </span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 rounded-lg p-6"
          aria-describedby="enhancement-dialog-description"
        >
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-bold text-eggplant-100">
              Add Your Lists
            </Dialog.Title>
            <div id="enhancement-dialog-description" className="sr-only">
              Select and configure additional lists to enhance your schedule
              optimization.
            </div>
            <Dialog.Close className="text-eggplant-400 hover:text-eggplant-100">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div
            className={clsx(
              "space-y-4",
              isDisabled && "opacity-75 pointer-events-none"
            )}
          >
            {error && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-200 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {selectedOption ? (
              <div>
                <button
                  onClick={() => setSelectedOption(null)}
                  className="text-sm text-eggplant-300 hover:text-neon-purple mb-4 flex items-center gap-1"
                >
                  ← Back to options
                </button>

                <div
                  {...getRootProps()}
                  className={clsx(
                    "relative cursor-pointer group",
                    "rounded-lg border-2 border-dashed overflow-hidden",
                    "transition-all duration-300 transform hover:scale-[1.02]",
                    isDragActive
                      ? "border-neon-purple bg-eggplant-800/50"
                      : "border-eggplant-700 hover:border-neon-purple",
                    processedPubs.length ? "bg-green-900/20" : "bg-dark-900/50"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="p-4 text-center">
                    {isProcessing ? (
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neon-purple"></div>
                        <p className="mt-2 text-sm text-eggplant-200">
                          Processing file...
                        </p>
                      </div>
                    ) : processedPubs.length > 0 ? (
                      <div className="text-center">
                        <p className="text-sm text-green-200">
                          ✨ {currentFileName}
                        </p>
                        <p className="text-xs text-green-300 mt-1">
                          {processedPubs.length} accounts loaded
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-eggplant-100">
                          Drop your Excel file here or click to browse
                        </p>
                        <p className="text-xs text-eggplant-200 mt-1">
                          {selectedOption.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {processedPubs.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {selectedOption.requiresFollowUp && (
                      <>
                        <div
                          className="flex items-start gap-3 p-4 rounded-lg bg-eggplant-800/50"
                          role="region"
                          aria-label="Follow-up settings"
                        >
                          <Clock className="h-5 w-5 text-neon-blue flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-eggplant-100 font-medium">
                              Follow-up Schedule
                            </p>
                            <p className="text-sm text-eggplant-200 mt-1">
                              When should we schedule follow-up visits?
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-eggplant-100 mb-2">
                            Follow-up Timeline (Days)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={config.followUpDays}
                              onChange={(e) =>
                                setConfig((prev) => ({
                                  ...prev,
                                  followUpDays: Math.max(
                                    1,
                                    parseInt(e.target.value) || 12
                                  ),
                                }))
                              }
                              className="w-20 px-3 py-2 bg-dark-900/50 border border-eggplant-700 rounded-lg text-eggplant-100 text-sm focus:border-neon-purple focus:ring-1 focus:ring-neon-purple"
                              min="1"
                            />
                            <span className="text-sm text-eggplant-200">
                              days after installation
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {selectedOption.requiresPriority && (
                      <>
                        <div
                          className="flex items-center justify-between mb-2"
                          role="region"
                          aria-label="Priority settings"
                        >
                          <label className="text-sm font-medium text-eggplant-100">
                            Set Deadline Instead of Priority?
                          </label>
                          <Switch.Root
                            checked={needsDeadline}
                            onCheckedChange={setNeedsDeadline}
                            className={clsx(
                              "w-10 h-6 rounded-full transition-colors",
                              needsDeadline
                                ? "bg-neon-purple"
                                : "bg-eggplant-800"
                            )}
                          >
                            <Switch.Thumb
                              className={clsx(
                                "block w-4 h-4 bg-white rounded-full transition-transform",
                                "transform translate-x-1",
                                needsDeadline && "translate-x-5"
                              )}
                            />
                          </Switch.Root>
                        </div>

                        {needsDeadline ? (
                          <div>
                            <label className="block text-sm font-medium text-eggplant-100 mb-2">
                              Target Completion Date
                            </label>
                            <input
                              type="date"
                              value={config.deadline}
                              onChange={(e) =>
                                setConfig((prev) => ({
                                  ...prev,
                                  deadline: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 bg-dark-900/50 border border-eggplant-700 rounded-lg text-eggplant-100 text-sm focus:border-neon-purple focus:ring-1 focus:ring-neon-purple"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-eggplant-100 mb-2">
                              Priority Level
                            </label>
                            <div className="flex gap-2">
                              {[1, 2, 3].map((level) => (
                                <button
                                  key={`priority-${level}`}
                                  disabled={usedPriorityLevels.includes(level)}
                                  onClick={() =>
                                    setConfig((prev) => ({
                                      ...prev,
                                      priorityLevel: level,
                                    }))
                                  }
                                  className={clsx(
                                    "px-4 py-2 rounded-lg text-sm transition-all border-2 shadow-sm",
                                    config.priorityLevel === level
                                      ? "bg-gradient-to-r from-neon-purple to-neon-blue text-white border-transparent shadow-md transform scale-105"
                                      : usedPriorityLevels.includes(level)
                                      ? "border-eggplant-700 bg-eggplant-800/30 text-eggplant-400 cursor-not-allowed opacity-70"
                                      : "border-eggplant-700 bg-eggplant-800 text-eggplant-200 hover:bg-eggplant-700 hover:border-neon-purple/30"
                                  )}
                                >
                                  {level}
                                  {usedPriorityLevels.includes(level) && (
                                    <div className="mt-1 flex items-center justify-center">
                                      <span className="text-xs text-eggplant-400 inline-flex items-center">
                                        <svg
                                          className="w-3 h-3 mr-1"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 15v2m0 0v2m0-2h2m-2 0H9"
                                          />
                                        </svg>
                                        In use
                                      </span>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                            {usedPriorityLevels.length > 0 ? (
                              <div className="mt-2 flex items-center p-2 rounded-lg bg-eggplant-800/50 border border-eggplant-700">
                                <svg
                                  className="w-4 h-4 text-eggplant-300 mr-2 flex-shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <p className="text-xs text-eggplant-300">
                                  Priority levels already assigned to other
                                  lists are marked as "In use"
                                </p>
                              </div>
                            ) : (
                              <p className="mt-2 text-xs text-eggplant-300 italic">
                                Higher priority (1) lists will be scheduled
                                before lower priority lists
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                      <button
                        onClick={handleClose}
                        className="px-4 py-2 rounded-lg text-eggplant-100 hover:bg-eggplant-800/50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="bg-gradient-to-r from-neon-purple to-neon-blue text-white px-4 py-2 rounded-lg font-medium hover:shadow-neon-purple transition-all"
                      >
                        Add to Schedule
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {ENHANCEMENT_OPTIONS.map((option) => {
                  const isFollowupDisabled = option.id === "wins";
                  const button = (
                    <button
                      key={option.id}
                      onClick={() => {
                        if (isFollowupDisabled) {
                          setError(FOLLOWUP_BLOCKED_DETAIL);
                          return;
                        }
                        setSelectedOption(option);
                      }}
                      disabled={isFollowupDisabled}
                      className={clsx(
                        "w-full p-4 rounded-lg text-left transition-all",
                        "border border-transparent hover:border-neon-purple",
                        "bg-gradient-to-r from-eggplant-800/50 to-dark-800/50",
                        "hover:from-eggplant-800/70 hover:to-dark-800/70",
                        isFollowupDisabled && "opacity-60 cursor-not-allowed hover:border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={clsx("p-2 rounded-lg", option.color)}>
                          <option.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">
                            {option.name}
                          </h3>
                          <p className="text-sm text-white/80">
                            {option.description}
                          </p>
                          {isFollowupDisabled && (
                            <p className="mt-1 text-xs text-eggplant-200">
                              Coming later
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );

                  if (!isFollowupDisabled) return button;

                  return (
                    <Tooltip.Provider key={option.id}>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="rounded-md bg-dark-800/90 px-3 py-2 text-xs text-eggplant-100 shadow-xl"
                            sideOffset={6}
                          >
                            {FOLLOWUP_DISABLED_MESSAGE}
                            <Tooltip.Arrow className="fill-dark-800/90" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  );
                })}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default EnhancementSelector;

