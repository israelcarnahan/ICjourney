import React from "react";
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
import { differenceInBusinessDays, format } from "date-fns";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Pub } from "../context/PubDataContext";
import { toArray } from "../utils/typeGuards";

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
  const { schedule, visitsPerDay, userFiles, schedulingDebug } = usePubData();
  const showDebug = import.meta.env.DEV && schedulingDebug;

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
      </div>
    );
  }

  const getPubsByFileId = (pubs: Pub[] = []): Map<string, Pub[]> => {
    const fileGroups = new Map<string, Pub[]>();
    pubs.forEach((pub: Pub) => {
      if (!pub.fileId) return;
      const group = fileGroups.get(pub.fileId) || [];
      fileGroups.set(pub.fileId, [...group, pub]);
    });
    return fileGroups;
  };

  const calculateStats = () => {
    const getListStats = (
      fileId: string,
      pubs: Pub[],
      type: string
    ): StatInfo | null => {
      if (!pubs?.length) return null;

      const firstPub = pubs[0];

      // Determine priority display
      let priority;
      if (type === "RepslyWin") {
        priority = "RepslyWin";
      } else if (type === "Wishlist") {
        if (firstPub.deadline) {
          priority = "Deadline";
        } else {
          priority = `Priority ${firstPub.priorityLevel || 1}`;
        }
      } else if (type === "Unvisited") {
        priority = "Priority 2";
      } else if (type === "Masterfile") {
        // Calculate highest priority level from other lists
        const maxPriority = Math.max(
          ...Array.from(stats.values())
            .filter((s) => s?.priorityLevel && !s.deadline)
            .map((s) => s.priorityLevel || 0),
          2 // Minimum priority level for non-deadline lists
        );
        priority = `Priority ${maxPriority + 1}`;
      } else {
        priority = type;
      }

      // Find the last scheduled visit for this type
      let lastScheduledDate = null;
      for (let i = schedule.length - 1; i >= 0; i--) {
        const day = schedule[i];
        if (toArray(day.visits).some((v) => v.fileId === fileId)) {
          lastScheduledDate = day.date;
          break;
        }
      }

      const scheduledCount = schedule.reduce(
        (acc, day) =>
          acc + toArray(day.visits).filter((v) => v.fileId === fileId).length,
        0
      );

      // Calculate completion date and days to deadline
      const completionDate = lastScheduledDate
        ? new Date(lastScheduledDate)
        : null;
      const deadline = firstPub?.deadline ? new Date(firstPub.deadline) : null;
      const daysToDeadline =
        deadline && completionDate
          ? differenceInBusinessDays(deadline, completionDate)
          : null;

      return {
        total: pubs.length,
        scheduled: scheduledCount,
        fileName: firstPub.fileName || "",
        priority,
        priorityLevel: firstPub.priorityLevel,
        followUpDays: firstPub.followUpDays,
        fileId: fileId,
        remaining: pubs.length - scheduledCount,
        isExhausted: scheduledCount === pubs.length && pubs.length > 0,
        completionDate,
        deadline,
        daysToDeadline,
      };
    };

    const stats = new Map<string, any>();

    // Process each file group separately
    const allPubs = userFiles?.pubs || [];
    [
      {
        pubs: allPubs.filter((pub) => pub.listType === "wins"),
        type: "RepslyWin",
      },
      {
        pubs: allPubs.filter((pub) => pub.listType === "hitlist"),
        type: "Wishlist",
      },
      {
        pubs: allPubs.filter((pub) => pub.listType === "unvisited"),
        type: "Unvisited",
      },
      {
        pubs: allPubs.filter((pub) => pub.listType === "masterhouse"),
        type: "Masterfile",
      },
    ].forEach(({ pubs, type }) => {
      const fileGroups = getPubsByFileId(pubs);
      fileGroups.forEach((groupPubs, fileId) => {
        stats.set(fileId, getListStats(fileId, groupPubs, type));
      });
    });

    return stats;
  };

  const stats = calculateStats();

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

  const getPriorityInfo = (stat: any) => {
    if (!stat) return "";

    if (stat.priority === "RepslyWin") {
      return stat.followUpDays
        ? `Follow-up: ${stat.followUpDays} days after install`
        : "Recent Win";
    } else if (stat.deadline) {
      return `Deadline: ${format(stat.deadline, "MMM d, yyyy")}`;
    } else if (stat.priority.startsWith("Priority ")) {
      return stat.priority;
    } else {
      return stat.priority;
    }
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
              {schedule.reduce((acc, day) => acc + toArray(day.visits).length, 0)} visits
            </div>
            <div className="text-xs text-eggplant-300 mt-1">
              {schedule.length}{" "}
              {schedule.length === 1 ? "week day" : "week days"} planned
            </div>
          </div>

          <div className="bg-eggplant-800/30 rounded-lg p-3">
            <div className="text-sm text-eggplant-200 mb-1">
              Average Per Day
            </div>
            <div className="text-xl font-bold text-eggplant-100">
              {schedule.length > 0
                ? (
                    schedule.reduce((acc, day) => acc + toArray(day.visits).length, 0) /
                    schedule.length
                  ).toFixed(1)
                : "0"}{" "}
              visits
            </div>
            <div className="text-xs text-eggplant-300 mt-1">
              Target efficiency
            </div>
          </div>
        </div>

        {/* Schedule Gaps Section - Only show if we have actual visits and gaps */}
        {schedule.some((day) => toArray(day.visits).length > 0) &&
          schedule.some((day) => toArray(day.visits).length < visitsPerDay) && (
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
                    {schedule.length * visitsPerDay} visits
                    <span className="text-xs text-eggplant-300 ml-1">
                      ({schedule.length} days × {visitsPerDay}/day)
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-eggplant-300 mb-1">
                    Missing Visits
                  </div>
                  <div className="text-sm font-medium text-yellow-200">
                    {schedule.length * visitsPerDay -
                      schedule.reduce(
                        (acc, day) => acc + toArray(day.visits).length,
                        0
                      )}{" "}
                    gaps
                    <span className="text-xs text-eggplant-300 ml-1">
                      (
                      {
                        schedule.filter(
                          (day) => toArray(day.visits).length < visitsPerDay
                        ).length
                      }{" "}
                      days affected)
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
                invalid geo {schedulingDebug.exclusionReasons.invalidGeo},{" "}
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
              {schedulingDebug.notes && (
                <div className="text-[10px] text-eggplant-400">
                  {schedulingDebug.notes}
                </div>
              )}
            </div>
          </details>
        )}

        {Array.from(stats.entries()).map(
          ([fileId, stat]) =>
            stat?.total > 0 && (
              <Tooltip.Provider key={`tooltip-${fileId}`}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div
                      className={`flex flex-col gap-2 p-2.5 rounded-lg cursor-help ${getStatusColor(
                        stat
                      )}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(stat)}
                          <span className="font-medium text-sm whitespace-nowrap">
                            {stat.fileName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs text-eggplant-300 whitespace-pre-line">
                          {getPriorityInfo(stat)}
                          {/* Add deadline completion info for hitlist imports with deadlines */}
                          {stat.deadline &&
                            stat.completionDate &&
                            stat.isExhausted && (
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
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-current opacity-30" />
                          <span className="text-xs">
                            {getStatusMessage(stat)}
                          </span>
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
                      {stat.deadline && stat.completionDate && (
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
