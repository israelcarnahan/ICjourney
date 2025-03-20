import { mapsService } from '../services/maps';

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

export default getMockPlaceData