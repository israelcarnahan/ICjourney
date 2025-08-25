import { ScheduleDay } from '../context/PubDataContext';
import { createEvents } from 'ics';
import { parseISO, addHours, format } from 'date-fns';
import { toArray } from './typeGuards';
import { formatPriorityForUser } from './sourceDetails';

// helper to satisfy ics DateTime tuple typing
type DateTuple = [number, number, number, number, number];
const toDateTuple = (d: Date): DateTuple => [
  d.getFullYear(),
  d.getMonth() + 1,
  d.getDate(),
  d.getHours(),
  d.getMinutes(),
];

export const generateICSFile = (schedule: ScheduleDay[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const events = toArray(schedule).flatMap(day => {
      const startDate = parseISO(String(day?.date ?? ''));
      return toArray(day?.visits).map((visit: any, index: number) => {
        // Start at 9 AM and each visit is 1 hour
        const visitStartTime = addHours(startDate, 9 + index);
        const visitEndTime = addHours(visitStartTime, 1);

        const isLast = index === toArray(day?.visits).length - 1;
        const driveInfo = isLast
          ? `\nDrive home: ${day?.endMileage?.toFixed(1) ?? '0'} mi / ${day?.endDriveTime ?? 0} mins`
          : visit?.mileageToNext
            ? `\nDrive to next: ${visit.mileageToNext.toFixed(1)} mi / ${visit.driveTimeToNext} mins`
            : '';

        return {
          start: toDateTuple(visitStartTime),
          end: toDateTuple(visitEndTime),
          title: `Visit: ${visit?.pub ?? 'Unknown'}`,
          description: `Priority: ${formatPriorityForUser(visit) || visit?.Priority || 'Unknown'}\nPostcode: ${visit?.zip ?? ''}${driveInfo}`,
          location: visit?.zip ?? ''
        };
      });
    });

    createEvents(events, (error, value) => {
      if (error) {
        reject(error);
      }
      resolve(value);
    });
  });
};

export const downloadICSFile = async (schedule: ScheduleDay[]) => {
  try {
    const icsContent = await generateICSFile(schedule);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `pub_visits_${format(new Date(), 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error generating calendar file:', error);
    throw error;
  }
};