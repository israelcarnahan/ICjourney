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

const vehicleIcons = {
  car: Car,
  truck: Truck,
  bike: Bike,
  bus: Bus,
  train: Train,
  plane: Plane,
  boat: Anchor,
  fairy: FairyIcon,
} as const;

interface Visit {
  pub: string;
  driveTimeToNext?: number;
  zip: string;
  scheduledTime?: string;
  visitNotes?: string;
  accountName?: string;
  openingTime?: string;
}

interface DriveTimeBarProps {
  visits: Visit[];
  totalDriveTime?: number;
  startDriveTime?: number;
  endDriveTime?: number;
  targetVisitsPerDay: number;
  startTime?: string;
  desiredEndTime?: string;
  onDesiredEndTimeChange?: (time: string) => void;
  onGenerateSchedule?: () => void;
  onPrevStep?: () => void;
  onNextStep?: () => void;
  isGeneratingSchedule?: boolean;
}

const vehicleColors: Record<VehicleColor, string> = {
  purple: "text-neon-purple",
  blue: "text-neon-blue",
  pink: "text-neon-pink",
  green: "text-emerald-400",
  orange: "text-orange-400",
  yellow: "text-yellow-400",
};

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
  const dayStart = new Date();
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  dayStart.setHours(startHours, startMinutes, 0, 0);

  let desiredEnd = new Date(dayStart);
  if (desiredEndTime) {
    const [endHours, endMinutes] = desiredEndTime.split(":").map(Number);
    desiredEnd.setHours(endHours, endMinutes, 0, 0);
  } else {
    desiredEnd.setHours(23, 0, 0, 0); // Default to 11 PM if not specified
  }

  const averageVisitTime = 45; // minutes
  const minDriveTime = 30; // minimum minutes between visits

  // Assign business hours to each pub
  const pubsWithHours = visits.map((visit, index) => ({
    ...visit,
    businessHours: getPubBusinessHours(index),
  }));

  // Initialize schedule array
  const schedule: ScheduleEntry[] = pubsWithHours.map((visit) => ({
    pub: visit.pub,
    arrival: dayStart,
    departure: addMinutes(dayStart, averageVisitTime),
    driveTime: visit.driveTimeToNext || minDriveTime,
    isScheduled: Boolean(visit.scheduledTime),
    businessHours: visit.businessHours,
  }));

  // Schedule visits considering business hours
  let currentTime = dayStart;
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i].isScheduled) continue;

    const pubHours = pubsWithHours[i].businessHours;
    const [openHours, openMinutes] = pubHours.openTime.split(":").map(Number);
    const [closeHours, closeMinutes] = pubHours.closeTime
      .split(":")
      .map(Number);

    // Set opening time for the current day
    const openingTime = new Date(dayStart);
    openingTime.setHours(openHours, openMinutes, 0, 0);

    // Set closing time for the current day
    const closingTime = new Date(dayStart);
    closingTime.setHours(closeHours, closeMinutes, 0, 0);

    // Ensure we schedule after opening time
    if (currentTime < openingTime) {
      currentTime = openingTime;
    }

    // Skip if we can't fit the visit before closing
    if (addMinutes(currentTime, averageVisitTime) > closingTime) {
      continue;
    }

    schedule[i].arrival = currentTime;
    schedule[i].departure = addMinutes(currentTime, averageVisitTime);
    currentTime = addMinutes(
      currentTime,
      averageVisitTime + (pubsWithHours[i].driveTimeToNext || minDriveTime)
    );
  }

  return schedule;
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

