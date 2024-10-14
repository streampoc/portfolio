'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { DataTable } from '../Common/DataTable';
import PieChart from '../Common/PieChart';
import { ColumnDef } from "@tanstack/react-table";

interface DividendPosition {
  id: number;
  transaction_type: string;
  underlying_symbol: string;
  profit_loss: string;
  close_date: string;
}

interface GroupedDividend {
  name: string;
  value: number;
}

const Dividends: React.FC = () => {
  const { appliedFilters } = useFilters();
  const [dividendPositions, setDividendPositions] = useState<DividendPosition[]>([]);
  const [groupedDividends, setGroupedDividends] = useState<GroupedDividend[]>([]);
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

        // Group dividends by symbol and sum the amounts
        const grouped: Record<string, number> = data.reduce((acc: Record<string, number>, curr: DividendPosition) => {
          const amount = parseFloat(curr.profit_loss);
          acc[curr.underlying_symbol] = (acc[curr.underlying_symbol] || 0) + amount;
          return acc;
        }, {});

        const groupedData: GroupedDividend[] = Object.entries(grouped).map(([name, value]) => ({
          name,
          value: Number(value.toFixed(2)) // Ensure value is a number and round to 2 decimal places
        }));
        setGroupedDividends(groupedData);
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

  const pieChartColors = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40",
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dividend Positions</h2>
      <div className="mb-8">
        <PieChart
          data={groupedDividends}
          colors={pieChartColors}
          title="Dividends by Symbol"
          description="Total dividends received per symbol"
        />
      </div>
      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={dividendPositions}
        />
      </div>
    </div>
  );
};

export default Dividends;
