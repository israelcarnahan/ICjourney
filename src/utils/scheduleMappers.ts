import { toArray, coerceString } from "./typeGuards";
import { Pub, ScheduleDay } from "../context/PubDataContext";

// Type for the loose schedule data that comes from planVisits
export type DaySchedule = {
  date?: string;
  visits?: Pub[] | undefined;
  totalMileage?: number;
  totalDriveTime?: number;
  startMileage?: number;
  startDriveTime?: number;
  endMileage?: number;
  endDriveTime?: number;
  schedulingErrors?: string[];
};

// Map DaySchedule (loose) -> ScheduleDay (strict)
export const toScheduleDay = (d: DaySchedule): ScheduleDay => ({
  date: coerceString(d.date, ''),
  visits: toArray(d.visits).map(visit => ({
    ...visit,
    // Preserve sourceLists and schedulingMode from Pub objects
    sourceLists: (visit as any).sourceLists || [],
    schedulingMode: (visit as any).schedulingMode || undefined,
  })),
  pub: '', // Default empty string for pub field
  arrival: new Date(),
  departure: new Date(),
  businessHours: { openTime: '09:00', closeTime: '17:00' },
  Priority: 'Unvisited',
  mileageToNext: 0,
  driveTimeToNext: 0,
  uuid: '',
  fileId: '',
  fileName: '',
  listType: 'masterhouse',
  totalMileage: d.totalMileage ?? 0,
  totalDriveTime: d.totalDriveTime ?? 0,
  startMileage: d.startMileage ?? 0,
  startDriveTime: d.startDriveTime ?? 0,
  endMileage: d.endMileage ?? 0,
  endDriveTime: d.endDriveTime ?? 0,
  schedulingErrors: d.schedulingErrors,
});

// Bulk mapper with filtering of obviously broken entries
export const toScheduleDays = (days: DaySchedule[] | undefined): ScheduleDay[] =>
  toArray(days).map(toScheduleDay).filter(sd => sd.date && sd.date.length > 0);
