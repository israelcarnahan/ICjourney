import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { usePubData } from '../context/PubDataContext';
import * as Tooltip from '@radix-ui/react-tooltip';
import { getPrimaryDriverLabel } from '../utils/sourceDetails';

const ScheduleReport: React.FC = () => {
  const { 
    userFiles,
    schedule 
  } = usePubData();

  const scheduledPubs = schedule.flatMap(day => day.visits);
  const allPubs = userFiles.pubs || [];

  const bucketConfig = [
    { key: 'visitBy', label: 'Visit By', match: (l: string) => l.startsWith('Visit by ') },
    { key: 'followUp', label: 'Follow Up', match: (l: string) => l.startsWith('Follow-up ') },
    { key: 'priority1', label: 'Priority 1', match: (l: string) => l === 'Priority 1' },
    { key: 'priority2', label: 'Priority 2', match: (l: string) => l === 'Priority 2' },
    { key: 'priority3', label: 'Priority 3', match: (l: string) => l === 'Priority 3' },
    { key: 'master', label: 'Masterfile', match: (l: string) => l === 'Masterfile' },
  ];

  const stats = bucketConfig.reduce((acc, bucket) => {
    const total = allPubs.filter(pub => bucket.match(getPrimaryDriverLabel(pub))).length;
    const scheduled = scheduledPubs.filter(pub => bucket.match(getPrimaryDriverLabel(pub))).length;
    acc[bucket.key] = {
      total,
      scheduled,
      get remaining() { return this.total - this.scheduled; },
      get isExhausted() { return this.remaining === 0 && this.total > 0; },
      label: bucket.label
    };
    return acc;
  }, {} as Record<string, { total: number; scheduled: number; remaining: number; isExhausted: boolean; label: string }>);

  const getStatusColor = (type: keyof typeof stats) => {
    const stat = stats[type];
    if (stat.isExhausted) return 'bg-green-900/20 border-green-700/50 text-green-200';
    if (stat.remaining === stat.total) return 'bg-red-900/20 border-red-700/50 text-red-200';
    return 'bg-yellow-900/20 border-yellow-700/50 text-yellow-200';
  };

  const getStatusIcon = (type: keyof typeof stats) => {
    const stat = stats[type];
    if (stat.isExhausted) return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    if (stat.remaining === stat.total) return <AlertCircle className="h-4 w-4 text-red-400" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
  };

  const getStatusMessage = (type: keyof typeof stats) => {
    const stat = stats[type];
    if (stat.isExhausted) return `All ${stat.total} scheduled`;
    if (stat.remaining === stat.total) return `None scheduled`;
    return `${stat.scheduled}/${stat.total} scheduled`;
  };

  if (!schedule.length) return null;

  return (
    <>
      {(Object.keys(stats) as Array<keyof typeof stats>).map(type => (
        stats[type].total > 0 && (
          <Tooltip.Provider key={type}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <div
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-lg cursor-help ${getStatusColor(type)}`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(type)}
                    <span className="font-medium text-sm whitespace-nowrap">
                      {stats[type].label}
                    </span>
                  </div>
                  <span className="text-sm">
                    {getStatusMessage(type)}
                  </span>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg max-w-xs"
                  sideOffset={5}
                >
                  <p className="font-medium mb-1">{stats[type].label}</p>
                  <p className="text-sm">
                    {stats[type].scheduled} scheduled, {stats[type].remaining} remaining
                    {stats[type].isExhausted && " - All pubs scheduled!"}
                  </p>
                  <Tooltip.Arrow className="fill-dark-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        )
      ))}
    </>
  );
};

export default ScheduleReport;
