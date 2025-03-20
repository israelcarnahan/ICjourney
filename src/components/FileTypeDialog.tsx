import React, { useState } from 'react';
import { AlertTriangle, X, Calendar, Star, Clock, Target } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import clsx from 'clsx';

interface FileTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: string, deadline?: string, priorityLevel?: number, followUpDays?: number) => void;
  error: string | null;
  setError: (error: string | null) => void;
  fileType: string;
  currentFileName: string;
  initialValues?: {
    type?: string;
    deadline?: string;
    priorityLevel?: number;
    followUpDays?: number;
  };
  isEditing?: boolean;
}

const FileTypeDialog: React.FC<FileTypeDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  error,
  setError,
  fileType,
  currentFileName,
  initialValues,
  isEditing = false
}) => {
  const [selectedType, setSelectedType] = useState<string>(initialValues?.type || fileType);
  const [deadline, setDeadline] = useState<string>(initialValues?.deadline || '');
  const [needsDeadline, setNeedsDeadline] = useState(!!initialValues?.deadline);
  const [priorityLevel, setPriorityLevel] = useState<number>(initialValues?.priorityLevel || 1);
  const [followUpDays, setFollowUpDays] = useState<number>(initialValues?.followUpDays || 12);

  const handleSubmit = () => {
    if (!selectedType) {
      setError('Please select a file type');
      return;
    }

    onSubmit(
      selectedType,
      needsDeadline && deadline ? deadline : undefined,
      selectedType === 'hitlist' && !needsDeadline && !deadline ? priorityLevel : undefined,
      selectedType === 'wins' ? followUpDays : undefined
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 rounded-lg p-6"
          aria-describedby="file-type-dialog-description"
        >
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-bold text-eggplant-100">
              {isEditing ? 'Edit List Settings' : 'Configure List Settings'}
            </Dialog.Title>
            <div id="file-type-dialog-description" className="sr-only">
              {isEditing ? 'Edit settings for existing list' : 'Configure settings for new list'} including priority levels and deadlines.
            </div>
            <div id="filetype-dialog-description" className="sr-only">
              {isEditing ? 'Edit settings for existing list' : 'Configure settings for new list'} including priority levels and deadlines.
            </div>
            <Dialog.Close className="text-eggplant-400 hover:text-eggplant-100">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="mb-4 p-4 rounded-lg bg-eggplant-800/30 border border-eggplant-700/30">
            <p className="text-sm text-eggplant-200">
              <span className="text-neon-purple font-medium">Current File:</span> {currentFileName}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-200 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {selectedType === 'wins' && (
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-eggplant-800/50">
                <Clock className="h-5 w-5 text-neon-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-eggplant-100 font-medium">Follow-up Schedule</p>
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
                    value={followUpDays}
                    onChange={(e) => setFollowUpDays(Math.max(1, parseInt(e.target.value) || 12))}
                    className="w-20 px-3 py-2 bg-dark-900/50 border border-eggplant-700 rounded-lg text-eggplant-100 text-sm focus:border-neon-purple focus:ring-1 focus:ring-neon-purple"
                    min="1"
                  />
                  <span className="text-sm text-eggplant-200">
                    days after installation
                  </span>
                </div>
              </div>
            </div>
          )}

          {selectedType === 'hitlist' && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-eggplant-100">
                  Set Deadline Instead of Priority?
                </label>
                <Switch.Root
                  checked={needsDeadline}
                  onCheckedChange={setNeedsDeadline}
                  className={clsx(
                    "w-10 h-6 rounded-full transition-colors",
                    needsDeadline ? "bg-neon-purple" : "bg-eggplant-800"
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
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-900/50 border border-eggplant-700 rounded-lg text-eggplant-100 text-sm focus:border-neon-purple focus:ring-1 focus:ring-neon-purple"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-eggplant-100 mb-2">
                    Priority Level
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <button
                        key={`priority-${level}`}
                        onClick={() => setPriorityLevel(level)}
                        className={clsx(
                          "px-3 py-1.5 rounded-lg text-sm transition-colors",
                          priorityLevel === level
                            ? "bg-gradient-to-r from-neon-purple to-neon-blue text-white"
                            : "bg-eggplant-800/50 text-eggplant-200 hover:bg-eggplant-700/50"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Dialog.Close className="px-4 py-2 rounded-lg text-eggplant-100 hover:bg-eggplant-800/50 transition-colors">
              Cancel
            </Dialog.Close>
            <button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-neon-purple to-neon-blue text-white px-4 py-2 rounded-lg font-medium hover:shadow-neon-purple transition-all"
            >
              {isEditing ? 'Save Changes' : 'Save Settings'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default FileTypeDialog;