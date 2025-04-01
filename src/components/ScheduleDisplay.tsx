import React, { useState, useCallback, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Trash2,
  Car,
  Anchor,
  Plane,
  Train,
  Bus,
  Bike,
  Truck,
  LucideIcon,
} from "lucide-react";
import {
  usePubData,
  ScheduleDay,
  ExtendedPub,
  VehicleType,
  VehicleColor,
  Pub,
} from "../context/PubDataContext";
import * as XLSX from "xlsx";
import {
  format,
  parseISO,
  isValid,
  differenceInBusinessDays,
  addBusinessDays,
  addMinutes,
  differenceInMinutes,
} from "date-fns";
import SparkleWrapper from "./Sparkles";
import ScheduleReport from "./ScheduleReport";
import RescheduleDialog from "./RescheduleDialog";
import { downloadICSFile } from "../utils/calendarUtils";
import * as Tooltip from "@radix-ui/react-tooltip";
import { checkPubOpeningHours } from "../utils/openingHours";
import OpeningHoursIndicator from "./OpeningHoursIndicator";
import clsx from "clsx";
import RemovePubDialog from "./RemovePubDialog";
import {
  calculateDistance,
  findNearestPubs,
  getPriorityOrder,
} from "../utils/scheduleUtils";
import RouteMap from "./RouteMap";
import UnscheduledPubsPanel from "./UnscheduledPubsPanel";
import VisitScheduler from "./VisitScheduler";
import DriveTimeBar from "./DriveTimeBar";
import * as Popover from "@radix-ui/react-popover";
import {
  BootIcon,
  TopHatIcon,
  ThimbleIcon,
  WheelbarrowIcon,
} from "./icons/MonopolyIcons";

interface OpeningHoursResult {
  isOpen: boolean;
  hours?: string;
  error?: string;
  openTime?: string;
  closeTime?: string;
}

interface OpeningHoursMap {
  [key: string]: OpeningHoursResult;
}

interface ScheduleVisit extends ExtendedPub {
  Priority: string;
  mileageToNext: number;
  driveTimeToNext: number;
}

interface EnhancedScheduleDay extends ScheduleDay {
  schedulingErrors?: string[];
  visits: ScheduleVisit[];
}

interface Visit extends Pub {
  driveTimeToNext?: number;
  scheduledTime?: string;
  visitNotes?: string;
  accountName?: string;
  openingTime?: string;
}

interface ScheduleEntry {
  pub: string;
  arrival: Date;
  departure: Date;
  driveTime: number;
  isScheduled: boolean;
}

// Custom icon for fairy
const FairyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2l1.5 5h5l-4 3 1.5 5-4-3-4 3 1.5-5-4-3h5z" />
    <path d="M12 16v6" />
    <path d="M8 14l-4 4" />
    <path d="M16 14l4 4" />
  </svg>
);

// Custom icon for horse
const HorseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 16v4h4v-4" />
    <path d="M4 20h16" />
    <path d="M16 16v4h4v-4" />
    <path d="M10 12c0-2.8 2.2-5 5-5s5 2.2 5 5" />
    <path d="M7 12c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

const vehicleIcons: Record<VehicleType, LucideIcon | React.FC<any>> = {
  car: Car,
  truck: Truck,
  bike: Bike,
  bus: Bus,
  train: Train,
  plane: Plane,
  boat: Anchor,
  fairy: FairyIcon,
};

const vehicleColors: Record<VehicleColor, string> = {
  purple: "text-neon-purple",
  blue: "text-neon-blue",
  pink: "text-neon-pink",
  green: "text-emerald-400",
  orange: "text-orange-400",
  yellow: "text-yellow-400",
};

const getPriorityStyles = (priority: string): string => {
  switch (priority) {
    case "RepslyWin":
      return "bg-purple-900/20 text-purple-200 border border-purple-700/50";
    case "Wishlist":
      return "bg-blue-900/20 text-blue-200 border border-blue-700/50";
    case "Unvisited":
      return "bg-green-900/20 text-green-200 border border-green-700/50";
    default:
      return "bg-gray-900/20 text-gray-200 border border-gray-700/50";
  }
};

