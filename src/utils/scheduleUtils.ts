import { Pub, ScheduleDay, SchedulingDebugSummary } from "../context/PubDataContext";
import { format, addBusinessDays } from "date-fns";
import { Visit } from "../types";
import { devLog } from "./devLog";
import {
  compareByProximity,
  estimateMockDistance,
  getProximityRank,
  getProximityScore,
} from "../geo/mockGeo";

const extractNumericPart = (postcode: string): [string, number] => {
  // Extract the first part of the postcode (letters + number)
  const match = postcode
    .trim()
    .toUpperCase()
    .match(/^([A-Z]+)(\d+)/);
  if (!match) return ["", 0];
  return [match[1], parseInt(match[2], 10)];
};

export const calculateDistance = (fromPostcode: string, toPostcode: string) => {
  return estimateMockDistance(fromPostcode, toPostcode);
};

export const findNearestPubs = (
  sourcePub: Visit,
  availablePubs: Visit[],
  maxDistance: number
): Visit[] => {
  return availablePubs
    .filter((pub) => getProximityScore(sourcePub.zip, pub.zip).eligible)
    .map((pub) => ({
      ...pub,
      distance: calculateDistance(sourcePub.zip, pub.zip).mileage,
    }))
    .filter((pub) => pub.distance <= maxDistance)
    .sort((a, b) => compareByProximity(sourcePub.zip, a.zip, b.zip));
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
  searchRadius: number = 15,
  debugCollector?: (entry: Record<string, unknown>) => void
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
  const remainingPubs = [...eligiblePubs];

  type BucketKey = "deadline" | "followUp" | "priority" | "master";
  const getBucket = (pub: Pub): BucketKey => {
    // Prefer effectivePlan when available so merged drivers control scheduling.
    const effective = pub.effectivePlan;
    if (effective?.primaryMode === "deadline") return "deadline";
    if (effective?.primaryMode === "followup") return "followUp";
    if (effective?.primaryMode === "priority") return "priority";

    const deadline = effective?.deadline ?? pub.deadline;
    // Follow-up-by-date is deferred; followUpDays stays a scalar driver for now.
    const followUpDays = effective?.followUpDays ?? pub.followUpDays;
    const priorityLevel = effective?.priorityLevel ?? pub.priorityLevel;

    if (deadline) return "deadline";
    if (followUpDays && followUpDays > 0) return "followUp";
    if (priorityLevel && priorityLevel > 0) return "priority";
    return "master";
  };

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
      return typeof priorityLevel === "number" ? priorityLevel : Infinity;
    }
    return 0;
  };

  const getLocalityKey = (pub: Pub): string => {
    const area = pub.postcodeMeta?.areaLetters;
    if (area) return area;
    const [prefix] = extractNumericPart(pub.zip || "");
    if (prefix) return prefix;
    return (pub.zip || "UNKNOWN").substring(0, 2).toUpperCase();
  };

  const normalizeDateOnly = (value: Date): number =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

  const meetsDeadlineConstraint = (pub: Pub, date: Date): boolean => {
    const effective = pub.effectivePlan;
    const deadline = effective?.deadline ?? pub.deadline;
    if (!deadline) return true;
    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) return true;
    return normalizeDateOnly(date) <= normalizeDateOnly(deadlineDate);
  };

  const countBusinessDaysInclusive = (start: Date, end: Date): number => {
    if (normalizeDateOnly(start) > normalizeDateOnly(end)) return 0;
    let count = 0;
    let cursor = new Date(start);
    while (normalizeDateOnly(cursor) <= normalizeDateOnly(end)) {
      count += 1;
      cursor = addBusinessDays(cursor, 1);
    }
    return count;
  };

  const getDeadlineDate = (pub: Pub): Date | null => {
    const deadline = pub.effectivePlan?.deadline ?? pub.deadline;
    if (!deadline) return null;
    const d = new Date(deadline);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  type PressureInfo = {
    pressureRatio: number;
    pressuredBy: Date | null;
    infeasibleBy: Date | null;
    requiredAtPressure: number;
    capacityAtPressure: number;
  };

  const getLocalityDeadlinePressure = (
    date: Date,
    pubs: Pub[],
    slotsPerDay: number,
    remainingScheduleDays: number
  ): Map<string, PressureInfo> => {
    const endDate =
      remainingScheduleDays > 0
        ? addBusinessDays(date, remainingScheduleDays - 1)
        : date;
    const remainingByLocality = pubs.reduce<Record<string, number>>(
      (acc, pub) => {
        const key = getLocalityKey(pub);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {}
    );
    const totalRemaining = Object.values(remainingByLocality).reduce(
      (acc, n) => acc + n,
      0
    );
    const localityShare: Record<string, number> = {};
    Object.entries(remainingByLocality).forEach(([key, count]) => {
      const rawShare = totalRemaining > 0 ? count / totalRemaining : 0;
      localityShare[key] = Math.sqrt(rawShare);
    });

    const byLocality = new Map<string, Pub[]>();
    pubs.forEach((pub) => {
      const key = getLocalityKey(pub);
      const list = byLocality.get(key) ?? [];
      list.push(pub);
      byLocality.set(key, list);
    });

    const out = new Map<string, PressureInfo>();
    byLocality.forEach((localPubs, locality) => {
      const deadlines = localPubs
        .map(getDeadlineDate)
        .filter((d): d is Date => Boolean(d))
        .filter((d) => normalizeDateOnly(d) >= normalizeDateOnly(date))
        .sort((a, b) => normalizeDateOnly(a) - normalizeDateOnly(b));
      if (deadlines.length === 0) {
        out.set(locality, {
          pressureRatio: 0,
          pressuredBy: null,
          infeasibleBy: null,
          requiredAtPressure: 0,
          capacityAtPressure: 0,
        });
        return;
      }

      const uniqueDeadlines = Array.from(
        new Set(deadlines.map((d) => normalizeDateOnly(d)))
      )
        .map((value) => new Date(value))
        .sort((a, b) => normalizeDateOnly(a) - normalizeDateOnly(b));

      let maxRatio = 0;
      let pressuredBy: Date | null = null;
      let requiredAtPressure = 0;
      let capacityAtPressure = 0;
      let infeasibleBy: Date | null = null;

      uniqueDeadlines.forEach((deadlineDate) => {
        const required = localPubs.filter((pub) => {
          const d = getDeadlineDate(pub);
          if (!d) return false;
          return normalizeDateOnly(d) <= normalizeDateOnly(deadlineDate);
        }).length;
        const capEnd =
          normalizeDateOnly(deadlineDate) < normalizeDateOnly(endDate)
            ? deadlineDate
            : endDate;
        const capacity =
          countBusinessDaysInclusive(date, capEnd) *
          slotsPerDay *
          (localityShare[locality] ?? 0);
        const ratio = required / Math.max(1, capacity);
        if (ratio > maxRatio) {
          maxRatio = ratio;
          pressuredBy = deadlineDate;
          requiredAtPressure = required;
          capacityAtPressure = capacity;
        }
        if (required > capacity && !infeasibleBy) {
          infeasibleBy = deadlineDate;
        }
      });

      out.set(locality, {
        pressureRatio: maxRatio,
        pressuredBy: maxRatio >= 0.8 ? pressuredBy : null,
        infeasibleBy,
        requiredAtPressure,
        capacityAtPressure,
      });
    });

    return out;
  };

  const selectPressuredLocality = (
    pressures: Map<string, PressureInfo>
  ): {
    locality: string;
    pressuredBy: Date | null;
    pressureRatio: number;
    requiredAtPressure: number;
    capacityAtPressure: number;
  } | null => {
    let best: { locality: string; pressuredBy: Date | null; ratio: number } | null = null;
    let bestRequired = 0;
    let bestCapacity = 0;
    pressures.forEach((info, locality) => {
      if (!info.pressuredBy) return;
      if (!best) {
        best = { locality, pressuredBy: info.pressuredBy, ratio: info.pressureRatio };
        bestRequired = info.requiredAtPressure;
        bestCapacity = info.capacityAtPressure;
        return;
      }
      if (info.pressureRatio > best.ratio) {
        best = { locality, pressuredBy: info.pressuredBy, ratio: info.pressureRatio };
        bestRequired = info.requiredAtPressure;
        bestCapacity = info.capacityAtPressure;
        return;
      }
      if (
        info.pressureRatio === best.ratio &&
        info.pressuredBy &&
        best.pressuredBy &&
        normalizeDateOnly(info.pressuredBy) < normalizeDateOnly(best.pressuredBy)
      ) {
        best = { locality, pressuredBy: info.pressuredBy, ratio: info.pressureRatio };
        bestRequired = info.requiredAtPressure;
        bestCapacity = info.capacityAtPressure;
        return;
      }
      if (
        info.pressureRatio === best.ratio &&
        info.pressuredBy &&
        best.pressuredBy &&
        normalizeDateOnly(info.pressuredBy) === normalizeDateOnly(best.pressuredBy) &&
        info.requiredAtPressure > bestRequired
      ) {
        best = { locality, pressuredBy: info.pressuredBy, ratio: info.pressureRatio };
        bestRequired = info.requiredAtPressure;
        bestCapacity = info.capacityAtPressure;
      }
    });
    const resolved = best as {
      locality: string;
      pressuredBy: Date | null;
      ratio: number;
    } | null;
    if (!resolved) return null;
    return {
      locality: resolved.locality,
      pressuredBy: resolved.pressuredBy,
      pressureRatio: resolved.ratio,
      requiredAtPressure: bestRequired,
      capacityAtPressure: bestCapacity,
    };
  };

  const buildDeadlineRatioLookup = (
    date: Date,
    pubs: Pub[],
    slotsPerDay: number,
    remainingScheduleDays: number
  ): Map<string, Map<number, number>> => {
    const endDate =
      remainingScheduleDays > 0
        ? addBusinessDays(date, remainingScheduleDays - 1)
        : date;
    const remainingByLocality = pubs.reduce<Record<string, number>>(
      (acc, pub) => {
        const key = getLocalityKey(pub);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {}
    );
    const totalRemaining = Object.values(remainingByLocality).reduce(
      (acc, n) => acc + n,
      0
    );
    const localityShare: Record<string, number> = {};
    Object.entries(remainingByLocality).forEach(([key, count]) => {
      const rawShare = totalRemaining > 0 ? count / totalRemaining : 0;
      localityShare[key] = Math.sqrt(rawShare);
    });

    const byLocality = new Map<string, Pub[]>();
    pubs.forEach((pub) => {
      const key = getLocalityKey(pub);
      const list = byLocality.get(key) ?? [];
      list.push(pub);
      byLocality.set(key, list);
    });

    const out = new Map<string, Map<number, number>>();
    byLocality.forEach((localPubs, locality) => {
      const deadlines = localPubs
        .map(getDeadlineDate)
        .filter((d): d is Date => Boolean(d))
        .filter((d) => normalizeDateOnly(d) >= normalizeDateOnly(date))
        .sort((a, b) => normalizeDateOnly(a) - normalizeDateOnly(b));
      if (deadlines.length === 0) return;

      const uniqueDeadlines = Array.from(
        new Set(deadlines.map((d) => normalizeDateOnly(d)))
      );
      const ratioMap = new Map<number, number>();
      uniqueDeadlines.forEach((value) => {
        const deadlineDate = new Date(value);
        const required = localPubs.filter((pub) => {
          const d = getDeadlineDate(pub);
          if (!d) return false;
          return normalizeDateOnly(d) <= normalizeDateOnly(deadlineDate);
        }).length;
        const capEnd =
          normalizeDateOnly(deadlineDate) < normalizeDateOnly(endDate)
            ? deadlineDate
            : endDate;
        const capacity =
          countBusinessDaysInclusive(date, capEnd) *
          slotsPerDay *
          (localityShare[locality] ?? 0);
        const ratio = required / Math.max(1, capacity);
        ratioMap.set(value, ratio);
      });
      out.set(locality, ratioMap);
    });
    return out;
  };

  const bucketOrder: BucketKey[] = [
    "deadline",
    "followUp",
    "priority",
    "master",
  ];

  const DEADLINE_URGENCY_THRESHOLD = 0.2;

  const getDeadlineUrgency = (
    pub: Pub,
    deadlineRatioLookup: Map<string, Map<number, number>>
  ): number => {
    const deadlineDate = getDeadlineDate(pub);
    if (!deadlineDate) return 0;
    const locality = getLocalityKey(pub);
    const ratioMap = deadlineRatioLookup.get(locality);
    const ratioKey = ratioMap ? ratioMap.get(normalizeDateOnly(deadlineDate)) : undefined;
    return ratioKey ?? 0;
  };

  const getDeadlineActivationInfo = (
    candidates: Pub[],
    deadlineRatioLookup: Map<string, Map<number, number>>,
    seedLocation: string | null
  ): {
    bestUrgency: number;
    bestDeadlineCandidate: Pub | null;
    active: boolean;
    reason: "urgency" | "override" | "inactive";
  } => {
    let bestUrgency = 0;
    let bestDeadlineCandidate: Pub | null = null;
    candidates.forEach((pub) => {
      if (getBucket(pub) !== "deadline") return;
      const urgency = getDeadlineUrgency(pub, deadlineRatioLookup);
      if (urgency > bestUrgency) {
        bestUrgency = urgency;
        bestDeadlineCandidate = pub;
      }
    });
    const hasNearbyOverride =
      seedLocation != null &&
      candidates.some((pub) => {
        if (getBucket(pub) !== "deadline") return false;
        const proximity = getProximityScore(seedLocation, pub.zip);
        return proximity.tier === "sector";
      });
    const active =
      bestUrgency >= DEADLINE_URGENCY_THRESHOLD || hasNearbyOverride;
    const reason = active
      ? bestUrgency >= DEADLINE_URGENCY_THRESHOLD
        ? "urgency"
        : "override"
      : "inactive";
    return { bestUrgency, bestDeadlineCandidate, active, reason };
  };

  const selectHighestBucket = (
    candidates: Pub[],
    pressureDeadlineBy: Date | null,
    deadlineRatioLookup: Map<string, Map<number, number>>,
    seedLocation: string | null
  ): { bucket: BucketKey | null; filtered: Pub[] } => {
    const pool = candidates.filter((pub) =>
      meetsDeadlineConstraint(pub, currentDate)
    );
    const deadlineActivation = getDeadlineActivationInfo(
      pool,
      deadlineRatioLookup,
      seedLocation
    );

    for (const bucket of bucketOrder) {
      const filtered = pool.filter((pub) => {
        if (getBucket(pub) !== bucket) return false;
        if (bucket === "deadline" && !deadlineActivation.active) return false;
        if (bucket !== "deadline") return true;
        const deadlineDate = getDeadlineDate(pub);
        if (!deadlineDate) return true;
        if (!pressureDeadlineBy) return true;
        return (
          normalizeDateOnly(deadlineDate) <= normalizeDateOnly(pressureDeadlineBy)
        );
      });
      if (filtered.length > 0) {
        return { bucket, filtered };
      }
    }

    return { bucket: null, filtered: [] };
  };

  const getBusinessDaysUntil = (start: Date, end: Date): number => {
    const days = countBusinessDaysInclusive(start, end);
    return Math.max(0, days - 1);
  };

  const pickBestPub = (
    candidates: Pub[],
    lastLocation: string,
    seedLocation: string | null,
    deadlineRatioLookup: Map<string, Map<number, number>>
  ): { pub: Pub; index: number } | null => {
    let bestIndex = -1;
    let bestPrimary = Infinity;
    let bestSelectionScore = Infinity;
    let bestUrgency = 0;

    candidates.forEach((pub, index) => {
      const pubKey = pub.uuid || `${pub.fileId}-${pub.pub}-${pub.zip}`;
      if (scheduledPubs.has(pubKey)) return;

      const bucket = getBucket(pub);
      const urgencyRatio =
        bucket === "deadline" ? getDeadlineUrgency(pub, deadlineRatioLookup) : 0;
      const primary = getPrimaryValue(bucket, pub);
      const lastRank = getProximityRank(lastLocation, pub.zip);
      const seedRank = seedLocation ? getProximityRank(seedLocation, pub.zip) : null;
      const selectionScore =
        seedRank === null ? lastRank : seedRank * 0.7 + lastRank * 0.3;

      if (
        urgencyRatio > bestUrgency ||
        (urgencyRatio === bestUrgency && primary < bestPrimary) ||
        (urgencyRatio === bestUrgency &&
          primary === bestPrimary &&
          selectionScore < bestSelectionScore)
      ) {
        bestUrgency = urgencyRatio;
        bestPrimary = primary;
        bestSelectionScore = selectionScore;
        bestIndex = index;
      }
    });

    if (bestIndex === -1) return null;
    return { pub: candidates[bestIndex], index: bestIndex };
  };

  const buildCandidateDebug = (
    candidates: Pub[],
    lastLocation: string,
    seedLocation: string | null,
    deadlineRatioLookup: Map<string, Map<number, number>>
  ) => {
    return candidates
      .map((pub) => {
        const bucket = getBucket(pub);
        const urgencyRatio =
          bucket === "deadline" ? getDeadlineUrgency(pub, deadlineRatioLookup) : 0;
        const primary = getPrimaryValue(bucket, pub);
        const lastProximity = getProximityScore(lastLocation, pub.zip);
        const seedProximity = seedLocation
          ? getProximityScore(seedLocation, pub.zip)
          : null;
        const lastRank = getProximityRank(lastLocation, pub.zip);
        const seedRank = seedLocation ? getProximityRank(seedLocation, pub.zip) : null;
        const selectionScore =
          seedRank === null ? lastRank : seedRank * 0.7 + lastRank * 0.3;
        return {
          pub: pub.pub,
          postcode: pub.zip,
          bucket,
          primary,
          urgencyRatio,
          effectiveRank: 0,
          selectionScore,
          seedProximity: seedProximity
            ? {
                eligible: seedProximity.eligible,
                tier: seedProximity.tier,
                districtDelta: seedProximity.districtDelta,
                sectorDelta: seedProximity.sectorDelta,
                unitDelta: seedProximity.unitDelta,
              }
            : null,
          lastProximity: {
            eligible: lastProximity.eligible,
            tier: lastProximity.tier,
            districtDelta: lastProximity.districtDelta,
            sectorDelta: lastProximity.sectorDelta,
            unitDelta: lastProximity.unitDelta,
          },
        };
      })
      .sort((a, b) => {
        if (a.urgencyRatio !== b.urgencyRatio) return b.urgencyRatio - a.urgencyRatio;
        if (a.effectiveRank !== b.effectiveRank) return a.effectiveRank - b.effectiveRank;
        if (a.primary !== b.primary) return a.primary - b.primary;
        return a.selectionScore - b.selectionScore;
      });
  };

  const getSelectionReason = (
    chosen: {
      urgencyRatio: number;
      effectiveRank: number;
      primary: number;
      selectionScore: number;
    },
    candidates: {
      urgencyRatio: number;
      effectiveRank: number;
      primary: number;
      selectionScore: number;
    }[]
  ): string => {
    const maxUrgency = Math.max(0, ...candidates.map((c) => c.urgencyRatio));
    const minPrimary = Math.min(...candidates.map((c) => c.primary));
    const minSelectionScore = Math.min(...candidates.map((c) => c.selectionScore));
    if (maxUrgency > 0 && chosen.urgencyRatio === maxUrgency) return "urgency";
    if (chosen.primary === minPrimary) return "primary-value";
    if (chosen.selectionScore === minSelectionScore) return "proximity";
    return "tie-break";
  };

  while (remainingDays > 0) {
    const dayVisits: Pub[] = [];
    let lastLocation = hasHome ? homeAddress : "";
    let pickIndex = 0;
    const dayPickSummary: Record<string, number> = {
      deadline: 0,
      followUp: 0,
      priority: 0,
      master: 0,
    };
    let deadlinePickByUrgency = 0;
    let deadlinePickByOverride = 0;

    const eligibleSeeds = remainingPubs.filter((pub) =>
      meetsDeadlineConstraint(pub, currentDate)
    );
    const pressureMap = getLocalityDeadlinePressure(
      currentDate,
      remainingPubs,
      visitsPerDay,
      remainingDays
    );
    const deadlineRatioLookup = buildDeadlineRatioLookup(
      currentDate,
      remainingPubs,
      visitsPerDay,
      remainingDays
    );
    const pressuredLocality = selectPressuredLocality(pressureMap);
    const pressuredSeeds = pressuredLocality
      ? eligibleSeeds.filter(
          (pub) => getLocalityKey(pub) === pressuredLocality.locality
        )
      : [];
    const seedCandidates =
      pressuredSeeds.length > 0 ? pressuredSeeds : eligibleSeeds;
    const seedActivation = getDeadlineActivationInfo(
      seedCandidates,
      deadlineRatioLookup,
      null
    );
    const seedBucket = selectHighestBucket(
      seedCandidates,
      pressuredLocality?.pressuredBy ?? null,
      deadlineRatioLookup,
      null
    );
    const seedSelection = pickBestPub(
      seedBucket.filtered,
      lastLocation,
      null,
      deadlineRatioLookup
    );
    if (!seedSelection) break;

    const seedPub = seedSelection.pub;
    const seedLastLocation = lastLocation;
    const dayLocalityKey = getLocalityKey(seedPub);
    const seedKey = seedPub.uuid || `${seedPub.fileId}-${seedPub.pub}-${seedPub.zip}`;
    dayVisits.push(seedPub);
    scheduledPubs.add(seedKey);
    lastLocation = seedPub.zip;
    dayPickSummary[seedBucket.bucket ?? "master"] += 1;
    if (seedBucket.bucket === "deadline") {
      if (seedActivation.reason === "urgency") deadlinePickByUrgency += 1;
      if (seedActivation.reason === "override") deadlinePickByOverride += 1;
    }
    remainingPubs.splice(
      remainingPubs.findIndex((p) => p === seedPub),
      1
    );

    if (debugCollector) {
      const candidates = buildCandidateDebug(
        seedBucket.filtered,
        seedLastLocation,
        null,
        deadlineRatioLookup
      );
      const chosen = candidates.find((c) => c.pub === seedPub.pub && c.postcode === seedPub.zip);
      debugCollector({
        type: "selection",
        phase: "seed",
        date: format(currentDate, "yyyy-MM-dd"),
        pickIndex,
        dayLocality: dayLocalityKey,
        lastLocation: seedLastLocation,
        deadlineThreshold: DEADLINE_URGENCY_THRESHOLD,
        bestDeadlineUrgency: seedActivation.bestUrgency,
        deadlineActive: seedActivation.active,
        deadlineActiveReason: seedActivation.reason,
        topDeadlineCandidate: seedActivation.bestDeadlineCandidate
          ? {
              pub: seedActivation.bestDeadlineCandidate.pub,
              postcode: seedActivation.bestDeadlineCandidate.zip,
              urgencyRatio: getDeadlineUrgency(
                seedActivation.bestDeadlineCandidate,
                deadlineRatioLookup
              ),
            }
          : null,
        activeBucket: seedBucket.bucket,
        candidates,
        chosen: chosen ?? null,
        reason: chosen ? getSelectionReason(chosen, candidates) : "unknown",
      });
    }
    pickIndex += 1;

    while (dayVisits.length < visitsPerDay) {
      const localPressure = pressureMap.get(dayLocalityKey);
      const pressureDeadlineBy = localPressure?.pressuredBy ?? null;
      const localityCandidates = remainingPubs.filter(
        (pub) =>
          getLocalityKey(pub) === dayLocalityKey &&
          meetsDeadlineConstraint(pub, currentDate)
      );
      const fillActivation = getDeadlineActivationInfo(
        localityCandidates,
        deadlineRatioLookup,
        seedPub.zip
      );
      const fillBucket = selectHighestBucket(
        localityCandidates,
        pressureDeadlineBy,
        deadlineRatioLookup,
        seedPub.zip
      );
      const fillLastLocation = lastLocation;
      const nextSelection = pickBestPub(
        fillBucket.filtered,
        lastLocation,
        seedPub.zip,
        deadlineRatioLookup
      );
      if (!nextSelection) break;

      const selectedPub = nextSelection.pub;
      const selectedKey =
        selectedPub.uuid || `${selectedPub.fileId}-${selectedPub.pub}-${selectedPub.zip}`;
      dayVisits.push(selectedPub);
      scheduledPubs.add(selectedKey);
      lastLocation = selectedPub.zip;
      dayPickSummary[fillBucket.bucket ?? "master"] += 1;
      if (fillBucket.bucket === "deadline") {
        if (fillActivation.reason === "urgency") deadlinePickByUrgency += 1;
        if (fillActivation.reason === "override") deadlinePickByOverride += 1;
      }
      remainingPubs.splice(
        remainingPubs.findIndex((p) => p === selectedPub),
        1
      );

      if (debugCollector) {
        const candidates = buildCandidateDebug(
          fillBucket.filtered,
          fillLastLocation,
          seedPub.zip,
          deadlineRatioLookup
        );
        const chosen = candidates.find((c) => c.pub === selectedPub.pub && c.postcode === selectedPub.zip);
        debugCollector({
          type: "selection",
          phase: "fill",
          date: format(currentDate, "yyyy-MM-dd"),
          pickIndex,
          dayLocality: dayLocalityKey,
          lastLocation: fillLastLocation,
          deadlineThreshold: DEADLINE_URGENCY_THRESHOLD,
          bestDeadlineUrgency: fillActivation.bestUrgency,
          deadlineActive: fillActivation.active,
          deadlineActiveReason: fillActivation.reason,
          topDeadlineCandidate: fillActivation.bestDeadlineCandidate
            ? {
                pub: fillActivation.bestDeadlineCandidate.pub,
                postcode: fillActivation.bestDeadlineCandidate.zip,
                urgencyRatio: getDeadlineUrgency(
                  fillActivation.bestDeadlineCandidate,
                  deadlineRatioLookup
                ),
              }
            : null,
          activeBucket: fillBucket.bucket,
          candidates,
          chosen: chosen ?? null,
          reason: chosen ? getSelectionReason(chosen, candidates) : "unknown",
        });
      }
      pickIndex += 1;
    }

    if (dayVisits.length === 0) break;

    if (debugCollector) {
      const pressureInfo = pressureMap.get(dayLocalityKey);
      const deadlineByLocality = dayVisits.reduce<Record<string, number>>(
        (acc, visit) => {
          if (getDeadlineDate(visit)) {
            const loc = getLocalityKey(visit);
            acc[loc] = (acc[loc] ?? 0) + 1;
          }
          return acc;
        },
        {}
      );
      const daysUntilDueDist = dayVisits.reduce<Record<string, number>>(
        (acc, visit) => {
          const deadlineDate = getDeadlineDate(visit);
          if (!deadlineDate) return acc;
          const daysUntil = getBusinessDaysUntil(currentDate, deadlineDate);
          const key = String(daysUntil);
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        },
        {}
      );
      debugCollector({
        type: "daySummary",
        date: format(currentDate, "yyyy-MM-dd"),
        seedLocality: dayLocalityKey,
        seedPostcode: seedPub.zip,
        seedReason: pressuredSeeds.length > 0 ? "pressure-override" : "normal",
        pressureRatio: pressureInfo?.pressureRatio ?? 0,
        pressureDueBy: pressureInfo?.pressuredBy
          ? format(pressureInfo.pressuredBy, "yyyy-MM-dd")
          : null,
        pressureRequired: pressureInfo?.requiredAtPressure ?? 0,
        pressureCapacity: pressureInfo?.capacityAtPressure ?? 0,
        deadlineThreshold: DEADLINE_URGENCY_THRESHOLD,
        pickCounts: dayPickSummary,
        deadlinePickReasons: {
          urgency: deadlinePickByUrgency,
          override: deadlinePickByOverride,
        },
        deadlineScheduledByLocality: deadlineByLocality,
        daysUntilDueDistribution: daysUntilDueDist,
      });
    }

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
        if (normalizeDateOnly(visitDate) > normalizeDateOnly(deadlineDate)) {
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
  // Prefer effective scheduling fields so debug matches scheduling output.
  if (pub.effectivePlan?.deadline) return "deadline";
  if (pub.effectivePlan?.followUpDays) return "followUp";
  if (pub.effectivePlan?.priorityLevel) return "priority";
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

/**
 * @ARCHIVED
 * Reason: Knip flags this symbol as unused (no internal/cross-file references).
 * Status: Roadmap/postpone. Keep for future resurrection.
 * Notes: Route optimization helper for future scheduling improvements.
 */
const optimizeRoute = (
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
void optimizeRoute;

const parseTimeString = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const getTimeGapMinutes = (startTime: string, endTime: string): number => {
  return parseTimeString(endTime) - parseTimeString(startTime);
};
