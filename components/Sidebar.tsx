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
import Link from 'next/link';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

interface AccountRow {
  email: string;
  id:number;
  broker_name: string;
  account_number: number;
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const { filters, setFilters, applyFilters } = useFilters();
  const [weeks, setWeeks] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>(['All Days']);
  const [tickers, setTickers] = useState<string[]>(['ALL']);
  const [isLoadingTickers, setIsLoadingTickers] = useState<boolean>(false);

  const [accounts, setAccounts] = useState<string[]>(['ALL']);


  //const accounts = ['ALL', 'TW', 'TD', 'RH'];

  const years = ['All Years', ...Array.from({ length: 20 }, (_, i) => (2015 + i).toString())];
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

  useEffect(() => {

    fetch(`/api/getAccountsData`)
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAccounts(['ALL', ...data.map((account: AccountRow) => `${account.broker_name}-${account.account_number}`)]);
          } else {
            console.error('Unexpected data format:', data);
            setAccounts(['ALL']);
          }
        })
        .catch(error => {
          console.error('Failed to fetch tickers:', error);
          setAccounts(['ALL']);
        });
  },[]);

  useEffect(() => {
    fetch(`/api/getTickers?account=ALL`)
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTickers(['ALL', ...data]);
          } else {
            console.error('Unexpected data format:', data);
            setTickers(['ALL']);
          }
        })
        .catch(error => {
          console.error('Failed to fetch tickers:', error);
          setTickers(['ALL']);
        });
  },[]);

  /*const fetchTickers = useCallback(async (account: string) => {
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
  }, [isLoadingTickers]);*/

  useEffect(() => {
    if (filters.year !== 'All Years' && filters.month !== 'ALL') {
      fetch(`/api/getWeeks?year=${filters.year}&month=${filters.month}`)
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            setWeeks(data);
          } else {
            console.error('Unexpected data format:', data);
            setWeeks(['ALL']);
          }
          setFilters(prev => ({ ...prev, week: 'ALL', day: 'All Days' }));
        })
        .catch(error => {
          console.error('Failed to fetch weeks:', error);
          setWeeks(['ALL']);
        });
    } else {
      setWeeks(['ALL']);
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
    /*if (filterType === 'account') {
      fetchTickers(value);
    }*/
  };

  const renderSelect = (id: string, label: string, options: string[] | { value: string; label: string }[], value: string, onChange: (value: string) => void) => (
    <div className="space-y-1 w-full">
      <label htmlFor={id} className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger className="w-full bg-background text-foreground">
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

  const handleApplyFilters = () => {
    applyFilters();
    if (onClose) onClose();
  };

  const handleResetFilters = () => {
    const resetFilters = {
      account: 'ALL',
      ticker: 'ALL',
      year: 'All Years',
      month: 'ALL',
      week: 'ALL',
      day: 'All Days'
    };
    
    setFilters(resetFilters);
    setTickers(['ALL']);
    setWeeks(['ALL']);
    setDays(['All Days']);
    
    // Immediately apply the reset filters
    applyFilters(resetFilters);
    
    if (onClose) onClose();
  };

  const navLinks = [
    { href: '/dashboard/home', label: 'Home' },
    { href: '/dashboard/open-positions', label: 'Open Positions' },
    { href: '/dashboard/closed-positions', label: 'Closed Positions' },
    { href: '/dashboard/stocks', label: 'Stocks' },
    { href: '/dashboard/dividends', label: 'Dividends' },
    { href: '/dashboard/details', label: 'Details' },
    { href: '/dashboard/upload-trades', label: 'Upload Trades' },
  ];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <ScrollArea className="flex-grow">
        <div className="space-y-4 p-4">
          <nav className="flex flex-col space-y-2 mb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground hover:underline px-2 py-1 rounded hover:bg-muted transition-colors"
                onClick={onClose}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
            {renderSelect('account', 'Account', accounts, filters.account, (value) => handleFilterChange('account', value))}
            {renderSelect('ticker', 'Ticker', tickers, filters.ticker, (value) => handleFilterChange('ticker', value))}
            {renderSelect('year', 'Year', years, filters.year, (value) => handleFilterChange('year', value))}
            {renderSelect('month', 'Month', months, filters.month, (value) => handleFilterChange('month', value))}
            {renderSelect('week', 'Week', weeks, filters.week, (value) => handleFilterChange('week', value))}
            {renderSelect('day', 'Day', days, filters.day, (value) => handleFilterChange('day', value))}
          </div>
        </div>
      </ScrollArea>
      <div className="p-4 mt-auto">
        <div className="flex space-x-2">
          <Button onClick={handleResetFilters} className="flex-1" variant="secondary">
            Reset
          </Button>
          <Button onClick={handleApplyFilters} className="flex-1" variant="secondary">
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar;
