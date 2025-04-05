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
  Users,
} from "lucide-react";
import {
  usePubData,
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
  formatDuration,
  Duration,
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
import { Visit, EnhancedScheduleDay } from "../types";

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

interface ScheduleVisit extends Pub {
  driveTimeToNext?: number;
  scheduledTime?: string;
  arrival?: Date;
  departure?: Date;
  Priority: string;
}

interface Visit extends Pub {
  driveTimeToNext?: number;
  scheduledTime?: string;
  arrival?: Date;
  departure?: Date;
  Priority: string;
}

interface ScheduleEntry {
  pub: string;
  arrival: Date;
  departure: Date;
  driveTime: number;
  isScheduled: boolean;
}

interface BusinessHours {
  openTime: string;
  closeTime: string;
}

interface ScheduleVisit {
  pub: string;
  arrival: Date;
  departure: Date;
  businessHours: BusinessHours;
}

interface ScheduleDay {
  date: string;
  visits: Visit[];
  totalDriveTime: number;
  totalMileage: number;
  startDriveTime: number;
  endDriveTime: number;
  schedulingErrors?: string[];
}

interface EnhancedScheduleDay extends ScheduleDay {
  totalMileage?: number;
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

  // First: Sort visits by their scheduled times
  const sortedVisits = [...visits].sort((a, b) => {
    if (!a.scheduledTime || a.scheduledTime === "Anytime") return 1;
    if (!b.scheduledTime || b.scheduledTime === "Anytime") return -1;

    const [aHours, aMinutes] = a.scheduledTime.split(":").map(Number);
    const [bHours, bMinutes] = b.scheduledTime.split(":").map(Number);
    return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
  });

  // Initialize schedule array with all visits
  const schedule: ScheduleEntry[] = sortedVisits.map((visit) => ({
    pub: visit.pub,
    arrival: dayStart,
    departure: addMinutes(dayStart, averageVisitTime),
    driveTime: visit.driveTimeToNext || minDriveTime,
    isScheduled:
      Boolean(visit.scheduledTime) && visit.scheduledTime !== "Anytime",
  }));

  // First pass: Schedule fixed appointments
  const scheduledVisits = sortedVisits.filter(
    (v): v is Visit & Required<Pick<Visit, "scheduledTime">> =>
      Boolean(v.scheduledTime) && v.scheduledTime !== "Anytime"
  );

  for (const visit of scheduledVisits) {
    const index = sortedVisits.findIndex((v) => v.pub === visit.pub);
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

  // Second pass: Schedule unscheduled and flexible visits in available time slots
  let currentTime = dayStart;
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i].isScheduled) {
      // For scheduled visits, update currentTime to after this visit
      currentTime = addMinutes(
        schedule[i].departure,
        schedule[i].driveTime || minDriveTime
      );
      continue;
    }

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

  console.log(
    "Calculated schedule:",
    schedule.map((s) => ({
      pub: s.pub,
      arrival: format(s.arrival, "HH:mm"),
      isScheduled: s.isScheduled,
      scheduledTime: sortedVisits.find((v) => v.pub === s.pub)?.scheduledTime,
    }))
  );

  return { schedule };
};

const isOutsideBusinessHours = (time: Date | string): boolean => {
  try {
    let hours: number;
    let minutes: number;

    if (time instanceof Date) {
      hours = time.getHours();
      minutes = time.getMinutes();
    } else {
      [hours, minutes] = time.split(":").map(Number);
    }

    const totalMinutes = hours * 60 + minutes;
    return totalMinutes < 9 * 60 || totalMinutes >= 17 * 60;
  } catch (error) {
    console.warn("Time validation error:", error);
    return true;
  }
};

interface DriveTimeBarProps {
  visits: Pub[];
  totalDriveTime: number;
  startDriveTime: string;
  endDriveTime: string;
  targetVisitsPerDay: number;
  desiredEndTime?: string;
  onDesiredEndTimeChange: (time: string) => void;
}

