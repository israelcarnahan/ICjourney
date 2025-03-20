import { format } from 'date-fns';
import { mapsService } from '../config/maps';

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
    console.debug('Searching for pub:', { query: searchQuery });

    const placeDetails = await mapsService.getPlaceDetails(searchQuery);

    if (placeDetails.error) {
      console.debug('Place details error:', placeDetails.error);
      return {
        isOpen: false,
        hours: 'Hours not available',
        error: placeDetails.error
      };
    }

    console.debug('Place details received:', placeDetails);

    // Use current period if available
    if (placeDetails.currentPeriod) {
      const now = new Date();
      const openHour = parseInt(placeDetails.currentPeriod.open.split(':')[0]);
      
      // Check if pub opens too late for scheduling
      const opensTooLate = openHour > 17 || (openHour === 17 && parseInt(placeDetails.currentPeriod.open.split(':')[1]) > 30);
      
      return {
        isOpen: placeDetails.isOpen && !opensTooLate,
        hours: placeDetails.openingHours?.join('\n') || 'Full schedule not available',
        openTime: placeDetails.currentPeriod.open,
        closeTime: placeDetails.currentPeriod.close
      };
    }
    // Fall back to parsing weekday text
    else if (placeDetails.openingHours?.length) {
      const today = format(new Date(), 'EEEE');
      const todayHours = placeDetails.openingHours?.find(day => 
        day.toLowerCase().startsWith(today.toLowerCase())
      );

      if (todayHours) {
        const [, hours = ''] = todayHours.split(/:\s+/);
        const [openTime = '', closeTime = ''] = (hours || '').split(' - ');

        return {
          isOpen: placeDetails.openNow ?? false,
          hours: placeDetails.openingHours.join('\n'),
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
    console.error('Error checking pub opening hours:', error);
    return {
      isOpen: false,
      hours: 'Hours not available',
      error: 'Error checking opening hours'
    };
  }
};