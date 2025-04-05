import { Pub, ScheduleDay } from "../context/PubDataContext";
import { format, addBusinessDays } from "date-fns";

export const extractNumericPart = (postcode: string): [string, number] => {
  // Extract the first part of the postcode (letters + number)
  const match = postcode
    .trim()
    .toUpperCase()
    .match(/^([A-Z]+)(\d+)/);
  if (!match) return ["", 0];
  return [match[1], parseInt(match[2], 10)];
};

export const calculateDistance = (
  from: string,
  to: string
): { mileage: number; driveTime: number } => {
  const [fromPrefix, fromNum] = extractNumericPart(from);
  const [toPrefix, toNum] = extractNumericPart(to);

  // If postcodes are in different areas, estimate higher distance
  if (fromPrefix !== toPrefix) {
    return { mileage: 50, driveTime: 90 };
  }

  // Calculate distance based on numeric difference
  const numDiff = Math.abs(fromNum - toNum);
  const baseDistance = numDiff * 2.5; // Roughly 2.5 miles per postcode number difference
  const baseTime = numDiff * 5; // Roughly 5 minutes per postcode number difference

  return {
    mileage: baseDistance + (Math.random() * 2 - 1), // Add some randomness ±1 mile
    driveTime: Math.round(baseTime + (Math.random() * 10 - 5)), // Add some randomness ±5 minutes
  };
};

export const findNearestPubs = (
  fromPub: Pub,
  pubs: Pub[],
  limit: number
): Pub[] => {
  if (!fromPub.zip || !pubs.length) return [];

  const [basePrefix, baseNum] = extractNumericPart(fromPub.zip);

  return pubs
    .filter((pub) => {
      if (!pub.zip) return false;
      const [pubPrefix, pubNum] = extractNumericPart(pub.zip);
      return (
        pubPrefix === basePrefix &&
        Math.abs(pubNum - baseNum) <= 1 &&
        pub.pub !== fromPub.pub
      );
    })
    .slice(0, limit);
};

export const getPriorityOrder = (pub: Pub): number => {
  switch (pub.Priority) {
    case "RecentWin":
      return 1;
    case "Wishlist":
      return pub.priorityLevel || 2;
    case "Unvisited":
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
