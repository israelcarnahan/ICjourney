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
  arrival?: Date;
  departure?: Date;
  businessHours?: {
    openTime: string;
    closeTime: string;
  };
}

export interface BusinessHours {
  [key: string]: {
    isOpen: boolean;
    open?: string;
    close?: string;
  };
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

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Route {
  distance: number;
  duration: number;
  coordinates: Coordinates[];
  trafficDelay: number;
}

export interface ContactInfo {
  phone: string;
  email: string;
  website: string;
  googleRating: number;
  reviewCount: number;
}

export interface Address {
  street: string;
  city: string;
  postcode: string;
}

export interface Pub {
  id: string;
  name: string;
  coordinates: Coordinates;
  businessHours: BusinessHours;
  contactInfo: ContactInfo;
  address: Address;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeocodingResponse {
  lat: number;
  lng: number;
  place_name: string;
  context: Array<{
    id: string;
    text: string;
  }>;
}

export interface DirectionsResponse {
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string;
  legs: Array<{
    distance: number;
    duration: number;
    summary: string;
  }>;
}

export interface BusinessDetails {
  phone: string;
  email: string;
  openingHours: BusinessHours;
  googleRating: number;
  reviewCount: number;
  website?: string;
}
