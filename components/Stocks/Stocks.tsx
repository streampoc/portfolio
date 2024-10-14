'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import BarChart from '../Common/BarChart';
import { DataTable } from '../Common/DataTable';
import { ColumnDef } from "@tanstack/react-table"

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

  const columns: ColumnDef<StockPosition>[] = [
    {
      accessorKey: "symbol",
      header: "Symbol",
    },
    {
      accessorKey: "underlying_symbol",
      header: "Underlying Symbol",
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
    },
    {
      accessorKey: "open_price",
      header: "Open Price",
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("open_price"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(price);
        return formatted;
      },
    },
    {
      accessorKey: "open_date",
      header: "Open Date",
      cell: ({ row }) => {
        return new Date(row.getValue("open_date")).toLocaleDateString();
      },
    },
  ];

  if (isLoading) {
    return <div>Loading stock positions...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Stock Positions</h2>
      <DataTable columns={columns} data={stockPositions} />
    </div>
  );
};

export default Stocks;
