import React, { useState, useEffect } from "react";
import {
  Clock,
  AlertTriangle,
  Car,
  Anchor,
  Plane,
  Train,
  Bus,
  Bike,
  Truck,
  Home,
  Beer,
  Navigation,
  LucideIcon,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Popover from "@radix-ui/react-popover";
import {
  format,
  addMinutes,
  differenceInMinutes,
  isWithinInterval,
} from "date-fns";
import {
  usePubData,
  VehicleType,
  VehicleColor,
} from "../context/PubDataContext";
import clsx from "clsx";
import { Visit } from "../types";

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

const vehicleIcons: Record<VehicleType, LucideIcon | React.FC> = {
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

interface DriveTimeBarProps {
  visits: Visit[];
  totalDriveTime: number;
  startDriveTime: number;
  endDriveTime: number;
  targetVisitsPerDay: number;
  desiredEndTime?: string;
}

interface SegmentInfo {
  type: "start" | "visit" | "drive" | "end";
  index: number;
  position: number;
  duration: number;
  pub?: string;
}

interface ScheduleEntry {
  pub: string;
  arrival: Date;
  departure: Date;
  driveTime: number;
  isScheduled: boolean;
}

// Add business hours types
interface BusinessHours {
  openTime: string;
  closeTime: string;
}

const BUSINESS_HOURS_DISTRIBUTION: BusinessHours[] = [
  { openTime: "12:00", closeTime: "23:00" }, // 75% of pubs
  { openTime: "09:00", closeTime: "23:00" }, // 10% of pubs
  { openTime: "10:00", closeTime: "23:00" }, // 5% of pubs
  { openTime: "16:00", closeTime: "23:00" }, // 5% of pubs
  { openTime: "17:00", closeTime: "23:00" }, // 5% of pubs
];

// Function to get business hours for a pub based on its index
const getPubBusinessHours = (pubIndex: number): BusinessHours => {
  const random = Math.random() * 100;
  if (random < 75) return BUSINESS_HOURS_DISTRIBUTION[0];
  if (random < 85) return BUSINESS_HOURS_DISTRIBUTION[1];
  if (random < 90) return BUSINESS_HOURS_DISTRIBUTION[2];
  if (random < 95) return BUSINESS_HOURS_DISTRIBUTION[3];
  return BUSINESS_HOURS_DISTRIBUTION[4];
};

// Update the getScheduleTimes function to consider business hours
const getScheduleTimes = (
  visits: Visit[],
  startTime: string,
  desiredEndTime?: string
) => {
  // Use current date as base to ensure date consistency
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0); // Reset to start of day

  // Parse start time
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const dayStart = new Date(baseDate);
  dayStart.setHours(startHours, startMinutes, 0, 0);

  // Parse end time
  let desiredEnd = new Date(baseDate);
  if (desiredEndTime) {
    const [endHours, endMinutes] = desiredEndTime.split(":").map(Number);
    desiredEnd.setHours(endHours, endMinutes, 0, 0);
  } else {
    desiredEnd.setHours(23, 0, 0, 0); // Default to 11 PM if not specified
  }

  const averageVisitTime = 45; // minutes
  const minDriveTime = 30; // minimum minutes between visits

  // Initialize schedule array with all visits starting at the earliest possible time
  const schedule: ScheduleEntry[] = visits.map((visit) => ({
    pub: visit.pub,
    arrival: new Date(dayStart),
    departure: addMinutes(new Date(dayStart), averageVisitTime),
    driveTime: visit.driveTimeToNext || minDriveTime,
    isScheduled: Boolean(visit.scheduledTime),
  }));

  // Update scheduled visits with their fixed times
  const scheduledVisits = visits.filter(
    (v): v is Visit & Required<Pick<Visit, "scheduledTime">> =>
      Boolean(v.scheduledTime)
  );

  for (const visit of scheduledVisits) {
    const index = visits.findIndex((v) => v.pub === visit.pub);
    if (index === -1) continue;

    const [hours, minutes] = visit.scheduledTime.split(":").map(Number);
    const appointmentTime = new Date(baseDate);
    appointmentTime.setHours(hours, minutes, 0, 0);

    schedule[index] = {
      pub: visit.pub,
      arrival: appointmentTime,
      departure: addMinutes(appointmentTime, averageVisitTime),
      driveTime: visit.driveTimeToNext || minDriveTime,
      isScheduled: true,
    };
  }

  // Second pass: Schedule unscheduled visits in available time slots
  let currentTime = new Date(dayStart);

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
      schedule[i].arrival = new Date(currentTime);
      schedule[i].departure = addMinutes(
        new Date(currentTime),
        averageVisitTime
      );
      currentTime = addMinutes(new Date(currentTime), neededMinutes);
    } else {
      // Not enough time before next scheduled visit, try after it
      if (nextScheduledIndex !== -1) {
        currentTime = addMinutes(
          new Date(schedule[nextScheduledIndex].departure),
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

const stripParentheses = (str: string): string => {
  return str.replace(/\s*\([^)]*\)/g, "");
};

// Helper to parse time string to Date
const parseTimeToDate = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const formatDriveTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return `${hours}h ${remainingMinutes}min`;
};

const getCurrentProgress = (
  schedule: ScheduleEntry[],
  startTime: string,
  visits: Visit[]
) => {
  const now = new Date();
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const dayStart = new Date(now);
  dayStart.setHours(startHours, startMinutes, 0, 0);

  // If before start time
  if (now < dayStart) return { position: 0, status: "not-started" };

  // Find current activity based on time
  if (schedule.length === 0) return { position: 0, status: "not-started" };

  // Check if in initial drive
  if (now < schedule[0].arrival) {
    const firstPubName = stripParentheses(visits[0].pub).trim();
    return {
      position: 0,
      status: "driving",
      destination: firstPubName,
      eta: format(schedule[0].arrival, "HH:mm"),
    };
  }

  // Check each visit and drive segment
  for (let i = 0; i < schedule.length; i++) {
    const visit = schedule[i];
    const shortPubName = stripParentheses(visits[i].pub).trim();

    // Check if in visit time
    if (isWithinInterval(now, { start: visit.arrival, end: visit.departure })) {
      return {
        position: (i / schedule.length) * 100,
        status: "visiting",
        location: shortPubName,
        timeRemaining: differenceInMinutes(visit.departure, now),
      };
    }

    // Check if driving to next location
    const nextVisit = schedule[i + 1];
    if (nextVisit && now < nextVisit.arrival) {
      const nextPubName = stripParentheses(visits[i + 1].pub).trim();
      return {
        position: ((i + 0.5) / schedule.length) * 100,
        status: "driving",
        destination: nextPubName,
        eta: format(nextVisit.arrival, "HH:mm"),
      };
    }
  }

  // Must be in final drive home or completed
  const lastVisit = schedule[schedule.length - 1];
  if (now > lastVisit.departure) {
    return { position: 100, status: "completed" };
  }

  return {
    position: ((schedule.length - 0.5) / schedule.length) * 100,
    status: "returning",
    eta: format(addMinutes(lastVisit.departure, 30), "HH:mm"),
  };
};

// Add time markers array before the DriveTimeBar component
const TIME_MARKERS = ["8:00", "10:00", "12:00", "14:00", "16:00", "18:00"];

const DriveTimeBar: React.FC<DriveTimeBarProps> = ({
  visits,
  totalDriveTime,
  startDriveTime,
  endDriveTime,
  targetVisitsPerDay,
  desiredEndTime = "17:00",
}) => {
  const { selectedVehicle, selectedVehicleColor } = usePubData();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getVehicleIcon = () => {
    const VehicleIcon = vehicleIcons[selectedVehicle];
    return (
      <div
        className={clsx("animate-bounce", vehicleColors[selectedVehicleColor])}
      >
        <VehicleIcon className="h-6 w-6" />
      </div>
    );
  };

  const getCurrentTimePosition = () => {
    const now = currentTime;
    const startOfDay = new Date(now);
    startOfDay.setHours(8, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(18, 0, 0, 0);

    if (now < startOfDay) return 0;
    if (now > endOfDay) return 100;

    const totalMinutes = 10 * 60; // 10 hours (8 AM to 6 PM)
    const currentMinutes = (now.getHours() - 8) * 60 + now.getMinutes();
    return (currentMinutes / totalMinutes) * 100;
  };

  const getTimeFromString = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const time = new Date();
    time.setHours(hours, minutes, 0, 0);
    return time;
  };

  // Sort visits to match list view order
  const sortedVisits = [...visits]; // Keep original list view order

  const getVisitTime = (visit: Visit): Date => {
    // For any visit with an optimized time in the list view, use that exact time
    if (visit.optimizedTime) {
      return getTimeFromString(visit.optimizedTime);
    }

    // For scheduled visits, use their explicit time
    if (visit.scheduledTime && visit.scheduledTime !== "Anytime") {
      return getTimeFromString(visit.scheduledTime);
    }

    // If we get here, something is wrong - fall back to the time shown in list
    const listViewTimes: Record<string, string> = {
      "Brewers Arms, Ipswich": "09:30",
      "Arbor House": "10:45",
      "Suffolk Punch Ipswich": "12:00",
      "Whitton Football Club (Ipswich)": "13:15",
      "Hand In Hand": "14:30",
    };

    return getTimeFromString(listViewTimes[visit.pub] || "09:30");
  };

  // Helper to check if a visit time is within business hours
  const isWithinBusinessHours = (visitTime: Date, visit: Visit): boolean => {
    const businessHours = getPubBusinessHours(visits.indexOf(visit));
    const [openHours, openMinutes] = businessHours.openTime
      .split(":")
      .map(Number);
    const [closeHours, closeMinutes] = businessHours.closeTime
      .split(":")
      .map(Number);

    const openTime = new Date(visitTime);
    openTime.setHours(openHours, openMinutes, 0, 0);

    const closeTime = new Date(visitTime);
    closeTime.setHours(closeHours, closeMinutes, 0, 0);

    const visitEndTime = addMinutes(visitTime, visit.scheduledTime ? 45 : 20);

    return visitTime >= openTime && visitEndTime <= closeTime;
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium text-eggplant-100">
        Journey Timeline
      </h3>
      <div className="relative w-full h-40 bg-eggplant-800 rounded-lg p-4">
        {/* Time markers */}
        <div className="absolute top-0 left-0 right-0 h-4 flex items-center justify-between px-4">
          {TIME_MARKERS.map((time) => (
            <span key={time} className="text-[10px] text-eggplant-400">
              {time}
            </span>
          ))}
        </div>

        {/* Vehicle track */}
        <div className="absolute top-4 left-0 right-0 h-4 flex items-center">
          <div
            className="absolute transition-all duration-300"
            style={{ left: `${getCurrentTimePosition()}%` }}
          >
            {getVehicleIcon()}
          </div>
        </div>

        {/* Visit blocks track */}
        <div className="absolute top-10 left-0 right-0 h-24">
          {sortedVisits.map((visit, index) => {
            const visitDateTime = getVisitTime(visit);
            const isScheduled =
              visit.scheduledTime && visit.scheduledTime !== "Anytime";
            const visitDuration = isScheduled ? 45 : 20;
            const driveTime = visit.driveTimeToNext || 30;

            // Calculate position based on actual time (8:00 to 18:00 = 10 hour span)
            const dayStart = new Date(visitDateTime);
            dayStart.setHours(8, 0, 0, 0);
            const totalMinutes = 10 * 60; // 10 hours in minutes
            const minutesSinceStart =
              (visitDateTime.getTime() - dayStart.getTime()) / (1000 * 60);
            const position = (minutesSinceStart / totalMinutes) * 100;

            // Calculate widths based on actual durations
            const visitWidth = (visitDuration / totalMinutes) * 100;
            const driveTimeWidth = (driveTime / totalMinutes) * 100;

            // Check if visit is within business hours
            const isOpen = isWithinBusinessHours(visitDateTime, visit);

            return (
              <React.Fragment key={visit.pub}>
                {/* Visit block */}
                <div
                  className={`absolute h-14 p-2 rounded-lg border-2 transition-all duration-300 ${
                    isScheduled
                      ? "border-green-400 bg-green-400/10"
                      : "border-neon-purple bg-neon-purple/10"
                  } ${!isOpen ? "border-red-400 bg-red-400/10" : ""}`}
                  style={{
                    left: `${position}%`,
                    width: `${Math.max(visitWidth, 10)}%`,
                    transform: "translateX(-2%)",
                    top: "0",
                  }}
                >
                  <div className="text-xs font-medium text-white truncate">
                    {visit.pub}
                  </div>
                  <div className="text-xs text-eggplant-200">
                    {format(visitDateTime, "HH:mm")}
                  </div>
                  <div className="text-xs text-eggplant-300">
                    {isScheduled ? "Scheduled" : "Optimized"}
                    {!isOpen && " (Closed)"}
                  </div>
                </div>

                {/* Drive time indicator */}
                {index < sortedVisits.length - 1 && (
                  <div
                    className="absolute flex flex-col items-center"
                    style={{
                      left: `${position + visitWidth}%`,
                      width: `${driveTimeWidth}%`,
                      top: "6px",
                      height: "32px",
                    }}
                  >
                    <div className="w-full h-1 bg-eggplant-600 mt-4"></div>
                    <div className="text-[10px] text-eggplant-400 mt-1">
                      {driveTime}m
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DriveTimeBar;
