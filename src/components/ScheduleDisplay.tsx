import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Trash2,
  Users,
  RefreshCw,
  X,
} from "lucide-react";
import {
  usePubData,
} from "../context/PubDataContext";
import * as XLSX from "xlsx-js-style";
import {
  format,
  parseISO,
  isValid,
  addMinutes,
  formatDuration,
  Duration,
} from "date-fns";
import { downloadICSFile } from "../utils/calendarUtils";
import * as Tooltip from "@radix-ui/react-tooltip";
import clsx from "clsx";
import { toArray } from "../utils/typeGuards";
import {
  calculateDistance,
} from "../utils/scheduleUtils";
import RouteMap from "./RouteMap";
import VisitScheduler from "./VisitScheduler";
import DriveTimeBar from "./DriveTimeBar";
import { SourceChips } from "./SourceChips";
import { OriginalValues } from "./OriginalValues";
import { SourceListChips } from "./SourceListChips";
import { collectSources } from "../utils/lineageMerge";
import { checkPubOpeningHours } from "../utils/openingHours";
import {
  Visit,
  ScheduleDay,
  OpeningHoursMap,
} from "../types";



// Helper function to get proper priority display
const getPriorityDisplay = (visit: Visit) => {
  // Check if we have effective plan with priority info
  if (visit.effectivePlan) {
    if (visit.effectivePlan.deadline) {
      return `Visit by ${visit.effectivePlan.deadline}`;
    }
    if (visit.effectivePlan.priorityLevel) {
      return `Priority ${visit.effectivePlan.priorityLevel}`;
    }
    if (visit.effectivePlan.followUpDays) {
      return `Follow-up ${visit.effectivePlan.followUpDays}d`;
    }
  }
  
  // Fallback to legacy priority field
  if (visit.priorityLevel) {
    return `Priority ${visit.priorityLevel}`;
  }
  if (visit.deadline) {
    return `Visit by ${visit.deadline}`;
  }
  if (visit.followUpDays) {
    return `Follow-up ${visit.followUpDays}d`;
  }
  
  // Default fallback
  return visit.Priority || "No priority";
};

// Helper function to get RTM display
const getRTMDisplay = (visit: Visit) => {
  // Check if we have RTM in merged extras
  if (visit.mergedExtras?.rtm && visit.mergedExtras.rtm.length > 0) {
    // Show the first RTM value (could be enhanced to show all)
    return visit.mergedExtras.rtm[0].value;
  }
  
  // Fallback to direct RTM field
  return visit.rtm || "—";
};

// Helper function to format priority label
function formatPriorityLabel(v: Visit): string {
  if (v.schedulingMode === 'priority' && v.priorityLevel) return `Priority ${v.priorityLevel}`;
  if (v.schedulingMode === 'deadline' && v.deadline) return `Visit by ${format(parseISO(v.deadline), 'yyyy-MM-dd')}`;
  if (v.schedulingMode === 'followup' && v.followUpDays != null) return `Follow-up in ${v.followUpDays}d`;
  return 'Masterfile';
}

// const vehicleIcons: Record<VehicleType, LucideIcon | React.FC<any>> = {
//   car: Car,
//   truck: Truck,
//   bike: Bike,
//   bus: Bus,
//   train: Train,
//   plane: Plane,
//   boat: Anchor,
//   fairy: FairyIcon,
// };

// const vehicleColors: Record<VehicleColor, string> = {
//   purple: "text-neon-purple",
//   blue: "text-neon-blue",
//   pink: "text-neon-pink",
//   green: "text-emerald-400",
//   orange: "text-orange-400",
//   yellow: "text-yellow-400",
// };

