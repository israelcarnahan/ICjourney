import React from 'react';
import { Clock } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import clsx from 'clsx';
import { getMockPlaceData } from '../utils/mockData';

interface OpeningHoursIndicatorProps {
  pub: string;
  postcode: string;
}

const OpeningHoursIndicator: React.FC<OpeningHoursIndicatorProps> = ({ 
  pub,
  // postcode
}) => {
  const mockData = getMockPlaceData(pub || 'Unknown Pub');
  const isOpen = true; // Simplified for demo
  const openTime = '09:00';
  const closeTime = '23:00';
  const hours = mockData.openingHours.join('\n');

  const getStatusText = () => {
    if (!isOpen && openTime) return `Opens too late (${openTime})`;
    if (!isOpen) return 'Closed';
    return `Open until ${closeTime}`;
  };

  const getTooltipContent = () => {
    if (!isOpen && openTime) {
      return `Opens at ${openTime}, which is too late for scheduling visits.\nFull schedule:\n${hours}`;
    }
    if (!isOpen) return 'Opening hours not available';
    return `Currently open (${openTime} - ${closeTime})\n\nFull schedule:\n${hours}`;
  };

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className={clsx(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
            {
              'bg-green-900/20 text-green-200 border border-green-700/50': isOpen,
              'bg-red-900/20 text-red-200 border border-red-700/50': !isOpen
            }
          )}>
            <Clock className="h-3 w-3" />
            <span>{getStatusText()}</span>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg max-w-xs whitespace-pre-line"
            sideOffset={5}
          >
            {getTooltipContent()}
            <Tooltip.Arrow className="fill-dark-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default OpeningHoursIndicator