import React from "react";
import {
  FileText,
  Star,
  Clock,
  // Calendar,
  AlertTriangle,
  Edit,
  Trash2,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import clsx from "clsx";
import { format } from "date-fns";
import { FileMetadata } from "../context/PubDataContext";

interface FilePreviewProps {
  files: Array<FileMetadata & { name: string }>;
  onEdit: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
  maxFiles: number;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  files,
  onEdit,
  onDelete,
  maxFiles,
}) => {
  const fileLimit = maxFiles || 6;
  // Sort files by priority (if available) and then by name
  const sortedFiles = [...files].sort((a, b) => {
    const priorityA = a.priority ?? Number.MAX_SAFE_INTEGER;
    const priorityB = b.priority ?? Number.MAX_SAFE_INTEGER;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return a.name.localeCompare(b.name);
  });
  const additionalFiles = files.filter((f) => f.type !== "masterhouse");

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "kpi":
        return "KPI Targets";
      case "wins":
        return "Recent Wins";
      case "hitlist":
        return "Hit List";
      case "masterhouse":
        return "Masterhouse";
      default:
        return type;
    }
  };

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return null;
    try {
      return format(new Date(deadline), "MMM d, yyyy");
    } catch {
      return deadline;
    }
  };

  return (
    <div
      className={clsx(
        "bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg p-4 border",
        files.length === 0
          ? "border-eggplant-800/10 opacity-70"
          : "border-eggplant-800/30"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className={clsx(
            "text-sm font-medium",
            files.length === 0 ? "text-eggplant-300" : "text-eggplant-100"
          )}
        >
          Uploaded Lists
        </h3>
        {files.length > 0 && (
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <div className="flex items-center gap-1 text-xs text-eggplant-300 cursor-help">
                  <Star className="h-3 w-3" />
                  <span>Priority order shown</span>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg"
                  sideOffset={5}
                >
                  Files are ordered by priority level, with 1 being highest
                  priority
                  <Tooltip.Arrow className="fill-dark-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        )}
      </div>

      <div className="space-y-2">
        {sortedFiles.map((file) => (
          <div
            key={file.fileId}
            className={clsx(
              "relative overflow-hidden rounded-lg border transition-all duration-300",
              "hover:shadow-lg hover:scale-[1.01] group",
              file.color
            )}
          >
            <div className="p-3 bg-gradient-to-r from-dark-900/20 to-transparent backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-white" />
                  <div>
                    <h4 className="font-medium text-white">
                      {file.fileName || getTypeLabel(file.type)}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-white/80">
                        {getTypeLabel(file.type)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      <span className="text-xs text-white/80">
                        {file.count} accounts
                      </span>
                      {file.type === "hitlist" && !file.deadline && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/30" />
                          <span className="text-xs text-white/80 flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Priority {file.priority}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {file.deadline && (
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <div className="flex items-center gap-1 text-xs text-white/80 bg-dark-900/30 px-2 py-1 rounded-lg">
                            <Clock className="h-3 w-3" />
                            <span>{formatDeadline(file.deadline)}</span>
                          </div>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg"
                            sideOffset={5}
                          >
                            {file.type === "wins"
                              ? "Follow-up deadline"
                              : "Completion deadline"}
                            <Tooltip.Arrow className="fill-dark-800" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  )}

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(file.fileId)}
                      className="p-1 rounded-lg transition-colors text-eggplant-300 hover:text-neon-blue hover:bg-eggplant-800/50"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(file.fileId)}
                        className="p-1 rounded-lg transition-colors text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {additionalFiles.length >= fileLimit - 1 && (
        <div className="text-center py-4">
          <AlertTriangle className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-yellow-200">
            Maximum number of additional lists ({fileLimit - 1}) reached
          </p>
        </div>
      )}

      {files.length === 0 && (
        <div className="text-center py-3">
          <AlertTriangle className="h-5 w-5 text-eggplant-300/50 mx-auto mb-1.5" />
          <p className="text-xs text-eggplant-300/70">No files uploaded yet</p>
          <p className="text-[10px] text-eggplant-300/50 mt-0.5">
            Start by uploading your Masterhouse list
          </p>
        </div>
      )}
    </div>
  );
};

export default FilePreview;
