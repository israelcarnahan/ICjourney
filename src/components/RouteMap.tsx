import React from 'react';
import { ScheduleDay } from '../context/PubDataContext';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { extractNumericPart } from '../utils/scheduleUtils';
import * as Tooltip from '@radix-ui/react-tooltip';
import clsx from 'clsx';

interface RouteMapProps {
  day: ScheduleDay;
  homeAddress: string;
  className?: string;
}

const RouteMap: React.FC<RouteMapProps> = ({ day, homeAddress, className = '' }) => {
  const [homePrefix] = extractNumericPart(homeAddress);

  const getMapUrl = (addresses: string[]) => {
    const waypoints = addresses.map(addr => {
      if (typeof addr === 'string') {
        return encodeURIComponent(addr);
      }
      return encodeURIComponent(`${addr.pub} ${addr.zip}`);
    }).join('/');
    return `https://www.google.com/maps/dir/${waypoints}`;
  };

  const getAppleMapsUrl = (addresses: string[]) => {
    const formatAddress = (addr: string | { pub: string; zip: string }) => {
      if (typeof addr === 'string') {
        return encodeURIComponent(`UK ${addr}`);
      }
      return encodeURIComponent(`${addr.pub}, ${addr.zip}, UK`);
    };

    const origin = formatAddress(addresses[0]);
    const stops = addresses.slice(1).map(formatAddress);
    
    return `http://maps.apple.com/?saddr=${origin}&daddr=${stops.join('+to:')}`;
  };

  const getWazeUrl = (addresses: string[]) => {
    const formatAddress = (addr: string | { pub: string; zip: string }) => {
      if (typeof addr === 'string') {
        return encodeURIComponent(`UK ${addr}`);
      }
      return encodeURIComponent(`${addr.pub}, ${addr.zip}, UK`);
    };

    // Waze only supports a single destination
    const destination = formatAddress(addresses[1]);
    return `https://www.waze.com/ul?navigate=yes&q=${destination}`;
  };

  const MockMap: React.FC<{ visits: ScheduleVisit[]; homeAddress: string }> = ({ visits, homeAddress }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set up coordinates
      const points = [
        { x: 50, y: canvas.height - 50 }, // Home
        ...visits.map((_, i) => ({
          x: 50 + ((canvas.width - 100) * (i + 1)) / (visits.length + 1),
          y: 50 + Math.sin(i * Math.PI / 2) * (canvas.height - 100) / 2
        })),
        { x: canvas.width - 50, y: canvas.height - 50 } // Back home
      ];

      // Draw route
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point, i) => {
        if (i === points.length - 2) {
          ctx.lineTo(point.x, point.y);
        } else {
          const cp1x = points[i].x + (point.x - points[i].x) * 0.5;
          const cp1y = points[i].y;
          const cp2x = points[i].x + (point.x - points[i].x) * 0.5;
          const cp2y = point.y;
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, point.x, point.y);
        }
      });
      
      // Style the path
      ctx.strokeStyle = '#9d00ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();

      // Draw points
      points.forEach((point, i) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 || i === points.length - 1 ? '#00ffff' : '#ff00ff';
        ctx.fill();
      });
    }, [visits]);

    return (
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="w-full h-[200px] bg-dark-900/50 rounded-lg mb-4"
      />
    );
  };

  return (
    <div className={`w-full rounded-lg overflow-hidden bg-dark-900/50 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-neon-purple" />
          <h3 className="text-lg font-semibold text-eggplant-100">Route Overview</h3>
        </div>
        <div className="flex-1" />
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <a
                href={getMapUrl([homeAddress, ...day.visits, homeAddress])}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-eggplant-800/50 transition-colors text-neon-blue"
              >
                <Navigation className="h-5 w-5" />
              </a>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg"
                sideOffset={5}
              >
                Navigate with Google Maps
                <Tooltip.Arrow className="fill-dark-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <a
                href={getAppleMapsUrl([homeAddress, ...day.visits, homeAddress])}
                className="p-2 rounded-lg hover:bg-eggplant-800/50 transition-colors text-neon-pink"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg"
                sideOffset={5}
              >
                Navigate with Apple Maps
                <Tooltip.Arrow className="fill-dark-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <a
                href={getWazeUrl([homeAddress, ...day.visits, homeAddress])}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-eggplant-800/50 transition-colors text-neon-purple"
              >
                <Navigation className="h-5 w-5 rotate-45" />
              </a>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg"
                sideOffset={5}
              >
                Navigate with Waze
                <Tooltip.Arrow className="fill-dark-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
      
      <div className="space-y-4">
        <div className="bg-eggplant-800/30 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-eggplant-200">Starting Point:</span>
            <span className="text-eggplant-100 font-medium">{homeAddress}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-eggplant-200">Total Visits:</span>
            <span className="text-eggplant-100 font-medium">{day.visits.length}</span>
          </div>
        </div>

        <div className="bg-eggplant-800/30 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-eggplant-200">Total Distance:</span>
            <span className="text-eggplant-100 font-medium">{day.totalMileage?.toFixed(1)} miles</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-eggplant-200">Drive Time:</span>
            <span className="text-eggplant-100 font-medium">{day.totalDriveTime} minutes</span>
          </div>
        </div>

        <div className="bg-eggplant-800/30 rounded-lg p-3">
          <div className="text-sm text-eggplant-200 mb-2">Visit Order:</div>
          <div className="space-y-2">
            {day.visits.map((visit, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-neon-pink/20 border border-neon-pink/50 flex items-center justify-center text-xs text-neon-pink">
                    {index + 1}
                  </span>
                  <span className="text-eggplant-100">{visit.pub}</span>
                </div>
                <span className="text-eggplant-300">{visit.zip}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-eggplant-800/30 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-eggplant-200">Return to:</span>
            <span className="text-eggplant-100 font-medium">{homeAddress}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;