'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import BarChart from '../Common/BarChart';
import DataTable from '../Common/DataTable';

interface ClosedPosition {
  id: number;
  transaction_type: string;
  open_date: string;
  close_date: string;
  symbol: string;
  underlying_symbol: string;
  quantity: string;
  open_price: string;
  close_price: string;
  profit_loss: string;
  commissions: string;
  fees: string;
}

const ClosedPositions: React.FC = () => {
  const { appliedFilters } = useFilters();
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClosedPositions = async () => {
      setIsLoading(true);
      try {
        const filterParams = Object.entries(appliedFilters).reduce((acc, [key, value]) => {
          acc[key] = value.toString();
          return acc;
        }, {} as Record<string, string>);

        const queryParams = new URLSearchParams(filterParams);
        const response = await fetch('/api/getClosedPositions?' + queryParams);
        if (!response.ok) {
          throw new Error('Failed to fetch closed positions');
        }
        const data = await response.json();
        setClosedPositions(data);
      } catch (error) {
        console.error('Error fetching closed positions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClosedPositions();
  }, [appliedFilters]);

  if (isLoading) {
    return <div>Loading closed positions...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Closed Positions</h2>
      <BarChart data={closedPositions} />
      <DataTable data={closedPositions} />
    </div>
  );
};

export default ClosedPositions;