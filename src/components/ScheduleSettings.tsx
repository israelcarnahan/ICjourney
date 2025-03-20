import React from 'react';
import { Calendar, Home, Users } from 'lucide-react';
import { usePubData } from '../context/PubDataContext';
import SparkleWrapper from './Sparkles';
import CustomDatePicker from './CustomDatePicker';
import { addBusinessDays, differenceInBusinessDays } from 'date-fns';
import clsx from 'clsx';

interface ScheduleSettingsProps {
  onGenerateSchedule: () => void;
  isGenerating: boolean;
}

const ScheduleSettings: React.FC<ScheduleSettingsProps> = ({ onGenerateSchedule, isGenerating }) => {
  const { 
    businessDays, 
    setBusinessDays,
    homeAddress,
    setHomeAddress,
    visitsPerDay,
    setVisitsPerDay
  } = usePubData();
  
  const [startDate, setStartDate] = React.useState<Date>(new Date());
  const [endDate, setEndDate] = React.useState<Date>(new Date());
  const [error, setError] = React.useState<string | null>(null);

  const handleEndDateChange = (date: Date) => {
    setEndDate(date);
    const days = differenceInBusinessDays(date, startDate);
    setBusinessDays(days > 0 ? days : 1);
  };

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
    // Initially set end date to match start date
    setEndDate(date);
    setBusinessDays(1);
  };

  const handleVisitsPerDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const visits = parseInt(e.target.value);
    if (visits >= 1 && visits <= 8) {
      setVisitsPerDay(visits);
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
    <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-eggplant-100">Schedule Settings</h2>
      
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="homeAddress" className="block text-sm font-medium text-eggplant-100 mb-1">
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
            />
          </div>
        </div>

        <div>
          <label htmlFor="visitsPerDay" className="block text-sm font-medium text-eggplant-100 mb-1">
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
            />
          </div>
          <p className={clsx(
            "mt-1 text-sm",
            visitsPerDay === 5 ? "text-green-400" : "text-eggplant-300"
          )}>
            {visitsPerDay === 5 
              ? "✓ Recommended: 5 visits per day for optimal coverage"
              : "Tip: 5 visits per day is recommended for best results"}
          </p>
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-eggplant-100 mb-1">
            Start Date
          </label>
          <CustomDatePicker
            selected={startDate}
            onChange={handleStartDateChange}
            placeholderText="Select start date..."
            icon={<Calendar className="h-5 w-5 text-neon-pink" />}
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-eggplant-100 mb-1">
            End Date
          </label>
          <CustomDatePicker
            selected={endDate}
            onChange={handleEndDateChange}
            placeholderText="Select end date..."
            icon={<Calendar className="h-5 w-5 text-neon-purple" />}
          />
          <p className="mt-1 text-sm text-eggplant-300">
            {businessDays} business days selected
          </p>
        </div>

        <SparkleWrapper>
          <button
            type="submit"
            className={`
              w-full bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue 
              text-white font-bold py-3 px-4 rounded-md transition-all duration-300 
              hover:shadow-neon-purple transform hover:scale-105 
              focus:outline-none focus:ring-2 focus:ring-neon-purple focus:ring-offset-2
              ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Generating...
              </div>
            ) : (
              'Generate Schedule'
            )}
          </button>
        </SparkleWrapper>
      </form>
    </div>
  );
};

export default ScheduleSettings;