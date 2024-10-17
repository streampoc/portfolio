import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface DayData {
  date: string;
  profitLoss: number | null;
  commissions: number | null;
}

interface CustomCalendarProps {
  year: number;
  month: number;
  data: DayData[];
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({ year, month, data }) => {
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formatNumber = (value: number | null): string => {
    if (value === null || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const getDayData = (day: number): DayData | undefined => {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return data.find(d => d.date === dateString);
  };

  const getDayColor = (profitLoss: number | null): string => {
    if (profitLoss === null || isNaN(profitLoss)) return '';
    return profitLoss >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30';
  };

  const totalProfitLoss = data.reduce((sum, day) => sum + (day.profitLoss || 0), 0);

  return (
    <Card className="w-full bg-white dark:bg-gray-800">
      <CardContent className="p-2 sm:p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">{monthNames[month]} {year}</h2>
          <div className="text-sm sm:text-lg font-semibold">
            <span className={totalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {formatNumber(totalProfitLoss)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map(day => (
            <div key={day} className="text-center font-bold text-foreground text-xs sm:text-sm">{day}</div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="h-14 sm:h-20 md:h-24 lg:h-28"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayData = getDayData(day);
            return (
              <div 
                key={day} 
                className={`border border-gray-200 dark:border-gray-700 p-1 h-14 sm:h-20 md:h-24 lg:h-28 overflow-hidden ${dayData ? getDayColor(dayData.profitLoss) : ''} relative`}
              >
                <div className="font-bold text-foreground text-xs sm:text-sm">{day}</div>
                {dayData && dayData.profitLoss !== null && (
                  <div className="absolute bottom-0 right-0 left-0 text-[0.5rem] sm:text-xs leading-tight text-right p-0.5 bg-opacity-75 dark:bg-opacity-75 bg-inherit">
                    <div className={`font-bold truncate ${dayData.profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatNumber(dayData.profitLoss)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomCalendar;
