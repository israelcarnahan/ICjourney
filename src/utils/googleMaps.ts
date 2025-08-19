import { MapsLoader, MAPS_CONFIG } from './mapsLoader';

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
      const loader = MapsLoader.getInstance();
      await loader.load();
      
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

  private handleError(error: unknown): Error {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    if (!((MAPS_CONFIG as any)?.apiKey)) {
      return new Error('Maps JavaScript API key not configured');
    }
    
    if (message.includes('RefererNotAllowed')) {
      return new Error('Domain not authorized for Maps JavaScript API');
    }
    
    if (message.includes('InvalidKey')) {
      return new Error('Invalid Maps JavaScript API key');
    }
    
    if (message.includes('ApiNotActivated')) {
      return new Error('Maps JavaScript API not activated - please enable it in your Google Cloud Console');
    }
    
    if (message.includes('QuotaExceeded')) {
      return new Error('Maps JavaScript API quota exceeded');
    }
    
    return new Error('Failed to load Maps JavaScript API services');
  }
}

export const mapsService = MapsService.getInstance();