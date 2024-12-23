'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';

import { useFilters } from '../../contexts/FilterContext';
import BarChart from '../Common/BarChart';
import { DataTable } from '../Common/DataTable';
import { ColumnDef } from "@tanstack/react-table"
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import LoadingSpinner from '../Common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import ErrorBoundary from '../Common/ErrorBoundary';

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

interface OpenPositionsProps {
  onContentLoaded: () => void;
}

const OpenPositions: React.FC<OpenPositionsProps> = ({ onContentLoaded }) => {
  const { appliedFilters } = useFilters();
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
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
        setError('Failed to load open positions. Please try again later.');
      } finally {
        setIsLoading(false);
        onContentLoaded();
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
  ];

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const chartConfig = {
    total_value: {
      label: 'Net Profit',
      color: 'hsl(152, 57.5%, 37.6%)',
      negativeColor: 'hsl(4, 90%, 58%)',
    },
  };



  return (
    <div className="space-y-6 ">
      <ErrorBoundary>
        {isLoading && <LoadingSpinner />}
        <Suspense fallback={<LoadingSpinner />}>
          <div style={{ visibility: isLoading ? 'hidden' : 'visible' }}>
            {chartData.length > 0 ? (
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
                    formatXAxis={(value) => value}
                    formatYAxis={formatCurrency}
                    formatTooltip={(value: number, name: string, props: any) => {
                      const formattedValue = formatCurrency(value);
                      const axisLabel = isLargeScreen
                        ? formattedValue
                        : props.payload.symbol;
                      const valueLabel = isLargeScreen 
                        ? props.payload.symbol
                        : formattedValue;
                      return [`${valueLabel} (${axisLabel})`, name];
                    }}
                    labelFormatter={(label) => `Symbol: ${label}`}
                    barSize={isLargeScreen ? 20 : 15}
                    colors={{
                      positive: chartConfig.total_value.color,
                      negative: chartConfig.total_value.negativeColor,
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Open Positions by Symbol</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>No data available.</p>
                </CardContent>
                </Card>
            )}
            <Card>
              <CardContent>
                <DataTable 
                  columns={columns} 
                  data={openPositions}
                  showNoResultsMessage={!isLoading && openPositions.length === 0}
                />
              </CardContent>
            </Card>
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default React.memo(OpenPositions);
