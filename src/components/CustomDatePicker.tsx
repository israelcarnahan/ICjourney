import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from 'lucide-react';

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date) => void;
  placeholderText?: string;
  className?: string;
  icon?: React.ReactNode;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  placeholderText,
  className = '',
  icon = <Calendar className="h-5 w-5 text-neon-purple" />
}) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        {icon}
      </div>
      <DatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholderText}
        className={`w-full pl-10 py-2 rounded-md border border-eggplant-700 bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 text-eggplant-100 shadow-sm focus:border-neon-blue focus:ring focus:ring-neon-blue focus:ring-opacity-50 text-sm transition-all duration-200 ${className}`}
        dateFormat="yyyy-MM-dd"
        calendarClassName="bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 border border-eggplant-700 rounded-lg shadow-lg text-eggplant-100"
        showPopperArrow={false}
        popperClassName="date-picker-popper"
        wrapperClassName="w-full"
        popperPlacement="bottom-start"
      />
    </div>
  );
};

export default CustomDatePicker;