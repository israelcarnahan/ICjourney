import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, MapPin, Clock, Download, ChevronDown, ChevronUp, AlertTriangle, Trash2 } from 'lucide-react';
import { usePubData } from '../context/PubDataContext';
import * as XLSX from 'xlsx';
import { format, parseISO, isValid, differenceInBusinessDays, addBusinessDays } from 'date-fns';
import SparkleWrapper from './Sparkles';
import ScheduleReport from './ScheduleReport';
import RescheduleDialog from './RescheduleDialog';
import { downloadICSFile } from '../utils/calendarUtils';
import * as Tooltip from '@radix-ui/react-tooltip';
import { checkPubOpeningHours } from '../utils/openingHours';
import OpeningHoursIndicator from './OpeningHoursIndicator';
import clsx from 'clsx';
import RemovePubDialog from './RemovePubDialog';
import { calculateDistance, findNearestPubs, getPriorityOrder } from '../utils/scheduleUtils';
import RouteMap from './RouteMap';
import UnscheduledPubsPanel from './UnscheduledPubsPanel';
import VisitScheduler from './VisitScheduler';

const getPriorityStyles = (priority: string): string => {
  switch (priority) {
    case 'RepslyWin':
      return 'bg-purple-900/20 text-purple-200 border border-purple-700/50';
    case 'Wishlist':
      return 'bg-blue-900/20 text-blue-200 border border-blue-700/50';
    case 'Unvisited':
      return 'bg-green-900/20 text-green-200 border border-green-700/50';
    default:
      return 'bg-gray-900/20 text-gray-200 border border-gray-700/50';
  }
};

const formatDate = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return 'Never';
  
  try {
    if (dateStr instanceof Date) {
      return format(dateStr, 'MMM d, yyyy');
    }

    if (!isNaN(Number(dateStr))) {
      const excelDate = new Date((Number(dateStr) - 25569) * 86400 * 1000);
      if (isValid(excelDate)) {
        return format(excelDate, 'MMM d, yyyy');
      }
    }

    const isoDate = parseISO(dateStr);
    if (isValid(isoDate)) {
      return format(isoDate, 'MMM d, yyyy');
    }

    return 'Never';
  } catch (error) {
    console.warn('Date parsing error:', error);
    return 'Never';
  }
};

