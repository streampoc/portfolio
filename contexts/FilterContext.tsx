'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface Filters {
  year: string;
  month: string;
  week: string;
  day: string;
  account: string;
  ticker: string;
}

interface FilterContextType {
  filters: Filters;
  appliedFilters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  applyFilters: (newFilters?: Filters) => void;
  session: any;
  setSession: React.Dispatch<React.SetStateAction<any>>;
}

const FilterContext = createContext<FilterContextType>({
  filters: {
    year: 'All Years',
    month: 'ALL',
    week: 'ALL',
    day: 'All Days',
    account: 'ALL',
    ticker: 'ALL',
  },
  appliedFilters: {
    year: 'All Years',
    month: 'ALL',
    week: 'ALL',
    day: 'All Days',
    account: 'ALL',
    ticker: 'ALL',
  },
  setFilters: () => {},
  applyFilters: () => {},
  session: null,
  setSession: () => {},
});

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<Filters>({
    year: 'All Years',
    month: 'ALL',
    week: 'ALL',
    day: 'All Days',
    account: 'ALL',
    ticker: 'ALL',
  });

  const [session, setSession] = useState<any>(null);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters);

  const applyFilters = (newFilters?: Filters) => {
    if (newFilters) {
      setFilters(newFilters);
      setAppliedFilters(newFilters);
    } else {
      setAppliedFilters(filters);
    }
  };

  return (
    <FilterContext.Provider value={{ filters, appliedFilters, setFilters, applyFilters, session, setSession }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
