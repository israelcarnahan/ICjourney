import React, { useState, useEffect } from "react";
import { AlertTriangle, X, ChevronDown, ChevronUp } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as RadioGroup from "@radix-ui/react-radio-group";
import clsx from "clsx";
import { ListType } from "../context/PubDataContext";

interface FileTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    type: ListType,
    deadline?: string,
    priorityLevel?: number,
    followUpDays?: number
  ) => void;
  error: string | null;
  setError: (error: string | null) => void;
  fileType: ListType;
  currentFileName: string;
  usedPriorities?: number[];
  initialValues?: {
    type: ListType;
    deadline?: string;
    priorityLevel?: number;
    followUpDays?: number;
  };
  isEditing?: boolean;
}

type ScheduleMode = 'priority' | 'deadline' | 'followup';

const FileTypeDialog: React.FC<FileTypeDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  error,
  setError,
  fileType,
  currentFileName,
  usedPriorities = [],
  initialValues,
  isEditing = false,
}) => {
  const [selectedType, setSelectedType] = useState<ListType>(
    initialValues?.type || fileType
  );
  const [mode, setMode] = useState<ScheduleMode>('priority');
  const [selectedPriority, setSelectedPriority] = useState<number | null>(
    initialValues?.priorityLevel || null
  );
  const [deadline, setDeadline] = useState<string>(
    initialValues?.deadline || ''
  );
  const [followUpDays, setFollowUpDays] = useState<number | ''>(
    initialValues?.followUpDays || ''
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      // Initialize mode based on initial values
      if (initialValues?.deadline) {
        setMode('deadline');
      } else if (initialValues?.followUpDays) {
        setMode('followup');
      } else {
        setMode('priority');
      }
    } else {
      // Reset state when dialog closes
      setMode('priority');
      setSelectedPriority(null);
      setDeadline('');
      setFollowUpDays('');
      setShowAdvanced(false);
    }
  }, [isOpen, initialValues]);

  // Auto-infer list type based on mode
  useEffect(() => {
    const inferredType: ListType =
      mode === 'deadline' ? 'hitlist'
      : mode === 'followup' ? 'wins'
      : 'hitlist';
    
    setSelectedType(inferredType);
  }, [mode]);

  // Clear other fields when mode changes
  useEffect(() => {
    if (mode === 'priority') {
      setDeadline('');
      setFollowUpDays('');
    } else if (mode === 'deadline') {
      setSelectedPriority(null);
      setFollowUpDays('');
    } else if (mode === 'followup') {
      setSelectedPriority(null);
      setDeadline('');
    }
  }, [mode]);

  const taken = new Set(usedPriorities);
  const isTaken = (n: number) => taken.has(n);

  const handleSubmit = () => {
    if (!selectedType) {
      setError("Please select a file type");
      return;
    }

    // Auto-infer type based on mode
    const inferredType: ListType =
      mode === 'deadline' ? 'hitlist'
      : mode === 'followup' ? 'wins'
      : 'hitlist';

    onSubmit(
      showAdvanced ? selectedType : inferredType,
      mode === 'deadline' ? (deadline || undefined) : undefined,
      mode === 'priority' ? (typeof selectedPriority === 'number' ? selectedPriority : undefined) : undefined,
      mode === 'followup' ? (Number.isFinite(followUpDays) && (followUpDays as number) > 0 ? (followUpDays as number) : undefined) : undefined
    );
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gradient-to-b from-eggplant-900/80 to-dark-900/80 border border-eggplant-700/60 rounded-2xl shadow-xl p-6"
          aria-describedby="file-type-dialog-description"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-bold text-eggplant-100">
              {isEditing ? "Edit List Settings" : "Configure List Settings"}
            </Dialog.Title>
            <div id="file-type-dialog-description" className="sr-only">
              {isEditing
                ? "Edit settings for existing list"
                : "Configure settings for new list"}{" "}
              including priority levels and deadlines.
            </div>
            <Dialog.Close 
              className="text-eggplant-400 hover:text-eggplant-100"
              data-testid="filetype-cancel"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="mb-4 p-4 rounded-lg bg-eggplant-800/30 border border-eggplant-700/30">
            <p className="text-sm text-eggplant-200">
              <span className="text-neon-purple font-medium">
                Current File:
              </span>{" "}
              {currentFileName}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-200 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-eggplant-200 mb-4">
              Choose how you want to schedule this list. We'll automatically determine the best list type.
            </p>

            {/* Schedule Mode Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-eggplant-100 mb-2">
                How do you want to schedule this list?
              </label>
              <RadioGroup.Root
                value={mode}
                onValueChange={(value) => setMode(value as ScheduleMode)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroup.Item
                    value="priority"
                    id="mode-priority"
                    className="w-4 h-4 rounded-full border border-eggplant-700 bg-eggplant-900/40 data-[state=checked]:border-neon-purple data-[state=checked]:bg-neon-purple/20"
                  >
                    <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-2 after:h-2 after:rounded-full after:bg-neon-purple" />
                  </RadioGroup.Item>
                  <label htmlFor="mode-priority" className="text-sm text-eggplant-200 cursor-pointer">
                    Priority Level (1-3)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroup.Item
                    value="deadline"
                    id="mode-deadline"
                    className="w-4 h-4 rounded-full border border-eggplant-700 bg-eggplant-900/40 data-[state=checked]:border-neon-purple data-[state=checked]:bg-neon-purple/20"
                  >
                    <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-2 after:h-2 after:rounded-full after:bg-neon-purple" />
                  </RadioGroup.Item>
                  <label htmlFor="mode-deadline" className="text-sm text-eggplant-200 cursor-pointer">
                    Target Completion Date
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroup.Item
                    value="followup"
                    id="mode-followup"
                    className="w-4 h-4 rounded-full border border-eggplant-700 bg-eggplant-900/40 data-[state=checked]:border-neon-purple data-[state=checked]:bg-neon-purple/20"
                  >
                    <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-2 after:h-2 after:rounded-full after:bg-neon-purple" />
                  </RadioGroup.Item>
                  <label htmlFor="mode-followup" className="text-sm text-eggplant-200 cursor-pointer">
                    Follow-up Timeline
                  </label>
                </div>
              </RadioGroup.Root>
            </div>

            {/* Priority Section - Only show when mode is priority */}
            {mode === 'priority' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-eggplant-100 mb-2">
                  Priority Level
                </label>
                <div className="flex gap-2" data-testid="filetype-priority">
                  {[1, 2, 3].map((level) => (
                    <button
                      key={`priority-${level}`}
                      type="button"
                      disabled={isTaken(level)}
                      onClick={() => setSelectedPriority(level)}
                      className={clsx(
                        'px-3 py-2 rounded-lg border text-sm transition-all',
                        selectedPriority === level 
                          ? 'bg-neon-purple/20 border-neon-purple text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]' 
                          : 'border-eggplant-700 text-eggplant-200 hover:border-neon-purple hover:bg-eggplant-800/50',
                        isTaken(level) && 'opacity-50 cursor-not-allowed'
                      )}
                      data-testid={`filetype-priority-${level}`}
                    >
                      {level} {isTaken(level) && '• Taken'}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-eggplant-300 italic">
                  Higher priority (1) lists will be scheduled before lower priority lists
                </p>
              </div>
            )}

            {/* Deadline Section - Only show when mode is deadline */}
            {mode === 'deadline' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-eggplant-100 mb-2">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-eggplant-900/40 border border-eggplant-700 text-eggplant-100 text-sm focus:ring-neon-purple focus:border-neon-purple rounded-lg"
                  data-testid="filetype-deadline"
                />
              </div>
            )}

            {/* Follow-up Days Section - Only show when mode is followup */}
            {mode === 'followup' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-eggplant-100 mb-2">
                  Follow-up Timeline (Days)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={followUpDays}
                    onChange={(e) =>
                      setFollowUpDays(
                        e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1)
                      )
                    }
                    className="w-20 px-3 py-2 bg-eggplant-900/40 border border-eggplant-700 text-eggplant-100 text-sm focus:ring-neon-purple focus:border-neon-purple rounded-lg"
                    min="1"
                    data-testid="filetype-followup"
                  />
                  <span className="text-sm text-eggplant-200">
                    days after installation
                  </span>
                </div>
              </div>
            )}

            {/* Advanced Toggle */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-eggplant-300 hover:text-neon-purple transition-colors"
              >
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Advanced Options
              </button>
              
              {showAdvanced && (
                <div className="mt-3 p-3 rounded-lg bg-eggplant-800/30 border border-eggplant-700/30">
                  <label className="block text-sm font-medium text-eggplant-100 mb-2">
                    List Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as ListType)}
                    className="w-full px-3 py-2 bg-eggplant-900/40 border border-eggplant-700 text-eggplant-100 text-sm focus:ring-neon-purple focus:border-neon-purple rounded-lg"
                    data-testid="filetype-type"
                  >
                    <option value="wins">Recent Wins</option>
                    <option value="hitlist">Hit List</option>
                    <option value="unvisited">Growth Opportunities</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Dialog.Close className="px-4 py-2 rounded-lg text-eggplant-100 hover:bg-eggplant-800/50 transition-colors">
              Cancel
            </Dialog.Close>
            <button
              onClick={handleSubmit}
              className="bg-neon-purple hover:bg-neon-purple/80 text-white px-4 py-2 rounded-lg font-medium shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all"
              data-testid="filetype-submit"
              type="submit"
            >
              {isEditing ? "Save Changes" : "Save Settings"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default FileTypeDialog;
