import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Pub, ScheduleDay } from '../context/PubDataContext';
import { extractNumericPart } from '../utils/scheduleUtils';
import * as Tooltip from '@radix-ui/react-tooltip';

interface CoverageHeatMapProps {
  schedule: ScheduleDay[];
  allPubs: Pub[];
}

const CoverageHeatMap: React.FC<CoverageHeatMapProps> = ({ schedule, allPubs }) => {
  const coverage = useMemo(() => {
    const areas = new Map<string, {
      total: number;
      scheduled: number;
      kpi: number;
      wishlist: number;
      unvisited: number;
    }>();

    // Process all pubs to get totals
    allPubs.forEach(pub => {
      if (!pub.zip) return;
      const [prefix] = extractNumericPart(pub.zip);
      if (!areas.has(prefix)) {
        areas.set(prefix, { total: 0, scheduled: 0, kpi: 0, wishlist: 0, unvisited: 0 });
      }
      const areaStats = areas.get(prefix)!;
      areaStats.total++;
      if (pub.Priority === 'KPI') areaStats.kpi++;
      if (pub.Priority === 'Wishlist') areaStats.wishlist++;
      if (pub.Priority === 'Unvisited') areaStats.unvisited++;
    });

    // Process scheduled pubs
    schedule.forEach(day => {
      day.visits.forEach(visit => {
        if (!visit.zip) return;
        const [prefix] = extractNumericPart(visit.zip);
        if (areas.has(prefix)) {
          areas.get(prefix)!.scheduled++;
        }
      });
    });

    return Array.from(areas.entries())
      .sort(([a], [b]) => a.localeCompare(b));
  }, [schedule, allPubs]);

  const getHeatColor = (scheduled: number, total: number) => {
    const percentage = (scheduled / total) * 100;
    if (percentage >= 75) return 'bg-green-900/30 border-green-700/50';
    if (percentage >= 50) return 'bg-blue-900/30 border-blue-700/50';
    if (percentage >= 25) return 'bg-yellow-900/30 border-yellow-700/50';
    return 'bg-red-900/30 border-red-700/50';
  };

  return (
    <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-neon-purple" />
        <h3 className="text-lg font-semibold text-eggplant-100">Territory Coverage</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {coverage.map(([area, stats]) => (
          <Tooltip.Provider key={area}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <div 
                  className={`
                    ${getHeatColor(stats.scheduled, stats.total)}
                    p-3 rounded-lg border cursor-help
                    transition-all duration-300
                    hover:scale-105
                  `}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-eggplant-100">{area}</div>
                    <div className="text-sm text-eggplant-200">
                      {stats.scheduled}/{stats.total}
                    </div>
                  </div>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg"
                  sideOffset={5}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{area} Area Coverage</p>
                    <p>Scheduled: {stats.scheduled} of {stats.total}</p>
                    <div className="text-xs space-y-1">
                      <p className="text-red-300">KPI Targets: {stats.kpi}</p>
                      <p className="text-blue-300">Wishlist: {stats.wishlist}</p>
                      <p className="text-green-300">Unvisited: {stats.unvisited}</p>
                    </div>
                  </div>
                  <Tooltip.Arrow className="fill-dark-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        ))}
      </div>

      <div className="flex justify-center mt-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-900/30 border border-red-700/50"></div>
          <span className="text-xs text-eggplant-200">0-25%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-900/30 border border-yellow-700/50"></div>
          <span className="text-xs text-eggplant-200">25-50%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-900/30 border border-blue-700/50"></div>
          <span className="text-xs text-eggplant-200">50-75%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-900/30 border border-green-700/50"></div>
          <span className="text-xs text-eggplant-200">75-100%</span>
        </div>
      </div>
    </div>
  );
};

export default CoverageHeatMap;