const getPriorityStyles = (priority: string): string => {
  // Handle new priority display format
  if (priority.startsWith("Priority ")) {
    const level = priority.split(" ")[1];
    switch (level) {
      case "1":
        return "bg-red-900/20 text-red-200 border border-red-700/50";
      case "2":
        return "bg-orange-900/20 text-orange-200 border border-orange-700/50";
      case "3":
        return "bg-yellow-900/20 text-yellow-200 border border-yellow-700/50";
      default:
        return "bg-blue-900/20 text-blue-200 border border-blue-700/50";
    }
  }
  
  if (priority.startsWith("Visit by ")) {
    return "bg-green-900/20 text-green-200 border border-green-700/50";
  }
  
  if (priority.startsWith("Follow-up ")) {
    return "bg-purple-900/20 text-purple-200 border border-purple-700/50";
  }
  
  if (priority.startsWith("Follow-up in ")) {
    return "bg-purple-900/20 text-purple-200 border border-purple-700/50";
  }
  
  if (priority === "Masterfile") {
    return "bg-gray-900/20 text-gray-200 border border-gray-700/50";
  }
  
  // Handle legacy priority values
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
  // desiredEndTime?: string
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



// const getScheduleTimes = (
//   visits: Visit[],
//   startTime: string,
//   desiredEndTime?: string
// ) => {
//   // Default business hours
//   const defaultStartTime = "09:00";
//   const defaultEndTime = "17:00";

//   // Use provided start time or default to 9 AM
//   const [startHours, startMinutes] = (startTime || defaultStartTime)
//     .split(":")
//     .map(Number);
//   const dayStart = new Date();
//   dayStart.setHours(startHours, startMinutes, 0, 0);

//   // Use provided end time or default to 5 PM
//   let desiredEnd: Date = new Date(dayStart);
//   if (desiredEndTime) {
//     const [endHours, endMinutes] = desiredEndTime.split(":").map(Number);
//     desiredEnd.setHours(endHours, endMinutes, 0, 0);
//   } else {
//     const [defaultEndHours, defaultEndMinutes] = defaultEndTime
//       .split(":")
//       .map(Number);
//     desiredEnd.setHours(defaultEndHours, defaultEndMinutes, 0, 0);
//   }

//   const averageVisitTime = 45; // minutes
//   const minDriveTime = 30; // minimum minutes between visits

//   // First: Sort visits by their scheduled times
//   const sortedVisits = [...visits].sort((a, b) => {
//     if (!a.scheduledTime || a.scheduledTime === "Anytime") return 1;
//     if (!b.scheduledTime || b.scheduledTime === "Anytime") return -1;

//     const [aHours, aMinutes] = a.scheduledTime.split(":").map(Number);
//     const [bHours, bMinutes] = b.scheduledTime.split(":").map(Number);
//     return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
//   });

//   // Initialize schedule array with all visits
//   const schedule: ScheduleEntry[] = sortedVisits.map((visit) => ({
//     pub: visit.pub,
//     arrival: dayStart,
//     departure: addMinutes(dayStart, averageVisitTime),
//     driveTime: visit.driveTimeToNext || minDriveTime,
//     isScheduled:
//       Boolean(visit.scheduledTime) && visit.scheduledTime !== "Anytime",
//   }));

//   // First pass: Schedule fixed appointments
//   const scheduledVisits = sortedVisits.filter(
//     (v): v is Visit & Required<Pick<Visit, "scheduledTime">> =>
//       Boolean(v.scheduledTime) && v.scheduledTime !== "Anytime"
//   );

//   for (const visit of scheduledVisits) {
//     const index = sortedVisits.findIndex((v) => v.pub === visit.pub);
//     if (index === -1) continue;

//     const appointmentTime = parseTimeToDate(visit.scheduledTime);
//     schedule[index] = {
//       pub: visit.pub,
//       arrival: appointmentTime,
//       departure: addMinutes(appointmentTime, averageVisitTime),
//       driveTime: visit.driveTimeToNext || minDriveTime,
//       isScheduled: true,
//     };
//   }

//   // Second pass: Schedule unscheduled and flexible visits in available time slots
//   let currentTime = dayStart;
//   for (let i = 0; i < schedule.length; i++) {
//     if (schedule[i].isScheduled) {
//       // For scheduled visits, update currentTime to after this visit
//       currentTime = addMinutes(
//         schedule[i].departure,
//         schedule[i].driveTime || minDriveTime
//       );
//       continue;
//     }

//     // Find the next scheduled visit (if any)
//     const nextScheduledIndex = schedule.findIndex(
//       (s, idx) => idx > i && s.isScheduled
//     );
//     const nextScheduledTime =
//       nextScheduledIndex !== -1
//         ? schedule[nextScheduledIndex].arrival
//         : desiredEnd;

//     // Calculate available time window
//     const availableMinutes = differenceInMinutes(
//       nextScheduledTime,
//       currentTime
//     );
//     const neededMinutes =
//       averageVisitTime + (schedule[i].driveTime || minDriveTime);

//     if (availableMinutes >= neededMinutes) {
//       // Schedule visit in the available window
//       schedule[i].arrival = currentTime;
//       schedule[i].departure = addMinutes(currentTime, averageVisitTime);
//       currentTime = addMinutes(currentTime, neededMinutes);
//     } else {
//       // Not enough time before next scheduled visit, try after it
//       if (nextScheduledIndex !== -1) {
//         currentTime = addMinutes(
//           schedule[nextScheduledIndex].departure,
//           schedule[nextScheduledIndex].driveTime || minDriveTime
//         );
//         i--; // Retry scheduling this visit in the next available slot
//         }
//       }

//       // If we can't schedule within business hours, show warning
//       if (currentTime > desiredEnd) {
//         console.warn(
//           `Warning: Visit to ${schedule[i].pub} may be scheduled outside business hours`
//         );
//       }
//     }

//     // Final pass: Ensure all visits have calculated times
//     for (let i = 0; i < schedule.length; i++) {
//       if (!schedule[i].arrival || !schedule[i].departure) {
//         const prevVisit = schedule[i - 1];
//         const startTime = prevVisit
//           ? addMinutes(prevVisit.departure, prevVisit.driveTime || minDriveTime)
//           : dayStart;

//         schedule[i].arrival = startTime;
//         schedule[i].departure = addMinutes(startTime, averageVisitTime);
//       }
//     }

//     console.log(
//       "Calculated schedule:",
//       schedule.map((s) => ({
//         pub: s.pub,
//         arrival: format(s.arrival, "HH:mm"),
//         isScheduled: s.isScheduled,
//         scheduledTime: sortedVisits.find((v) => v.pub === s.pub)?.scheduledTime,
//       }))
//     );

//     // return { schedule };
// };

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

// interface DriveTimeBarProps {
//   visits: Pub[];
//   totalDriveTime: number;
//   startDriveTime: number;
//   endDriveTime: number;
//   targetVisitsPerDay: number;
//   desiredEndTime?: string;
//   onDesiredEndTimeChange: (time: string) => void;
// }

const ScheduleDisplay: React.FC = () => {
  const {
    schedule: contextSchedule,
    setSchedule: setContextSchedule,
    userFiles,
    homeAddress,
    visitsPerDay,
    // selectedVehicle,
    // selectedVehicleColor,
    // setSelectedVehicle,
    // setSelectedVehicleColor,
    selectedDate,
  } = usePubData();

  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  // const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [openingHours, setOpeningHours] = useState<OpeningHoursMap>({});

  // const [selectedPub, setSelectedPub] = useState<Visit | null>(null);
  // const [isCustomizing, setIsCustomizing] = useState(false);
  const [desiredEndTimes, setDesiredEndTimes] = useState<
    Record<string, string>
  >({});
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [totalDriveTime] = useState<Duration>({ minutes: 480 }); // 8 hours

  // Convert context schedule to our local type
  const schedule = contextSchedule.map((day) => ({
    date: day.date || "",
    visits: toArray(day.visits).map((visit) => ({
      ...visit,
      Priority: visit.Priority || "Unscheduled",
    })),
    totalDriveTime: day.totalDriveTime || 0,
    totalMileage: day.totalMileage || 0,
    startMileage: day.startMileage || 0,
    startDriveTime:
      typeof day.startDriveTime === "number" ? day.startDriveTime : 0,
    endMileage: day.endMileage || 0,
    endDriveTime: typeof day.endDriveTime === "number" ? day.endDriveTime : 0,
    schedulingErrors: day.schedulingErrors,
  }));

  const updateSchedule = (updater: (prev: any[]) => any[]) => {
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



  // const handleRemovePubVisit = (dayDate: string, pubToRemove: string) => {
  //   setRemovedPubs((prev) => ({
  //     ...prev,
  //     [dayDate]: new Set([...(prev[dayDate]?.values() || []), pubToRemove]),
  //   }));

  //   updateSchedule((prevSchedule) =>
  //     prevSchedule.map((day) => {
  //       if (day.date !== dayDate) return day;

  //       const pubIndex = day.visits.findIndex(
  //         (visit) => visit.pub === pubToRemove
  //       );
  //       if (pubIndex === -1) return day;

  //       const removedPub = day.visits[pubIndex];
  //       const replacementPub = findReplacementPub(dayDate, removedPub);

  //       let updatedVisits = [...day.visits];
  //       if (replacementPub) {
  //         updatedVisits[pubIndex] = replacementPub;
  //       } else {
  //         updatedVisits = updatedVisits.filter(
  //           (visit) => visit.pub !== pubToRemove
  //       );
  //       }

  //       const metrics = recalculateMetrics(updatedVisits, homeAddress);

  //       return {
  //         ...day,
  //         ...metrics,
  //       };
  //     })
  //   );
  // };

  // const handlePubSelect = useCallback((pub: any) => {
  //   setSelectedPub(pub);
  // }, []);

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
        Priority: formatPriorityLabel(visit),
        Lists: (visit.sourceLists || collectSources([visit])).join(', '),
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
      { wch: 25 },
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

        const metrics = recalculateMetrics(day.visits || [], homeAddress);
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

        // Find the visit to update
        const visitIndex = day.visits.findIndex(
          (visit: Visit) => visit.pub === visitId
        );
        if (visitIndex === -1) return day;

        // Create a copy of the visits array
        const updatedVisits = [...day.visits];

        // Update the specific visit with new scheduled time
        updatedVisits[visitIndex] = {
          ...updatedVisits[visitIndex],
          scheduledTime: time,
          visitNotes: notes || updatedVisits[visitIndex].visitNotes,
        };

        // Sort visits based on scheduled times and proximity
        const sortedVisits = [...updatedVisits].sort((a, b) => {
          // If both have scheduled times, sort by time
          if (
            a.scheduledTime &&
            b.scheduledTime &&
            a.scheduledTime !== "Anytime" &&
            b.scheduledTime !== "Anytime"
          ) {
            const [aHours, aMinutes] = a.scheduledTime.split(":").map(Number);
            const [bHours, bMinutes] = b.scheduledTime.split(":").map(Number);
            return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
          }
          // If only one has a scheduled time, it goes first
          if (a.scheduledTime && a.scheduledTime !== "Anytime") return -1;
          if (b.scheduledTime && b.scheduledTime !== "Anytime") return 1;

          // For unscheduled visits, maintain their relative order
          return updatedVisits.indexOf(a) - updatedVisits.indexOf(b);
        });

        // Recalculate metrics with the new order
        const metrics = recalculateMetrics(
          sortedVisits,
          homeAddress
        );

        // Return updated day with all required properties
        return {
          ...day,
          visits: sortedVisits,
          totalMileage: metrics.totalMileage,
          totalDriveTime: metrics.totalDriveTime,
          startDriveTime: metrics.startDriveTime,
          endDriveTime: metrics.endDriveTime,
        };
      })
    );
  };

  const getOptimizedTime = (
    visit: Visit,
    dayIndex: number,
    visits: Visit[],
    startDriveTime: number = 0
  ): Date => {
    const baseTime = new Date();
    baseTime.setHours(9, 0, 0, 0); // Start at 9 AM

    if (dayIndex === 0) {
      // For first visit of the day
      if (visits.indexOf(visit) === 0) {
        return addMinutes(baseTime, startDriveTime);
      }
    }

    // Calculate cumulative time based on previous visits
    const visitIndex = visits.indexOf(visit);
    let currentTime = new Date(baseTime);
    currentTime = addMinutes(currentTime, startDriveTime); // Add initial drive time from home

    for (let i = 0; i < visitIndex; i++) {
      const prevVisit = visits[i];
      // Add visit duration (45 minutes)
      currentTime = addMinutes(currentTime, 45);
      // Add drive time to next visit
      if (prevVisit.driveTimeToNext) {
        currentTime = addMinutes(currentTime, prevVisit.driveTimeToNext);
      } else {
        currentTime = addMinutes(currentTime, 30); // Default 30 minutes if no drive time specified
      }
    }

    return currentTime;
  };

  const handleVisitDelete = async (date: string, visitId: string) => {
    // Remove the visit without replacement
    updateSchedule((prevSchedule) =>
      prevSchedule.map((d) => {
        if (d.date !== date) return d;

        const updatedVisits = d.visits.filter((v: Visit) => v.pub !== visitId);

        // Recalculate metrics
        const metrics = recalculateMetrics(
          updatedVisits,
          homeAddress
        );

        return {
          ...d,
          ...metrics,
          visits: updatedVisits,
        };
      })
    );
  };

  const handleVisitReplace = async (date: string, visitId: string) => {
    // Find a replacement visit based on criteria
    const day = schedule.find((d) => d.date === date);
    if (!day) return;

    const visitToReplace = day.visits.find((v) => v.pub === visitId);
    if (!visitToReplace) return;

    // Get potential replacement visits based on criteria
    const replacementVisits = userFiles.pubs.filter((pub) => {
      // Not already scheduled
      const isNotScheduled = !schedule.some((d) =>
        d.visits.some((v) => v.pub === pub.pub)
      );

      // Within search radius (using postcode matching)
      const isNearby =
        pub.zip.substring(0, 2) === visitToReplace.zip.substring(0, 2);

      // Matches priority level
      const hasSimilarPriority = pub.Priority === visitToReplace.Priority;

      // Consider deadline if exists
      const meetsDeadline =
        !pub.deadline ||
        (pub.deadline && new Date(pub.deadline) > new Date(date));

      return isNotScheduled && isNearby && hasSimilarPriority && meetsDeadline;
    });

    // Sort by last visited date (prioritize ones not visited recently)
    replacementVisits.sort((a, b) => {
      const aDate = a.last_visited ? new Date(a.last_visited) : new Date(0);
      const bDate = b.last_visited ? new Date(b.last_visited) : new Date(0);
      return aDate.getTime() - bDate.getTime();
    });

    if (replacementVisits.length === 0) {
      console.warn("No suitable replacement found");
      return;
    }

    // Update schedule with replacement
    updateSchedule((prevSchedule) =>
      prevSchedule.map((d) => {
        if (d.date !== date) return d;

        const updatedVisits = [...d.visits];
        const visitIndex = updatedVisits.findIndex((v) => v.pub === visitId);

        if (visitIndex !== -1) {
          updatedVisits[visitIndex] = {
            ...replacementVisits[0],
            scheduledTime: visitToReplace.scheduledTime, // Preserve the time slot
            mileageToNext: 0,
            driveTimeToNext: 30,
          };
        }

        // Recalculate metrics
        const metrics = recalculateMetrics(
          updatedVisits,
          homeAddress
        );

        return {
          ...d,
          ...metrics,
          visits: updatedVisits,
        };
      })
    );
  };

  const handleDayRegenerate = async (date: string) => {
    const day = schedule.find((d) => d.date === date);
    if (!day) return;

    // Get the postcode area for this day (from first visit)
    const postcodeArea = day.visits[0]?.zip.substring(0, 2);
    if (!postcodeArea) return;

    // Find all potential visits in this postcode area
    const potentialVisits = userFiles.pubs.filter((pub) => {
      // Match postcode area
      const isInArea = pub.zip.substring(0, 2) === postcodeArea;

      // Not already scheduled
      const isNotScheduled = !schedule.some((d) =>
        d.visits.some((v) => v.pub === pub.pub)
      );

      // Consider deadline if exists
      const meetsDeadline =
        !pub.deadline ||
        (pub.deadline && new Date(pub.deadline) > new Date(date));

      return isInArea && isNotScheduled && meetsDeadline;
    });

    // Sort by priority and last visited date
    potentialVisits.sort((a, b) => {
      // First by priority
      const priorityA = a.priorityLevel || 0;
      const priorityB = b.priorityLevel || 0;
      if (priorityA !== priorityB) return priorityB - priorityA;

      // Then by last visited date
      const aDate = a.last_visited ? new Date(a.last_visited) : new Date(0);
      const bDate = b.last_visited ? new Date(b.last_visited) : new Date(0);
      return aDate.getTime() - bDate.getTime();
    });

    // Take the top N visits based on visitsPerDay
    const newVisits = potentialVisits.slice(0, visitsPerDay).map((visit) => ({
      ...visit,
      Priority: visit.Priority || formatPriorityLabel(visit as any),
      mileageToNext: 0,
      driveTimeToNext: 30,
    }));

    if (newVisits.length === 0) {
      console.warn("No suitable visits found for regeneration");
      return;
    }

    // Update schedule with new visits
    updateSchedule((prevSchedule) =>
      prevSchedule.map((d) => {
        if (d.date !== date) return d;

        // Recalculate metrics
        const metrics = recalculateMetrics(
          newVisits,
          homeAddress
        );

        return {
          ...d,
          ...metrics,
          visits: newVisits,
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
            <div className="flex items-center gap-2 text-sm text-eggplant-100">
              <Clock className="h-4 w-4" />
              <span>End Time:</span>
              <input
                type="time"
                value={desiredEndTimes[day.date || ""] || "17:00"}
                onChange={(e) =>
                  handleDesiredEndTimeChange(day.date || "", e.target.value)
                }
                className="bg-eggplant-800 text-white text-sm rounded px-2 py-1 border border-eggplant-700"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

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
                handleDayRegenerate(day.date || "");
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-eggplant-700 hover:bg-eggplant-600 text-white rounded-md transition-colors"
              title="Regenerate schedule"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </button>

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
                      Lists
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">
                      RTM
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
                  {[...visits]
                    .sort((a, b) => {
                      const getVisitTime = (visit: Visit): number => {
                        if (
                          visit.scheduledTime &&
                          visit.scheduledTime !== "Anytime"
                        ) {
                          const [hours, minutes] = visit.scheduledTime
                            .split(":")
                            .map(Number);
                          return hours * 60 + minutes;
                        }
                        // For unscheduled visits, calculate their optimized time
                        const previousVisits = visits.slice(
                          0,
                          visits.indexOf(visit)
                        );
                        const totalPreviousTime = previousVisits.reduce(
                          (total, prev) => {
                            return total + (prev.driveTimeToNext || 30) + 45; // 45 min visit time
                          },
                          day.startDriveTime || 0
                        ); // Use day.startDriveTime with fallback
                        return 9 * 60 + totalPreviousTime; // Start at 9 AM
                      };

                      return getVisitTime(a) - getVisitTime(b);
                    })
                    .map((visit, visitIndex) => (
                      <tr key={`${visit.pub}-${visitIndex}`}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              {visit.scheduledTime &&
                              visit.scheduledTime !== "Anytime" ? (
                                <>
                                  <span
                                    className={clsx(
                                      "text-xs flex items-center gap-1",
                                      isOutsideBusinessHours(
                                        visit.scheduledTime
                                      )
                                        ? "text-red-400"
                                        : "text-green-400"
                                    )}
                                  >
                                    <Clock className="h-3 w-3" />
                                    Scheduled
                                    {isOutsideBusinessHours(
                                      visit.scheduledTime
                                    ) && " ⚠️"}
                                  </span>
                                  <span
                                    className={clsx(
                                      "text-lg",
                                      isOutsideBusinessHours(
                                        visit.scheduledTime
                                      )
                                        ? "text-red-200"
                                        : "text-green-200"
                                    )}
                                  >
                                    {visit.scheduledTime}
                                  </span>
                                </>
                              ) : visit.scheduledTime === "Anytime" ? (
                                <>
                                  <span className="text-xs text-blue-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Flexible
                                  </span>
                                  <span className="text-lg text-neon-purple">
                                    {format(
                                      getOptimizedTime(
                                        visit,
                                        dayIndex,
                                        visits,
                                        day.startDriveTime || 0
                                      ),
                                      "HH:mm"
                                    )}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-xs text-neon-purple flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Optimized
                                  </span>
                                  <span className="text-lg text-neon-purple">
                                    {format(
                                      getOptimizedTime(
                                        visit,
                                        dayIndex,
                                        visits,
                                        day.startDriveTime || 0
                                      ),
                                      "HH:mm"
                                    )}
                                  </span>
                                </>
                              )}
                            </div>
                            <VisitScheduler
                              visit={visit as any}
                              date={day.date || ""}
                              onSchedule={handleVisitSchedule}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setSelectedVisit(visit)}
                              className="text-left hover:text-neon-purple transition-colors cursor-pointer"
                            >
                              {visit.pub}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">
                          {visit.zip}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getPriorityStyles(
                              formatPriorityLabel(visit)
                            )}`}
                          >
                            {formatPriorityLabel(visit)}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <SourceListChips 
                            sources={visit.sourceLists || collectSources([visit])} 
                            className="text-xs" 
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">
                          {getRTMDisplay(visit)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">
                          {visit.driveTimeToNext
                            ? `${visit.driveTimeToNext}m`
                            : "-"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVisitReplace(day.date || "", visit.pub);
                              }}
                              className="p-1 text-neon-purple hover:text-neon-purple/80 transition-colors"
                              title="Replace visit"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVisitDelete(day.date || "", visit.pub);
                              }}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                              title="Delete visit"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <RouteMap
                route={{
                  visits: visits.map(visit => ({
                    name: visit.pub,
                    address: visit.zip
                  }))
                }}
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
        {schedule.map((day, index) => renderDaySchedule(day, index))}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => downloadICSFile(schedule as any)}
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
      
      {/* Visit Detail Dialog */}
      {selectedVisit && (
        <div className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="w-[min(800px,calc(100vw-32px))] max-h-[90vh] rounded-2xl overflow-hidden bg-eggplant-900 border border-eggplant-700/60 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-eggplant-900 via-eggplant-800 to-neon-purple text-white border-b border-eggplant-700/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Visit Details</h2>
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="p-2 hover:bg-eggplant-800/50 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-medium text-eggplant-100 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-eggplant-300">Pub Name:</span>
                      <div className="text-eggplant-100 font-medium">{selectedVisit.pub}</div>
                    </div>
                    <div>
                      <span className="text-eggplant-300">Postcode:</span>
                      <div className="text-eggplant-100 font-medium">{selectedVisit.zip}</div>
                    </div>
                    <div>
                      <span className="text-eggplant-300">Priority:</span>
                      <div className="text-eggplant-100 font-medium">{getPriorityDisplay(selectedVisit)}</div>
                    </div>
                    <div>
                      <span className="text-eggplant-300">RTM:</span>
                      <div className="text-eggplant-100 font-medium">{getRTMDisplay(selectedVisit)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Source Lists */}
                <div>
                  <h3 className="text-lg font-medium text-eggplant-100 mb-3">Source Lists</h3>
                  <SourceChips pub={selectedVisit} />
                </div>
                
                {/* Original Values */}
                <div>
                  <h3 className="text-lg font-medium text-eggplant-100 mb-3">Original Values</h3>
                  <OriginalValues pub={selectedVisit} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleDisplay;
