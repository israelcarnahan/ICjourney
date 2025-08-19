import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, Calendar, Star } from "lucide-react";
import { Button } from "./ui/button";
// import { Input } from "./ui/input";
// import { Label } from "./ui/label";
// import { cn } from "../lib/utils";
import { useState, useCallback } from "react";
import type { ListType } from "../context/PubDataContext";

type ScheduleType = "date" | "priority";

interface ListCriteriaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    deadline?: string,
    priorityLevel?: number,
    followUpDays?: number
  ) => void;
  listType: Extract<ListType, "wins" | "hitlist"> | null;
  currentFileName: string;
  usedPriorityLevels: number[];
}

export function ListCriteriaDialog({
  isOpen,
  onClose,
  onSubmit,
  listType,
  currentFileName,
  usedPriorityLevels,
}: ListCriteriaDialogProps) {
  // Only log when the dialog is actually opened
  React.useEffect(() => {
    if (isOpen) {
      console.log("⚙️ List Criteria Dialog opened", {
        listType,
        currentFileName,
        usedPriorityLevels,
      });
    }
  }, [isOpen, listType, currentFileName, usedPriorityLevels]);

  // State
  const [error, setError] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string>("");
  const [priorityLevel, setPriorityLevel] = useState<number | undefined>(
    undefined
  );
  const [followUpDays, setFollowUpDays] = useState<number>(10);
  const [scheduleType, setScheduleType] = useState<ScheduleType>("priority");

  // Reset state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setDeadline("");
      setPriorityLevel(undefined);
      setFollowUpDays(10);
      setScheduleType("priority");
      setError(null);
    }
  }, [isOpen]);

  // const availablePriorityLevels = [1, 2, 3, 4, 5].filter(
  //   (level) => !usedPriorityLevels.includes(level)
  // );

  // Handlers
  const handleScheduleTypeChange = useCallback((type: ScheduleType) => {
    console.log("📅 Schedule type changed:", { type });
    setScheduleType(type);
  }, []);

  const handlePrioritySelect = useCallback((level: number) => {
    console.log("⭐ Priority level selected:", { level });
    setPriorityLevel(level);
  }, []);

  const handleDeadlineChange = useCallback((date: string) => {
    console.log("📅 Deadline changed:", { date });
    setDeadline(date);
  }, []);

  const handleFollowUpDaysChange = useCallback((days: number) => {
    console.log("🕒 Follow-up days changed:", { days });
    if (days >= 1 && days <= 90) {
      setFollowUpDays(days);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    console.log("💾 Submitting list criteria:", {
      listType,
      scheduleType,
      deadline,
      priorityLevel,
      followUpDays,
    });

    try {
      if (listType === "wins") {
        if (!followUpDays || followUpDays < 1 || followUpDays > 90) {
          setError("Please enter a valid follow-up period (1-90 days)");
          return;
        }
        onSubmit(undefined, undefined, followUpDays);
      } else if (listType === "hitlist") {
        if (scheduleType === "date") {
          if (!deadline) {
            setError("Please select a deadline");
            return;
          }
          onSubmit(deadline);
        } else {
          if (!priorityLevel) {
            setError("Please select a priority level");
            return;
          }
          onSubmit(undefined, priorityLevel);
        }
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  }, [
    listType,
    followUpDays,
    scheduleType,
    deadline,
    priorityLevel,
    onSubmit,
    onClose,
  ]);

  // Early return if dialog should not be shown
  if (!isOpen || !listType) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-eggplant-900 rounded-lg shadow-xl p-6 w-[400px] max-w-[90vw] focus:outline-none">
          <Dialog.Title className="text-xl font-semibold mb-2 text-eggplant-100">
            Configure List Settings
          </Dialog.Title>
          <Dialog.Description className="text-sm text-eggplant-200 mb-4">
            {currentFileName}
          </Dialog.Description>

          {listType === "wins" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-eggplant-100">
                Follow-up Period
              </h3>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={followUpDays}
                  onChange={(e) =>
                    handleFollowUpDaysChange(parseInt(e.target.value))
                  }
                  min="1"
                  max="90"
                  className="w-20 px-3 py-2 rounded bg-eggplant-800 border border-eggplant-700 text-eggplant-100 focus:outline-none focus:border-neon-pink"
                />
                <span className="text-eggplant-200">days after last visit</span>
              </div>
            </div>
          )}

          {listType === "hitlist" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-eggplant-100">
                  Schedule Type
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleScheduleTypeChange("date")}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all space-y-2 ${
                      scheduleType === "date"
                        ? "border-neon-purple bg-eggplant-800/50"
                        : "border-eggplant-700 hover:border-neon-purple/50"
                    }`}
                  >
                    <Calendar className="h-6 w-6 text-neon-purple" />
                    <p className="text-sm font-medium text-eggplant-100">
                      By Date
                    </p>
                  </button>

                  <button
                    onClick={() => handleScheduleTypeChange("priority")}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all space-y-2 ${
                      scheduleType === "priority"
                        ? "border-neon-purple bg-eggplant-800/50"
                        : "border-eggplant-700 hover:border-neon-purple/50"
                    }`}
                  >
                    <Star className="h-6 w-6 text-neon-purple" />
                    <p className="text-sm font-medium text-eggplant-100">
                      By Priority
                    </p>
                  </button>
                </div>
              </div>

              {scheduleType === "date" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-eggplant-100">
                    Deadline
                  </h3>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => handleDeadlineChange(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-eggplant-800 border border-eggplant-700 text-eggplant-100 focus:outline-none focus:border-neon-purple"
                  />
                </div>
              )}

              {scheduleType === "priority" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-eggplant-100">
                    Priority Level
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => handlePrioritySelect(level)}
                        disabled={usedPriorityLevels.includes(level)}
                        className={`p-3 rounded-lg shadow-sm border-2 text-center transition-all ${
                          priorityLevel === level &&
                          !usedPriorityLevels.includes(level)
                            ? "bg-gradient-to-r from-neon-purple to-neon-blue border-transparent text-white shadow-md transform scale-105"
                            : usedPriorityLevels.includes(level)
                            ? "border-eggplant-700 bg-eggplant-800/30 text-eggplant-500 cursor-not-allowed opacity-70"
                            : "border-eggplant-700 bg-eggplant-800 text-eggplant-100 hover:bg-eggplant-700 hover:border-neon-purple/30"
                        }`}
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
                  {usedPriorityLevels.length > 0 && (
                    <div className="flex items-center p-2 rounded-lg bg-eggplant-800/50 border border-eggplant-700">
                      <svg
                        className="w-4 h-4 text-eggplant-300 mr-2"
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
                        Priority levels already assigned to other lists are
                        marked as "In use"
                      </p>
                    </div>
                  )}
                  {!usedPriorityLevels.length && (
                    <p className="text-xs text-eggplant-300 italic">
                      Higher priority (1) lists will be scheduled before lower
                      priority lists
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-200 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-eggplant-200 hover:text-eggplant-100"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium bg-neon-purple text-white rounded hover:bg-neon-purple/90"
              disabled={
                (listType === "hitlist" &&
                  ((scheduleType === "date" && !deadline) ||
                    (scheduleType === "priority" && !priorityLevel))) ||
                (listType === "wins" && !followUpDays)
              }
            >
              Save Settings
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