const DriveTimeBar: React.FC<DriveTimeBarProps> = ({
  visits,
  totalDriveTime = 0,
  startDriveTime = 0,
  endDriveTime = 0,
  targetVisitsPerDay,
  startTime = "09:00",
  desiredEndTime = "17:00",
  onDesiredEndTimeChange,
  onGenerateSchedule,
  onPrevStep,
  onNextStep,
  isGeneratingSchedule = false,
}) => {
  const { selectedVehicle, selectedVehicleColor } = usePubData();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Get optimized schedule
  const { schedule } = getScheduleTimes(visits, startTime, desiredEndTime);

  // Calculate total day duration based on start and desired end times
  const getDayDuration = () => {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = desiredEndTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0, 0);
    const endDate = new Date();
    endDate.setHours(endHours, endMinutes, 0, 0);
    return differenceInMinutes(endDate, startDate);
  };

  const totalDayDuration = getDayDuration();

  // Function to get width percentage for a time segment
  const getSegmentWidth = (minutes: number) => {
    return (minutes / totalDayDuration) * 100;
  };

  // Function to get position percentage for a time
  const getTimePosition = (time: Date) => {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0, 0);
    const minutesFromStart = differenceInMinutes(time, startDate);
    return getSegmentWidth(minutesFromStart);
  };

  // Sort visits based on scheduled times
  const sortedVisits = [...visits].sort((a, b) => {
    const aInfo = schedule.find((s) => s.pub === a.pub);
    const bInfo = schedule.find((s) => s.pub === b.pub);
    if (!aInfo || !bInfo) return 0;
    return aInfo.arrival.getTime() - bInfo.arrival.getTime();
  });

  // Get current progress
  const progress = getCurrentProgress(schedule, startTime, sortedVisits);

  // Check if schedule fits within desired time
  const lastVisit = schedule[schedule.length - 1];
  const estimatedEndTime = lastVisit
    ? format(addMinutes(lastVisit.departure, endDriveTime), "HH:mm")
    : desiredEndTime;
  const isOverTime = estimatedEndTime > desiredEndTime;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between text-xs text-eggplant-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Total drive time: {formatDriveTime(totalDriveTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Total day duration: {formatDriveTime(totalDayDuration)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-eggplant-300">Desired return:</span>
          <input
            type="time"
            id="desiredEndTime"
            aria-label="Desired return time"
            value={desiredEndTime}
            onChange={(e) => onDesiredEndTimeChange?.(e.target.value)}
            className={`bg-eggplant-800 border rounded px-2 py-0.5 text-eggplant-100 focus:outline-none w-20 ${
              isOverTime
                ? "border-amber-400 text-amber-400"
                : "border-neon-purple text-neon-purple"
            }`}
          />
          {isOverTime && (
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-eggplant-800 text-amber-400 text-xs rounded-md p-2 shadow-lg"
                    sideOffset={5}
                  >
                    Schedule extends beyond desired return time
                    <Tooltip.Arrow className="fill-eggplant-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          )}
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="relative h-32 bg-eggplant-900/50 rounded-lg overflow-hidden">
        {/* Vehicle position */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-50 transition-all duration-1000"
          style={{ left: `${progress.position}%` }}
        >
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <div>
                  {React.createElement(vehicleIcons[selectedVehicle], {
                    className: `h-6 w-6 ${
                      vehicleColors[selectedVehicleColor]
                    } ${
                      progress.status === "driving" ||
                      progress.status === "returning"
                        ? "animate-bounce"
                        : progress.status === "visiting"
                        ? "animate-pulse"
                        : ""
                    }`,
                    style: { color: `currentColor` },
                  })}
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-eggplant-800 text-eggplant-100 text-xs rounded-md p-2 shadow-lg"
                  sideOffset={5}
                >
                  {progress.status === "not-started" && (
                    <span>Journey not started</span>
                  )}
                  {progress.status === "driving" && (
                    <div>
                      <div>Driving to: {progress.destination}</div>
                      <div>ETA: {progress.eta}</div>
                    </div>
                  )}
                  {progress.status === "visiting" && (
                    <div>
                      <div>At: {progress.location}</div>
                      <div>
                        Time remaining: {progress.timeRemaining} minutes
                      </div>
                    </div>
                  )}
                  {progress.status === "returning" && (
                    <div>
                      <div>Returning home</div>
                      <div>ETA: {progress.eta}</div>
                    </div>
                  )}
                  {progress.status === "completed" && (
                    <span>Journey completed</span>
                  )}
                  <Tooltip.Arrow className="fill-eggplant-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>

        {/* Start drive time */}
        <div
          className="absolute h-[60%] bottom-0 bg-neon-purple/20 border-r border-neon-purple/50"
          style={{ width: `${getSegmentWidth(startDriveTime)}%` }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
            <div className="bg-eggplant-900/90 px-1.5 py-0.5 rounded text-neon-purple shadow-sm">
              {formatDriveTime(startDriveTime)}
            </div>
          </div>
          <div className="absolute -top-12 left-0 flex flex-col items-start gap-1">
            <div className="bg-eggplant-900/90 px-2 py-1 rounded text-[10px] font-medium text-neon-purple shadow-sm whitespace-nowrap">
              Leave Home
            </div>
            <div className="bg-eggplant-900/90 px-2 py-1 rounded text-[10px] font-medium text-neon-purple/90 shadow-sm whitespace-nowrap">
              {startTime}
            </div>
          </div>
        </div>

        {/* Visit blocks with drive segments */}
        {sortedVisits.map((visit, index) => {
          const visitInfo = schedule.find((s) => s.pub === visit.pub);
          if (!visitInfo) return null;

          const startTime = format(visitInfo.arrival, "HH:mm");
          const endTime = format(visitInfo.departure, "HH:mm");
          const shortPubName = stripParentheses(visit.pub).trim();

          // Generate flags for the visit
          const flags = [];
          if (visit.visitNotes) flags.push("📝 Notes");
          if (visit.scheduledTime) flags.push("📅 Scheduled");
          if (visit.accountName) flags.push("👤 Account");

          return (
            <React.Fragment key={`${visit.pub}-${index}`}>
              {/* Visit block */}
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div
                      className="absolute h-[60%] bottom-0 bg-neon-blue/20 border-r border-neon-blue/50"
                      style={{
                        left: `${getTimePosition(visitInfo.arrival)}%`,
                        width: `${getSegmentWidth(
                          differenceInMinutes(
                            visitInfo.departure,
                            visitInfo.arrival
                          )
                        )}%`,
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center px-1">
                        <div className="bg-eggplant-900/90 px-1.5 py-0.5 rounded text-[9px] leading-tight font-medium text-neon-blue shadow-sm w-full text-center break-words">
                          {shortPubName}
                        </div>
                      </div>
                      <div className="absolute -top-12 left-0 flex flex-col items-start gap-1">
                        {flags.length > 0 && (
                          <div className="bg-eggplant-900/90 px-2 py-1 rounded text-[10px] font-medium text-neon-purple shadow-sm whitespace-nowrap">
                            {flags.join(" • ")}
                          </div>
                        )}
                        <div className="bg-eggplant-900/90 px-2 py-1 rounded text-[10px] font-medium text-neon-blue/90 shadow-sm whitespace-nowrap">
                          {startTime} • {endTime}
                        </div>
                      </div>
                    </div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-eggplant-800 text-eggplant-100 text-xs rounded-md p-2 shadow-lg"
                      sideOffset={5}
                    >
                      <div className="font-semibold text-neon-blue mb-1">
                        {visit.pub}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-neon-blue" />
                          <span>Arrive: {startTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-neon-purple" />
                          <span>Depart: {endTime}</span>
                        </div>
                      </div>
                      <Tooltip.Arrow className="fill-eggplant-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>

              {/* Drive segments */}
              {index < sortedVisits.length - 1 && (
                <div
                  className="absolute h-[60%] bottom-0 bg-neon-purple/20 border-r border-neon-purple/50"
                  style={{
                    left: `${getTimePosition(visitInfo.departure)}%`,
                    width: `${getSegmentWidth(visit.driveTimeToNext || 30)}%`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
                    <div className="bg-eggplant-900/90 px-1.5 py-0.5 rounded text-neon-purple shadow-sm">
                      {formatDriveTime(visit.driveTimeToNext || 30)}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* End drive time */}
        {sortedVisits.length > 0 && (
          <div
            className="absolute h-[60%] bottom-0 bg-neon-purple/20 border-r border-neon-purple/50"
            style={{
              left: `${getTimePosition(
                schedule[schedule.length - 1].departure
              )}%`,
              width: `${getSegmentWidth(endDriveTime)}%`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
              <div className="bg-eggplant-900/90 px-1.5 py-0.5 rounded text-neon-purple shadow-sm">
                {formatDriveTime(endDriveTime)}
              </div>
            </div>
            <div className="absolute -top-12 right-0 flex flex-col items-end gap-1">
              <div className="bg-eggplant-900/90 px-2 py-1 rounded text-[10px] font-medium text-neon-purple shadow-sm whitespace-nowrap">
                Return Home
              </div>
              <div className="bg-eggplant-900/90 px-2 py-1 rounded text-[10px] font-medium text-neon-purple/90 shadow-sm whitespace-nowrap">
                {estimatedEndTime}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriveTimeBar;
