'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import BarChart from '../Common/BarChart';
import { DataTable } from '../Common/DataTable';
import { ColumnDef } from "@tanstack/react-table"

interface OpenPosition {
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

const OpenPositions: React.FC = () => {
  const { appliedFilters } = useFilters();
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOpenPositions = async () => {
      setIsLoading(true);
      try {
        const filterParams = Object.entries(appliedFilters).reduce((acc, [key, value]) => {
          acc[key] = value.toString();
          return acc;
        }, {} as Record<string, string>);

        const queryParams = new URLSearchParams(filterParams);
        const response = await fetch('/api/getOpenPositions?' + queryParams);
        if (!response.ok) {
          throw new Error('Failed to fetch open positions');
        }
        const data = await response.json();
        setOpenPositions(data);
      } catch (error) {
        console.error('Error fetching open positions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpenPositions();
  }, [appliedFilters]);

  const columns: ColumnDef<OpenPosition>[] = [
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
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(price);
      },
    },
    {
      accessorKey: "open_date",
      header: "Open Date",
      cell: ({ row }) => new Date(row.getValue("open_date")).toLocaleDateString(),
    },
    {
      accessorKey: "commissions",
      header: "Commissions",
      cell: ({ row }) => {
        const commissions = parseFloat(row.getValue("commissions"));
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(commissions);
      },
    },
    {
      accessorKey: "fees",
      header: "Fees",
      cell: ({ row }) => {
        const fees = parseFloat(row.getValue("fees"));
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(fees);
      },
    },
  ];

  if (isLoading) {
    return <div>Loading open positions...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Open Positions</h2>
      <BarChart data={openPositions} />
      <DataTable columns={columns} data={openPositions}/>
    </div>
  );
};

export default OpenPositions;