const formatDate = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return "Never";

  try {
    if (dateStr instanceof Date) {
      return format(dateStr, "MMM d, yyyy");
    }

    if (!isNaN(Number(dateStr))) {
      const excelDate = new Date((Number(dateStr) - 25569) * 86400 * 1000);
      if (isValid(excelDate)) {
        return format(excelDate, "MMM d, yyyy");
      }
    }

    const isoDate = parseISO(dateStr);
    if (isValid(isoDate)) {
      return format(isoDate, "MMM d, yyyy");
    }

    return "Never";
  } catch (error) {
    console.warn("Date parsing error:", error);
    return "Never";
  }
};

const recalculateMetrics = (
  visits: Visit[],
  homeAddress: string,
  desiredEndTime?: string
) => {
  let totalMileage = 0;
  let totalDriveTime = 0;
  let startDriveTime = 0;
  let endDriveTime = 0;

  // Calculate drive times between visits
  for (let i = 0; i < visits.length; i++) {
    const visit = visits[i];
    const nextVisit = visits[i + 1];

    if (i === 0) {
      // Calculate drive time from home to first visit
      const { mileage, driveTime } = calculateDistance(homeAddress, visit.zip);
      startDriveTime = driveTime;
      totalMileage += mileage;
      totalDriveTime += driveTime;
    }

    if (nextVisit) {
      // Calculate drive time to next visit
      const { mileage, driveTime } = calculateDistance(
        visit.zip,
        nextVisit.zip
      );
      visit.driveTimeToNext = driveTime;
      totalMileage += mileage;
      totalDriveTime += driveTime;
    } else {
      // Calculate drive time from last visit to home
      const { mileage, driveTime } = calculateDistance(visit.zip, homeAddress);
      endDriveTime = driveTime;
      totalMileage += mileage;
      totalDriveTime += driveTime;
    }
  }

  return {
    totalMileage,
    totalDriveTime,
    startDriveTime,
    endDriveTime,
    visits,
  };
};

// Helper to parse time string to Date
const parseTimeToDate = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const getScheduleTimes = (
  visits: Visit[],
  startTime: string,
  desiredEndTime?: string
) => {
  // Default business hours
  const defaultStartTime = "09:00";
  const defaultEndTime = "17:00";

  // Use provided start time or default to 9 AM
  const [startHours, startMinutes] = (startTime || defaultStartTime)
    .split(":")
    .map(Number);
  const dayStart = new Date();
  dayStart.setHours(startHours, startMinutes, 0, 0);

  // Use provided end time or default to 5 PM
  let desiredEnd: Date = new Date(dayStart);
  if (desiredEndTime) {
    const [endHours, endMinutes] = desiredEndTime.split(":").map(Number);
    desiredEnd.setHours(endHours, endMinutes, 0, 0);
  } else {
    const [defaultEndHours, defaultEndMinutes] = defaultEndTime
      .split(":")
      .map(Number);
    desiredEnd.setHours(defaultEndHours, defaultEndMinutes, 0, 0);
  }

  const averageVisitTime = 45; // minutes
  const minDriveTime = 30; // minimum minutes between visits

  // First pass: Schedule fixed appointments
  const scheduledVisits = visits.filter(
    (v): v is Visit & Required<Pick<Visit, "scheduledTime">> =>
      Boolean(v.scheduledTime)
  );

  // Initialize schedule array with all visits starting at the earliest possible time
  const schedule: ScheduleEntry[] = visits.map((visit) => ({
    pub: visit.pub,
    arrival: dayStart,
    departure: addMinutes(dayStart, averageVisitTime),
    driveTime: visit.driveTimeToNext || minDriveTime,
    isScheduled: Boolean(visit.scheduledTime),
  }));

  // Update scheduled visits with their fixed times
  for (const visit of scheduledVisits) {
    const index = visits.findIndex((v) => v.pub === visit.pub);
    if (index === -1) continue;

    const appointmentTime = parseTimeToDate(visit.scheduledTime);
    schedule[index] = {
      pub: visit.pub,
      arrival: appointmentTime,
      departure: addMinutes(appointmentTime, averageVisitTime),
      driveTime: visit.driveTimeToNext || minDriveTime,
      isScheduled: true,
    };
  }

  // Second pass: Schedule unscheduled visits in available time slots
  let currentTime = dayStart;
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i].isScheduled) continue;

    // Find the next scheduled visit (if any)
    const nextScheduledIndex = schedule.findIndex(
      (s, idx) => idx > i && s.isScheduled
    );
    const nextScheduledTime =
      nextScheduledIndex !== -1
        ? schedule[nextScheduledIndex].arrival
        : desiredEnd;

    // Calculate available time window
    const availableMinutes = differenceInMinutes(
      nextScheduledTime,
      currentTime
    );
    const neededMinutes =
      averageVisitTime + (schedule[i].driveTime || minDriveTime);

    if (availableMinutes >= neededMinutes) {
      // Schedule visit in the available window
      schedule[i].arrival = currentTime;
      schedule[i].departure = addMinutes(currentTime, averageVisitTime);
      currentTime = addMinutes(currentTime, neededMinutes);
    } else {
      // Not enough time before next scheduled visit, try after it
      if (nextScheduledIndex !== -1) {
        currentTime = addMinutes(
          schedule[nextScheduledIndex].departure,
          schedule[nextScheduledIndex].driveTime || minDriveTime
        );
        i--; // Retry scheduling this visit in the next available slot
      }
    }

    // If we can't schedule within business hours, show warning
    if (currentTime > desiredEnd) {
      console.warn(
        `Warning: Visit to ${schedule[i].pub} scheduled outside business hours`
      );
    }
  }

  return { schedule };
};

