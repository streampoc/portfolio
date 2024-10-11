'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import BarChart from '../Common/BarChart';
import DataTable from '../Common/DataTable';

interface StockPosition {
  id: number;
  transaction_type: string;
  open_date: string;
  symbol: string;
  underlying_symbol: string;
  quantity: string;
  open_price: string;
  commissions: string;
  fees: string;
}

const Stocks: React.FC = () => {
  const { appliedFilters } = useFilters();
  const [stockPositions, setStockPositions] = useState<StockPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStockPositions = async () => {
      setIsLoading(true);
      try {
        const filterParams = Object.entries(appliedFilters).reduce((acc, [key, value]) => {
          acc[key] = value.toString();
          return acc;
        }, {} as Record<string, string>);

        const queryParams = new URLSearchParams(filterParams);
        const response = await fetch('/api/getStockPositions?' + queryParams);
        if (!response.ok) {
          throw new Error('Failed to fetch stock positions');
        }
        const data = await response.json();
        setStockPositions(data);
      } catch (error) {
        console.error('Error fetching stock positions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockPositions();
  }, [appliedFilters]);

  if (isLoading) {
    return <div>Loading stock positions...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Stock Positions</h2>
      <BarChart data={stockPositions} />
      <DataTable data={stockPositions} />
    </div>
  );
};

export default Stocks;