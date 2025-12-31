import { Pub, ScheduleDay, SchedulingDebugSummary } from "../context/PubDataContext";
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
  // Invalid postcodes are excluded from scheduling until fixed by the user.
  const eligiblePubs = pubs.filter((pub) => pub.postcodeMeta?.status !== "INVALID");
  const invalidPubs = pubs.filter((pub) => pub.postcodeMeta?.status === "INVALID");

  devLog("Starting schedule planning:", {
    pubsCount: pubs.length,
    eligibleCount: eligiblePubs.length,
    invalidCount: invalidPubs.length,
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
  const hasHome = Boolean(homeAddress && homeAddress.trim().length > 0);

  // const [homePrefix] = extractNumericPart(homeAddress); // TODO: Use for distance calculations

  // Track scheduled pubs to prevent duplicates
  const scheduledPubs = new Set<string>();

  type BucketKey = "deadline" | "followUp" | "priority" | "master";
  const bucketOrder: BucketKey[] = [
    "deadline",
    "followUp",
    "priority",
    "master",
  ];
  const bucketPubs: Record<BucketKey, Pub[]> = {
    deadline: [],
    followUp: [],
    priority: [],
    master: [],
  };

  const getBucket = (pub: Pub): BucketKey => {
    // Prefer effectivePlan when available so merged drivers control scheduling.
    const effective = pub.effectivePlan;
    if (effective?.primaryMode === "deadline") return "deadline";
    if (effective?.primaryMode === "followup") return "followUp";
    if (effective?.primaryMode === "priority") return "priority";

    const deadline = effective?.deadline ?? pub.deadline;
    const followUpDays = effective?.followUpDays ?? pub.followUpDays;
    const priorityLevel = effective?.priorityLevel ?? pub.priorityLevel;

    if (deadline) return "deadline";
    if (followUpDays && followUpDays > 0) return "followUp";
    if (priorityLevel && priorityLevel > 0) return "priority";
    return "master";
  };

  eligiblePubs.forEach((pub) => {
    bucketPubs[getBucket(pub)].push(pub);
  });

  const getPrimaryValue = (bucket: BucketKey, pub: Pub): number => {
    const effective = pub.effectivePlan;
    const deadline = effective?.deadline ?? pub.deadline;
    const followUpDays = effective?.followUpDays ?? pub.followUpDays;
    const priorityLevel = effective?.priorityLevel ?? pub.priorityLevel;

    if (bucket === "deadline") {
      return deadline ? new Date(deadline).getTime() : Infinity;
    }
    if (bucket === "followUp") {
      return typeof followUpDays === "number" ? followUpDays : Infinity;
    }
    if (bucket === "priority") {
      return typeof priorityLevel === "number"
        ? priorityLevel
        : Infinity;
    }
    return 0;
  };

  const pickNextFromBucket = (
    bucket: BucketKey,
    lastLocation: string
  ): { pub: Pub; index: number } | null => {
    const candidates = bucketPubs[bucket];
    let bestIndex = -1;
    let bestPrimary = Infinity;
    let bestDistance = Infinity;

    candidates.forEach((pub, index) => {
      if (scheduledPubs.has(pub.pub)) return;
      const primary = getPrimaryValue(bucket, pub);
      const distance = calculateDistance(lastLocation, pub.zip).mileage;

      if (
        primary < bestPrimary ||
        (primary === bestPrimary && distance < bestDistance)
      ) {
        bestPrimary = primary;
        bestDistance = distance;
        bestIndex = index;
      }
    });

    if (bestIndex === -1) return null;
    return { pub: candidates[bestIndex], index: bestIndex };
  };

  while (remainingDays > 0) {
    const dayVisits: Pub[] = [];
    let lastLocation = hasHome ? homeAddress : "";

    for (const bucket of bucketOrder) {
      while (dayVisits.length < visitsPerDay) {
        const selection = pickNextFromBucket(bucket, lastLocation);
        if (!selection) break;

        dayVisits.push(selection.pub);
        scheduledPubs.add(selection.pub.pub);
        lastLocation = selection.pub.zip;
        bucketPubs[bucket].splice(selection.index, 1);
      }
      if (dayVisits.length >= visitsPerDay) break;
    }

    if (dayVisits.length === 0) break;

    // Calculate metrics for the day
    let totalMileage = 0;
    let totalDriveTime = 0;
    const firstPubMetrics = hasHome
      ? calculateDistance(homeAddress, dayVisits[0].zip)
      : { mileage: 0, driveTime: 0 };
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
          driveTimeToNext: metrics.driveTime,
        };
        totalMileage += metrics.mileage;
        totalDriveTime += metrics.driveTime;
      }
    });

    // Add return journey
    const lastPubMetrics = calculateDistance(
      dayVisits[dayVisits.length - 1].zip,
      hasHome ? homeAddress : dayVisits[0].zip
    );
    if (hasHome) {
      totalMileage += lastPubMetrics.mileage;
      totalDriveTime += lastPubMetrics.driveTime;
    }

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

    schedule.push({
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
    remainingDays -= 1;
  }

  devLog("Schedule planning complete:", {
    daysRequested: businessDays,
    daysGenerated: schedule.length,
    totalVisits: schedule.reduce((acc, day) => acc + day.visits.length, 0),
  });

  return schedule;
}

