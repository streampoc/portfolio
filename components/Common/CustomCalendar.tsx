import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DayData {
  date: string;
  profitLoss: number | null;
  commissions: number | null;
  net: number | null;
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

  const getDayData = (day: number, targetYear: number, targetMonth: number): DayData | undefined => {
    const dateString = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return data.find(d => d.date === dateString);
  };

  // Check if this is the last day of the month
  const shouldShowWeeklyTotal = (day: number): boolean => {
    const dayOfWeek = (firstDayOfMonth + day - 1) % 7;
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;
    
    if (isSaturday && !isLastDayOfWeek(day)) {
      // Show on Saturday if it's within the month
      return true;
    }
    
    if (isSunday) {
      // Check if next Saturday is in next month
      const nextSaturday = new Date(year, month, day + 6);
      return nextSaturday.getMonth() !== month;
    }
    
    return false;
  };

  const isLastDayOfWeek = (day: number): boolean => {
    // Check if this week's Saturday falls in the next month
    const currentDate = new Date(year, month, day);
    const nextSaturday = new Date(year, month, day + (6 - currentDate.getDay()));
    return nextSaturday.getMonth() !== month;
  };

  const getWeeklyTotal = (currentDay: number): number | null => {
    if (!shouldShowWeeklyTotal(currentDay)) return null;

    let total = 0;
    let currentDate = new Date(year, month, currentDay);
    const isSunday = currentDate.getDay() === 0;

    if (isSunday) {
      // For Sundays, look ahead to next Monday-Friday
      currentDate.setDate(currentDate.getDate() + 1); // Move to Monday
      for (let i = 0; i < 5; i++) { // Monday through Friday
        const dayData = getDayData(
          currentDate.getDate(),
          currentDate.getFullYear(),
          currentDate.getMonth()
        );
        
        if (dayData?.profitLoss) {
          total += dayData.profitLoss;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // For Saturdays, look back to Monday-Friday
      currentDate.setDate(currentDate.getDate() - 1); // Move to Friday
      for (let i = 0; i < 5; i++) { // Friday back to Monday
        const dayData = getDayData(
          currentDate.getDate(),
          currentDate.getFullYear(),
          currentDate.getMonth()
        );
        
        if (dayData?.profitLoss) {
          total += dayData.profitLoss;
        }
        
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }

    return total;
  };

  const getDayColor = (profitLoss: number | null): string => {
    if (profitLoss === null || isNaN(profitLoss)) return '';
    return profitLoss >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30';
  };

  const totalProfitLoss = data.reduce((sum, day) => sum + (day.profitLoss || 0), 0);

  const TouchFriendlyTooltip: React.FC<{ children: React.ReactNode; content: React.ReactNode }> = ({ children, content }) => {
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  
    return (
      <Tooltip open={isTooltipOpen}>
        <TooltipTrigger asChild>
          <div
            onMouseEnter={() => setIsTooltipOpen(true)}
            onMouseLeave={() => setIsTooltipOpen(false)}
            onTouchStart={() => setIsTooltipOpen(true)}
            onTouchEnd={() => setIsTooltipOpen(false)}
          >
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    );
  };

  const getWeekDateRange = (currentDay: number): string | null => {
    if (!shouldShowWeeklyTotal(currentDay)) return null;
    
    let currentDate = new Date(year, month, currentDay);
    const isSunday = currentDate.getDay() === 0;
    
    if (isSunday) {
      // For Sundays, show next Monday-Friday
      let startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() + 1); // Monday
      let endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 4); // Friday
      if (endDate.getMonth() !== startDate.getMonth()) {
        // Set endDate to the last day of startDate's month
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      }
      return `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
    } else {
      // For Saturdays, show previous Monday-Friday
      let endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() - 1); // Friday
      let startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 4); // Monday
      return `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
    }
  };

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
          <TooltipProvider>
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dayData = getDayData(day, year, month);
              const weeklyTotal = getWeeklyTotal(day);
              const showWeeklyTotal = shouldShowWeeklyTotal(day);
              const weekDateRange = getWeekDateRange(day);

              return (
                <TouchFriendlyTooltip
                  key={day}
                  content={
                    (dayData ||weeklyTotal) && (
                      <>
                      {dayData && (
                        <>
                          <p>Date: {dayData?.date || `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`}</p>
                          <p>Daily P/L: {formatNumber(dayData.profitLoss)}</p>
                          <p>Net P/L: {formatNumber(dayData.net)}</p>
                        </>
                        )
                      }
                      {weeklyTotal && (
                        <>
                          <p>Week (Mon-Fri): {weekDateRange}</p>
                          <p>Weekly Total: {formatNumber(weeklyTotal)}</p>
                        </>
                      )}
                      </>
                    )
                  }
                >
                  <div 
                    className={`border border-gray-200 dark:border-gray-700 p-1 h-14 sm:h-20 md:h-24 lg:h-28 overflow-hidden ${dayData ? getDayColor(dayData.profitLoss) : ''} relative ${dayData ? 'cursor-pointer' : ''}`}
                  >
                    <div className="font-bold text-foreground text-xs sm:text-sm">{day}</div>
                    {dayData && dayData.profitLoss !== null && (
                      <div className="absolute bottom-0 right-0 left-0 text-[0.5rem] sm:text-xs leading-tight text-right p-0.5 bg-opacity-75 dark:bg-opacity-75 bg-inherit">
                        <div className={`font-bold truncate ${dayData.profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatNumber(dayData.profitLoss)}
                        </div>
                      </div>
                    )}
                    {showWeeklyTotal && weeklyTotal !== null && weeklyTotal !== 0 && (
                      <div className="absolute middle-0 right-0 left-0 text-[0.5rem] sm:text-xs leading-tight text-right p-0.5 bg-gray-100 dark:bg-gray-700 bg-opacity-75 dark:bg-opacity-75">
                        <div className={`font-bold truncate ${weeklyTotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatNumber(weeklyTotal)}
                        </div>
                      </div>
                    )}
                  </div>
                </TouchFriendlyTooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomCalendar;
