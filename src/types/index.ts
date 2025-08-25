export interface Visit {
  pub: string;
  zip: string;
  Priority: string;
  uuid: string;
  fileId: string;
  fileName: string;
  listType: string;
  deadline?: string;
  priorityLevel?: number;
  followUpDays?: number;
  mileageToNext: number;
  driveTimeToNext: number;
  last_visited?: string;
  rtm?: string;
  landlord?: string;
  notes?: string;
  scheduledTime?: string;
  optimizedTime?: string;
  visitNotes?: string;
  uploadTime?: number;
  
  // Lineage fields (optional for backward compatibility)
  sources?: Array<{
    sourceId: string;
    fileId: string;
    fileName: string;
    rowIndex: number;
    schedulingMode?: 'priority' | 'deadline' | 'followup';
    priority?: number;
    deadline?: string;
    followUpDays?: number;
    mapped: Record<string, string>;
    extras: Record<string, string>;
  }>;
  fieldValuesBySource?: Record<string, Array<{ sourceId: string; value: string }>>;
  mergedExtras?: Record<string, Array<{ sourceId: string; value: string }>>;
  effectivePlan?: {
    deadline?: string;
    priorityLevel?: number;
    followUpDays?: number;
    listNames: string[];
  };
}

export interface BusinessHours {
  openTime: string;
  closeTime: string;
}

export interface ScheduleDay {
  date: string;
  visits: Visit[];
  totalMileage: number;
  totalDriveTime: number;
  startMileage: number;
  endMileage: number;
  startDriveTime: number;
  endDriveTime: number;
  schedulingErrors?: string[];
  pub: string;
  arrival: Date;
  departure: Date;
  businessHours: BusinessHours;
  Priority: string;
  mileageToNext: number;
  driveTimeToNext: number;
  uuid: string;
  fileId: string;
  fileName: string;
  listType: string;
}

export interface ScheduleEntry {
  pub: string;
  arrival: Date;
  departure: Date;
  driveTime: number;
  isScheduled: boolean;
}

export interface OpeningHoursMap {
  [key: string]: {
    isOpen: boolean;
    error?: string;
  };
}
