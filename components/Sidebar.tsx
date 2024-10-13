'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const { filters, setFilters, applyFilters } = useFilters();
  const [weeks, setWeeks] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>(['All Days']);
  const [tickers, setTickers] = useState<string[]>(['ALL']);
  const [isLoadingTickers, setIsLoadingTickers] = useState<boolean>(false);

  const accounts = ['ALL', 'TW', 'TD', 'RH'];
  const years = ['All Years', ...Array.from({ length: 100 }, (_, i) => (2000 + i).toString())];
  const months = [
    { value: 'ALL', label: 'ALL' },
    { value: '1', label: 'JAN' },
    { value: '2', label: 'FEB' },
    { value: '3', label: 'MAR' },
    { value: '4', label: 'APR' },
    { value: '5', label: 'MAY' },
    { value: '6', label: 'JUN' },
    { value: '7', label: 'JUL' },
    { value: '8', label: 'AUG' },
    { value: '9', label: 'SEP' },
    { value: '10', label: 'OCT' },
    { value: '11', label: 'NOV' },
    { value: '12', label: 'DEC' }
  ];

  const fetchTickers = useCallback(async (account: string) => {
    if (isLoadingTickers) return;
    setIsLoadingTickers(true);
    try {
      console.log(`Fetching tickers for account: ${account}`);
      const response = await fetch(`/api/getTickers?account=${account}`);
      const data = await response.json();
      console.log('Tickers fetched:', data);
      if (Array.isArray(data)) {
        setTickers(['ALL', ...data]);
      } else {
        console.error('Unexpected data format for tickers:', data);
        setTickers(['ALL']);
      }
    } catch (error) {
      console.error('Failed to fetch tickers:', error);
      setTickers(['ALL']);
    } finally {
      setIsLoadingTickers(false);
    }
  }, [isLoadingTickers]);

  useEffect(() => {
    if (filters.year !== 'All Years' && filters.month !== 'ALL') {
      fetch(`/api/getWeeks?year=${filters.year}&month=${filters.month}`)
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            setWeeks(data);
          } else {
            console.error('Unexpected data format:', data);
            setWeeks([]);
          }
          setFilters(prev => ({ ...prev, week: 'ALL', day: 'All Days' }));
        })
        .catch(error => {
          console.error('Failed to fetch weeks:', error);
          setWeeks([]);
        });
    } else {
      setWeeks([]);
      setFilters(prev => ({ ...prev, week: 'ALL', day: 'All Days' }));
    }
  }, [filters.year, filters.month, setFilters]);

  useEffect(() => {
    if (filters.week !== 'ALL') {
      const [startDate, endDate] = filters.week.split(' to ');
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysInWeek = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        daysInWeek.push(d.toISOString().split('T')[0]);
      }
      setDays(['All Days', ...daysInWeek]);
    } else {
      setDays(['All Days']);
    }
    setFilters(prev => ({ ...prev, day: 'All Days' }));
  }, [filters.week, setFilters]);

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prevFilters => ({ ...prevFilters, [filterType]: value }));
    if (filterType === 'account') {
      fetchTickers(value);
    }
  };

  const renderSelect = (id: string, label: string, options: string[] | { value: string; label: string }[], value: string, onChange: (value: string) => void) => (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            typeof option === 'string' ? (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ) : (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            )
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Filters
          </h2>
          <ScrollArea className="h-[430px] px-4">
            <div className="space-y-2">
              {renderSelect('account', 'Account', accounts, filters.account, (value) => handleFilterChange('account', value))}
              {renderSelect('ticker', 'Ticker', tickers, filters.ticker, (value) => handleFilterChange('ticker', value))}
              {renderSelect('year', 'Year', years, filters.year, (value) => handleFilterChange('year', value))}
              {renderSelect('month', 'Month', months, filters.month, (value) => handleFilterChange('month', value))}
              {renderSelect('week', 'Week', ['ALL', ...weeks], filters.week, (value) => handleFilterChange('week', value))}
              {renderSelect('day', 'Day', days, filters.day, (value) => handleFilterChange('day', value))}
            </div>
          </ScrollArea>
        </div>
        <div className="px-3 py-2">
          <Button onClick={applyFilters} className="w-full" variant="secondary">
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar;
