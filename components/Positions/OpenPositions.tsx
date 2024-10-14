'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import BarChart from '../Common/BarChart';
import { DataTable } from '../Common/DataTable';
import { ColumnDef } from "@tanstack/react-table"
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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

interface ChartData {
  symbol: string;
  total_value: number;
}

const OpenPositions: React.FC = () => {
  const { appliedFilters } = useFilters();
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

        // Process data for the chart
        const groupedData: Record<string, number> = data.reduce((acc: Record<string, number>, position: OpenPosition) => {
          const symbol = position.underlying_symbol;
          const quantity = parseFloat(position.quantity);
          const openPrice = parseFloat(position.open_price);
          const value = isNaN(quantity) || isNaN(openPrice) ? 0 : quantity * openPrice;
          acc[symbol] = (acc[symbol] || 0) + value;
          return acc;
        }, {});

        const chartData: ChartData[] = Object.entries(groupedData).map(([symbol, total_value]) => ({
          symbol,
          total_value: Number(total_value.toFixed(2)) // Ensure total_value is a number and round to 2 decimal places
        }));

        setChartData(chartData);
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
        accessorKey: "open_price",
        header: "Open Price",
        cell: ({ row }) => {
          const price = parseFloat(row.getValue("open_price"));
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(price);
        },
        sortingFn: (rowA, rowB, columnId) => {
            return parseFloat(rowA.getValue(columnId)) - parseFloat(rowB.getValue(columnId));
        }
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
    },
    {
      accessorKey: "open_date",
      header: "Open Date",
      cell: ({ row }) => new Date(row.getValue("open_date")).toLocaleDateString(),
    },
    {
        accessorKey: "underlying_symbol",
        header: "Underlying Symbol",
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

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Open Positions by Symbol</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={chartData}
            xDataKey="symbol"
            yDataKey="total_value"
            layout={isLargeScreen ? "horizontal" : "vertical"}
            isLargeScreen={isLargeScreen}
            formatYAxis={formatCurrency}
            formatTooltip={(value: number, name: string, props: any) => {
              const formattedValue = formatCurrency(value);
              const axisLabel = isLargeScreen
                ? props.payload.symbol
                : formattedValue;
              const valueLabel = isLargeScreen 
                ? formattedValue 
                : props.payload.symbol;
              return [`${valueLabel} (${axisLabel})`, name];
            }}
            labelFormatter={(label) => `Symbol: ${label}`}
            barSize={isLargeScreen ? 20 : 15}
            colors={{
              positive: 'hsl(152, 57.5%, 37.6%)',
              negative: 'hsl(4, 90%, 58%)',
            }}
          />
        </CardContent>
      </Card>
      <h2 className="text-2xl font-bold mb-4">Open Positions</h2>
      <DataTable columns={columns} data={openPositions}/>
    </div>
  );
};

export default OpenPositions;
