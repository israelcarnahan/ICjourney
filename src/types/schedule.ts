import { LucideIcon } from "lucide-react";

export interface Visit {
  id: string;
  pubName: string;
  postcode: string;
  priority: string;
  lastVisitDate: string | null;
  visitTime: number;
  notes?: string;
}

export interface ScheduleDay {
  date: string;
  visits: Visit[];
  isExpanded: boolean;
  desiredEndTime?: string;
}

export interface EnhancedScheduleDay extends ScheduleDay {
  totalDriveTime: number;
  startDriveTime: number;
  endDriveTime: number;
  totalMileage: number;
}

export interface ScheduleEntry {
  date: string;
  visitId: string;
  time: string;
  notes?: string;
}

export interface VehicleTypeMap {
  [key: string]: LucideIcon | React.FC<any>;
}

export interface VehicleColorMap {
  [key: string]: string;
}

export interface DriveTimeMetrics {
  totalMileage: number;
  totalDriveTime: number;
  startDriveTime: number;
  endDriveTime: number;
}

export interface ScheduleOptimizationResult {
  optimizedVisits: Visit[];
  metrics: DriveTimeMetrics;
}
