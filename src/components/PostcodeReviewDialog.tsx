import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, CheckCircle2, X, Trash2 } from "lucide-react";
import clsx from "clsx";

import { parsePostcode, type ParsedPostcode } from "../utils/postcodeUtils";

export type PostcodeIssueRow = {
  id: string;
  rowIndex: number;
  rawRow: Record<string, any>;
  postcode: string;
  parsed: ParsedPostcode;
};

export type PostcodeReviewDecision = {
  rowIndex: number;
  action: "keep" | "remove";
  postcode: string;
  parsed: ParsedPostcode;
};

type PostcodeReviewDialogProps = {
  isOpen: boolean;
  fileName: string;
  intentLabel: string;
  intentDetail?: string;
  headers: string[];
  issues: PostcodeIssueRow[];
  onConfirm: (decisions: PostcodeReviewDecision[]) => void;
  onCancel: () => void;
};

const statusLabels: Record<ParsedPostcode["status"], string> = {
  OK: "OK",
  ODDBALL: "Oddball",
  INVALID: "Invalid",
};

const statusStyles: Record<ParsedPostcode["status"], string> = {
  OK: "bg-green-500/20 text-green-200 border-green-500/40",
  ODDBALL: "bg-yellow-500/20 text-yellow-200 border-yellow-500/40",
  INVALID: "bg-red-500/20 text-red-200 border-red-500/40",
};

