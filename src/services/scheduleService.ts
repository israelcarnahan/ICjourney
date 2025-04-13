import {
  Visit,
  ScheduleDay,
  EnhancedScheduleDay,
  ScheduleEntry,
} from "../types/schedule";
import { recalculateMetrics, getScheduleTimes } from "../utils/scheduleUtils";
import { optimizeRoute } from "../utils/routeOptimization";

export class ScheduleService {
  private homeAddress: string;

  constructor(homeAddress: string) {
    this.homeAddress = homeAddress;
  }

  /**
   * Enhances a schedule day with calculated metrics
   * @param day - Schedule day to enhance
   * @returns Enhanced schedule day with metrics
   */
  public enhanceScheduleDay(day: ScheduleDay): EnhancedScheduleDay {
    try {
      const metrics = recalculateMetrics(
        day.visits,
        this.homeAddress,
        day.desiredEndTime
      );
      return {
        ...day,
        ...metrics,
      };
    } catch (error) {
      console.error("Error enhancing schedule day:", error);
      throw new Error("Failed to enhance schedule day");
    }
  }

  /**
   * Updates a visit in the schedule
   * @param day - Schedule day containing the visit
   * @param entry - Visit entry to update
   * @returns Updated schedule day
   */
  public updateVisit(day: ScheduleDay, entry: ScheduleEntry): ScheduleDay {
    try {
      const updatedVisits = day.visits.map((visit) => {
        if (visit.id === entry.visitId) {
          return {
            ...visit,
            scheduledTime: entry.time,
            notes: entry.notes,
          };
        }
        return visit;
      });

      return {
        ...day,
        visits: updatedVisits,
      };
    } catch (error) {
      console.error("Error updating visit:", error);
      throw new Error("Failed to update visit");
    }
  }

  /**
   * Optimizes the schedule for a given day
   * @param day - Schedule day to optimize
   * @returns Optimized schedule day
   */
  public async optimizeSchedule(day: ScheduleDay): Promise<ScheduleDay> {
    try {
      const optimizedVisits = await optimizeRoute(day.visits, this.homeAddress);
      return {
        ...day,
        visits: optimizedVisits,
      };
    } catch (error) {
      console.error("Error optimizing schedule:", error);
      throw new Error("Failed to optimize schedule");
    }
  }

  /**
   * Removes a visit from the schedule
   * @param day - Schedule day containing the visit
   * @param visitId - ID of the visit to remove
   * @returns Updated schedule day
   */
  public removeVisit(day: ScheduleDay, visitId: string): ScheduleDay {
    try {
      const updatedVisits = day.visits.filter((visit) => visit.id !== visitId);
      return {
        ...day,
        visits: updatedVisits,
      };
    } catch (error) {
      console.error("Error removing visit:", error);
      throw new Error("Failed to remove visit");
    }
  }
}
