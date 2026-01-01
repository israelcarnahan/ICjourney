import { useMemo, useState } from "react";
import { usePubData } from "../context/PubDataContext";
import {
  TrendingUp,
  Target,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Pub } from "../context/PubDataContext";
import { toArray } from "../utils/typeGuards";
import { parsePostcode } from "../utils/postcodeUtils";
import PostcodeFixesDialog, {
  type PostcodeFixUpdate,
} from "./PostcodeFixesDialog";
import { getPrimaryDriverLabel } from "../utils/sourceDetails";

interface StatInfo {
  total: number;
  scheduled: number;
  fileName: string;
  priority: string;
  priorityLevel?: number;
  followUpDays?: number;
  fileId: string;
  remaining: number;
  isExhausted: boolean;
  completionDate: Date | null;
  deadline: Date | null;
  daysToDeadline: number | null;
}

const RepStatsPanel: React.FC = () => {
  const {
    schedule,
    visitsPerDay,
    businessDays,
    userFiles,
    schedulingDebug,
    setUserFiles,
  } = usePubData();
  const showDebug = import.meta.env.DEV && schedulingDebug;
  const [showPostcodeFixes, setShowPostcodeFixes] = useState(false);
  const totalScheduledVisits = schedule.reduce(
    (acc, day) => acc + toArray(day.visits).length,
    0
  );
  const averagePerDay =
    schedule.length > 0 ? totalScheduledVisits / schedule.length : 0;
  const averageMismatch =
    schedule.length > 0 && Number(averagePerDay.toFixed(1)) !== visitsPerDay;
  const missingSlots = Math.max(
    0,
    businessDays * visitsPerDay - totalScheduledVisits
  );
  const unscheduledDays = Math.max(0, businessDays - schedule.length);
  const scheduledDaysWithGaps = schedule.filter(
    (day) => toArray(day.visits).length < visitsPerDay
  ).length;

  const pendingFixes = useMemo(
    () =>
      (userFiles?.pubs || []).filter(
        (pub) => pub.postcodeMeta?.status && pub.postcodeMeta.status !== "OK"
      ),
    [userFiles]
  );

  const pendingInvalid = pendingFixes.filter(
    (pub) => pub.postcodeMeta?.status === "INVALID"
  );
  const pendingOddball = pendingFixes.filter(
    (pub) => pub.postcodeMeta?.status === "ODDBALL"
  );

  const applyPostcodeUpdates = (updates: PostcodeFixUpdate[]) => {
    setUserFiles((prev) => ({
      ...prev,
      pubs: prev.pubs.map((pub) => {
        const update = updates.find((u) => u.uuid === pub.uuid);
        if (!update) return pub;
        const parsed = update.parsed ?? parsePostcode(update.postcode);
        const normalized = parsed.normalized ?? update.postcode;

        // Keep the stored raw row aligned with the corrected postcode.
        const nextRawRow = pub.rawRow ? { ...pub.rawRow } : undefined;
        if (nextRawRow) {
          Object.keys(nextRawRow).forEach((key) => {
            const normalizedKey = key.trim().toLowerCase();
            if (["postcode", "post code", "post_code", "zip"].includes(normalizedKey)) {
              nextRawRow[key] = normalized;
            }
          });
        }

        return {
          ...pub,
          zip: normalized,
          postcodeMeta: parsed,
          rawRow: nextRawRow ?? pub.rawRow,
        };
      }),
    }));
    setShowPostcodeFixes(false);
  };

  // If no schedule exists or it's empty, show the placeholder
  if (
    !schedule ||
    schedule.length === 0 ||
    !schedule.some((day) => toArray(day.visits).length > 0)
  ) {
    return (
      <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-neon-purple" />
          <h3 className="text-lg font-semibold text-eggplant-100">
            Schedule Overview
          </h3>
        </div>
        <p className="text-sm text-eggplant-300">
          Generate a schedule to see statistics and insights.
        </p>

        {pendingFixes.length > 0 && (
          <div className="mt-4 bg-eggplant-800/30 rounded-lg border border-eggplant-700/40 p-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-eggplant-100">
                  Pending Postcode Fixes
                </div>
                <div className="text-xs text-eggplant-300 mt-1">
                  {pendingInvalid.length} invalid, {pendingOddball.length} oddball
                </div>
              </div>
              <button
                onClick={() => setShowPostcodeFixes(true)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-neon-purple rounded-lg hover:bg-neon-purple/90"
              >
                Review fixes
              </button>
            </div>
          </div>
        )}

        {showPostcodeFixes && pendingFixes.length > 0 && (
          <PostcodeFixesDialog
            isOpen={showPostcodeFixes}
            issues={pendingFixes}
            onCancel={() => setShowPostcodeFixes(false)}
            onConfirm={applyPostcodeUpdates}
          />
        )}
      </div>
    );
  }

  const getListEntries = (pub: Pub) => {
    const sources: Array<{ fileName?: string; listName?: string }> = Array.isArray((pub as any).sources)
      ? (pub as any).sources
      : [];
    if (sources.length > 0) {
      return sources.map((source) => ({
        fileName: source.fileName ?? source.listName ?? pub.fileName,
      }));
    }
    return [{ fileName: pub.fileName }];
  };

  const getPubKey = (pub: Pub) =>
    pub.uuid || pub.id || `${pub.fileId}-${pub.pub}-${pub.zip}`;

  const calculateDriverStats = () => {
    // Driver summary stays focused on scheduling drivers, not list membership.
    const stats = new Map<string, StatInfo>();
    const allPubs = userFiles?.pubs || [];

    allPubs.forEach((pub) => {
      const label = getPrimaryDriverLabel(pub);
      const current = stats.get(label) || {
        total: 0,
        scheduled: 0,
        fileName: label,
        priority: label,
        fileId: label,
        remaining: 0,
        isExhausted: false,
        completionDate: null,
        deadline: null,
        daysToDeadline: null,
      };
      current.total += 1;
      stats.set(label, current);
    });

    schedule.forEach((day) => {
      toArray(day.visits).forEach((visit) => {
        const label = getPrimaryDriverLabel(visit as Pub);
        const current = stats.get(label);
        if (!current) return;
        current.scheduled += 1;
      });
    });

    stats.forEach((stat) => {
      stat.remaining = Math.max(0, stat.total - stat.scheduled);
      stat.isExhausted = stat.total > 0 && stat.scheduled >= stat.total;
    });

    return stats;
  };

  const calculateListMembershipStats = () => {
    // List membership counts include merged pubs (counts can exceed unique pubs).
    const stats = new Map<string, StatInfo>();
    const totalsByList = new Map<string, number>();
    const scheduledByList = new Map<string, number>();
    const allPubs = userFiles?.pubs || [];

    allPubs.forEach((pub) => {
      getListEntries(pub).forEach((source) => {
        const listName = source.fileName || pub.fileName || "Unknown list";
        const current = stats.get(listName) || {
          total: 0,
          scheduled: 0,
          fileName: listName,
          priority: "",
          fileId: listName,
          remaining: 0,
          isExhausted: false,
          completionDate: null,
          deadline: null,
          daysToDeadline: null,
        };
        totalsByList.set(listName, (totalsByList.get(listName) || 0) + 1);
        stats.set(listName, current);
      });
    });

    schedule.forEach((day) => {
      toArray(day.visits).forEach((visit) => {
        getListEntries(visit as Pub).forEach((source) => {
          const listName = source.fileName || (visit as Pub).fileName || "Unknown list";
          scheduledByList.set(listName, (scheduledByList.get(listName) || 0) + 1);
        });
      });
    });

    stats.forEach((stat) => {
      stat.total = totalsByList.get(stat.fileId) || 0;
      stat.scheduled = scheduledByList.get(stat.fileId) || 0;
      stat.remaining = Math.max(0, stat.total - stat.scheduled);
      stat.isExhausted = stat.total > 0 && stat.scheduled >= stat.total;
    });

    return stats;
  };

  const driverStats = calculateDriverStats();
  const listStats = calculateListMembershipStats();
  const listMembershipDetails = useMemo(() => {
    const membership = new Map<string, Map<string, Pub>>();
    const scheduledKeys = new Set<string>();

    schedule.forEach((day) => {
      toArray(day.visits).forEach((visit) => {
        scheduledKeys.add(getPubKey(visit as Pub));
      });
    });

    (userFiles?.pubs || []).forEach((pub) => {
      const pubKey = getPubKey(pub);
      getListEntries(pub).forEach((source) => {
        const listName = source.fileName || pub.fileName || "Unknown list";
        const entries = membership.get(listName) || new Map<string, Pub>();
        entries.set(String(pubKey), pub);
        membership.set(listName, entries);
      });
    });

    const details = new Map<
      string,
      {
        unscheduled: Array<{ pub: Pub; reason: string }>;
      }
    >();

    membership.forEach((entries, listName) => {
      const unscheduled: Array<{ pub: Pub; reason: string }> = [];
      entries.forEach((pub, pubKey) => {
        if (scheduledKeys.has(pubKey)) return;
        const reason =
          pub.postcodeMeta?.status === "INVALID"
            ? "Invalid postcode"
            : "Capacity";
        unscheduled.push({ pub, reason });
      });
      details.set(listName, { unscheduled });
    });

    return details;
  }, [schedule, userFiles]);

  const getDriverRank = (label: string) => {
    if (label.startsWith("Visit by")) return 1;
    if (label.startsWith("Follow-up")) return 2;
    if (label.startsWith("Priority 1")) return 3;
    if (label.startsWith("Priority 2")) return 4;
    if (label.startsWith("Priority 3")) return 5;
    if (label === "Masterfile") return 6;
    return 99;
  };

  const sortedDriverStats = Array.from(driverStats.entries()).sort(
    ([aLabel], [bLabel]) => getDriverRank(aLabel) - getDriverRank(bLabel)
  );

  const getStatusColor = (stat: any) => {
    if (!stat) return "";
    if (stat.isExhausted)
      return "bg-green-900/20 border-green-700/50 text-green-200";
    if (stat.scheduled === 0)
      return "bg-red-900/20 border-red-700/50 text-red-200";
    return "bg-yellow-900/20 border-yellow-700/50 text-yellow-200";
  };

  const getStatusIcon = (stat: any) => {
    if (!stat) return null;
    if (stat.isExhausted)
      return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    if (stat.scheduled === 0)
      return <AlertCircle className="h-4 w-4 text-red-400" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
  };

  const getStatusMessage = (stat: any) => {
    if (!stat) return "";

    let scheduledText = stat.isExhausted
      ? `All ${stat.total} scheduled`
      : stat.scheduled === 0
      ? "None scheduled"
      : `${stat.scheduled}/${stat.total} scheduled`;

    return scheduledText;
  };

  return (
    <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-neon-purple" />
        <h3 className="text-lg font-semibold text-eggplant-100">
          Schedule Overview
        </h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-eggplant-800/30 rounded-lg p-3">
            <div className="text-sm text-eggplant-200 mb-1">
              Total Scheduled
            </div>
            <div className="text-xl font-bold text-eggplant-100">
              {totalScheduledVisits} visits
            </div>
            <div className="text-xs text-eggplant-300 mt-1">
              Requested {businessDays}{" "}
              {businessDays === 1 ? "week day" : "week days"} • Scheduled{" "}
              <span
                className={
                  schedule.length !== businessDays
                    ? "text-red-300"
                    : "text-eggplant-300"
                }
              >
                {schedule.length}
              </span>
            </div>
          </div>

          <div className="bg-eggplant-800/30 rounded-lg p-3">
            <div className="text-sm text-eggplant-200 mb-1">
              Average Per Day
            </div>
            <div className="text-xl font-bold text-eggplant-100">
              <span className={averageMismatch ? "text-red-300" : "text-eggplant-100"}>
                {schedule.length > 0 ? averagePerDay.toFixed(1) : "0"}
              </span>{" "}
              visits
            </div>
            <div className="text-xs text-eggplant-300 mt-1">
              Target: {visitsPerDay} visits/day
            </div>
          </div>
        </div>

        {/* Schedule Gaps Section - Only show if we have actual visits and gaps */}
        {schedule.some((day) => toArray(day.visits).length > 0) &&
          missingSlots > 0 && (
            <div className="bg-yellow-900/10 rounded-lg border border-yellow-700/30 p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <div className="text-sm font-medium text-yellow-200">
                  Schedule Gaps Detected
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="text-xs text-eggplant-300 mb-1">
                    Expected Visits
                  </div>
                  <div className="text-sm font-medium text-eggplant-100">
                    {businessDays * visitsPerDay} visits
                    <span className="text-xs text-eggplant-300 ml-1">
                      ({businessDays} days x {visitsPerDay}/day)
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-eggplant-300 mb-1">
                    Missing Visits
                  </div>
                  <div className="text-sm font-medium text-yellow-200">
                    {missingSlots} gaps
                    <span className="text-xs text-eggplant-300 ml-1">
                      ({scheduledDaysWithGaps} scheduled days affected{unscheduledDays > 0 ? `, ${unscheduledDays} unscheduled days` : ""})
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-eggplant-300 mt-3">
                Some days couldn't be fully scheduled due to lack of available
                pubs in nearby areas. Consider adding more pubs to your lists or
                adjusting your visits per day setting.
              </p>
            </div>
          )}

        {pendingFixes.length > 0 && (
          <div className="bg-eggplant-800/30 rounded-lg border border-eggplant-700/40 p-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-eggplant-100">
                  Pending Postcode Fixes
                </div>
                <div className="text-xs text-eggplant-300 mt-1">
                  {pendingInvalid.length} invalid (excluded), {pendingOddball.length} oddball (still schedulable)
                </div>
              </div>
              <button
                onClick={() => setShowPostcodeFixes(true)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-neon-purple rounded-lg hover:bg-neon-purple/90"
              >
                Review fixes
              </button>
            </div>
          </div>
        )}

        {showPostcodeFixes && pendingFixes.length > 0 && (
          <PostcodeFixesDialog
            isOpen={showPostcodeFixes}
            issues={pendingFixes}
            onCancel={() => setShowPostcodeFixes(false)}
            onConfirm={applyPostcodeUpdates}
          />
        )}

        {sortedDriverStats.map(
          ([fileId, stat]) =>
            stat?.total > 0 && (
              <Tooltip.Provider key={`tooltip-${fileId}`}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div
                      className={`flex flex-col gap-1 p-2.5 rounded-lg cursor-help ${getStatusColor(
                        stat
                      )}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(stat)}
                          <span className="font-medium text-sm whitespace-nowrap">
                            {stat.fileName}
                          </span>
                        </div>
                        <span className="text-xs text-eggplant-200">
                          {getStatusMessage(stat)}
                        </span>
                      </div>
                      <div className="mt-1">
                        <div className="text-xs text-eggplant-300 whitespace-pre-line">
                          {/* Add deadline completion info for hitlist imports with deadlines */}
                          {stat.deadline &&
                            stat.completionDate &&
                            stat.isExhausted &&
                            stat.daysToDeadline != null && (
                              <div
                                className={`mt-1 ${
                                  stat.daysToDeadline > 0
                                    ? "text-green-400"
                                    : stat.daysToDeadline === 0
                                    ? "text-yellow-400"
                                    : "text-red-400"
                                }`}
                              >
                                {stat.daysToDeadline > 0
                                  ? `✓ Scheduled ${stat.daysToDeadline} week days early`
                                  : stat.daysToDeadline === 0
                                  ? `⚠️ Scheduled on deadline`
                                  : `⚠️ Scheduled ${Math.abs(
                                      stat.daysToDeadline
                                    )} week days late`}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg max-w-xs"
                      sideOffset={5}
                    >
                      <p className="font-medium mb-1">{stat.fileName}</p>
                      <p className="text-sm">
                        {stat.scheduled} scheduled, {stat.remaining} remaining
                        {stat.isExhausted && " - All pubs scheduled!"}
                      </p>

                      {/* Show deadline completion status for hitlist imports with deadlines */}
                      {stat.deadline &&
                        stat.completionDate &&
                        stat.daysToDeadline != null && (
                        <div className="mt-2 pt-2 border-t border-eggplant-800/50">
                          {stat.daysToDeadline > 0 ? (
                            <p className="text-sm text-green-400 flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Scheduled {stat.daysToDeadline} week days prior to
                              deadline
                            </p>
                          ) : stat.daysToDeadline === 0 ? (
                            <p className="text-sm text-yellow-400 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Scheduled on deadline day
                            </p>
                          ) : (
                            <p className="text-sm text-red-400 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Scheduled {Math.abs(stat.daysToDeadline)} week
                              days after deadline
                            </p>
                          )}
                          <p className="text-xs text-eggplant-300 mt-1">
                            Last visit:{" "}
                            {format(stat.completionDate, "MMM d, yyyy")}
                          </p>
                        </div>
                      )}
                      <Tooltip.Arrow className="fill-dark-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            )
        )}

        <details className="bg-eggplant-800/30 rounded-lg p-3 border border-eggplant-700/40">
          <summary className="text-sm text-eggplant-200 cursor-pointer">
            List membership (expanded)
          </summary>
          <div className="mt-2 space-y-2">
            {Array.from(listStats.values())
              .sort((a, b) => a.fileName.localeCompare(b.fileName))
              .map((stat) => {
                const listDetail = listMembershipDetails.get(stat.fileName);
                const unscheduled = listDetail?.unscheduled ?? [];
                return (
                  <details
                    key={stat.fileId}
                    className="rounded-md border border-eggplant-700/30 bg-eggplant-900/20 px-2 py-1"
                  >
                    <summary className="flex items-center justify-between text-xs text-eggplant-200 cursor-pointer">
                      <span className="font-medium">{stat.fileName}</span>
                      <span className="text-eggplant-300">
                        {stat.scheduled}/{stat.total} scheduled
                      </span>
                    </summary>
                    {unscheduled.length > 0 && (
                      <div className="mt-2 space-y-1 text-[11px] text-eggplant-300">
                        {unscheduled.map(({ pub, reason }) => (
                          <div key={getPubKey(pub)} className="flex items-start justify-between gap-3">
                            <span className="flex-1 whitespace-normal break-words">
                              {pub.pub} ({pub.zip})
                            </span>
                            <span className="text-eggplant-400 whitespace-nowrap">
                              {reason}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {unscheduled.length === 0 && (
                      <div className="mt-2 text-[11px] text-eggplant-400">
                        All related accounts scheduled.
                      </div>
                    )}
                  </details>
                );
              })}
          </div>
        </details>

        {showDebug && (
          <details className="bg-eggplant-800/30 rounded-lg p-3 border border-eggplant-700/40">
            <summary className="text-sm text-eggplant-200 cursor-pointer">
              Debug Summary (dev only)
            </summary>
            <div className="mt-2 text-xs text-eggplant-300 space-y-2">
              <div>
                <span className="text-eggplant-200">Anchor:</span>{" "}
                {schedulingDebug.anchorMode}
              </div>
              <div>
                <span className="text-eggplant-200">Buckets:</span>{" "}
                deadline {schedulingDebug.bucketTotals.deadline}, follow-up{" "}
                {schedulingDebug.bucketTotals.followUp}, priority{" "}
                {schedulingDebug.bucketTotals.priority}, master{" "}
                {schedulingDebug.bucketTotals.master}
              </div>
              <div>
                <span className="text-eggplant-200">Scheduled:</span>{" "}
                deadline {schedulingDebug.bucketScheduled.deadline}, follow-up{" "}
                {schedulingDebug.bucketScheduled.followUp}, priority{" "}
                {schedulingDebug.bucketScheduled.priority}, master{" "}
                {schedulingDebug.bucketScheduled.master}
              </div>
              <div>
                <span className="text-eggplant-200">Excluded:</span>{" "}
                deadline {schedulingDebug.bucketExcluded.deadline}, follow-up{" "}
                {schedulingDebug.bucketExcluded.followUp}, priority{" "}
                {schedulingDebug.bucketExcluded.priority}, master{" "}
                {schedulingDebug.bucketExcluded.master}
              </div>
              <div>
                <span className="text-eggplant-200">Reasons:</span>{" "}
                radius {schedulingDebug.exclusionReasons.radiusConstrained},{" "}
                invalid postcode {schedulingDebug.exclusionReasons.invalidGeo},{" "}
                capacity {schedulingDebug.exclusionReasons.capacityLimit},{" "}
                already scheduled{" "}
                {schedulingDebug.exclusionReasons.alreadyScheduled}
              </div>
              <div>
                <span className="text-eggplant-200">Totals:</span>{" "}
                {schedulingDebug.totalScheduled}/{schedulingDebug.totalPubs}{" "}
                visits across {schedulingDebug.scheduledDays} days at{" "}
                {schedulingDebug.visitsPerDay}/day
              </div>
              <div>
                <span className="text-eggplant-200">Days requested:</span>{" "}
                {schedulingDebug.daysRequested}
              </div>
              <div>
                <span className="text-eggplant-200">Unscheduled by list:</span>{" "}
                {Array.from(listMembershipDetails.entries())
                  .map(([listName, detail]) => ({
                    listName,
                    count: detail.unscheduled.length,
                  }))
                  .filter((entry) => entry.count > 0)
                  .slice(0, 5)
                  .map((entry) => `${entry.listName}: ${entry.count}`)
                  .join(", ") || "None"}
              </div>
              {schedulingDebug.notes && (
                <div className="text-[10px] text-eggplant-400">
                  {schedulingDebug.notes}
                </div>
              )}
            </div>
          </details>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-neon-pink" />
            <span className="text-sm text-eggplant-200">Total Travel</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-eggplant-100">
              {schedule
                .reduce((acc, day) => acc + (day.totalMileage || 0), 0)
                .toFixed(1)}{" "}
              miles
            </p>
            <p className="text-xs text-eggplant-300">
              {(
                schedule.reduce(
                  (acc, day) => acc + (day.totalMileage || 0),
                  0
                ) / Math.max(1, schedule.length)
              ).toFixed(1)}{" "}
              miles per day
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-neon-purple" />
            <span className="text-sm text-eggplant-200">Total Time</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-eggplant-100">
              {schedule.reduce(
                (acc, day) => acc + (day.totalDriveTime || 0),
                0
              )}{" "}
              minutes
            </p>
            <p className="text-xs text-eggplant-300">
              {(
                schedule.reduce(
                  (acc, day) => acc + (day.totalDriveTime || 0),
                  0
                ) / Math.max(1, schedule.length)
              ).toFixed(0)}{" "}
              minutes per day
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-eggplant-800/30">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-neon-blue" />
            <span className="text-sm text-eggplant-200">Coverage</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-eggplant-100">
              {Math.round(
                (schedule.reduce((acc, day) => acc + toArray(day.visits).length, 0) /
                  (userFiles?.pubs?.length || 1)) *
                  100
              )}
              % of territory
            </p>
            <p className="text-xs text-eggplant-300">
              {schedule.reduce((acc, day) => acc + toArray(day.visits).length, 0)} of{" "}
              {userFiles?.pubs?.length || 0} pubs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepStatsPanel;