const ScheduleDisplay: React.FC = () => {
  const {
    schedule: contextSchedule,
    setSchedule: setContextSchedule,
    userFiles,
    homeAddress,
    visitsPerDay,
    selectedVehicle,
    selectedVehicleColor,
    setSelectedVehicle,
    setSelectedVehicleColor,
    selectedDate,
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
  const [totalDriveTime] = useState<Duration>({ minutes: 480 }); // 8 hours

  // Convert context schedule to our local type
  const schedule = contextSchedule.map((day) => ({
    date: day.date || "",
    visits: (day.visits || []).map((visit) => ({
      ...visit,
      Priority: visit.Priority || "Unscheduled",
    })),
    totalDriveTime: day.totalDriveTime || 0,
    totalMileage: day.totalMileage || 0,
    startDriveTime:
      typeof day.startDriveTime === "number" ? day.startDriveTime : 0,
    endDriveTime: typeof day.endDriveTime === "number" ? day.endDriveTime : 0,
    schedulingErrors: day.schedulingErrors,
  }));

  const updateSchedule = (updater: (prev: ScheduleDay[]) => ScheduleDay[]) => {
    const updatedSchedule = updater(schedule);
    // Convert back to context schedule type when updating
    setContextSchedule(
      updatedSchedule.map((day) => ({
        ...day,
        date: day.date,
        visits: day.visits,
      }))
    );
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

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, date: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleDay(date);
    }
  };

  const handleDeleteDay = (date: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this day from the schedule?"
      )
    ) {
      updateSchedule((prevSchedule) =>
        prevSchedule.filter((day) => day.date !== date)
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

    updateSchedule((prevSchedule) =>
      prevSchedule.map((day) => {
        if (!day.date || day.date !== date) return day;

        const metrics = recalculateMetrics(day.visits || [], homeAddress, time);
        return {
          ...day,
          ...metrics,
        } as ScheduleDay;
      })
    );
  };

  const handleVisitSchedule = (
    date: string,
    visitId: string,
    time: string,
    notes?: string
  ) => {
    console.log("Scheduling visit:", { date, visitId, time, notes });

    updateSchedule((prevSchedule) =>
      prevSchedule.map((day) => {
        if (!day.date || day.date !== date) return day;
        const visits = day.visits || [];

        // Update the visit's scheduled time and notes
        const updatedVisits = visits.map((visit) =>
          visit.pub === visitId
            ? {
                ...visit,
                scheduledTime: time,
                visitNotes: notes || visit.visitNotes,
              }
            : visit
        );

        // Get optimized schedule times
        const { schedule: updatedTimes } = getScheduleTimes(
          updatedVisits,
          "09:00",
          desiredEndTimes[date]
        );

        // Update arrival and departure times for each visit
        let finalVisits = updatedVisits.map((visit, index) => {
          const scheduleInfo = updatedTimes[index];
          return {
            ...visit,
            arrival: scheduleInfo.arrival,
            departure: scheduleInfo.departure,
          };
        });

        // Sort visits by their actual times (scheduled or arrival)
        finalVisits = finalVisits.sort((a, b) => {
          // Helper function to get the effective time for sorting
          const getEffectiveTime = (visit: Visit) => {
            if (visit.scheduledTime && visit.scheduledTime !== "Anytime") {
              const [hours, minutes] = visit.scheduledTime
                .split(":")
                .map(Number);
              const date = new Date();
              date.setHours(hours, minutes, 0, 0);
              return date;
            }
            return visit.arrival || new Date(0);
          };

          const timeA = getEffectiveTime(a);
          const timeB = getEffectiveTime(b);
          return timeA.getTime() - timeB.getTime();
        });

        // Recalculate metrics after sorting
        const metrics = recalculateMetrics(
          finalVisits,
          homeAddress,
          desiredEndTimes[date]
        );

        console.log("Updated schedule:", {
          visits: finalVisits.map((v) => ({
            pub: v.pub,
            scheduledTime: v.scheduledTime,
            arrival: v.arrival ? format(v.arrival, "HH:mm") : null,
            effectiveTime:
              v.scheduledTime ||
              (v.arrival ? format(v.arrival, "HH:mm") : "No time"),
          })),
        });

        return {
          ...day,
          visits: finalVisits,
          ...metrics,
        };
      })
    );
  };

  const renderDaySchedule = (day: ScheduleDay, dayIndex: number) => {
    const isExpanded = expandedDays[day.date || ""];
    const visits = day.visits || [];
    const hasWarnings =
      visits.length < visitsPerDay ||
      (day.schedulingErrors?.length ?? 0) > 0 ||
      visits.some((v) => v.arrival && isOutsideBusinessHours(v.arrival));

    // Convert drive times to numbers for DriveTimeBar
    const startDriveTimeMinutes = parseInt(day.startDriveTime || "0", 10);
    const endDriveTimeMinutes = parseInt(day.endDriveTime || "0", 10);

    return (
      <div
        key={day.date}
        className={clsx(
          "bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 rounded-lg p-4 sm:p-6 transition-all duration-300 mb-4",
          {
            "border border-amber-500/20": hasWarnings && !isExpanded,
            "border-2 border-neon-purple/30": isExpanded,
            "border border-eggplant-700/30": !hasWarnings && !isExpanded,
          }
        )}
      >
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleDay(day.date || "")}
          onKeyPress={(e) => handleKeyPress(e, day.date || "")}
          tabIndex={0}
          role="button"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-neon-blue mr-2" />
              <h3 className="font-medium text-eggplant-100">
                {day.date
                  ? format(new Date(day.date), "EEEE, MMMM d, yyyy")
                  : "No date"}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center text-sm text-eggplant-100">
                <MapPin className="h-4 w-4 mr-1 text-neon-pink" />
                <span>{day.totalMileage?.toFixed(1)} miles</span>
              </div>
              <div className="flex items-center text-sm text-eggplant-100">
                <Clock className="h-4 w-4 mr-1 text-neon-purple" />
                <span>{day.totalDriveTime}m drive time</span>
              </div>
              <div className="flex items-center text-sm text-eggplant-100">
                <Users className="h-4 w-4 mr-1 text-neon-blue" />
                <span>
                  {visits.length}/{visitsPerDay} visits
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasWarnings && (
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div className="p-1 rounded-full bg-yellow-900/20 border border-yellow-700/50">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    </div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-dark-800 text-eggplant-100 px-4 py-3 rounded-lg text-sm shadow-lg"
                      sideOffset={5}
                    >
                      <h4 className="font-medium text-yellow-400 mb-2">
                        Schedule Warnings
                      </h4>
                      {visits.length < visitsPerDay && (
                        <p className="text-yellow-200 mb-2">
                          Only {visits.length} visits scheduled (target:{" "}
                          {visitsPerDay})
                        </p>
                      )}
                      {visits.some(
                        (v) => v.arrival && isOutsideBusinessHours(v.arrival)
                      ) && (
                        <p className="text-yellow-200 mb-2">
                          Some visits are scheduled outside business hours (9 AM
                          - 5 PM)
                        </p>
                      )}
                      {day.schedulingErrors?.map((error, i) => (
                        <p key={i} className="text-yellow-200">
                          {error}
                        </p>
                      ))}
                      <Tooltip.Arrow className="fill-dark-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteDay(day.date || "");
              }}
              className="p-2 rounded-full transition-colors hover:bg-red-900/20 text-red-400 hover:text-red-300"
              title="Delete day"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              className={clsx(
                "p-2 rounded-full transition-colors",
                "hover:bg-eggplant-700/50 text-neon-blue hover:text-neon-purple"
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleDay(day.date || "");
              }}
              aria-label={isExpanded ? "Collapse day" : "Expand day"}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            <DriveTimeBar
              visits={visits}
              totalDriveTime={day.totalDriveTime || 0}
              startDriveTime={startDriveTimeMinutes}
              endDriveTime={endDriveTimeMinutes}
              targetVisitsPerDay={visitsPerDay}
              desiredEndTime={desiredEndTimes[day.date || ""]}
              onDesiredEndTimeChange={(time) =>
                handleDesiredEndTimeChange(day.date || "", time)
              }
            />
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-eggplant-800/30">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">
                      Time
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
                      Drive Time
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-eggplant-800/30">
                  {visits.map((visit, visitIndex) => (
                    <tr key={`${visit.pub}-${visitIndex}`}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            {visit.scheduledTime && (
                              <span
                                className={clsx(
                                  "text-xs",
                                  visit.scheduledTime === "Anytime"
                                    ? "text-blue-400"
                                    : isOutsideBusinessHours(
                                        visit.scheduledTime
                                      )
                                    ? "text-red-400"
                                    : "text-green-400"
                                )}
                              >
                                Scheduled:{" "}
                                {visit.scheduledTime === "Anytime"
                                  ? "Flexible"
                                  : visit.scheduledTime}
                                {visit.scheduledTime !== "Anytime" &&
                                  isOutsideBusinessHours(visit.scheduledTime) &&
                                  " ⚠️"}
                              </span>
                            )}
                            <span
                              className={clsx(
                                "text-eggplant-100",
                                visit.scheduledTime &&
                                  !isOutsideBusinessHours(
                                    visit.scheduledTime
                                  ) &&
                                  "text-green-200",
                                visit.scheduledTime &&
                                  isOutsideBusinessHours(visit.scheduledTime) &&
                                  "text-red-200",
                                !visit.scheduledTime &&
                                  visit.arrival &&
                                  !isOutsideBusinessHours(visit.arrival) &&
                                  "text-blue-200",
                                !visit.scheduledTime &&
                                  visit.arrival &&
                                  isOutsideBusinessHours(visit.arrival) &&
                                  "text-orange-200"
                              )}
                            >
                              {visit.arrival
                                ? format(visit.arrival, "HH:mm")
                                : visit.scheduledTime
                                ? visit.scheduledTime
                                : "Not scheduled"}
                            </span>
                          </div>
                          <VisitScheduler
                            visit={{
                              ...visit,
                              scheduledTime:
                                visit.scheduledTime ||
                                (visit.arrival
                                  ? format(visit.arrival, "HH:mm")
                                  : undefined),
                            }}
                            date={day.date || ""}
                            onSchedule={handleVisitSchedule}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">
                        <div className="flex items-center justify-between">
                          <span>{visit.pub}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">
                        {visit.zip}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getPriorityStyles(
                            visit.Priority || ""
                          )}`}
                        >
                          {visit.Priority}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">
                        {visit.driveTimeToNext
                          ? `${visit.driveTimeToNext}m`
                          : "-"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <RemovePubDialog
                            visit={visit}
                            onConfirm={() =>
                              handleRemovePubVisit(day.date || "", visit.pub)
                            }
                          />
                          <RescheduleDialog
                            day={day}
                            visit={visit}
                            onReschedule={(newSchedule) => {
                              updateSchedule((prevSchedule) =>
                                prevSchedule.map((d) =>
                                  d.date === day.date ? newSchedule : d
                                )
                              );
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <RouteMap
                day={day}
                homeAddress={homeAddress}
                className="h-[400px] rounded-lg animated-border"
              />
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
    <div className="w-full p-4 rounded-lg bg-opacity-20 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-white text-xl font-semibold">
          {format(selectedDate || new Date(), "yyyy-MM-dd")}
        </div>
        <div className="text-white text-sm">
          Total drive time: {formatDuration(totalDriveTime)}
        </div>
      </div>

      <div className="space-y-4">
        {(schedule || []).map((day, index) => renderDaySchedule(day, index))}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => downloadICSFile(schedule)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-white text-purple-900 hover:bg-white/90 transition-colors"
        >
          <Calendar className="h-4 w-4" />
          Export Calendar
        </button>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-white text-purple-900 hover:bg-white/90 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export Excel
        </button>
      </div>
    </div>
  );
};

export default ScheduleDisplay;
