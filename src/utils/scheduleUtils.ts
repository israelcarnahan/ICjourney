import { Pub, ScheduleDay, ScheduleVisit } from '../context/PubDataContext';
import { format, addBusinessDays } from 'date-fns';

export const extractNumericPart = (postcode: string): [string, number] => {
  // Extract the first part of the postcode (letters + number)
  const match = postcode.trim().toUpperCase().match(/^([A-Z]+)(\d+)/);
  if (!match) return ['', 0];
  return [match[1], parseInt(match[2], 10)];
};

export const calculateDistance = (from: string, to: string): { mileage: number; driveTime: number } => {
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
    driveTime: Math.round(baseTime + (Math.random() * 10 - 5)) // Add some randomness ±5 minutes
  };
};

export const findNearestPubs = (fromPub: Pub, pubs: Pub[], limit: number): Pub[] => {
  if (!fromPub.zip || !pubs.length) return [];
  
  const [basePrefix, baseNum] = extractNumericPart(fromPub.zip);
  
  return pubs
    .filter(pub => {
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
    case 'RecentWin': return 1;
    case 'Wishlist': return pub.priorityLevel || 2;
    case 'Unvisited': return 3;
    default: return 4;
  }
};

export const planVisits = async (
  pubs: Pub[],
  startDate: Date,
  businessDays: number,
  homeAddress: string,
  visitsPerDay: number
): Promise<ScheduleDay[]> => {
  console.debug('Starting schedule planning:', {
    pubCount: pubs.length,
    businessDays,
    visitsPerDay
  });

  const schedule: ScheduleDay[] = [];
  const [homePrefix] = extractNumericPart(homeAddress);
  
  // Track scheduled pubs to prevent duplicates
  const scheduledPubs = new Set<string>();
  
  // Group pubs by priority level
  const priorityGroups: Record<string, Pub[]> = {
    deadline: [],
    recentWin: [],
    wishlist: [],
    unvisited: [],
    other: []
  };

  // Sort pubs into priority groups
  pubs.forEach(pub => {
    if (pub.deadline) {
      priorityGroups.deadline.push(pub);
    } else if (pub.Priority === 'RecentWin') {
      priorityGroups.recentWin.push(pub);
    } else if (pub.Priority === 'Wishlist') {
      priorityGroups.wishlist.push(pub);
    } else if (pub.Priority === 'Unvisited') {
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
  
  // Group each priority level by postcode area
  const groupByPostcode = (pubs: Pub[]): Record<string, Pub[]> => {
    return pubs.reduce((acc, pub) => {
      if (!pub.zip) return acc;
      const [prefix] = extractNumericPart(pub.zip);
      if (!acc[prefix]) acc[prefix] = [];
      acc[prefix].push(pub);
      return acc;
    }, {} as Record<string, Pub[]>);
  };

  // Process each priority group
  const processGroup = async (pubs: Pub[], currentDate: Date): Promise<[ScheduleDay[], Date]> => {
    const groupSchedule: ScheduleDay[] = [];
    const postcodeGroups = groupByPostcode(pubs);
    let remainingVisits = visitsPerDay;
    
    // Randomize postcode order while keeping home area first
    const postcodes = Object.keys(postcodeGroups);
    const homeIndex = postcodes.indexOf(homePrefix);
    if (homeIndex !== -1) {
      postcodes.splice(homeIndex, 1);
    }
    
    // Fisher-Yates shuffle for remaining postcodes
    for (let i = postcodes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [postcodes[i], postcodes[j]] = [postcodes[j], postcodes[i]];
    }
    
    // Put home area first if it exists
    if (homeIndex !== -1) {
      postcodes.unshift(homePrefix);
    }

    for (const postcode of postcodes) {
      const areaPubs = postcodeGroups[postcode];
      
      // Randomize pubs within each area
      const availablePubs = areaPubs.filter(pub => !scheduledPubs.has(pub.pub));
      for (let i = availablePubs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availablePubs[i], availablePubs[j]] = [availablePubs[j], availablePubs[i]];
      }

      while (availablePubs.length > 0 && remainingVisits > 0) {
        const dayVisits = availablePubs.splice(0, remainingVisits);
        if (dayVisits.length === 0) continue;

        const visits: ScheduleVisit[] = [];
        let totalMileage = 0;
        let totalDriveTime = 0;

        // Calculate metrics
        const firstPubMetrics = calculateDistance(homeAddress, dayVisits[0].zip || '');
        totalMileage += firstPubMetrics.mileage;
        totalDriveTime += firstPubMetrics.driveTime;

        dayVisits.forEach((pub, index) => {
          const visit: ScheduleVisit = { ...pub };
          
          if (index < dayVisits.length - 1) {
            const nextPub = dayVisits[index + 1];
            const metrics = calculateDistance(pub.zip || '', nextPub.zip || '');
            visit.mileageToNext = metrics.mileage;
            visit.driveTimeToNext = metrics.driveTime;
            totalMileage += metrics.mileage;
            totalDriveTime += metrics.driveTime;
          }
          
          visits.push(visit);
          scheduledPubs.add(pub.pub);
        });
        
        // Reset remaining visits for next day
        if (visits.length > 0) {
          remainingVisits = visitsPerDay;
        }

        const lastPubMetrics = calculateDistance(
          dayVisits[dayVisits.length - 1].zip || '',
          homeAddress
        );
        totalMileage += lastPubMetrics.mileage;
        totalDriveTime += lastPubMetrics.driveTime;

        const schedulingErrors: string[] = [];
        
        // Check if we have fewer visits than requested
        if (dayVisits.length < visitsPerDay) {
          schedulingErrors.push(
            `Only ${dayVisits.length} visits scheduled (target: ${visitsPerDay})`
          );
        }

        dayVisits.forEach(visit => {
          if (visit.deadline) {
            const deadlineDate = new Date(visit.deadline);
            const visitDate = new Date(currentDate);
            if (visitDate > deadlineDate) {
              schedulingErrors.push(
                `${visit.pub} scheduled after deadline (${format(deadlineDate, 'MMM d, yyyy')})`
              );
            }
          }
        });

        groupSchedule.push({
          date: format(currentDate, 'yyyy-MM-dd'),
          visits,
          totalMileage,
          totalDriveTime,
          startMileage: firstPubMetrics.mileage,
          startDriveTime: firstPubMetrics.driveTime,
          endMileage: lastPubMetrics.mileage,
          endDriveTime: lastPubMetrics.driveTime,
          ...(schedulingErrors.length > 0 && { schedulingErrors })
        });

        currentDate = addBusinessDays(currentDate, 1);
      }
    }

    return [groupSchedule, currentDate];
  };

  let currentDate = startDate;
  let remainingDays = businessDays;

  // Process deadline pubs first to ensure they're scheduled
  if (priorityGroups.deadline.length > 0) {
    const [deadlineSchedule, newDate] = await processGroup(priorityGroups.deadline, currentDate);
    schedule.push(...deadlineSchedule);
    currentDate = newDate;
    remainingDays -= deadlineSchedule.length;
  }

  // Process each priority group in order
  for (const group of ['recentWin', 'wishlist', 'unvisited', 'other']) {
    if (remainingDays <= 0) break;
    
    const groupPubs = priorityGroups[group as keyof typeof priorityGroups];
    if (groupPubs.length === 0) continue;
    
    const [groupSchedule, newDate] = await processGroup(groupPubs, currentDate);
    schedule.push(...groupSchedule);
    
    currentDate = newDate;
    remainingDays -= groupSchedule.length;
  }
  
  console.debug('Schedule planning complete:', {
    daysGenerated: schedule.length,
    totalVisits: schedule.reduce((acc, day) => acc + day.visits.length, 0)
  });

  return schedule;
};