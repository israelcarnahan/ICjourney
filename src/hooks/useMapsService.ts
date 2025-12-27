import { Loader } from '@googlemaps/js-api-loader';

// Environment variables
export const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Initialize Google Maps loader
export const mapsLoader = new Loader({
  apiKey: MAPS_API_KEY,
  version: "weekly",
  libraries: ["places", "geometry"],
  language: 'en-GB',
  region: 'GB',
  retries: 3
});

// Service state management
class MapsService {
  private static instance: MapsService;
  private placesService: google.maps.places.PlacesService | null = null;
  private geocoder: google.maps.Geocoder | null = null;
  private isLoaded = false;
  private loadError: Error | null = null;

  private constructor() {}

  static getInstance(): MapsService {
    if (!MapsService.instance) {
      MapsService.instance = new MapsService();
    }
    return MapsService.instance;
  }

  async initialize(): Promise<void> {
    if (this.loadError) {
      throw this.loadError;
    }

    if (this.isLoaded) {
      return;
    }

    try {
      await mapsLoader.load();
      
      // Initialize services
      const div = document.createElement('div');
      this.placesService = new google.maps.places.PlacesService(div);
      this.geocoder = new google.maps.Geocoder();
      
      this.isLoaded = true;
    } catch (error) {
      this.loadError = this.handleError(error);
      throw this.loadError;
    }
  }

  private handleError(error: unknown): Error {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (!MAPS_API_KEY) {
      return new Error('Maps API key not configured');
    }
    
    if (errorMessage.includes('RefererNotAllowed')) {
      return new Error('Domain not authorized');
    }
    
    if (errorMessage.includes('InvalidKey')) {
      return new Error('Invalid API key');
    }
    
    if (errorMessage.includes('ApiNotActivated')) {
      return new Error('Maps API not activated');
    }
    
    if (errorMessage.includes('QuotaExceeded')) {
      return new Error('API quota exceeded');
    }
    
    return new Error('Failed to load Maps services');
  }

  getPlacesService(): google.maps.places.PlacesService | null {
    return this.placesService;
  }

  getGeocoder(): google.maps.Geocoder | null {
    return this.geocoder;
  }

  isInitialized(): boolean {
    return this.isLoaded;
  }

  hasError(): boolean {
    return this.loadError !== null;
  }

  getError(): Error | null {
    return this.loadError;
  }
}

export const mapsService = MapsService.getInstance();

// Mock data generator
export const getMockPlaceData = (pubName: string) => {
  let seed = pubName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const rating = 3.5 + rand() * 1.5;
  const totalRatings = Math.floor(50 + rand() * 200);
  const phoneNumber = `020 ${Math.floor(1000 + rand() * 9000)} ${Math.floor(1000 + rand() * 9000)}`;
  const openingHours = [
    'Monday: 11:00 AM - 11:00 PM',
    'Tuesday: 11:00 AM - 11:00 PM',
    'Wednesday: 11:00 AM - 11:00 PM',
    'Thursday: 11:00 AM - 11:00 PM',
    'Friday: 11:00 AM - 12:00 AM',
    'Saturday: 11:00 AM - 12:00 AM',
    'Sunday: 12:00 PM - 10:30 PM'
  ];

  const normalizedName = pubName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = `info@${normalizedName}.co.uk`;
  const website = `https://www.${normalizedName}.co.uk`;

  return {
    rating,
    totalRatings,
    phoneNumber,
    email,
    openingHours,
    website
  };
};