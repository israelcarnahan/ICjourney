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

export interface MapboxGeocodingResponse {
  type: "FeatureCollection";
  query: string[];
  features: Array<{
    id: string;
    type: "Feature";
    place_name: string;
    relevance: number;
    properties: {
      accuracy: string;
    };
    text: string;
    place_type: string[];
    center: [number, number]; // [lng, lat]
    geometry: {
      type: "Point";
      coordinates: [number, number]; // [lng, lat]
    };
    context: Array<{
      id: string;
      text: string;
      wikidata?: string;
      short_code?: string;
    }>;
  }>;
  attribution: string;
}

export interface MapboxDirectionsResponse {
  routes: Array<{
    distance: number; // meters
    duration: number; // seconds
    geometry: {
      coordinates: Array<[number, number]>; // [lng, lat]
      type: "LineString";
    };
    legs: Array<{
      distance: number;
      duration: number;
      summary: string;
      steps: Array<{
        distance: number;
        duration: number;
        geometry: {
          coordinates: Array<[number, number]>;
          type: "LineString";
        };
        maneuver: {
          type: string;
          instruction: string;
          bearing_after: number;
          location: [number, number];
        };
      }>;
    }>;
  }>;
  waypoints: Array<{
    distance: number;
    name: string;
    location: [number, number];
  }>;
  code: string;
  uuid: string;
}

export interface BusinessDetails {
  phone: string;
  email: string;
  openingHours: BusinessHours;
  googleRating: number;
  reviewCount: number;
  website?: string;
}

export interface EnhancedBusinessDetails {
  phone: string;
  email: string;
  openingHours: {
    periods: Array<{
      open: {
        day: number;
        time: string;
      };
      close: {
        day: number;
        time: string;
      };
    }>;
    weekday_text: string[];
  };
  rating: {
    google: {
      stars: number; // 1-5
      count: number;
    };
    yelp?: {
      stars: number;
      count: number;
    };
  };
  website?: string;
  photos?: string[];
  reviews?: Array<{
    author: string;
    rating: number;
    text: string;
    time: string;
  }>;
}
