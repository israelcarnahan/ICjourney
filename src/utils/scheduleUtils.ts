import { Pub, ScheduleDay } from "../context/PubDataContext";
import {
  format,
  addBusinessDays,
  parseISO,
  isValid,
  addMinutes,
  differenceInMinutes,
} from "date-fns";
import { Visit, DriveTimeMetrics } from "../types/schedule";

export const extractNumericPart = (postcode: string): [string, number] => {
  // Extract the first part of the postcode (letters + number)
  const match = postcode
    .trim()
    .toUpperCase()
    .match(/^([A-Z]+)(\d+)/);
  if (!match) return ["", 0];
  return [match[1], parseInt(match[2], 10)];
};

export const calculateDistance = (fromPostcode: string, toPostcode: string) => {
  // Basic postcode proximity check
  const fromPrefix = fromPostcode.substring(0, 2);
  const toPrefix = toPostcode.substring(0, 2);

  // If postcodes don't share first two characters, they're likely far apart
  const isFarApart = fromPrefix !== toPrefix;

  // Calculate a rough estimate based on postcode similarity
  const baseTime = isFarApart ? 90 : 30;
  const baseMileage = isFarApart ? 45 : 15;

  return {
    driveTime: baseTime,
    mileage: baseMileage,
  };
};

export const findNearestPubs = (
  sourcePub: Visit,
  availablePubs: Visit[],
  maxDistance: number
): Visit[] => {
  const sourcePrefix = sourcePub.zip.substring(0, 2);

  // Filter pubs by postcode proximity first
  return availablePubs
    .filter((pub) => {
      const pubPrefix = pub.zip.substring(0, 2);
      return pubPrefix === sourcePrefix;
    })
    .map((pub) => ({
      ...pub,
      distance: calculateDistance(sourcePub.zip, pub.zip).mileage,
    }))
    .filter((pub) => pub.distance <= maxDistance)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
};

export const getPriorityOrder = (pub: Visit): number => {
  switch (pub.Priority?.toLowerCase()) {
    case "repslywin":
    case "recent win":
      return 1;
    case "wishlist":
    case "hit list":
      return 2;
    case "unvisited":
      return 3;
    default:
      return 4;
  }
};

interface DaySchedule extends Partial<ScheduleDay> {
  date: string;
  visits: Pub[];
  totalMileage: number;
  totalDriveTime: number;
  startMileage: number;
  startDriveTime: number;
  endMileage: number;
  endDriveTime: number;
  schedulingErrors?: string[];
}