const isOutsideBusinessHours = (time: Date): boolean => {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes < 9 * 60 || totalMinutes > 17 * 60;
};

const ScheduleDisplay: React.FC = () => {
  const {
    schedule,
    setSchedule,
    userFiles,
    homeAddress,
    visitsPerDay,
    selectedVehicle,
    selectedVehicleColor,
    setSelectedVehicle,
    setSelectedVehicleColor,
  } = usePubData();

  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [openingHours, setOpeningHours] = useState<OpeningHoursMap>({});
  const [removedPubs, setRemovedPubs] = useState<Record<string, Set<string>>>(
    {}
  );
  const [selectedPub, setSelectedPub] = useState<any>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [desiredEndTimes, setDesiredEndTimes] = useState<
    Record<string, string>
  >({});

  const updateSchedule = (updater: (prev: ScheduleDay[]) => ScheduleDay[]) => {
    try {
      console.log("updateSchedule called");

      // Get the new schedule
      const newSchedule = updater(schedule);
      if (!newSchedule) {
        console.warn("No new schedule returned from updater");
        return;
      }

      console.log("New schedule generated", {
        scheduleLength: newSchedule.length,
      });

      // Immediately update the schedule state to reflect changes
      setSchedule(newSchedule);
      console.log("Schedule state updated");

      // Then process the updates in the background
      const processUpdates = () => {
        console.log("Processing background updates");
        // Recalculate metrics for the affected day
        const updatedSchedule = newSchedule.map((day) => {
          console.log("Recalculating metrics for day", day.date);

          // Calculate base metrics
          const metrics = recalculateMetrics(
            day.visits,
            homeAddress,
            desiredEndTimes[day.date]
          );

          // Get updated schedule times
          const { schedule: daySchedule } = getScheduleTimes(
            day.visits,
            "09:00",
            desiredEndTimes[day.date]
          );

          // Check for scheduling conflicts
          const schedulingErrors: string[] = [];
          daySchedule.forEach((entry, index) => {
            if (index > 0) {
              const prevEntry = daySchedule[index - 1];
              const gap = differenceInMinutes(
                entry.arrival,
                prevEntry.departure
              );
              if (gap < 30) {
                schedulingErrors.push(
                  `Insufficient travel time between ${prevEntry.pub} and ${entry.pub}`
                );
              }
            }
            if (isOutsideBusinessHours(entry.arrival)) {
              schedulingErrors.push(
                `${entry.pub} is scheduled outside business hours (9 AM - 5 PM)`
              );
            }
          });

          return {
            ...day,
            ...metrics,
            schedulingErrors,
          };
        });

        console.log("Applying updated schedule with metrics");
        // Update the state with the recalculated metrics
        setSchedule(updatedSchedule);
      };

      // Use requestIdleCallback if available, otherwise use setTimeout
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(() => processUpdates());
      } else {
        setTimeout(processUpdates, 0);
      }
    } catch (error) {
      console.error("Error in updateSchedule:", error);
    }
  };

  const fetchOpeningHours = async (pubName: string, postcode: string) => {
    try {
      const result = await checkPubOpeningHours(pubName);
      setOpeningHours((prev) => ({
        ...prev,
        [`${pubName}-${postcode}`]: result,
      }));
    } catch (error) {
      console.error("Error fetching opening hours:", error);
      setOpeningHours((prev) => ({
        ...prev,
        [`${pubName}-${postcode}`]: {
          isOpen: false,
          error: "Failed to fetch opening hours",
        },
      }));
    }
  };

  useEffect(() => {
    Object.entries(expandedDays).forEach(async ([date, isExpanded]) => {
      if (isExpanded) {
        const daySchedule = schedule.find((day) => day.date === date);
        if (daySchedule) {
          for (const visit of daySchedule.visits) {
            const key = `${visit.pub}-${visit.zip}`;
            if (!openingHours[key]) {
              try {
                const hours = await checkPubOpeningHours(visit.pub);
                setOpeningHours((prev) => ({
                  ...prev,
                  [key]: hours,
                }));
              } catch (error) {
                console.error("Error fetching opening hours:", error);
              }
            }
          }
        }
      }
    });
  }, [expandedDays, schedule]);

  const toggleDay = useCallback(
    (date: string) => {
      setExpandedDays((prev) => {
        const newState = { ...prev, [date]: !prev[date] };

        // Only try to set selected pub if expanding the day
        if (newState[date]) {
          const daySchedule = schedule?.find((day) => day?.date === date);
          const firstVisit = daySchedule?.visits?.[0];
          setSelectedPub(firstVisit || null);
        } else {
          setSelectedPub(null);
        }

        return newState;
      });
    },
    [schedule]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent, date: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleDay(date);
      }
    },
    [toggleDay]
  );

  const handleDeleteDay = (dateToDelete: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this day from the schedule?"
      )
    ) {
      updateSchedule((prevSchedule) =>
        prevSchedule.filter((day) => day.date !== dateToDelete)
      );
    }
  };

  const findReplacementPub = (dayDate: string, removedPub: any) => {
    // Get all pubs from userFiles
    const allPubs = [
      ...userFiles.pubs.map((pub) => ({
        ...pub,
        Priority:
          pub.listType === "wins"
            ? "RepslyWin"
            : pub.listType === "hitlist"
            ? "Wishlist"
            : pub.listType === "unvisited"
            ? "Unvisited"
            : "Masterfile",
      })),
    ];

    const scheduledPubs = new Set(
      schedule.flatMap((day) => day.visits.map((visit) => visit.pub))
    );
    const dayRemovedPubs = removedPubs[dayDate] || new Set();

    const availablePubs = allPubs.filter(
      (pub) =>
        pub &&
        pub.pub &&
        pub.zip &&
        !scheduledPubs.has(pub.pub) &&
        !dayRemovedPubs.has(pub.pub)
    );

    const removedPubPriorityOrder = getPriorityOrder(removedPub);
    const eligiblePubs = availablePubs.filter(
      (pub) => getPriorityOrder(pub) <= removedPubPriorityOrder
    );

    if (!removedPub || !removedPub.zip) {
      console.warn("Invalid removed pub:", removedPub);
      return null;
    }

    const nearbyPubs = findNearestPubs(removedPub, eligiblePubs, 10);
    if (!nearbyPubs.length) return null;

    return nearbyPubs.sort((a, b) => {
      const priorityDiff = getPriorityOrder(a) - getPriorityOrder(b);
      if (priorityDiff !== 0) return priorityDiff;

      const distanceA = calculateDistance(removedPub.zip, a.zip).mileage;
      const distanceB = calculateDistance(removedPub.zip, b.zip).mileage;
      return distanceA - distanceB;
    })[0];
  };

  const handleRemovePubVisit = (dayDate: string, pubToRemove: string) => {
    setRemovedPubs((prev) => ({
      ...prev,
      [dayDate]: new Set([...(prev[dayDate]?.values() || []), pubToRemove]),
    }));

    updateSchedule((prevSchedule) =>
      prevSchedule.map((day) => {
        if (day.date !== dayDate) return day;

        const pubIndex = day.visits.findIndex(
          (visit) => visit.pub === pubToRemove
        );
        if (pubIndex === -1) return day;

        const removedPub = day.visits[pubIndex];
        const replacementPub = findReplacementPub(dayDate, removedPub);

        let updatedVisits = [...day.visits];
        if (replacementPub) {
          updatedVisits[pubIndex] = replacementPub;
        } else {
          updatedVisits = updatedVisits.filter(
            (visit) => visit.pub !== pubToRemove
          );
        }

        const metrics = recalculateMetrics(updatedVisits, homeAddress);

        return {
          ...day,
          ...metrics,
        };
      })
    );
  };

  const handlePubSelect = useCallback((pub: any) => {
    setSelectedPub(pub);
  }, []);

  const exportToExcel = () => {
    const flatSchedule = schedule.flatMap((day) =>
      day.visits.map((visit, index) => ({
        Date: day.date,
        "From Home":
          index === 0
            ? `${day.startMileage?.toFixed(1)} mi / ${day.startDriveTime} mins`
            : "",
        "Pub Name": visit.pub,
        "Post Code": visit.zip,
        "Last Visited": formatDate(visit.last_visited),
        Priority:
          visit.listType === "wins"
            ? "Recent Win"
            : visit.listType === "hitlist"
            ? "Hit List"
            : visit.listType === "unvisited"
            ? "Unvisited"
            : "Masterhouse",
        RTM: visit.rtm || "",
        Landlord: visit.landlord || "",
        Notes: visit.notes || "",
        "To Next":
          index === day.visits.length - 1
            ? `To Home: ${day.endMileage?.toFixed(1)} mi / ${
                day.endDriveTime
              } mins`
            : visit.mileageToNext
            ? `${visit.mileageToNext.toFixed(1)} mi / ${
                visit.driveTimeToNext
              } mins`
            : "End of day",
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(flatSchedule);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Visit Schedule");

    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 20 },
      { wch: 30 },
      { wch: 10 },
      { wch: 12 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 50 },
      { wch: 20 },
    ];

    const fileName = `visit_schedule_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleDesiredEndTimeChange = (date: string, time: string) => {
    setDesiredEndTimes((prev) => ({ ...prev, [date]: time }));

    // Update schedule with new end time
    updateSchedule((prevSchedule) =>
      prevSchedule.map((day) => {
        if (day.date !== date) return day;

        // Recalculate metrics with new end time
        const metrics = recalculateMetrics(day.visits, homeAddress, time);

        return {
          ...day,
          ...metrics,
        };
      })
    );
  };

  const renderDaySchedule = (day: EnhancedScheduleDay, dayIndex: number) => {
    const handleVisitSchedule = (
      visitId: string,
      time: string,
      notes: string
    ) => {
      console.log("handleVisitSchedule called", { visitId, time, notes });
      updateSchedule((prevSchedule: ScheduleDay[]) => {
        if (!prevSchedule) {
          console.warn("No previous schedule available");
          return prevSchedule;
        }
        return prevSchedule.map((d: ScheduleDay) => {
          if (d.date !== day.date) return d;
          console.log("Updating visits for day", d.date);
          return {
            ...d,
            visits: d.visits.map((v: Visit) => {
              if (v.pub !== visitId) return v;
              console.log("Updating visit", { pub: v.pub, newTime: time });
              return {
                ...v,
                scheduledTime: time,
                visitNotes: notes,
              };
            }),
          };
        });
      });
    };

    const isExpanded = expandedDays[day.date];
    const hasWarnings =
      day.visits.length < visitsPerDay ||
      (day.schedulingErrors?.length ?? 0) > 0;

    const renderSchedulingErrors = () => {
      if (!day.schedulingErrors?.length) return null;
      return (
        <div className="mt-2 p-2 rounded-lg bg-red-900/20 border border-red-700/50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              {day.schedulingErrors.map((error, index) => (
                <p key={index} className="text-xs text-red-200">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div
        key={day.date}
        className={clsx(
          "bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 rounded-lg p-4 sm:p-6 transition-all duration-300",
          {
            "border border-amber-500/20": hasWarnings && !isExpanded,
            "border-2 border-neon-purple/30": isExpanded,
            "border border-eggplant-700/30": !hasWarnings && !isExpanded,
          }
        )}
      >
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleDay(day.date)}
          onKeyPress={(e) => handleKeyPress(e, day.date)}
          tabIndex={0}
          role="button"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-neon-blue mr-2" />
            <h3 className="font-medium text-eggplant-100">{day.date}</h3>
            {day.visits.length < visitsPerDay && (
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div className="ml-2 p-1 rounded-full bg-yellow-900/20 border border-yellow-700/50 cursor-help">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    </div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-dark-800 text-eggplant-100 px-4 py-3 rounded-lg text-sm shadow-lg max-w-md"
                      sideOffset={5}
                    >
                      <h4 className="font-medium text-yellow-400 mb-2">
                        Insufficient Visits
                      </h4>
                      <p className="text-yellow-200">
                        Only {day.visits.length} visits scheduled for this day
                        (target: {visitsPerDay})
                      </p>
                      <div className="mt-3 pt-2 border-t border-eggplant-800/50">
                        <p className="text-xs text-eggplant-300">
                          Consider adding more visits from nearby pubs to
                          optimize your schedule.
                        </p>
                      </div>
                      <Tooltip.Arrow className="fill-dark-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            )}
            {day.visits.some((v) => v.scheduledTime || v.visitNotes) && (
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div className="ml-2 p-1 rounded-full bg-green-900/20 border border-green-700/50 cursor-help">
                      <Clock className="h-4 w-4 text-green-400" />
                    </div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-dark-800 text-eggplant-100 px-4 py-3 rounded-lg text-sm shadow-lg max-w-md"
                      sideOffset={5}
                    >
                      <h4 className="font-medium text-green-400 mb-2">
                        Scheduled Visits
                      </h4>
                      <div className="space-y-2">
                        {day.visits.map(
                          (visit, i) =>
                            visit.scheduledTime && (
                              <div key={i} className="flex items-start gap-2">
                                <Clock className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-green-200">{visit.pub}</p>
                                  <p className="text-xs text-eggplant-300">
                                    {visit.scheduledTime}{" "}
                                    {visit.visitNotes &&
                                      `- ${visit.visitNotes}`}
                                  </p>
                                </div>
                              </div>
                            )
                        )}
                      </div>
                      <Tooltip.Arrow className="fill-dark-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            )}
            {renderSchedulingErrors()}
          </div>

          <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center text-sm text-eggplant-100">
              <MapPin className="h-4 w-4 mr-1 text-neon-pink" />
              <span className="hidden sm:inline">
                {day.totalMileage?.toFixed(1)} miles
              </span>
              <span className="sm:hidden">
                {day.totalMileage?.toFixed(1)}mi
              </span>
            </div>

            <div className="flex items-center text-sm text-eggplant-100">
              <Clock className="h-4 w-4 mr-1 text-neon-purple" />
              <span>{day.totalDriveTime}m</span>
            </div>

            <div className="flex items-center space-x-2">
              <RescheduleDialog
                day={day}
                onReschedule={(newSchedule) => {
                  updateSchedule((prevSchedule) =>
                    prevSchedule.map((d) =>
                      d.date === day.date ? newSchedule : d
                    )
                  );
                }}
              />

              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDay(day.date);
                      }}
                      className={`
                            p-2 rounded-full transition-all duration-300
                            text-red-400 opacity-0 group-hover:opacity-100
                            hover:bg-red-900/20 hover:text-red-300
                          `}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg"
                      sideOffset={5}
                    >
                      Delete this day
                      <Tooltip.Arrow className="fill-dark-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>

              <button
                className={clsx(
                  "p-2 rounded-full transition-all duration-300",
                  "hover:bg-eggplant-700/50 text-neon-blue hover:text-neon-purple",
                  "focus:outline-none focus:ring-2 focus:ring-neon-purple focus:ring-opacity-50"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDay(day.date);
                }}
                aria-label={
                  expandedDays[day.date] ? "Collapse day" : "Expand day"
                }
              >
                {expandedDays[day.date] ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            <DriveTimeBar
              visits={day.visits}
              totalDriveTime={day.totalDriveTime}
              startDriveTime={day.startDriveTime}
              endDriveTime={day.endDriveTime}
              targetVisitsPerDay={visitsPerDay}
              desiredEndTime={desiredEndTimes[day.date]}
              onDesiredEndTimeChange={(time) =>
                handleDesiredEndTimeChange(day.date, time)
              }
            />
            {renderSchedulingErrors()}
            <div className="p-4 bg-dark-900/95 backdrop-blur-sm overflow-x-auto">
              <table className="min-w-full divide-y divide-eggplant-800/30">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">
                      Travel Info
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">
                      Pub
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">
                      Post Code
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">
                      Opening Hours
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">
                      Last Visited
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">
                      RTM
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">
                      Landlord
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-eggplant-800/30">
                  {(() => {
                    const { schedule } = getScheduleTimes(
                      day.visits,
                      "09:00",
                      desiredEndTimes[day.date]
                    );
                    // Sort visits based on their scheduled/arrival times
                    const sortedVisits = [...day.visits].sort((a, b) => {
                      const aInfo = schedule.find(
                        (s: ScheduleEntry) => s.pub === a.pub
                      );
                      const bInfo = schedule.find(
                        (s: ScheduleEntry) => s.pub === b.pub
                      );
                      if (!aInfo || !bInfo) return 0;
                      return aInfo.arrival.getTime() - bInfo.arrival.getTime();
                    });

                    return sortedVisits.map((visit) => {
                      const hoursKey = `${visit.pub}-${visit.zip}`;
                      const hoursData = openingHours[hoursKey];
                      const visitInfo = schedule.find(
                        (s: ScheduleEntry) => s.pub === visit.pub
                      );
                      const visitIndex = day.visits.indexOf(visit);

                      const travelInfo =
                        visitIndex === 0
                          ? `From Home: ${day.startMileage?.toFixed(1)} mi / ${
                              day.startDriveTime
                            } mins`
                          : visitIndex === day.visits.length - 1
                          ? `To Home: ${day.endMileage?.toFixed(1)} mi / ${
                              day.endDriveTime
                            } mins`
                          : visit.mileageToNext
                          ? `Next: ${visit.mileageToNext.toFixed(1)} mi / ${
                              visit.driveTimeToNext
                            } mins`
                          : "End of day";

                      return (
                        <tr
                          key={`visit-${day.date}-${visit.pub}-${visit.zip}-${visitIndex}-${dayIndex}`}
                          className={clsx(
                            "hover:bg-eggplant-800/20 transition-colors group cursor-pointer",
                            selectedPub?.pub === visit.pub &&
                              "bg-eggplant-800/30",
                            visitInfo &&
                              isOutsideBusinessHours(visitInfo.arrival) &&
                              "border-l-2 border-l-amber-400"
                          )}
                          onClick={() => handlePubSelect(visit)}
                        >
                          <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">
                            <div className="flex items-center gap-2">
                              <div
                                className={clsx(
                                  visitInfo &&
                                    isOutsideBusinessHours(visitInfo.arrival) &&
                                    "text-amber-400"
                                )}
                              >
                                {visitInfo
                                  ? format(visitInfo.arrival, "HH:mm")
                                  : "--:--"}
                                {visitInfo &&
                                  isOutsideBusinessHours(visitInfo.arrival) && (
                                    <Tooltip.Provider>
                                      <Tooltip.Root>
                                        <Tooltip.Trigger asChild>
                                          <AlertTriangle className="h-4 w-4 ml-1 inline-block" />
                                        </Tooltip.Trigger>
                                        <Tooltip.Portal>
                                          <Tooltip.Content
                                            className="bg-dark-800 text-amber-200 px-3 py-2 rounded-lg text-sm shadow-lg"
                                            sideOffset={5}
                                          >
                                            Visit scheduled outside business
                                            hours (9 AM - 5 PM)
                                            <Tooltip.Arrow className="fill-dark-800" />
                                          </Tooltip.Content>
                                        </Tooltip.Portal>
                                      </Tooltip.Root>
                                    </Tooltip.Provider>
                                  )}
                              </div>
                              <span>{travelInfo}</span>
                              <VisitScheduler
                                key={`scheduler-${day.date}-${visit.pub}-${visitIndex}-${dayIndex}`}
                                visit={visit}
                                date={day.date}
                                onSchedule={handleVisitSchedule}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-eggplant-100 relative">
                            <div className="flex items-center justify-between">
                              <span>{visit.pub}</span>
                              <RemovePubDialog
                                visit={visit}
                                onConfirm={() =>
                                  handleRemovePubVisit(day.date, visit.pub)
                                }
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">
                            {visit.zip}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getPriorityStyles(
                                visit.Priority
                              )}`}
                            >
                              {visit.Priority}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <OpeningHoursIndicator
                              pub={visit.pub}
                              postcode={visit.zip}
                            />
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">
                            {formatDate(visit.last_visited)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">
                            {visit.rtm || "-"}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">
                            {visit.landlord || "-"}
                          </td>
                          <td className="px-4 py-2 text-eggplant-100 max-w-xs truncate">
                            {visit.notes || "-"}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 bg-dark-900/95">
              <div className="flex gap-4">
                <div className="flex-1">
                  <RouteMap
                    day={day}
                    homeAddress={homeAddress}
                    className="animated-border h-[400px]"
                  />
                </div>
                <UnscheduledPubsPanel
                  pubs={userFiles.pubs}
                  selectedPub={selectedPub}
                  scheduledPubs={day.visits}
                  onScheduleAnyway={(pub) => {
                    const daySchedule = schedule.find(
                      (d) => d.date === day.date
                    );
                    if (!daySchedule) return false;

                    // Check if pub is already scheduled
                    if (daySchedule.visits.some((v) => v.pub === pub.pub)) {
                      return false;
                    }

                    // Calculate metrics for the new visit
                    const updatedVisits = [...daySchedule.visits];
                    const lastVisit = updatedVisits[updatedVisits.length - 1];
                    let totalMileage = daySchedule.totalMileage || 0;
                    let totalDriveTime = daySchedule.totalDriveTime || 0;

                    if (updatedVisits.length === 0) {
                      const { mileage, driveTime } = calculateDistance(
                        homeAddress,
                        pub.zip
                      );
                      totalMileage = mileage;
                      totalDriveTime = driveTime;
                    } else {
                      const { mileage, driveTime } = calculateDistance(
                        lastVisit.zip,
                        pub.zip
                      );
                      lastVisit.mileageToNext = mileage;
                      lastVisit.driveTimeToNext = driveTime;
                      totalMileage += mileage;
                      totalDriveTime += driveTime;
                    }

                    const {
                      mileage: mileageToHome,
                      driveTime: driveTimeToHome,
                    } = calculateDistance(pub.zip, homeAddress);

                    const newVisit = {
                      ...pub,
                      Priority: pub.Priority || "Unvisited",
                      mileageToNext: 0,
                      driveTimeToNext: 0,
                    } satisfies ScheduleVisit;

                    updatedVisits.push(newVisit);
                    totalMileage += mileageToHome;
                    totalDriveTime += driveTimeToHome;

                    updateSchedule((prevSchedule) =>
                      prevSchedule.map((d) => {
                        if (d.date !== day.date) return d;
                        return {
                          ...d,
                          visits: updatedVisits,
                          totalMileage,
                          totalDriveTime,
                          endMileage: mileageToHome,
                          endDriveTime: driveTimeToHome,
                        };
                      })
                    );
                    return true;
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (schedule.length === 0) {
    return (
      <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg shadow-md p-8 text-center">
        <h3 className="text-xl font-semibold mb-4 text-eggplant-100">
          Ready to Plan Your Journey?
        </h3>
        <p className="text-eggplant-100 mb-2">
          Start by uploading your pub lists and configuring your schedule
          settings.
        </p>
        <p className="text-eggplant-200 text-sm">
          We'll help you create an optimized visit schedule with drive times and
          route information.
        </p>
      </div>
    );
  }

  return (
    <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent">
          Visit Schedule
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadICSFile(schedule)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-neon-purple text-white hover:bg-neon-purple/90 transition-colors"
          >
            <Calendar className="h-4 w-4" />
            Export Calendar
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:opacity-90 transition-opacity"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {schedule.map((day, index) =>
          renderDaySchedule(day as EnhancedScheduleDay, index)
        )}
      </div>
    </div>
  );
};

export default ScheduleDisplay;
