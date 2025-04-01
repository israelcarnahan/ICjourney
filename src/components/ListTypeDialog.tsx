import React from "react";

interface ListTypeDialogProps {
  onSelect: (listType: "wins" | "hitlist") => void;
  onCancel: () => void;
}

export default function ListTypeDialog({
  onSelect,
  onCancel,
}: ListTypeDialogProps) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Select List Type
        </h2>
        <p className="text-gray-600 mb-6">
          Choose the type of list you're uploading to help us process it
          correctly.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => onSelect("hitlist")}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Hit List</h3>
            <p className="text-sm text-gray-500">
              High-priority accounts that need special attention
            </p>
          </button>

          <button
            onClick={() => onSelect("wins")}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Recent Wins</h3>
            <p className="text-sm text-gray-500">
              Recently installed accounts to follow up on
            </p>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
