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
    if (value === null) return 'N/A';
    if (typeof value !== 'number') return 'N/A';
    return value.toFixed(2);
  };

  const getDayData = (day: number): DayData | undefined => {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return data.find(d => d.date === dateString);
  };

  const getDayColor = (profitLoss: number | null): string => {
    if (profitLoss === null) return '';
    return profitLoss >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900';
  };

  const totalProfitLoss = data.reduce((sum, day) => {
    return sum + (day.profitLoss || 0);
  }, 0);
  

  return (
    <Card className="w-full">
      <CardContent className="p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
          <h2 className="text-xl sm:text-2xl font-bold">{monthNames[month]} {year}</h2>
          <div className="text-sm sm:text-lg font-semibold mt-2 sm:mt-0">
            <span className={totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
              ${formatNumber(totalProfitLoss)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs sm:text-sm">
          {dayNames.map(day => (
            <div key={day} className="text-center font-bold">{day}</div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="h-12 sm:h-20 md:h-24"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayData = getDayData(day);
            return (
              <div 
                key={day} 
                className={`border p-1 h-12 sm:h-20 md:h-24 overflow-hidden ${dayData ? getDayColor(dayData.profitLoss) : ''} relative`}
              >
                <div className="font-bold">{day}</div>
                {dayData && (
                  <div className="absolute bottom-1 right-1 text-[0.6rem] sm:text-xs leading-tight text-right">
                    <div>{formatNumber(dayData.profitLoss)}</div>
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