export default function PostcodeReviewDialog({
  isOpen,
  fileName,
  intentLabel,
  intentDetail,
  headers,
  issues,
  onConfirm,
  onCancel,
}: PostcodeReviewDialogProps) {
  // Track edits per row so user can fix or remove with full context.
  const [edits, setEdits] = useState<
    Record<string, { action: "keep" | "remove"; postcode: string; parsed: ParsedPostcode }>
  >({});

  useEffect(() => {
    if (!isOpen) return;
    const next: Record<
      string,
      { action: "keep" | "remove"; postcode: string; parsed: ParsedPostcode }
    > = {};
    issues.forEach((issue) => {
      next[issue.id] = {
        action: "keep",
        postcode: issue.postcode,
        parsed: issue.parsed,
      };
    });
    setEdits(next);
  }, [isOpen, issues]);

  const counts = useMemo(() => {
    const values = Object.values(edits);
    const keep = values.filter((e) => e.action === "keep").length;
    const remove = values.filter((e) => e.action === "remove").length;
    return { keep, remove };
  }, [edits]);

  const handlePostcodeChange = (issue: PostcodeIssueRow, nextPostcode: string) => {
    const parsed = parsePostcode(nextPostcode);
    setEdits((prev) => ({
      ...prev,
      [issue.id]: {
        ...prev[issue.id],
        postcode: nextPostcode,
        parsed,
      },
    }));
  };

  const handleActionChange = (issueId: string, action: "keep" | "remove") => {
    setEdits((prev) => ({
      ...prev,
      [issueId]: {
        ...prev[issueId],
        action,
      },
    }));
  };

  const handleConfirm = () => {
    const decisions: PostcodeReviewDecision[] = issues.map((issue) => ({
      rowIndex: issue.rowIndex,
      action: edits[issue.id]?.action ?? "keep",
      postcode: edits[issue.id]?.postcode ?? issue.postcode,
      parsed: edits[issue.id]?.parsed ?? issue.parsed,
    }));
    onConfirm(decisions);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-5xl max-h-[85vh] overflow-hidden bg-gradient-to-b from-eggplant-900/90 to-dark-900/90 border border-eggplant-700/60 rounded-2xl shadow-xl focus:outline-none"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-start justify-between px-6 py-5 border-b border-eggplant-700/50">
            <div className="space-y-2">
              <Dialog.Title className="text-xl font-bold text-eggplant-100">
                Fix Postcode Issues Before Import
              </Dialog.Title>
              <p className="text-sm text-eggplant-200">
                Review the highlighted rows, fix postcodes if needed, or remove rows you don’t want to keep.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-eggplant-200">
                <span className="px-2 py-1 rounded-full border border-eggplant-600/60 bg-eggplant-800/40">
                  File: {fileName}
                </span>
                <span className="px-2 py-1 rounded-full border border-eggplant-600/60 bg-eggplant-800/40">
                  Intent: {intentLabel}
                  {intentDetail ? ` (${intentDetail})` : ""}
                </span>
                <span className="px-2 py-1 rounded-full border border-eggplant-600/60 bg-eggplant-800/40">
                  Rows flagged: {issues.length}
                </span>
              </div>
            </div>
            <Dialog.Close className="text-eggplant-400 hover:text-eggplant-100">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="px-6 py-4 overflow-y-auto max-h-[60vh] space-y-4">
            {issues.map((issue) => {
              const edit = edits[issue.id];
              const parsed = edit?.parsed ?? issue.parsed;
              const status = parsed.status;
              return (
                <div
                  key={issue.id}
                  className="border border-eggplant-700/50 rounded-xl p-4 bg-eggplant-900/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-eggplant-100">
                        Row {issue.rowIndex + 1}
                      </span>
                      <span
                        className={clsx(
                          "px-2 py-1 text-xs rounded-full border",
                          statusStyles[status]
                        )}
                      >
                        {statusLabels[status]}
                      </span>
                      {status === "OK" && (
                        <span className="text-xs text-green-200 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Fixed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleActionChange(issue.id, "keep")}
                        className={clsx(
                          "px-3 py-1 text-xs rounded-full border transition",
                          edit?.action === "keep"
                            ? "bg-neon-purple/20 border-neon-purple/50 text-neon-purple"
                            : "border-eggplant-600/50 text-eggplant-200 hover:border-eggplant-400"
                        )}
                      >
                        Keep with warning
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActionChange(issue.id, "remove")}
                        className={clsx(
                          "px-3 py-1 text-xs rounded-full border transition flex items-center gap-1",
                          edit?.action === "remove"
                            ? "bg-red-500/20 border-red-500/50 text-red-200"
                            : "border-eggplant-600/50 text-eggplant-200 hover:border-red-400"
                        )}
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove row
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[220px,1fr]">
                    <div className="text-xs text-eggplant-300">Postcode (editable)</div>
                    <div className="space-y-2">
                      <input
                        value={edit?.postcode ?? issue.postcode}
                        onChange={(e) =>
                          handlePostcodeChange(issue, e.target.value)
                        }
                        className="w-full bg-eggplant-950/60 border border-eggplant-600/50 rounded-lg px-3 py-2 text-sm text-eggplant-100"
                      />
                      <div className="text-xs text-eggplant-300 flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-yellow-300" />
                        Normalized: {parsed.normalized ?? "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border border-eggplant-700/40 rounded-lg overflow-hidden">
                    {headers.map((header) => {
                      const normalizedHeader = String(header).trim().toLowerCase();
                      const isPostcodeHeader = ["postcode", "post code", "post_code", "zip"].includes(
                        normalizedHeader
                      );
                      const value = isPostcodeHeader
                        ? edit?.postcode ?? issue.postcode
                        : issue.rawRow[header];
                      return (
                        <div
                          key={`${issue.id}-${header}`}
                          className="grid grid-cols-3 gap-3 px-3 py-2 text-xs border-b border-eggplant-800/60 last:border-0"
                        >
                          <div className="text-eggplant-300">{header}</div>
                          <div className="col-span-2 text-eggplant-100 break-words">
                            {value !== undefined && value !== null && String(value).trim().length > 0
                              ? String(value)
                              : "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-eggplant-700/50">
            <div className="text-xs text-eggplant-300 flex items-center gap-2">
              <span>Keeping: {counts.keep}</span>
              <span>Removing: {counts.remove}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-eggplant-200 border border-eggplant-600/60 hover:border-eggplant-400"
              >
                Cancel import
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 rounded-lg bg-neon-purple text-white hover:bg-neon-purple/90"
              >
                Apply fixes and continue
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
