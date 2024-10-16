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
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<Filters>({
    year: 'All Years',
    month: 'ALL',
    week: 'ALL',
    day: 'All Days',
    account: 'ALL',
    ticker: 'ALL',
  });

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
    <FilterContext.Provider value={{ filters, appliedFilters, setFilters, applyFilters }}>
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
