import React from "react";
import { Calendar, Home, Users, Clock } from "lucide-react";
import { usePubData } from "../context/PubDataContext";
import SparkleWrapper from "./Sparkles";
import CustomDatePicker from "./CustomDatePicker";
import { differenceInBusinessDays, isWeekend } from "date-fns";
import clsx from "clsx";

interface ScheduleSettingsProps {
  onGenerateSchedule: () => void;
  isGenerating: boolean;
  isDisabled?: boolean;
}

const ScheduleSettings: React.FC<ScheduleSettingsProps> = ({
  onGenerateSchedule,
  isGenerating,
  isDisabled = false,
}) => {
  const {
    businessDays,
    setBusinessDays,
    homeAddress,
    setHomeAddress,
    visitsPerDay,
    setVisitsPerDay,
    searchRadius,
    setSearchRadius,
  } = usePubData();

  const [startDate, setStartDate] = React.useState<Date>(new Date());
  const [endDate, setEndDate] = React.useState<Date>(new Date());
  const [error, setError] = React.useState<string | null>(null);

  const handleEndDateChange = (date: Date) => {
    setEndDate(date);
  };

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
  };

  React.useEffect(() => {
    // Keep businessDays in sync with the visible date range (inclusive).
    const days = differenceInBusinessDays(endDate, startDate);
    const addEndDay = days >= 0 && !isWeekend(endDate) ? 1 : 0;
    const inclusiveDays = Math.max(0, days + addEndDay);
    setBusinessDays(inclusiveDays);
  }, [endDate, startDate, setBusinessDays]);

  const handleVisitsPerDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const visits = parseInt(e.target.value);
    if (visits >= 1 && visits <= 8) {
      setVisitsPerDay(visits);
    }
  };

  const handleSearchRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const radius = parseInt(e.target.value);
    if (radius >= 5 && radius <= 30) {
      setSearchRadius(radius);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!homeAddress) {
      setError("Please enter your home address postcode");
      return;
    }

    onGenerateSchedule();
  };

  return (
    <div
      className={`animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg shadow-md p-6 ${
        isDisabled ? "opacity-75" : ""
      }`}
    >
      <h2 className="text-xl font-semibold mb-4 text-eggplant-100">
        Schedule Settings
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="homeAddress"
            className="block text-sm font-medium text-eggplant-100 mb-1"
          >
            Home Address Postcode <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Home className="h-5 w-5 text-neon-blue" />
            </div>
            <input
              type="text"
              id="homeAddress"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value.toUpperCase())}
              className="pl-10 block w-full rounded-md border-eggplant-700 bg-eggplant-800/50 text-eggplant-100 shadow-sm focus:border-neon-purple focus:ring-neon-purple placeholder-eggplant-400 sm:text-sm"
              placeholder="Enter your postcode..."
              required
              disabled={isDisabled || isGenerating}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="searchRadius"
            className="block text-sm font-medium text-white mb-1"
          >
            Search Radius
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-5 w-5 text-neon-pink" />
            </div>
            <input
              type="range"
              id="searchRadius"
              min="5"
              max="30"
              value={searchRadius}
              onChange={handleSearchRadiusChange}
              className="pl-10 block w-full accent-neon-purple"
              disabled={isDisabled || isGenerating}
            />
            <div className="mt-1 flex justify-between text-xs text-white/70">
              <span>Condensed (5)</span>
              <span className="text-neon-purple">
                {searchRadius} mile radius
              </span>
              <span>Expanded (30)</span>
            </div>
          </div>
          <p
            className={clsx(
              "mt-1 text-xs",
              searchRadius < 10
                ? "text-yellow-400"
                : searchRadius > 20
                ? "text-purple-400"
                : "text-green-400"
            )}
          >
            {searchRadius < 10
              ? "⚡ Tighter routes, may have scheduling gaps"
              : searchRadius > 20
              ? "🌟 Wider coverage, longer drive times"
              : "✓ Balanced coverage and drive times"}
          </p>
        </div>

        <div>
          <label
            htmlFor="visitsPerDay"
            className="block text-sm font-medium text-eggplant-100 mb-1"
          >
            Visits Per Day
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-neon-purple" />
            </div>
            <input
              type="number"
              id="visitsPerDay"
              min="1"
              max="8"
              value={visitsPerDay}
              onChange={handleVisitsPerDayChange}
              className="pl-10 block w-full rounded-md border-eggplant-700 bg-eggplant-800/50 text-eggplant-100 shadow-sm focus:border-neon-purple focus:ring-neon-purple placeholder-eggplant-400 sm:text-sm"
              disabled={isDisabled || isGenerating}
            />
          </div>
          <p
            className={clsx(
              "mt-1 text-sm",
              visitsPerDay === 5
                ? "text-green-400"
                : visitsPerDay > 5
                ? "text-purple-400"
                : "text-eggplant-300"
            )}
          >
            {visitsPerDay === 5
              ? "✓ Recommended: 5 visits per day for optimal coverage"
              : visitsPerDay > 5
              ? "🌟 You're a rockstar! That's an ambitious schedule, go get 'em!"
              : "Tip: 5 visits per day is recommended for best results"}
          </p>
        </div>

        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-eggplant-100 mb-1"
          >
            Start Date
          </label>
          <CustomDatePicker
            selected={startDate}
            onChange={handleStartDateChange}
            placeholderText="Select start date..."
            icon={<Calendar className="h-5 w-5 text-neon-pink" />}
            disabled={isDisabled || isGenerating}
          />
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-eggplant-100 mb-1"
          >
            End Date
          </label>
          <CustomDatePicker
            selected={endDate}
            onChange={handleEndDateChange}
            placeholderText="Select end date..."
            icon={<Calendar className="h-5 w-5 text-neon-purple" />}
            disabled={isDisabled || isGenerating}
          />
          <p className="mt-1 text-sm text-eggplant-300">
            {businessDays} {businessDays === 1 ? "week day" : "week days"}{" "}
            selected
          </p>
        </div>

        <SparkleWrapper>
          <button
            type="submit"
            aria-label={
              isGenerating ? "Generating schedule..." : "Next: Choose your skin"
            }
            className={`
              w-full bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue 
              text-white font-bold py-3 px-4 rounded-md transition-all duration-300 
              hover:shadow-neon-purple transform hover:scale-105 
              focus:outline-none focus:ring-2 focus:ring-neon-purple focus:ring-offset-2
              ${
                isGenerating || isDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
            `}
            disabled={isGenerating || isDisabled}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Loading...
              </div>
            ) : (
              "Next: Choose Your Skin 👤"
            )}
          </button>
        </SparkleWrapper>
      </form>
    </div>
  );
};

export default ScheduleSettings;
