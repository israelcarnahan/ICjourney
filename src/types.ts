import { Pub } from "./context/PubDataContext";

export interface OpeningHoursResult {
  isOpen: boolean;
  hours?: string;
  error?: string;
  openTime?: string;
  closeTime?: string;
}

export interface OpeningHoursMap {
  [key: string]: OpeningHoursResult;
}

/**
 * @ARCHIVED
 * Reason: Knip flags this symbol as unused (no internal/cross-file references).
 * Status: Roadmap/postpone. Keep for future resurrection.
 * Notes: Intended as a shared business hours model if domain types are consolidated.
 */
interface BusinessHours {
  openTime: string;
  closeTime: string;
}
const archivedBusinessHours: BusinessHours | null = null;
void archivedBusinessHours;


export interface Visit extends Pub {
  driveTimeToNext?: number;
  scheduledTime?: string;
  arrival?: Date;
  departure?: Date;
  Priority: string;
  visitNotes?: string;
}

export interface ScheduleDay {
  date: string;
  visits: Visit[];
  totalDriveTime: number;
  totalMileage: number;
  startDriveTime: number;
  endDriveTime: number;
  schedulingErrors?: string[];
}

