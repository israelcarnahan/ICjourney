import { format } from 'date-fns';
import { mapsService } from '../config/maps';
import { devLog } from './devLog';

type PlaceDetailsLike = {
  error?: unknown;
  currentPeriod?: { open: string; close: string };
  isOpen?: boolean;
  openingHours?: string[];
  openNow?: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const checkPubOpeningHours = async (pubName: string): Promise<{
  isOpen: boolean;
  hours?: string;
  error?: string;
  openTime?: string;
  closeTime?: string;
}> => {
  if (!pubName) {
    return {
      isOpen: false,
      error: 'Missing pub name'
    };
  }

  try {
    await mapsService.initialize();
    
    // Format search query to improve matching
    const cleanPubName = pubName.toLowerCase()
      .replace(/^the\s+/i, '')           // Remove leading "The"
      .replace(/\s*pub\s*$/i, '')        // Remove trailing "pub"
      .replace(/[^\w\s-]/g, ' ')         // Replace special chars with spaces
      .replace(/\s+/g, ' ')              // Normalize spaces
      .trim()
      .split(' ')
      .slice(0, 3)                       // Take first 3 words max
      .join(' ');
    
    // Construct a cleaner search query
    const searchQuery = `${cleanPubName} pub UK`;
    devLog('Searching for pub:', { query: searchQuery });

    const placeDetails = await mapsService.getPlaceDetails(searchQuery);
    const details: PlaceDetailsLike = isRecord(placeDetails)
      ? placeDetails as PlaceDetailsLike
      : {};
    const errorValue = details.error;
    const errorMessage =
      typeof errorValue === 'string'
        ? errorValue
        : errorValue != null
          ? String(errorValue)
          : undefined;

    if (errorMessage) {
      devLog('Place details error:', errorMessage);
      return {
        isOpen: false,
        hours: 'Hours not available',
        error: errorMessage
      };
    }

    devLog('Place details received:', placeDetails);

    // Use current period if available
    if (details.currentPeriod) {
      // const now = new Date(); // TODO: Use for time-based checks
      const openHour = parseInt(details.currentPeriod.open.split(':')[0]);
      
      // Check if pub opens too late for scheduling
      const opensTooLate = openHour > 17 || (openHour === 17 && parseInt(details.currentPeriod.open.split(':')[1]) > 30);
      
      return {
        isOpen: Boolean(details.isOpen) && !opensTooLate,
        hours: details.openingHours?.join('\n') || 'Full schedule not available',
        openTime: details.currentPeriod.open,
        closeTime: details.currentPeriod.close
      };
    }
    // Fall back to parsing weekday text
    else if (details.openingHours?.length) {
      const today = format(new Date(), 'EEEE');
      const todayHours = details.openingHours?.find(day => 
        day.toLowerCase().startsWith(today.toLowerCase())
      );

      if (todayHours) {
        const [, hours = ''] = todayHours.split(/:\s+/);
        const [openTime = '', closeTime = ''] = (hours || '').split(' - ');

        return {
          isOpen: details.openNow ?? false,
          hours: details.openingHours.join('\n'),
          openTime,
          closeTime
        };
      }
    }

    // No opening hours data available
    return {
      isOpen: false,
      hours: 'Hours not available',
      error: 'Opening hours not available'
    };
  } catch (error) {
    devLog('Error checking pub opening hours:', error);
    return {
      isOpen: false,
      hours: 'Hours not available',
      error: 'Error checking opening hours'
    };
  }
};
