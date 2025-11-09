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

export interface BusinessHours {
  openTime: string;
  closeTime: string;
}

export interface ScheduleEntry {
  pub: string;
  arrival: Date;
  departure: Date;
  driveTime: number;
  isScheduled: boolean;
}

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

export interface EnhancedScheduleDay extends ScheduleDay {
  totalMileage: number;
  startMileage: number;
  endMileage: number;
}
