import { ScheduleDay } from '../context/PubDataContext';
import { createEvents } from 'ics';
import { parseISO, addHours, format } from 'date-fns';

export const generateICSFile = (schedule: ScheduleDay[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const events = schedule.flatMap(day => {
      return day.visits.map((visit, index) => {
        const startDate = parseISO(day.date);
        // Start at 9 AM and each visit is 1 hour
        const visitStartTime = addHours(startDate, 9 + index);
        const visitEndTime = addHours(visitStartTime, 1);

        const driveInfo = index === day.visits.length - 1
          ? `\nDrive home: ${day.endMileage?.toFixed(1)} mi / ${day.endDriveTime} mins`
          : visit.mileageToNext
            ? `\nDrive to next: ${visit.mileageToNext.toFixed(1)} mi / ${visit.driveTimeToNext} mins`
            : '';

        return {
          start: [
            visitStartTime.getFullYear(),
            visitStartTime.getMonth() + 1,
            visitStartTime.getDate(),
            visitStartTime.getHours(),
            visitStartTime.getMinutes()
          ],
          end: [
            visitEndTime.getFullYear(),
            visitEndTime.getMonth() + 1,
            visitEndTime.getDate(),
            visitEndTime.getHours(),
            visitEndTime.getMinutes()
          ],
          title: `Visit: ${visit.pub}`,
          description: `Priority: ${visit.Priority}\nPostcode: ${visit.zip}${driveInfo}`,
          location: visit.zip
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