// Placeholder Maps Service
import { devLog } from "../utils/devLog";

type GeocodeStatus = "OK";

interface GeocodeRequest {
  address?: string;
  location?: { lat: number; lng: number };
  region?: string;
  componentRestrictions?: { country?: string };
}

interface GeocodeResult {
  formatted_address?: string;
  geometry?: {
    location?: { lat: number; lng: number };
  };
}

interface Geocoder {
  geocode: (
    request: GeocodeRequest,
    callback: (results: GeocodeResult[], status: GeocodeStatus) => void
  ) => void;
}

interface PlaceDetails {
  isOpen: boolean;
  openNow: boolean;
  openingHours: string[];
  currentPeriod: {
    open: string;
    close: string;
  };
}

class MapsService {
  private static instance: MapsService;
  private initialized = false;

  private constructor() {}

  static getInstance(): MapsService {
    if (!MapsService.instance) {
      MapsService.instance = new MapsService();
    }
    return MapsService.instance;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async initialize(): Promise<void> {
    devLog("Maps service initialization placeholder");
    this.initialized = true;
    return Promise.resolve();
  }

  getGeocoder(): Geocoder {
    // Return a mock geocoder for now
    return {
      geocode: (_request: GeocodeRequest, callback) => {
        // Mock successful geocoding
        callback([], "OK");
      },
    };
  }

  getPlaceDetails(_query: string): PlaceDetails {
    void _query;
    return {
      isOpen: true,
      openNow: true,
      openingHours: [
        "Monday: 9:00 AM – 11:00 PM",
        "Tuesday: 9:00 AM – 11:00 PM",
        "Wednesday: 9:00 AM – 11:00 PM",
        "Thursday: 9:00 AM – 11:00 PM",
        "Friday: 9:00 AM – 11:00 PM",
        "Saturday: 10:00 AM – 11:00 PM",
        "Sunday: 10:00 AM – 10:30 PM",
      ],
      currentPeriod: {
        open: "09:00",
        close: "23:00",
      },
    };
  }

  calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): number {
    // Simple placeholder distance calculation using Euclidean distance
    return Math.sqrt(
      Math.pow(destination.lat - origin.lat, 2) +
        Math.pow(destination.lng - origin.lng, 2)
    );
  }
}

export const mapsService = MapsService.getInstance();