const ScheduleDisplay: React.FC = () => {
  const { 
    schedule, 
    setSchedule, 
    userFiles,
    homeAddress 
  } = usePubData();
  
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [openingHours, setOpeningHours] = useState<Record<string, {
    isOpen: boolean;
    hours?: string;
    error?: string;
    openTime?: string;
    closeTime?: string;
  }>>({});
  const [removedPubs, setRemovedPubs] = useState<Record<string, Set<string>>>({});
  const [selectedPub, setSelectedPub] = useState<any>(null);

  const fetchOpeningHours = async (pubName: string, postcode: string) => {
    try {
      const result = await checkPubOpeningHours(pubName);
      setOpeningHours(prev => ({
        ...prev,
        [`${pubName}-${postcode}`]: result
      }));
    } catch (error) {
      console.error('Error fetching opening hours:', error);
      setOpeningHours(prev => ({
        ...prev,
        [`${pubName}-${postcode}`]: {
          isOpen: false,
          error: 'Failed to fetch opening hours'
        }
      }));
    }
  };

  useEffect(() => {
    Object.entries(expandedDays).forEach(([date, isExpanded]) => {
      if (isExpanded) {
        const daySchedule = schedule.find(day => day.date === date);
        if (daySchedule) {
          daySchedule.visits.forEach(visit => {
            const key = `${visit.pub}-${visit.zip}`;
            if (!openingHours[key]) {
              const hours = checkPubOpeningHours(visit.pub);
              if (hours) {
                setOpeningHours(prev => ({
                  ...prev,
                  [key]: {
                    isOpen: hours.isOpen,
                    hours: hours.hours,
                    openTime: hours.openTime,
                    closeTime: hours.closeTime
                  }
                }));
              }
            }
          });
        }
      }
    });
  }, [expandedDays, schedule]);


  const toggleDay = useCallback((date: string) => {
    setExpandedDays(prev => {
      const newState = { ...prev, [date]: !prev[date] };
      
      // Only try to set selected pub if expanding the day
      if (newState[date]) {
        const daySchedule = schedule?.find(day => day?.date === date);
        const firstVisit = daySchedule?.visits?.[0];
        setSelectedPub(firstVisit || null);
      } else {
        setSelectedPub(null);
      }
      
      return newState;
    });
  }, [schedule]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent, date: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDay(date);
    }
  }, [toggleDay]);

  const handleDeleteDay = (dateToDelete: string) => {
    if (window.confirm('Are you sure you want to delete this day from the schedule?')) {
      const updatedSchedule = schedule.filter(day => day.date !== dateToDelete);
      setSchedule(updatedSchedule);
    }
  };

  const findReplacementPub = (dayDate: string, removedPub: any) => {
    // Get all pubs from userFiles
    const allPubs = [
      ...userFiles.pubs.map(pub => ({
        ...pub,
        Priority: pub.listType === 'wins' ? 'RepslyWin' :
                 pub.listType === 'hitlist' ? 'Wishlist' :
                 pub.listType === 'unvisited' ? 'Unvisited' :
                 'Masterfile'
      }))
    ];

    const scheduledPubs = new Set(schedule.flatMap(day => day.visits.map(visit => visit.pub)));
    const dayRemovedPubs = removedPubs[dayDate] || new Set();

    const availablePubs = allPubs.filter(pub => 
      pub && pub.pub && pub.zip && !scheduledPubs.has(pub.pub) && !dayRemovedPubs.has(pub.pub)
    );

    const removedPubPriorityOrder = getPriorityOrder(removedPub);
    const eligiblePubs = availablePubs.filter(pub => 
      getPriorityOrder(pub) <= removedPubPriorityOrder
    );

    if (!removedPub || !removedPub.zip) {
      console.warn('Invalid removed pub:', removedPub);
      return null;
    }

    const nearbyPubs = findNearestPubs(removedPub, eligiblePubs, 10);
    if (!nearbyPubs.length) return null;

    return nearbyPubs.sort((a, b) => {
      const priorityDiff = getPriorityOrder(a) - getPriorityOrder(b);
      if (priorityDiff !== 0) return priorityDiff;

      const distanceA = calculateDistance(removedPub.zip, a.zip).mileage;
      const distanceB = calculateDistance(removedPub.zip, b.zip).mileage;
      return distanceA - distanceB;
    })[0];
  };

  const recalculateMetrics = (visits: any[], homeZip: string) => {
    const visitsWithMetrics = visits.map((visit, index) => {
      if (index === visits.length - 1) {
        return { ...visit, mileageToNext: 0, driveTimeToNext: 0 };
      }

      const nextVisit = visits[index + 1];
      const { mileage, driveTime } = calculateDistance(visit.zip || '', nextVisit.zip || '');
      return { ...visit, mileageToNext: mileage, driveTimeToNext: driveTime };
    });

    const firstPub = visitsWithMetrics[0];
    const lastPub = visitsWithMetrics[visitsWithMetrics.length - 1];
    const startMetrics = calculateDistance(homeZip, firstPub.zip || '');
    const endMetrics = calculateDistance(lastPub.zip || '', homeZip);

    const totalMileage = visitsWithMetrics.reduce((sum, visit) => 
      sum + (visit.mileageToNext || 0), 0) + startMetrics.mileage + endMetrics.mileage;
    
    const totalDriveTime = visitsWithMetrics.reduce((sum, visit) => 
      sum + (visit.driveTimeToNext || 0), 0) + startMetrics.driveTime + endMetrics.driveTime;

    return {
      visits: visitsWithMetrics,
      startMileage: startMetrics.mileage,
      startDriveTime: startMetrics.driveTime,
      endMileage: endMetrics.mileage,
      endDriveTime: endMetrics.driveTime,
      totalMileage,
      totalDriveTime
    };
  };

  const handleRemovePubVisit = (dayDate: string, pubToRemove: string) => {
    setRemovedPubs(prev => ({
      ...prev,
      [dayDate]: new Set([...(prev[dayDate]?.values() || []), pubToRemove])
    }));

    const updatedSchedule = schedule.map(day => {
      if (day.date !== dayDate) return day;

      const pubIndex = day.visits.findIndex(visit => visit.pub === pubToRemove);
      if (pubIndex === -1) return day;

      const removedPub = day.visits[pubIndex];
      const replacementPub = findReplacementPub(dayDate, removedPub);
      
      let updatedVisits = [...day.visits];
      if (replacementPub) {
        updatedVisits[pubIndex] = replacementPub;
      } else {
        updatedVisits = updatedVisits.filter(visit => visit.pub !== pubToRemove);
      }

      const metrics = recalculateMetrics(updatedVisits, homeAddress);

      return {
        ...day,
        ...metrics
      };
    });

    setSchedule(updatedSchedule);
  };

  const handlePubSelect = useCallback((pub: any) => {
    setSelectedPub(pub);
  }, []);

  const exportToExcel = () => {
    const flatSchedule = schedule.flatMap(day => 
      day.visits.map((visit, index) => ({
        Date: day.date,
        'From Home': index === 0 ? `${day.startMileage?.toFixed(1)} mi / ${day.startDriveTime} mins` : '',
        'Pub Name': visit.pub,
        'Post Code': visit.zip,
        'Last Visited': formatDate(visit.last_visited),
        Priority: visit.listType === 'wins' ? 'Recent Win' :
                 visit.listType === 'hitlist' ? 'Hit List' :
                 visit.listType === 'unvisited' ? 'Unvisited' :
                 'Masterhouse',
        'RTM': visit.rtm || '',
        'Landlord': visit.landlord || '',
        'Notes': visit.notes || '',
        'To Next': index === day.visits.length - 1
          ? `To Home: ${day.endMileage?.toFixed(1)} mi / ${day.endDriveTime} mins`
          : visit.mileageToNext
            ? `${visit.mileageToNext.toFixed(1)} mi / ${visit.driveTimeToNext} mins`
            : 'End of day'
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(flatSchedule);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Visit Schedule');
    
    worksheet['!cols'] = [
      { wch: 10 },
      { wch: 20 },
      { wch: 30 },
      { wch: 10 },
      { wch: 12 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 50 },
      { wch: 20 }
    ];
    
    const fileName = `visit_schedule_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (schedule.length === 0) {
    return (
      <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg shadow-md p-8 text-center">
        <h3 className="text-xl font-semibold mb-4 text-eggplant-100">
          Ready to Plan Your Journey?
        </h3>
        <p className="text-eggplant-100 mb-2">
          Start by uploading your pub lists and configuring your schedule settings.
        </p>
        <p className="text-eggplant-200 text-sm">
          We'll help you create an optimized visit schedule with drive times and route information.
        </p>
      </div>
    );
  }

  return (
    <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-eggplant-100 mb-4">Visit Schedule</h2>
        </div>
        <div className="flex gap-2">
          <SparkleWrapper>
            <button
              onClick={() => downloadICSFile(schedule)}
              className="flex items-center bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue text-white px-4 py-2 rounded-md transition-all duration-300 hover:shadow-neon-purple transform hover:scale-105"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Export Calendar
            </button>
          </SparkleWrapper>
          <SparkleWrapper>
            <button
              onClick={exportToExcel}
              className="flex items-center bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue text-white px-4 py-2 rounded-md transition-all duration-300 hover:shadow-neon-purple transform hover:scale-105"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </button>
          </SparkleWrapper>
        </div>
      </div>

      <div className="space-y-4">
        {schedule.map((day, dayIndex) => (
          <div 
            key={`schedule-day-${day.date}-${dayIndex}`}
            className="rounded-lg overflow-hidden border border-eggplant-800/50 shadow-lg relative group"
          >
            <div 
              role="button"
              tabIndex={0}
              className={clsx(
                "bg-gradient-to-r from-eggplant-800/90 via-dark-800/95 to-eggplant-800/90 p-4",
                "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0",
                "cursor-pointer select-none",
                "focus:outline-none focus:ring-2 focus:ring-neon-purple focus:ring-opacity-50"
              )}
              onClick={() => toggleDay(day.date)}
              onKeyDown={(e) => handleKeyPress(e, day.date)}
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-neon-blue mr-2" />
                <h3 className="font-medium text-eggplant-100">{day.date}</h3>
                {day.visits.length < visitsPerDay && (
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <div className="ml-2 p-1 rounded-full bg-yellow-900/20 border border-yellow-700/50 cursor-help">
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-dark-800 text-eggplant-100 px-4 py-3 rounded-lg text-sm shadow-lg max-w-md"
                          sideOffset={5}
                        >
                          <h4 className="font-medium text-yellow-400 mb-2">Insufficient Visits</h4>
                          <p className="text-yellow-200">
                            Only {day.visits.length} visits scheduled for this day (target: {visitsPerDay})
                          </p>
                          <div className="mt-3 pt-2 border-t border-eggplant-800/50">
                            <p className="text-xs text-eggplant-300">
                              Consider adding more visits from nearby pubs to optimize your schedule.
                            </p>
                          </div>
                          <Tooltip.Arrow className="fill-dark-800" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                )}
                {day.visits.some(v => v.scheduledTime || v.visitNotes) && (
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <div className="ml-2 p-1 rounded-full bg-green-900/20 border border-green-700/50 cursor-help">
                          <Clock className="h-4 w-4 text-green-400" />
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-dark-800 text-eggplant-100 px-4 py-3 rounded-lg text-sm shadow-lg max-w-md"
                          sideOffset={5}
                        >
                          <h4 className="font-medium text-green-400 mb-2">Scheduled Visits</h4>
                          <div className="space-y-2">
                            {day.visits.map((visit, i) => (
                              visit.scheduledTime && (
                                <div key={i} className="flex items-start gap-2">
                                  <Clock className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-green-200">{visit.pub}</p>
                                    <p className="text-xs text-eggplant-300">
                                      {visit.scheduledTime} {visit.visitNotes && `- ${visit.visitNotes}`}
                                    </p>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                          <Tooltip.Arrow className="fill-dark-800" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                )}
                {day.schedulingErrors?.length > 0 && (
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <div className="ml-2 p-1 rounded-full bg-yellow-900/20 border border-yellow-700/50 cursor-help">
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-dark-800 text-eggplant-100 px-4 py-3 rounded-lg text-sm shadow-lg max-w-md"
                          sideOffset={5}
                        >
                          <h4 className="font-medium text-neon-purple mb-2">Scheduling Issues</h4>
                          <div className="space-y-2">
                            {day.schedulingErrors.map((error, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <p className="text-yellow-200">{error}</p>
                              </div>
                            ))}
                            <div className="mt-3 pt-2 border-t border-eggplant-800/50">
                              <p className="text-xs text-eggplant-300">
                                These issues may affect route optimization and visit scheduling efficiency.
                                Consider adjusting your schedule settings or adding more pubs to improve coverage.
                              </p>
                            </div>
                          </div>
                          <Tooltip.Arrow className="fill-dark-800" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                )}
              </div>
              
              <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center text-sm text-eggplant-100">
                  <MapPin className="h-4 w-4 mr-1 text-neon-pink" />
                  <span className="hidden sm:inline">{day.totalMileage?.toFixed(1)} miles</span>
                  <span className="sm:hidden">{day.totalMileage?.toFixed(1)}mi</span>
                </div>
                
                <div className="flex items-center text-sm text-eggplant-100">
                  <Clock className="h-4 w-4 mr-1 text-neon-purple" />
                  <span>{day.totalDriveTime}m</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RescheduleDialog 
                    day={day}
                    onReschedule={(newSchedule) => {
                      const updatedSchedule = schedule.map(d => 
                        d.date === day.date ? newSchedule : d
                      );
                      setSchedule(updatedSchedule);
                    }}
                  />
                  
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDay(day.date);
                          }}
                          className={`
                            p-2 rounded-full transition-all duration-300
                            text-red-400 opacity-0 group-hover:opacity-100
                            hover:bg-red-900/20 hover:text-red-300
                          `}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg"
                          sideOffset={5}
                        >
                          Delete this day
                          <Tooltip.Arrow className="fill-dark-800" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                  
                  <button
                    className={clsx(
                      "p-2 rounded-full transition-all duration-300",
                      "hover:bg-eggplant-700/50 text-neon-blue hover:text-neon-purple",
                      "focus:outline-none focus:ring-2 focus:ring-neon-purple focus:ring-opacity-50"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDay(day.date);
                    }}
                    aria-label={expandedDays[day.date] ? "Collapse day" : "Expand day"}
                  >
                    {expandedDays[day.date] ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {expandedDays[day.date] && (
              <>
                <div className="p-4 bg-dark-900/95 backdrop-blur-sm overflow-x-auto">
                  <table className="min-w-full divide-y divide-eggplant-800/30">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">Travel Info</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">Pub</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">Post Code</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">Priority</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">Opening Hours</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">Last Visited</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">RTM</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">Landlord</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-eggplant-800/30">
                      {day.visits.map((visit) => {
                        const hoursKey = `${visit.pub}-${visit.zip}`;
                        const hoursData = openingHours[hoursKey];
                        const visitIndex = day.visits.indexOf(visit);
                        
                        const travelInfo = visitIndex === 0
                          ? `From Home: ${day.startMileage?.toFixed(1)} mi / ${day.startDriveTime} mins`
                          : visitIndex === day.visits.length - 1
                            ? `To Home: ${day.endMileage?.toFixed(1)} mi / ${day.endDriveTime} mins`
                            : visit.mileageToNext
                              ? `Next: ${visit.mileageToNext.toFixed(1)} mi / ${visit.driveTimeToNext} mins`
                              : 'End of day';
                        
                        return (
                          <tr 
                            key={`visit-${day.date}-${visit.pub}-${visit.zip}-${visitIndex}-${dayIndex}`}
                            className={clsx(
                              "hover:bg-eggplant-800/20 transition-colors group cursor-pointer",
                              selectedPub?.pub === visit.pub && "bg-eggplant-800/30"
                            )}
                            onClick={() => handlePubSelect(visit)}
                          >
                            <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">
                              <div className="flex items-center gap-2">
                                <span>{travelInfo}</span>
                                <VisitScheduler
                                  key={`scheduler-${day.date}-${visit.pub}-${visitIndex}-${dayIndex}`}
                                  visit={visit}
                                  date={day.date}
                                  onSchedule={(visitId, time, notes) => {
                                    const updatedSchedule = schedule.map(d => {
                                      if (d.date !== day.date) return d;
                                      return {
                                        ...d,
                                        visits: d.visits.map(v => {
                                          if (v.pub !== visitId) return v;
                                          return {
                                            ...v,
                                            scheduledTime: time,
                                            visitNotes: notes
                                          };
                                        })
                                      };
                                    });
                                    setSchedule(updatedSchedule);
                                  }}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-eggplant-100 relative">
                              <div className="flex items-center justify-between">
                                <span>{visit.pub}</span>
                                <RemovePubDialog
                                  visit={visit}
                                  onConfirm={() => handleRemovePubVisit(day.date, visit.pub)}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">{visit.zip}</td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              
                              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityStyles(visit.Priority)}`}>
                                {visit.Priority}
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <OpeningHoursIndicator
                                pub={visit.pub}
                                postcode={visit.zip}
                              />
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">
                              {formatDate(visit.last_visited)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">{visit.rtm || '-'}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-eggplant-100">{visit.landlord || '-'}</td>
                            <td className="px-4 py-2 text-eggplant-100 max-w-xs truncate">
                              {visit.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-1 gap-4 p-4 bg-dark-900/95">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <RouteMap 
                        day={day} 
                        homeAddress={homeAddress}
                        className="animated-border h-[400px]"
                      />
                    </div>
                    <UnscheduledPubsPanel
                      pubs={userFiles.pubs}
                      selectedPub={selectedPub}
                      scheduledPubs={day.visits}
                      onScheduleAnyway={(pub) => {
                        const daySchedule = schedule.find(d => d.date === day.date);
                        if (!daySchedule) return false;
                        
                        // Check if pub is already scheduled
                        if (daySchedule.visits.some(v => v.pub === pub.pub)) {
                          return false;
                        }
                        
                        // Calculate metrics for the new visit
                        const updatedVisits = [...daySchedule.visits];
                        const lastVisit = updatedVisits[updatedVisits.length - 1];
                        let totalMileage = daySchedule.totalMileage || 0;
                        let totalDriveTime = daySchedule.totalDriveTime || 0;
                        
                        if (updatedVisits.length === 0) {
                          const { mileage, driveTime } = calculateDistance(homeAddress, pub.zip);
                          totalMileage = mileage;
                          totalDriveTime = driveTime;
                        } else {
                          const { mileage, driveTime } = calculateDistance(lastVisit.zip, pub.zip);
                          lastVisit.mileageToNext = mileage;
                          lastVisit.driveTimeToNext = driveTime;
                          totalMileage += mileage;
                          totalDriveTime += driveTime;
                        }
                        
                        const { mileage: mileageToHome, driveTime: driveTimeToHome } = 
                          calculateDistance(pub.zip, homeAddress);
                        
                        const newVisit: ScheduleVisit = {
                          ...pub,
                          Priority: pub.Priority || 'Unvisited',
                          mileageToNext: 0,
                          driveTimeToNext: 0
                        };
                        
                        updatedVisits.push(newVisit);
                        totalMileage += mileageToHome;
                        totalDriveTime += driveTimeToHome;
                        
                        const updatedSchedule = schedule.map(d => {
                          if (d.date !== day.date) return d;
                          return {
                            ...d,
                            visits: updatedVisits,
                            totalMileage,
                            totalDriveTime,
                            endMileage: mileageToHome,
                            endDriveTime: driveTimeToHome
                          };
                        });
                        
                        setSchedule(updatedSchedule);
                        return true;
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleDisplay