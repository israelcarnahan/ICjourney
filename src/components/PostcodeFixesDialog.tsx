import { useEffect, useMemo, useState } from "react";
import type { FC } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import clsx from "clsx";

import type { Pub } from "../context/PubDataContext";
import { parsePostcode, type ParsedPostcode } from "../utils/postcodeUtils";

export type PostcodeFixUpdate = {
  uuid: string;
  postcode: string;
  parsed: ParsedPostcode;
};

type RowEdit = {
  postcode: string;
  parsed: ParsedPostcode;
};

type PostcodeFixesDialogProps = {
  isOpen: boolean;
  issues: Pub[];
  onConfirm: (updates: PostcodeFixUpdate[]) => void;
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

const labelForListType = (listType?: string) => {
  switch (listType) {
    case "masterhouse":
      return "Masterfile";
    case "wins":
      return "Follow Up By";
    case "hitlist":
      return "Priority / Visit By";
    case "unvisited":
      return "Unvisited";
    default:
      return "List";
  }
};

const PostcodeFixesDialog: FC<PostcodeFixesDialogProps> = ({
  isOpen,
  issues,
  onConfirm,
  onCancel,
}) => {
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});

  useEffect(() => {
    if (!isOpen) return;
    const next: Record<string, RowEdit> = {};
    issues.forEach((issue) => {
      const raw = issue.zip ?? "";
      next[issue.uuid] = {
        postcode: raw,
        parsed: issue.postcodeMeta ?? parsePostcode(raw),
      };
    });
    setEdits(next);
  }, [isOpen, issues]);

  const headers = useMemo(() => {
    const all = new Set<string>();
    issues.forEach((issue) => {
      if (issue.rawRow) {
        Object.keys(issue.rawRow).forEach((key) => all.add(key));
      }
    });
    return Array.from(all);
  }, [issues]);

  const handlePostcodeChange = (pub: Pub, nextPostcode: string) => {
    const parsed = parsePostcode(nextPostcode);
    setEdits((prev) => ({
      ...prev,
      [pub.uuid]: { postcode: nextPostcode, parsed },
    }));
  };

  const handleConfirm = () => {
    const updates = issues.map((issue) => ({
      uuid: issue.uuid,
      postcode: edits[issue.uuid]?.postcode ?? issue.zip,
      parsed: edits[issue.uuid]?.parsed ?? parsePostcode(issue.zip),
    }));
    onConfirm(updates);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-5xl max-h-[85vh] overflow-hidden bg-gradient-to-b from-eggplant-900/90 to-dark-900/90 border border-eggplant-700/60 rounded-2xl shadow-xl focus:outline-none">
          <div className="flex items-start justify-between px-6 py-5 border-b border-eggplant-700/50">
            <div className="space-y-2">
              <Dialog.Title className="text-xl font-bold text-eggplant-100">
                Pending Postcode Fixes
              </Dialog.Title>
              <p className="text-sm text-eggplant-200">
                Fix invalid postcodes so they can be scheduled. Oddball postcodes can stay scheduled, but remain flagged until confirmed.
              </p>
              <div className="text-xs text-eggplant-300">
                {issues.length} account{issues.length === 1 ? "" : "s"} need attention.
              </div>
            </div>
            <Dialog.Close className="text-eggplant-400 hover:text-eggplant-100">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="px-6 py-4 overflow-y-auto max-h-[60vh] space-y-4">
            {issues.map((issue) => {
              const edit = edits[issue.uuid];
              const parsed = edit?.parsed ?? issue.postcodeMeta ?? parsePostcode(issue.zip);
              return (
                <div
                  key={issue.uuid}
                  className="border border-eggplant-700/50 rounded-xl p-4 bg-eggplant-900/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-eggplant-100">
                        {issue.pub}
                      </div>
                      <div className="text-xs text-eggplant-300">
                        {issue.fileName} • {labelForListType(issue.listType)}
                      </div>
                    </div>
                    <span
                      className={clsx(
                        "px-2 py-1 text-xs rounded-full border",
                        statusStyles[parsed.status]
                      )}
                    >
                      {statusLabels[parsed.status]}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[220px,1fr]">
                    <div className="text-xs text-eggplant-300">Postcode (editable)</div>
                    <div className="space-y-2">
                      <input
                        value={edit?.postcode ?? issue.zip}
                        onChange={(e) => handlePostcodeChange(issue, e.target.value)}
                        className="w-full bg-eggplant-950/60 border border-eggplant-600/50 rounded-lg px-3 py-2 text-sm text-eggplant-100"
                      />
                      <div className="text-xs text-eggplant-300 flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-yellow-300" />
                        Normalized: {parsed.normalized ?? "—"}
                      </div>
                      {parsed.status === "OK" && (
                        <div className="text-xs text-green-200 flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3" />
                          Postcode is now valid and will be scheduled next run.
                        </div>
                      )}
                    </div>
                  </div>

                  {headers.length > 0 && (
                    <div className="mt-4 border border-eggplant-700/40 rounded-lg overflow-hidden">
                      {headers.map((header) => {
                        const normalizedHeader = String(header).trim().toLowerCase();
                        const isPostcodeHeader = ["postcode", "post code", "post_code", "zip"].includes(
                          normalizedHeader
                        );
                        const value = isPostcodeHeader
                          ? edit?.postcode ?? issue.zip
                          : issue.rawRow?.[header];
                        return (
                          <div
                            key={`${issue.uuid}-${header}`}
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
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-eggplant-700/50">
            <div className="text-xs text-eggplant-300">
              Fixes apply immediately; reschedule to include newly valid accounts.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-eggplant-200 border border-eggplant-600/60 hover:border-eggplant-400"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 rounded-lg bg-neon-purple text-white hover:bg-neon-purple/90"
              >
                Save fixes
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PostcodeFixesDialog;
