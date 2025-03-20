import { getMockPlaceData } from '../utils/mockData';

class MapsService {
  private static instance: MapsService;
  private isLoaded = true;

  private constructor() {}

  static getInstance(): MapsService {
    if (!MapsService.instance) {
      MapsService.instance = new MapsService();
    }
    return MapsService.instance;
  }

  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  isInitialized(): boolean {
    return this.isLoaded;
  }

  getPlacesService(): any {
    return {
      findPlaceFromQuery: (request: any, callback: Function) => {
        const mockData = getMockPlaceData(request.query.split(' ')[0]);
        callback([{
          place_id: 'mock-place-id',
          rating: mockData.rating,
          user_ratings_total: mockData.totalRatings
        }], 'OK');
      },
      getDetails: (request: any, callback: Function) => {
        const mockData = getMockPlaceData(request.placeId);
        callback({
          rating: mockData.rating,
          user_ratings_total: mockData.totalRatings,
          formatted_phone_number: mockData.phoneNumber,
          website: mockData.website,
          opening_hours: {
            weekday_text: mockData.openingHours
          }
        }, 'OK');
      }
    };
  }

  getGeocoder(): any {
    return {
      geocode: (request: any, callback: Function) => {
        callback([{
          geometry: {
            location: { lat: () => 51.5074, lng: () => -0.1278 }
          }
        }], 'OK');
      }
    };
  }

  getPlaceDetails(query: string) {
    const mockData = getMockPlaceData(query);
    return {
      isOpen: true,
      openNow: true,
      openingHours: mockData.openingHours,
      currentPeriod: {
        open: '09:00',
        close: '23:00'
      }
    };
  }
}

export const mapsService = MapsService.getInstance();