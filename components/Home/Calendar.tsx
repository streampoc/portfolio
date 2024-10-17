'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LoadingSpinner from '../Common/LoadingSpinner';
import CustomCalendar from '../Common/CustomCalendar';
import { DataTable } from '../Common/DataTable';
import { ColumnDef } from "@tanstack/react-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CalendarProps {
  onContentLoaded: () => void;
}

interface CalendarData {
  date: string;
  total_profit_loss: string;
  total_commissions: string;
  total_fees: string;
}

interface FormattedCalData {
  date: string;
  profitLoss: number;
  commissions: number;
}

const Calendar: React.FC<CalendarProps> = ({ onContentLoaded }) => {
  const { appliedFilters } = useFilters();
  const [calendarData, setCalendarData] = useState<CalendarData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendarData = async () => {
      setIsLoading(true);
      setError(null);
      const filterParams = { ...appliedFilters };
      // Default to current year if 'All Years' is selected
      if (filterParams.year === 'All Years') {
        filterParams.year = new Date().getFullYear().toString();
      }
      if (filterParams.month === 'ALL') {
        filterParams.month = (new Date().getMonth() + 1).toString();
      }

      const queryParams = new URLSearchParams(
        Object.entries(filterParams).reduce((acc, [key, value]) => {
          acc[key] = value.toString();
          return acc;
        }, {} as Record<string, string>)
      );

      try {
        const response = await fetch('/api/getCalendarData?' + queryParams, {
          cache: 'no-store' // This ensures we always get fresh data
        });
        if (!response.ok) {
          throw new Error('Failed to fetch calendar data');
        }
        const data = await response.json();
        setCalendarData(data);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        setError('Failed to load calendar data. Please try again later.');
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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
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

  const formatNumber = (value: string | number | null): string => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numValue) ? 'N/A' : numValue.toFixed(2);
  };

  const year = appliedFilters.year === 'All Years' ? new Date().getFullYear() : parseInt(appliedFilters.year);
  const month = appliedFilters.month === 'ALL' ? new Date().getMonth() : parseInt(appliedFilters.month) - 1;
  
  const formattedData: FormattedCalData[] = calendarData
    .map(day => ({
      date: new Date(day.date).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      profitLoss: parseFloat(day.total_profit_loss) + parseFloat(day.total_commissions) + parseFloat(day.total_fees),
      commissions: parseFloat(day.total_commissions)
    }));

  const columns: ColumnDef<FormattedCalData>[] = [
    {
      accessorKey: "date",
      header: "Date",
      footer: "Total"
    },
    {
      accessorKey: "profitLoss",
      header: "Profit/Loss",
      cell: ({ row }) => formatNumber(row.original.profitLoss),
      footer: ({ table }) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, row) => sum + (row.original.profitLoss as number), 0);
        return formatNumber(total);
      }
    },
    {
      accessorKey: "commissions",
      header: "Commissions",
      cell: ({ row }) => formatNumber(row.original.commissions),
    },
  ];

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent>
        <CustomCalendar 
          year={year}
          month={month}
          data={formattedData} 
        />
        {/* <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Calendar Data</h3>
          <DataTable 
            columns={columns} 
            data={formattedData} 
            showFooter={true}
            showPagination={false}
          />
        </div> */}
      </CardContent>
    </Card>
  );
};

export default Calendar;
