'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import BarChart from '../Common/BarChart';
import DataTable from '../Common/DataTable';

interface DividendPosition {
  id: number;
  transaction_type: string;
  underlying_symbol: string;
  profit_loss: string;
}

const Dividends: React.FC = () => {
  const { appliedFilters } = useFilters();
  const [dividendPositions, setDividendPositions] = useState<DividendPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDividendPositions = async () => {
      setIsLoading(true);
      try {
        const filterParams = Object.entries(appliedFilters).reduce((acc, [key, value]) => {
          acc[key] = value.toString();
          return acc;
        }, {} as Record<string, string>);

        const queryParams = new URLSearchParams(filterParams);
        const response = await fetch('/api/getDividendPositions?' + queryParams);
        if (!response.ok) {
          throw new Error('Failed to fetch dividend positions');
        }
        const data = await response.json();
        // Map the data to only include the fields we want
        const filteredData = data.map((item: any) => ({
          id: item.id,
          transaction_type: item.transaction_type,
          underlying_symbol: item.underlying_symbol,
          profit_loss: item.profit_loss
        }));
        setDividendPositions(filteredData);
      } catch (error) {
        console.error('Error fetching dividend positions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDividendPositions();
  }, [appliedFilters]);

  if (isLoading) {
    return <div>Loading dividend positions...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dividend Positions</h2>
      <BarChart data={dividendPositions} />
      <DataTable data={dividendPositions} />
    </div>
  );
};

export default Dividends;