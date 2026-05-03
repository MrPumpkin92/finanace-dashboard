import React from 'react';
import { format, addMonths, subMonths, parse } from 'date-fns';

interface MonthPickerProps {
  value: string; // YYYY-MM format
  onChange: (month: string) => void;
  disabled?: boolean;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({ value, onChange, disabled = false }) => {
  const currentDate = parse(value, 'yyyy-MM', new Date());

  const handlePrevMonth = () => {
    const prev = subMonths(currentDate, 1);
    onChange(format(prev, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const next = addMonths(currentDate, 1);
    onChange(format(next, 'yyyy-MM'));
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePrevMonth}
        disabled={disabled}
        className="p-2 hover:bg-dark-surface rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous month"
      >
        ←
      </button>

      <div className="min-w-[150px] text-center font-medium">
        {format(currentDate, 'MMMM yyyy')}
      </div>

      <button
        onClick={handleNextMonth}
        disabled={disabled}
        className="p-2 hover:bg-dark-surface rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next month"
      >
        →
      </button>
    </div>
  );
};

export default MonthPicker;
