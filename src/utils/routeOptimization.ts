import { Visit } from "../types";
import { calculateDistance } from "./scheduleUtils";

const parseTimeString = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const extractPostcodePrefix = (postcode: string): string => {
  // Normalize postcode format and extract the outward code (first part)
  return postcode.trim().toUpperCase().split(" ")[0];
};

const getPostcodeDistance = (a: string, b: string): number => {
  const prefixA = extractPostcodePrefix(a);
  const prefixB = extractPostcodePrefix(b);

  // If prefixes match exactly, they're closest
  if (prefixA === prefixB) return 0;

  // If first part matches (e.g., "IP1" and "IP2"), they're very close
  if (prefixA.slice(0, -1) === prefixB.slice(0, -1)) return 1;

  // If only letters match (e.g., "IP" and "IP"), they're in same region
  if (prefixA.replace(/\d/g, "") === prefixB.replace(/\d/g, "")) return 2;

  // Otherwise, they're in different regions
  return 3;
};

export const optimizeRoute = (
  visits: Visit[],
  homeAddress: string
): Visit[] => {
  if (!visits.length) return [];

  // Separate fixed and flexible visits
  const scheduledVisits = visits
    .filter((v) => v.scheduledTime && v.scheduledTime !== "Anytime")
    .sort((a, b) => {
      const timeA = parseTimeString(a.scheduledTime!);
      const timeB = parseTimeString(b.scheduledTime!);
      return timeA - timeB;
    });

  const unscheduledVisits = visits.filter(
    (v) => !v.scheduledTime || v.scheduledTime === "Anytime"
  );

  // If there are scheduled visits, use them as anchor points
  if (scheduledVisits.length > 0) {
    let finalRoute: Visit[] = [];
    let remainingVisits = [...unscheduledVisits];

    // For each scheduled visit, find nearby unscheduled visits
    scheduledVisits.forEach((scheduledVisit, index) => {
      const scheduledTime = parseTimeString(scheduledVisit.scheduledTime!);
      const nextScheduledVisit = scheduledVisits[index + 1];
      const nextScheduledTime = nextScheduledVisit
        ? parseTimeString(nextScheduledVisit.scheduledTime!)
        : parseTimeString("17:00");

      // Group remaining visits by postcode proximity to the scheduled visit
      const visitsByProximity = remainingVisits
        .map((visit) => ({
          visit,
          postcodeDistance: getPostcodeDistance(visit.zip, scheduledVisit.zip),
          physicalDistance: calculateDistance(scheduledVisit.zip, visit.zip)
            .mileage,
        }))
        .sort((a, b) => {
          // First sort by postcode proximity
          if (a.postcodeDistance !== b.postcodeDistance) {
            return a.postcodeDistance - b.postcodeDistance;
          }
          // Then by physical distance
          return a.physicalDistance - b.physicalDistance;
        });

      // Calculate how many visits can fit before the next scheduled visit
      const availableTime = nextScheduledTime - scheduledTime;
      const possibleVisits = Math.floor((availableTime - 45) / 75); // (available - visit time) / (visit + drive time)

      // Add visits that fit in the time window
      const visitsToAdd = visitsByProximity.slice(0, possibleVisits);
      remainingVisits = remainingVisits.filter(
        (v) => !visitsToAdd.some((added) => added.visit.pub === v.pub)
      );

      // Add visits in optimal order around the scheduled visit
      const beforeScheduled = visitsToAdd.slice(
        0,
        Math.floor(visitsToAdd.length / 2)
      );
      const afterScheduled = visitsToAdd.slice(
        Math.floor(visitsToAdd.length / 2)
      );

      finalRoute.push(
        ...beforeScheduled.map((v) => v.visit),
        scheduledVisit,
        ...afterScheduled.map((v) => v.visit)
      );
    });

    // Handle any remaining unscheduled visits
    if (remainingVisits.length > 0) {
      // Sort remaining visits by postcode proximity to the last scheduled visit
      const lastScheduledVisit = scheduledVisits[scheduledVisits.length - 1];
      remainingVisits.sort((a, b) => {
        const distA = getPostcodeDistance(a.zip, lastScheduledVisit.zip);
        const distB = getPostcodeDistance(b.zip, lastScheduledVisit.zip);
        if (distA !== distB) return distA - distB;
        return (
          calculateDistance(lastScheduledVisit.zip, a.zip).mileage -
          calculateDistance(lastScheduledVisit.zip, b.zip).mileage
        );
      });
      finalRoute.push(...remainingVisits);
    }

    return finalRoute;
  }

  // If no scheduled visits, optimize based on postcode proximity to home
  const visitsByPostcode = unscheduledVisits.reduce((acc, visit) => {
    const prefix = extractPostcodePrefix(visit.zip);
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(visit);
    return acc;
  }, {} as Record<string, Visit[]>);

  // Sort postcode groups by distance from home
  const sortedPostcodes = Object.keys(visitsByPostcode).sort((a, b) => {
    const distA = calculateDistance(homeAddress, a).mileage;
    const distB = calculateDistance(homeAddress, b).mileage;
    return distA - distB;
  });

  // Create final route by visiting each postcode group
  return sortedPostcodes.flatMap((postcode) => {
    const visitsInArea = visitsByPostcode[postcode];
    return visitsInArea.sort((a, b) => {
      const distA = calculateDistance(homeAddress, a.zip).mileage;
      const distB = calculateDistance(homeAddress, b.zip).mileage;
      return distA - distB;
    });
  });
};