type BucketKey = "deadline" | "followUp" | "priority" | "master";

const classifyBucket = (pub: Pub): BucketKey => {
  if (pub.deadline) return "deadline";
  if (pub.followUpDays) return "followUp";
  if (pub.priorityLevel) return "priority";
  return "master";
};

export function buildSchedulingDebugSummary(
  pubs: Pub[],
  schedule: DaySchedule[],
  visitsPerDay: number,
  homeAddress: string,
  daysRequested: number
): SchedulingDebugSummary {
  const bucketTotals = {
    deadline: 0,
    followUp: 0,
    priority: 0,
    master: 0,
  };
  const bucketScheduled = {
    deadline: 0,
    followUp: 0,
    priority: 0,
    master: 0,
  };

  pubs.forEach((pub) => {
    const bucket = classifyBucket(pub);
    bucketTotals[bucket] += 1;
  });

  schedule.forEach((day) => {
    (day.visits || []).forEach((visit) => {
      const bucket = classifyBucket(visit);
      bucketScheduled[bucket] += 1;
    });
  });

  const bucketExcluded = {
    deadline: Math.max(0, bucketTotals.deadline - bucketScheduled.deadline),
    followUp: Math.max(0, bucketTotals.followUp - bucketScheduled.followUp),
    priority: Math.max(0, bucketTotals.priority - bucketScheduled.priority),
    master: Math.max(0, bucketTotals.master - bucketScheduled.master),
  };

  const totalScheduled = Object.values(bucketScheduled).reduce(
    (acc, n) => acc + n,
    0
  );
  const totalPubs = pubs.length;
  const excludedTotal = Math.max(0, totalPubs - totalScheduled);
  const invalidPostcodes = pubs.filter(
    (pub) => pub.postcodeMeta?.status === "INVALID"
  ).length;
  const capacityExcluded = Math.max(0, excludedTotal - invalidPostcodes);

  return {
    bucketTotals,
    bucketScheduled,
    bucketExcluded,
    exclusionReasons: {
      radiusConstrained: 0,
      invalidGeo: invalidPostcodes,
      capacityLimit: capacityExcluded,
      alreadyScheduled: 0,
    },
    anchorMode:
      homeAddress && homeAddress.trim().length > 0 ? "home" : "fallback",
    daysRequested,
    scheduledDays: schedule.length,
    visitsPerDay,
    totalPubs,
    totalScheduled,
    notes:
      "Exclusion reasons use invalid postcode counts; radius/geo filters are still placeholders.",
  };
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
