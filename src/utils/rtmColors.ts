export const getRtmColor = (rtm: string | undefined): string => {
  if (!rtm) return '#6B7280'; // Default gray

  const normalizedRtm = rtm.toLowerCase().trim();
  
  if (normalizedRtm.includes('greene king')) {
    return normalizedRtm.includes('ift') ? '#2F6D0F' : '#16A34A'; // Made GK IFT darker
  }
  if (normalizedRtm.includes('admiral')) return '#DC2626';
  if (normalizedRtm.includes('punch')) return '#71717A';
  if (normalizedRtm.includes('stonegate')) return '#2563EB';
  if (normalizedRtm.includes('trust')) return '#F97316'; // Bright orange
  
  // Add more RTM mappings as needed
  return '#6B7280'; // Default gray for unknown RTMs
};