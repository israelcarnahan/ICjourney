import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { usePubData } from '../context/PubDataContext';
import * as Tooltip from '@radix-ui/react-tooltip';

const ScheduleReport: React.FC = () => {
  const { 
    userFiles,
    schedule 
  } = usePubData();

  // Get all scheduled pubs
  const scheduledPubs = schedule.flatMap(day => day.visits);

  // Calculate statistics for each priority level
  const stats = {
    RepslyWin: {
      total: userFiles.pubs.filter(pub => pub.listType === 'wins').length,
      scheduled: scheduledPubs.filter(pub => pub?.Priority === 'RepslyWin').length,
      get remaining() { return this.total - this.scheduled },
      get isExhausted() { return this.remaining === 0 && this.total > 0 }
    },
    Wishlist: {
      total: userFiles.pubs.filter(pub => pub.listType === 'hitlist').length,
      scheduled: scheduledPubs.filter(pub => pub?.Priority === 'Wishlist').length,
      get remaining() { return this.total - this.scheduled },
      get isExhausted() { return this.remaining === 0 && this.total > 0 }
    },
    Unvisited: {
      total: userFiles.pubs.filter(pub => pub.listType === 'unvisited').length,
      scheduled: scheduledPubs.filter(pub => pub?.Priority === 'Unvisited').length,
      get remaining() { return this.total - this.scheduled },
      get isExhausted() { return this.remaining === 0 && this.total > 0 }
    },
    Masterfile: {
      total: userFiles.pubs.filter(pub => pub.listType === 'masterhouse').length,
      scheduled: scheduledPubs.filter(pub => pub?.Priority === 'Masterfile').length,
      get remaining() { return this.total - this.scheduled },
      get isExhausted() { return this.remaining === 0 && this.total > 0 }
    }
  };

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

  const getPriorityLabel = (type: keyof typeof stats) => {
    switch (type) {
      case 'RepslyWin':
        return 'Recent Wins';
      case 'Wishlist':
        return 'Priority 1';
      case 'Unvisited':
        return 'Priority 2';
      case 'Masterfile':
        return 'Priority 3';
    }
  };

  if (!schedule.length) return null;

  return (
    <>
      {(['RepslyWin', 'Wishlist', 'Unvisited', 'Masterfile'] as const).map(type => (
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
                      {getPriorityLabel(type)}
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
                  <p className="font-medium mb-1">{type === 'RepslyWin' ? 'Recent Wins' : `${type} Pubs`}</p>
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