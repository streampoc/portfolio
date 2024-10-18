'use client';

import React, { useEffect, useState,Suspense } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import BarChart from '../Common/BarChart';
import { DataTable } from '../Common/DataTable';
import { ColumnDef } from "@tanstack/react-table"
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorBoundary from '../Common/ErrorBoundary';


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

interface ClosedPositionsProps {
    onContentLoaded: () => void;
}

interface ClosedPositionBySymbol {
  underlying_symbol: string;
  total_profit_loss: number;
  total_commissions: number;
  total_fees: number;
}

interface ClosedPositionByMonth {
  close_month: string;
  total_profit_loss: number;
  total_commissions: number;
  total_fees: number;
}

const monthAbbreviations = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const getMonthAbbreviation = (monthNumber: string): string => {
  const index = parseInt(monthNumber, 10) - 1;
  return monthAbbreviations[index] || monthNumber;
};

const ClosedPositions: React.FC<ClosedPositionsProps> = ({ onContentLoaded }) => {
  const { appliedFilters } = useFilters();
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  const [chartData, setChartData] = useState<ClosedPositionBySymbol[] | ClosedPositionByMonth[]>([]);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // 1024px is typically the breakpoint for large screens
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const filterParams = Object.entries(appliedFilters).reduce((acc, [key, value]) => {
          acc[key] = value.toString();
          return acc;
        }, {} as Record<string, string>);

        const queryParams = new URLSearchParams(filterParams);
        
        // Fetch closed positions
        const closedPositionsResponse = await fetch('/api/getClosedPositions?' + queryParams);
        if (!closedPositionsResponse.ok) {
          throw new Error('Failed to fetch closed positions');
        }
        const closedPositionsData = await closedPositionsResponse.json();
        setClosedPositions(closedPositionsData);

        // Fetch data for the chart
        let chartDataResponse;
        if (appliedFilters.ticker !== 'ALL' && appliedFilters.month === 'ALL') {
          chartDataResponse = await fetch('/api/getClosedPositionsByMonth?' + queryParams);
        } else {
          chartDataResponse = await fetch('/api/getClosedPositionsBySymbol?' + queryParams);
        }
        
        if (!chartDataResponse.ok) {
          throw new Error('Failed to fetch chart data');
        }
        const chartDataResult = await chartDataResponse.json();
        setChartData(chartDataResult);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
        onContentLoaded();
      }
    };

    fetchData();
  }, [appliedFilters]);

  const columns: ColumnDef<ClosedPosition>[] = [
    {
      accessorKey: "symbol",
      header: "Symbol",
    },
    {
      accessorKey: "profit_loss",
      header: "Profit/Loss",
      cell: ({ row }) => {
        const pl = parseFloat(row.getValue("profit_loss"));
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          signDisplay: "always"
        }).format(pl);
      },
    },
    {
      accessorKey: "close_date",
      header: "Close Date",
      cell: ({ row }) => new Date(row.getValue("close_date")).toLocaleDateString(),
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
      accessorKey: "close_price",
      header: "Close Price",
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("close_price"));
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
    
  ];

  const formatCurrency = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) {
      console.warn('Invalid currency value:', value);
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const chartConfig = {
    total_profit_loss: {
      label: 'Net Profit/Loss',
      color: 'hsl(152, 57.5%, 37.6%)', // Green color for positive values
      negativeColor: 'hsl(4, 90%, 58%)', // Red color for negative values
    },
  };

  const isGroupedByMonth = appliedFilters.ticker !== 'ALL' && appliedFilters.month === 'ALL';
  
  const calculateChartHeight = () => {
    const baseHeight = 400;
    const itemHeight = isLargeScreen ? 25 : 30;
    const itemCount = chartData.length;
    
    if (isLargeScreen) {
      return Math.min(baseHeight, itemCount * itemHeight);
    } else {
      return Math.max(baseHeight, itemCount * itemHeight);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const NoDataMessage = () => (
    <div className="text-center p-4">
      No data available for the selected filters.
    </div>
  );
  

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
            xDataKey={isGroupedByMonth ? "close_month" : "underlying_symbol"}
            yDataKey="total_profit_loss"
            layout={isLargeScreen ? "horizontal" : "vertical"}
            isLargeScreen={isLargeScreen}
            formatXAxis={isGroupedByMonth ? getMonthAbbreviation : undefined}
            formatYAxis={formatCurrency}
            formatTooltip={(value: number, name: string, props: any) => {
              const formattedValue = formatCurrency(value);
              const axisLabel = isLargeScreen
                ? props.payload.underlying_symbol || getMonthAbbreviation(props.payload.close_month)
                : formattedValue;
              const valueLabel = isLargeScreen 
                ? formattedValue 
                : props.payload.underlying_symbol || getMonthAbbreviation(props.payload.close_month);
              return [`${valueLabel} (${axisLabel})`, name];
            }}
            labelFormatter={(label) => {
              return isGroupedByMonth
                ? `Month: ${getMonthAbbreviation(label)}`
                : `Symbol: ${label}`;
            }}
            barSize={isLargeScreen ? 20 : 15}
            colors={{
              positive: chartConfig.total_profit_loss.color,
              negative: chartConfig.total_profit_loss.negativeColor,
            }}
            />
            </CardContent>
          </Card>
        ) : (
          <div className="text-center p-4 mb-6">
            No data available for the selected filters.
          </div>
        )}
        <Card>
        <CardContent>
                <DataTable 
                  columns={columns} 
                  data={closedPositions}
                  showNoResultsMessage={!isLoading && closedPositions.length === 0}
                />
              </CardContent>
            </Card>
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default ClosedPositions;