export async function planVisits(
  pubs: Pub[],
  startDate: Date,
  businessDays: number,
  homeAddress: string,
  visitsPerDay: number,
  searchRadius: number = 15
): Promise<DaySchedule[]> {
  console.debug("Starting schedule planning:", {
    pubsCount: pubs.length,
    startDate,
    businessDays,
    visitsPerDay,
    searchRadius,
  });

  if (businessDays <= 0) {
    console.warn("Invalid business days requested:", businessDays);
    return [];
  }

  // Initialize schedule array and tracking variables
  const schedule: DaySchedule[] = [];
  let remainingDays = businessDays;
  let currentDate = startDate;

  const [homePrefix] = extractNumericPart(homeAddress);

  // Track scheduled pubs to prevent duplicates
  const scheduledPubs = new Set<string>();

  // Group pubs by priority level
  const priorityGroups: Record<string, Pub[]> = {
    deadline: [],
    recentWin: [],
    wishlist: [],
    unvisited: [],
    other: [],
  };

  // Sort pubs into priority groups
  pubs.forEach((pub) => {
    if (pub.deadline) {
      priorityGroups.deadline.push(pub);
    } else if (pub.Priority === "RecentWin") {
      priorityGroups.recentWin.push(pub);
    } else if (pub.Priority === "Wishlist") {
      priorityGroups.wishlist.push(pub);
    } else if (pub.Priority === "Unvisited") {
      priorityGroups.unvisited.push(pub);
    } else {
      priorityGroups.other.push(pub);
    }
  });

  // Sort deadline pubs by date
  priorityGroups.deadline.sort((a, b) => {
    const dateA = new Date(a.deadline!).getTime();
    const dateB = new Date(b.deadline!).getTime();
    return dateA - dateB;
  });

  // Process each priority group
  const processGroup = async (
    pubs: Pub[],
    currentDate: Date,
    daysRemaining: number
  ): Promise<[DaySchedule[], Date]> => {
    const groupSchedule: DaySchedule[] = [];
    let currentPubs = [...pubs];
    let daysUsed = 0;

    while (currentPubs.length > 0 && daysUsed < daysRemaining) {
      // Get pubs for this day based on location proximity
      const dayVisits: Pub[] = [];
      let lastLocation = homeAddress;

      // Try to fill up to visitsPerDay
      while (dayVisits.length < visitsPerDay && currentPubs.length > 0) {
        // Find the nearest unscheduled pub to the last location
        const nearestPubIndex = currentPubs.reduce(
          (nearest, pub, index) => {
            if (scheduledPubs.has(pub.pub)) return nearest;

            const distance = calculateDistance(lastLocation, pub.zip);
            const currentDistance = nearest.distance;

            return distance.mileage < currentDistance.mileage
              ? { index, distance: distance }
              : nearest;
          },
          { index: -1, distance: { mileage: Infinity, driveTime: Infinity } }
        );

        if (nearestPubIndex.index === -1) break;

        const selectedPub = currentPubs[nearestPubIndex.index];
        dayVisits.push(selectedPub);
        scheduledPubs.add(selectedPub.pub);
        lastLocation = selectedPub.zip;
        currentPubs.splice(nearestPubIndex.index, 1);
      }

      if (dayVisits.length === 0) break;

      // Calculate metrics for the day
      let totalMileage = 0;
      let totalDriveTime = 0;
      const firstPubMetrics = calculateDistance(homeAddress, dayVisits[0].zip);
      totalMileage += firstPubMetrics.mileage;
      totalDriveTime += firstPubMetrics.driveTime;

      // Calculate distances between visits
      dayVisits.forEach((pub, index) => {
        if (index < dayVisits.length - 1) {
          const metrics = calculateDistance(pub.zip, dayVisits[index + 1].zip);
          pub.mileageToNext = metrics.mileage;
          pub.driveTimeToNext = metrics.driveTime;
          totalMileage += metrics.mileage;
          totalDriveTime += metrics.driveTime;
        }
      });

      // Add return journey
      const lastPubMetrics = calculateDistance(
        dayVisits[dayVisits.length - 1].zip,
        homeAddress
      );
      totalMileage += lastPubMetrics.mileage;
      totalDriveTime += lastPubMetrics.driveTime;

      const schedulingErrors: string[] = [];
      if (dayVisits.length < visitsPerDay) {
        schedulingErrors.push(
          `Only ${dayVisits.length} visits scheduled (target: ${visitsPerDay})`
        );
      }

      // Check deadlines
      dayVisits.forEach((visit) => {
        if (visit.deadline) {
          const deadlineDate = new Date(visit.deadline);
          const visitDate = new Date(currentDate);
          if (visitDate > deadlineDate) {
            schedulingErrors.push(
              `${visit.pub} scheduled after deadline (${format(
                deadlineDate,
                "MMM d, yyyy"
              )})`
            );
          }
        }
      });

      groupSchedule.push({
        date: format(currentDate, "yyyy-MM-dd"),
        visits: dayVisits,
        totalMileage,
        totalDriveTime,
        startMileage: firstPubMetrics.mileage,
        startDriveTime: firstPubMetrics.driveTime,
        endMileage: lastPubMetrics.mileage,
        endDriveTime: lastPubMetrics.driveTime,
        schedulingErrors:
          schedulingErrors.length > 0 ? schedulingErrors : undefined,
      });

      currentDate = addBusinessDays(currentDate, 1);
      daysUsed++;
    }

    return [groupSchedule, currentDate];
  };

  // Process deadline pubs first
  if (priorityGroups.deadline.length > 0) {
    const [deadlineSchedule, newDate] = await processGroup(
      priorityGroups.deadline,
      currentDate,
      remainingDays
    );
    schedule.push(...deadlineSchedule);
    currentDate = newDate;
    remainingDays -= deadlineSchedule.length;
  }

  // Process remaining groups
  for (const group of ["recentWin", "wishlist", "unvisited", "other"]) {
    if (remainingDays <= 0) break;

    const groupPubs = priorityGroups[group as keyof typeof priorityGroups];
    if (groupPubs.length === 0) continue;

    const [groupSchedule, newDate] = await processGroup(
      groupPubs,
      currentDate,
      remainingDays
    );

    const daysToTake = Math.min(groupSchedule.length, remainingDays);
    schedule.push(...groupSchedule.slice(0, daysToTake));
    remainingDays -= daysToTake;
    currentDate = newDate;

    if (remainingDays <= 0) break;
  }

  console.debug("Schedule planning complete:", {
    daysRequested: businessDays,
    daysGenerated: schedule.length,
    totalVisits: schedule.reduce((acc, day) => acc + day.visits.length, 0),
  });

  return schedule;
}

