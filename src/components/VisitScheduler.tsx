import React, { useState } from "react";
import { Clock, Calendar, Clock4, MapPin, Star, Globe } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { ExtendedPub } from "../context/PubDataContext";
import { format } from "date-fns";


import { useBusinessData } from "../api/useBusinessData";
import { seedFromPub } from "../utils/seedFromPub";

interface ScheduleVisit extends ExtendedPub {
  Priority: string;
  mileageToNext: number;
  driveTimeToNext: number;
}



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

function SourceDetailsPanel({ visitOrPub }: { visitOrPub: any }) {
  const seed = seedFromPub(visitOrPub);
  const businessData = useBusinessData(visitOrPub.pub || visitOrPub.uuid || 'unknown', seed);

  if (!businessData) {
    return (
      <div className="mt-6" data-testid="source-details">
        <h4 className="text-sm font-semibold text-eggplant-100 mb-2">From your lists</h4>
        <p className="text-xs text-eggplant-300">Loading business data...</p>
      </div>
    );
  }

  return (
    <div className="mt-6" data-testid="source-details">
      <h4 className="text-sm font-semibold text-eggplant-100 mb-2">From your lists</h4>
      <p className="text-xs text-eggplant-300 mb-3">This section shows data imported from your files.</p>

      {/* Row of list chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {businessData.sources.map((source, i) => (
          <span key={`${source.listName}-${i}`} className="px-2 py-0.5 rounded-full bg-eggplant-800 text-eggplant-50 text-xs">
            {source.listName}
          </span>
        ))}
      </div>

      {/* Business information from API provider */}
      <div className="space-y-3">
        <details className="rounded-lg bg-eggplant-900/50 border border-eggplant-700/50">
          <summary className="cursor-pointer px-3 py-2 text-eggplant-200 hover:text-white flex items-center gap-2">
            <span className="font-medium">Business Information</span>
            <span className="text-xs text-eggplant-300 flex-shrink-0">• {businessData.sources.length} sources</span>
          </summary>

          <div className="px-3 pb-3 text-sm text-eggplant-100">
            {/* Core business fields */}
            <ul className="grid grid-cols-1 gap-x-6 gap-y-1">
              {businessData.postcode && <li className="break-words"><span className="opacity-70">Postcode:</span> {businessData.postcode}</li>}
              {businessData.address && <li className="break-words"><span className="opacity-70">Address:</span> {businessData.address}</li>}
              {businessData.town && <li className="break-words"><span className="opacity-70">Town/City:</span> {businessData.town}</li>}
              {businessData.phone && <li className="break-words"><span className="opacity-70">Phone:</span> {businessData.phone}</li>}
              {businessData.email && <li className="break-words"><span className="opacity-70">Email:</span> {businessData.email}</li>}
            </ul>

            {businessData.notes && (
              <div className="mt-2">
                <div className="opacity-70 text-xs mb-0.5">Notes</div>
                <div className="p-2 rounded bg-eggplant-900 border border-eggplant-700/40 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                  {businessData.notes}
                </div>
              </div>
            )}

            {/* Extras from all sources */}
            {businessData.extras && Object.keys(businessData.extras).length > 0 && (
              <div className="mt-2">
                <div className="opacity-70 text-xs mb-1">Additional fields from your lists</div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-1">
                  {Object.entries(businessData.extras).map(([k, v]) => (
                    <div key={k} className="break-words">
                      <span className="opacity-70">{k}:</span> <span>{String(v ?? '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
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

  // Get business data from API provider
  const seed = seedFromPub(visit);
  const businessData = useBusinessData(visit.pub || visit.uuid || 'unknown', seed);

  // Debug log when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      console.debug('[dialog-open] fetching business data for', seed);
    }
  }, [isOpen, seed]);

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
    if (!businessData?.isOpenAt) {
      // Fallback to default hours if no business data
      try {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const totalMinutes = hours * 60 + minutes;
        return totalMinutes < 9 * 60 || totalMinutes >= 17 * 60;
      } catch (error) {
        console.warn("Time validation error:", error);
        return true;
      }
    }

    try {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const testDate = new Date();
      testDate.setHours(hours, minutes, 0, 0);
      return !businessData.isOpenAt(testDate);
    } catch (error) {
      console.warn("Time validation error:", error);
      return true;
    }
  };

  const getDirectionsUrl = (): string => {
    if (businessData?.extras?.latitude && businessData?.extras?.longitude) {
      // Use coordinates if available
      const lat = businessData.extras.latitude;
      const lng = businessData.extras.longitude;
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else {
      // Fallback to name and postcode
      const query = [visit.pub, visit.zip].filter(Boolean).join(", ");
      return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
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
           className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[90vh] animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 rounded-lg overflow-hidden flex flex-col"
           aria-describedby="visit-desc"
         >
           <Dialog.Description id="visit-desc" className="sr-only">
             Schedule a visit and add optional notes.
           </Dialog.Description>
          <div className="flex justify-between items-center p-6 pb-4">
                         <Dialog.Title className="text-xl font-bold text-eggplant-100">
               {visit.scheduledTime ? "Edit Scheduled Visit" : "Schedule Visit"}
             </Dialog.Title>
            <Dialog.Close className="text-eggplant-400 hover:text-eggplant-100">
              <Clock className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6">
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
                             {businessData && (
                 <div className="mt-2 space-y-1 text-xs text-eggplant-300">
                   {(() => {
                     const prov = businessData.meta?.provenance || {};
                     const showPhone = prov.phone === 'google' || prov.phone === 'user';
                     const showSite = prov.website === 'google' || prov.website === 'user';
                     const showHours = prov.openingHours === 'google' || prov.openingHours === 'user';
                     
                     return (
                       <>
                         {businessData.phone && showPhone && (
                           <div>
                             <a
                               href={`tel:${businessData.phone}`}
                               className="hover:text-neon-blue transition-colors"
                             >
                               {businessData.phone}
                             </a>
                           </div>
                         )}
                         {businessData.email && (
                           <div>
                             <a
                               href={`mailto:${businessData.email}`}
                               className="hover:text-neon-pink transition-colors"
                             >
                               {businessData.email}
                             </a>
                           </div>
                         )}
                         {(businessData.extras?.website as string) && showSite && (
                           <div>
                             <a
                               href={businessData.extras.website as string}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="hover:text-neon-green transition-colors flex items-center gap-1"
                             >
                               <Globe className="h-3 w-3" />
                               Website
                             </a>
                           </div>
                         )}
                         {(businessData.extras?.google_rating as number) && (
                           <div className="flex items-center gap-1">
                             <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                             <span>{String(businessData.extras.google_rating)}</span>
                             {(businessData.extras?.google_ratings_count as number) && (
                               <span className="text-eggplant-400">
                                 ({String(businessData.extras.google_ratings_count)})
                               </span>
                             )}
                           </div>
                         )}
                         {showHours && (
                           <>
                             {businessData.openingHours && (
                               <div className="flex items-center gap-2 mt-2 text-sm">
                                 <Clock className="h-4 w-4 text-neon-purple" />
                                 <span className="text-eggplant-200">Business Hours:</span>
                                 <span className="text-neon-purple">
                                   {businessData.openingHours.weekly[1] ? 
                                     `${businessData.openingHours.weekly[1][0]} - ${businessData.openingHours.weekly[1][1]}` : 
                                     "Hours vary"
                                   }
                                 </span>
                               </div>
                             )}
                             {(businessData.extras?.google_opening_hours_text as string[]) && (
                               <details className="mt-2">
                                 <summary className="cursor-pointer text-xs text-eggplant-400 hover:text-eggplant-200">
                                   Detailed hours
                                 </summary>
                                 <div className="mt-1 pl-2 text-xs text-eggplant-300">
                                   {(businessData.extras.google_opening_hours_text as string[]).map((day, i) => (
                                     <div key={i}>{day}</div>
                                   ))}
                                 </div>
                               </details>
                             )}
                           </>
                         )}
                         <div className="flex items-center gap-2 mt-2 text-sm">
                           <MapPin className="h-4 w-4 text-neon-purple" />
                           <a
                             href={getDirectionsUrl()}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-neon-blue hover:text-neon-purple transition-colors"
                           >
                             Get Directions
                           </a>
                         </div>
                         {prov.google && (
                           <div className="text-xs text-eggplant-400 mt-2">
                             Some info © Google
                           </div>
                         )}
                       </>
                     );
                   })()}
                 </div>
               )}
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
                                 {!isAnytime && selectedTime && (() => {
                   const prov = businessData?.meta?.provenance || {};
                   const showHours = prov.openingHours === 'google' || prov.openingHours === 'user';
                   return showHours;
                 })() && (
                   <p
                     className={clsx(
                       "text-xs",
                       isOutsideBusinessHours(selectedTime)
                         ? "text-red-400"
                         : "text-green-400"
                     )}
                   >
                     {isOutsideBusinessHours(selectedTime)
                       ? "⚠️ Selected time is outside business hours"
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

            <SourceDetailsPanel visitOrPub={visit} />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-eggplant-700/50">
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
