'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { DataTable } from '../Common/DataTable';
import { ColumnDef } from "@tanstack/react-table";

interface DividendPosition {
  id: number;
  transaction_type: string;
  underlying_symbol: string;
  profit_loss: string;
  close_date: string;
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
        setDividendPositions(data);
      } catch (error) {
        console.error('Error fetching dividend positions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDividendPositions();
  }, [appliedFilters]);

  const columns: ColumnDef<DividendPosition>[] = [
    {
      accessorKey: "underlying_symbol",
      header: "Symbol",
    },
    {
      accessorKey: "transaction_type",
      header: "Transaction Type",
    },
    {
      accessorKey: "profit_loss",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("profit_loss"));
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          signDisplay: "always"
        }).format(amount);
      },
    },
    {
      accessorKey: "close_date",
      header: "Date",
      cell: ({ row }) => new Date(row.getValue("close_date")).toLocaleDateString(),
    },
  ];

  if (isLoading) {
    return <div>Loading dividend positions...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dividend Positions</h2>
      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={dividendPositions}
          filterColumn="underlying_symbol"
        />
      </div>
    </div>
  );
};

export default Dividends;
