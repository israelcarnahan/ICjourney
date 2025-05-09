import React, { useState } from "react";
import { Clock, Calendar, Clock4 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { ExtendedPub } from "../context/PubDataContext";
import { format } from "date-fns";
import { getMockPlaceData } from "../utils/mockData";
import { Star } from "lucide-react";

interface ScheduleVisit extends ExtendedPub {
  Priority: string;
  mileageToNext: number;
  driveTimeToNext: number;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - Math.ceil(rating);

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          className="h-3 w-3 fill-neon-purple text-neon-purple"
        />
      ))}
      {hasHalfStar && (
        <div className="relative h-3 w-3">
          <Star className="absolute inset-0 h-3 w-3 fill-neon-purple text-neon-purple clip-path-half" />
          <Star className="absolute inset-0 h-3 w-3 text-eggplant-500" />
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-3 w-3 text-eggplant-500" />
      ))}
    </div>
  );
};

interface VisitSchedulerProps {
  visit: ScheduleVisit;
  date: string;
  onSchedule: (
    date: string,
    visitId: string,
    time: string,
    notes: string
  ) => void;
}

const VisitScheduler: React.FC<VisitSchedulerProps> = ({
  visit,
  date,
  onSchedule,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(
    visit.scheduledTime || "09:00"
  );
  const [isAnytime, setIsAnytime] = useState(visit.scheduledTime === "Anytime");
  const [notes, setNotes] = useState(visit.visitNotes || "");

  const formatTimeDisplay = (timeStr: string | undefined): string => {
    if (!timeStr) return "Not scheduled";
    if (timeStr === "Anytime") return "Anytime";

    try {
      // Create a base date to avoid timezone issues
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Parse time string (HH:mm format)
      const [hours, minutes] = timeStr.split(":");
      const time = new Date(today);
      time.setHours(parseInt(hours, 10), parseInt(minutes, 10));

      // Validate parsed time
      if (isNaN(time.getTime())) {
        return "Not scheduled";
      }

      return format(time, "HH:mm");
    } catch (error) {
      console.warn("Time parsing error:", error);
      return "Not scheduled";
    }
  };

  const validateTimeInput = (time: string): boolean => {
    if (time === "Anytime") return true;
    if (!time) return false;

    try {
      const [hoursStr, minutesStr] = time.split(":");
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      return (
        !isNaN(hours) &&
        !isNaN(minutes) &&
        hours >= 0 &&
        hours < 24 &&
        minutes >= 0 &&
        minutes < 60
      );
    } catch (error) {
      console.warn("Time validation error:", error);
      return false;
    }
  };

  const isOutsideBusinessHours = (timeStr: string): boolean => {
    try {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes;
      return totalMinutes < 9 * 60 || totalMinutes >= 17 * 60;
    } catch (error) {
      console.warn("Time validation error:", error);
      return true;
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setSelectedTime(newTime);
  };

  const handleSchedule = () => {
    try {
      console.log("handleSchedule called", { selectedTime, isAnytime, notes });

      if (!isAnytime) {
        if (!validateTimeInput(selectedTime)) {
          console.warn("Invalid time selected:", selectedTime);
          return;
        }

        if (isOutsideBusinessHours(selectedTime)) {
          if (
            !window.confirm(
              "The selected time is outside business hours (9 AM - 5 PM). Do you want to schedule anyway?"
            )
          ) {
            return;
          }
        }
      }

      console.log("Validation passed, closing dialog");
      // Close the dialog first
      setIsOpen(false);

      console.log("Setting up schedule update");
      // Use setTimeout to ensure the dialog is closed before updating the schedule
      setTimeout(() => {
        const finalTime = isAnytime ? "Anytime" : selectedTime;
        console.log("Executing schedule update", {
          date,
          visitId: visit.pub,
          time: finalTime,
          notes,
        });
        onSchedule(date, visit.pub, finalTime, notes);
      }, 0);
    } catch (error) {
      console.error("Error in handleSchedule:", error);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className={`
            ml-2 p-1 rounded-lg transition-colors
            ${
              visit.scheduledTime
                ? "text-green-400 hover:text-green-300 hover:bg-green-900/20"
                : "text-eggplant-400 hover:text-eggplant-300 hover:bg-eggplant-800/50"
            }
          `}
          aria-label={
            visit.scheduledTime ? "Edit scheduled visit" : "Schedule visit"
          }
        >
          <Clock
            className={`h-4 w-4 ${visit.scheduledTime ? "animate-pulse" : ""}`}
          />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 rounded-lg p-6"
          aria-describedby="visit-scheduler-description"
        >
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-bold text-eggplant-100">
              {visit.scheduledTime ? "Edit Scheduled Visit" : "Schedule Visit"}
            </Dialog.Title>
            <Dialog.Description
              id="visit-scheduler-description"
              className="sr-only"
            >
              {visit.scheduledTime ? "Edit scheduled" : "Schedule"} visit time
              and add notes for {visit.pub} on{" "}
              {format(new Date(date), "MMMM d, yyyy")}.
            </Dialog.Description>
            <Dialog.Close className="text-eggplant-400 hover:text-eggplant-100">
              <Clock className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-neon-purple" />
                <h3 className="font-medium text-eggplant-100">
                  {format(new Date(date), "MMMM d, yyyy")}
                </h3>
              </div>
              <p className="text-sm text-eggplant-200">
                {visit.pub} - {visit.zip}
              </p>
              {(() => {
                const mockData = getMockPlaceData(visit.pub);
                return (
                  <div className="mt-2 space-y-1 text-xs text-eggplant-300">
                    <div className="flex items-center gap-1">
                      <StarRating rating={mockData.rating} />
                      <span>({mockData.totalRatings})</span>
                    </div>
                    <div>
                      <a
                        href={`tel:${mockData.phoneNumber}`}
                        className="hover:text-neon-blue transition-colors"
                      >
                        {mockData.phoneNumber}
                      </a>
                    </div>
                    <div>
                      <a
                        href={`mailto:${mockData.email}`}
                        className="hover:text-neon-pink transition-colors"
                      >
                        {mockData.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Clock className="h-4 w-4 text-neon-purple" />
                      <span className="text-eggplant-200">Business Hours:</span>
                      <span className="text-neon-purple">
                        9:00 AM - 5:00 PM
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-eggplant-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnytime}
                  onChange={(e) => setIsAnytime(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-neon-purple rounded border-eggplant-700 bg-dark-900/50 focus:ring-neon-purple focus:ring-offset-0"
                />
                <Clock4 className="h-4 w-4 text-neon-purple" />
                <span>Flexible Time (Anytime)</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-eggplant-100 mb-2">
                Visit Time
              </label>
              <input
                type="time"
                disabled={isAnytime}
                value={selectedTime}
                onChange={handleTimeChange}
                min="09:00"
                max="17:00"
                className={clsx(
                  "w-full px-3 py-2 bg-dark-900/50 border border-eggplant-700 rounded-lg text-eggplant-100",
                  "focus:border-neon-purple focus:ring-1 focus:ring-neon-purple",
                  isAnytime && "opacity-50 cursor-not-allowed"
                )}
              />
              <div className="mt-1 space-y-1">
                <p className="text-xs text-eggplant-300">
                  Currently scheduled for:{" "}
                  {formatTimeDisplay(visit.scheduledTime)}
                </p>
                {!isAnytime && selectedTime && (
                  <p
                    className={clsx(
                      "text-xs",
                      isOutsideBusinessHours(selectedTime)
                        ? "text-red-400"
                        : "text-green-400"
                    )}
                  >
                    {isOutsideBusinessHours(selectedTime)
                      ? "⚠️ Selected time is outside business hours (9 AM - 5 PM)"
                      : "✓ Selected time is within business hours"}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-eggplant-100 mb-2">
                Visit Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-dark-900/50 border border-eggplant-700 rounded-lg text-eggplant-100 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple h-24 resize-none"
                placeholder="Add any notes about this visit..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Dialog.Close className="px-4 py-2 rounded-lg text-eggplant-100 hover:bg-eggplant-800/50 transition-colors">
              Cancel
            </Dialog.Close>
            <button
              onClick={handleSchedule}
              className="bg-gradient-to-r from-neon-purple to-neon-blue text-white px-4 py-2 rounded-lg font-medium hover:shadow-neon-purple transition-all duration-300"
            >
              Schedule Visit
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export { VisitScheduler };
export default VisitScheduler;
