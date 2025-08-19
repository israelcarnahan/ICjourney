import React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { X, AlertTriangle } from 'lucide-react';
import { Visit } from '../types';
import clsx from 'clsx';

interface RemovePubDialogProps {
  visit: Visit;
  onConfirm: () => void;
}

const RemovePubDialog: React.FC<RemovePubDialogProps> = ({ visit, onConfirm }) => {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button
          className={clsx(
            "p-2 rounded-full transition-all duration-300",
            "text-red-400 opacity-0 group-hover:opacity-100",
            "hover:bg-red-900/20 hover:text-red-300",
            "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          )}
          aria-label="Remove pub visit"
          aria-describedby="remove-pub-dialog-description"
        >
          <X className="h-5 w-5" />
        </button>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <AlertDialog.Title className="text-xl font-bold text-eggplant-100">
                Remove and Replace Visit
              </AlertDialog.Title>
              <div id="remove-pub-dialog-description" className="sr-only">
                Confirm removal of {visit.pub} from schedule. A replacement pub may be suggested.
              </div>
              <AlertDialog.Description className="text-eggplant-200 mt-2">
                Are you sure you want to remove <span className="text-eggplant-100 font-medium">{visit.pub}</span>? The system will attempt to find a suitable replacement pub in the same area with similar or higher priority.
              </AlertDialog.Description>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button className="px-4 py-2 rounded-lg text-eggplant-100 hover:bg-eggplant-800/50 transition-colors">
                Cancel
              </button>
            </AlertDialog.Cancel>
            
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                className="bg-red-900/90 hover:bg-red-800/90 text-red-100 px-4 py-2 rounded-lg transition-colors"
              >
                Remove & Replace
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default RemovePubDialog;