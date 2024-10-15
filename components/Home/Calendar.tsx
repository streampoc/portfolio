'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LoadingSpinner from '../Common/LoadingSpinner';

interface CalendarProps {
  onContentLoaded: () => void;
}

interface CalendarData {
  // Define the structure of your calendar data here
  // For example:
  date: string;
  profit_loss: number;
}

const Calendar: React.FC<CalendarProps> = ({ onContentLoaded }) => {
  const { appliedFilters } = useFilters();
  const [calendarData, setCalendarData] = useState<CalendarData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCalendarData = async () => {
      setIsLoading(true);
      try {
        const filterParams = Object.entries(appliedFilters).reduce((acc, [key, value]) => {
          acc[key] = value.toString();
          return acc;
        }, {} as Record<string, string>);

        const queryParams = new URLSearchParams(filterParams);
        const response = await fetch('/api/getCalendarData?' + queryParams);
        if (!response.ok) {
          throw new Error('Failed to fetch calendar data');
        }
        const data = await response.json();
        setCalendarData(data);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setIsLoading(false);
        onContentLoaded();
      }
    };

    fetchCalendarData();
  }, [appliedFilters]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (calendarData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No data available for the selected filters.</p>
        </CardContent>
      </Card>
    );
  }

  // Render your calendar here using the calendarData
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Replace this with your actual calendar rendering logic */}
        <p>Calendar data loaded. Implement calendar view here.</p>
        {/* You can map through calendarData and render each day */}
        {calendarData.map((day, index) => (
          <div key={index}>
            <span>{day.date}: </span>
            <span>{day.profit_loss}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default Calendar;
