import { Pub, ScheduleDay } from "../context/PubDataContext";
import { format, addBusinessDays } from "date-fns";
import { Visit } from "../types";
import { devLog } from "./devLog";

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
  devLog("Starting schedule planning:", {
    pubsCount: pubs.length,
    startDate,
    businessDays,
    visitsPerDay,
    searchRadius,
  });

  if (businessDays <= 0) {
    devLog("Invalid business days requested:", businessDays);
    return [];
  }

  // Initialize schedule array and tracking variables
  const schedule: DaySchedule[] = [];
  let remainingDays = businessDays;
  let currentDate = startDate;

  // const [homePrefix] = extractNumericPart(homeAddress); // TODO: Use for distance calculations

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
          // Create a new object to avoid modifying the original
          dayVisits[index] = {
            ...pub,
            mileageToNext: metrics.mileage,
            driveTimeToNext: metrics.driveTime
          };
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

  devLog("Schedule planning complete:", {
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