export const optimizeRoute = (
  visits: Visit[],
  homeAddress: string,
  maxDriveTime: number = 90 // Maximum drive time between visits in minutes
): Visit[] => {
  // Separate fixed and flexible visits
  const fixedVisits = visits.filter(
    (v) => v.scheduledTime && v.scheduledTime !== "Anytime"
  );
  const flexibleVisits = visits.filter(
    (v) => !v.scheduledTime || v.scheduledTime === "Anytime"
  );

  // Sort fixed visits by time
  fixedVisits.sort((a, b) => {
    const timeA = parseTimeString(a.scheduledTime!);
    const timeB = parseTimeString(b.scheduledTime!);
    return timeA - timeB;
  });

  // Initialize optimized route with fixed visits
  const optimizedRoute: Visit[] = [...fixedVisits];

  // For each fixed visit, find nearest flexible visits that can fit in the time gaps
  for (let i = 0; i < fixedVisits.length - 1; i++) {
    const currentVisit = fixedVisits[i];
    const nextVisit = fixedVisits[i + 1];

    const timeGap = getTimeGapMinutes(
      currentVisit.scheduledTime!,
      nextVisit.scheduledTime!
    );
    const availableTime = timeGap - 45; // Subtract visit duration

    if (availableTime >= 60) {
      // Minimum time needed for a flexible visit
      const nearbyVisits = findNearestPubs(
        currentVisit,
        flexibleVisits,
        maxDriveTime
      ).filter((v) => !optimizedRoute.includes(v));

      if (nearbyVisits.length > 0) {
        optimizedRoute.splice(i + 1, 0, nearbyVisits[0]);
        flexibleVisits.splice(flexibleVisits.indexOf(nearbyVisits[0]), 1);
      }
    }
  }

  // Add remaining flexible visits to the start or end of the day
  const remainingVisits = findNearestPubs(
    { zip: homeAddress } as Visit,
    flexibleVisits,
    maxDriveTime
  );

  // Add visits to start of day if they're closer to home
  const morningVisits = remainingVisits.slice(
    0,
    Math.floor(remainingVisits.length / 2)
  );
  const afternoonVisits = remainingVisits.slice(
    Math.floor(remainingVisits.length / 2)
  );

  return [...morningVisits, ...optimizedRoute, ...afternoonVisits];
};

const parseTimeString = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const getTimeGapMinutes = (startTime: string, endTime: string): number => {
  return parseTimeString(endTime) - parseTimeString(startTime);
};

/**
 * Formats a date string or Date object into a readable format
 * @param dateStr - The date to format
 * @returns Formatted date string or "Never" if invalid
 */
export const formatDate = (
  dateStr: string | Date | null | undefined
): string => {
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

/**
 * Calculates drive time metrics for a list of visits
 * @param visits - Array of visits
 * @param homeAddress - Starting address
 * @param desiredEndTime - Optional desired end time
 * @returns Drive time metrics
 */
export const recalculateMetrics = (
  visits: Visit[],
  homeAddress: string,
  desiredEndTime?: string
): DriveTimeMetrics => {
  let totalMileage = 0;
  let totalDriveTime = 0;
  let startDriveTime = 0;
  let endDriveTime = 0;

  try {
    // Calculate drive times between visits
    for (let i = 0; i < visits.length; i++) {
      const visit = visits[i];
      const nextVisit = visits[i + 1];

      if (i === 0) {
        // Calculate drive time from home to first visit
        const { mileage, driveTime } = calculateDistance(
          homeAddress,
          visit.postcode
        );
        startDriveTime = driveTime;
        totalMileage += mileage;
        totalDriveTime += driveTime;
      }

      if (nextVisit) {
        // Calculate drive time to next visit
        const { mileage, driveTime } = calculateDistance(
          visit.postcode,
          nextVisit.postcode
        );
        totalMileage += mileage;
        totalDriveTime += driveTime;
      }

      if (i === visits.length - 1) {
        // Calculate drive time from last visit to home
        const { mileage, driveTime } = calculateDistance(
          visit.postcode,
          homeAddress
        );
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
    };
  } catch (error) {
    console.error("Error calculating metrics:", error);
    throw new Error("Failed to calculate drive time metrics");
  }
};

/**
 * Parses a time string into a Date object
 * @param timeStr - Time string to parse
 * @returns Date object
 */
export const parseTimeToDate = (timeStr: string): Date => {
  try {
    return parseISO(timeStr);
  } catch (error) {
    console.error("Error parsing time:", error);
    throw new Error("Invalid time format");
  }
};

/**
 * Calculates schedule times for visits
 * @param visits - Array of visits
 * @param startTime - Start time
 * @param desiredEndTime - Optional desired end time
 * @returns Array of scheduled visits with times
 */
export const getScheduleTimes = (
  visits: Visit[],
  startTime: string,
  desiredEndTime?: string
): Visit[] => {
  try {
    let currentTime = parseTimeToDate(startTime);
    const scheduledVisits = visits.map((visit, index) => {
      const visitWithTime = {
        ...visit,
        scheduledTime: currentTime,
      };

      if (index < visits.length - 1) {
        const nextVisit = visits[index + 1];
        const { driveTime } = calculateDistance(
          visit.postcode,
          nextVisit.postcode
        );
        currentTime = addMinutes(currentTime, visit.visitTime + driveTime);
      }

      return visitWithTime;
    });

    return scheduledVisits;
  } catch (error) {
    console.error("Error calculating schedule times:", error);
    throw new Error("Failed to calculate schedule times");
  }
};
