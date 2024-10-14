'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { DataTable } from '../Common/DataTable';
import PieChart from '../Common/PieChart';
import LineChart from '../Common/LineChart';
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

interface MonthlyDividend {
  monthYear: string;
  total: number;
  symbolBreakdown: { [key: string]: number };
}

const monthAbbreviations = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const getMonthAbbreviation = (monthNumber: string): string => {
  const index = parseInt(monthNumber, 10) - 1;
  return monthAbbreviations[index] || monthNumber;
};

const Dividends: React.FC = () => {
  const { appliedFilters } = useFilters();
  const [dividendPositions, setDividendPositions] = useState<DividendPosition[]>([]);
  const [groupedDividends, setGroupedDividends] = useState<GroupedDividend[]>([]);
  const [monthlyDividends, setMonthlyDividends] = useState<MonthlyDividend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDividendPositions = async () => {
      setIsLoading(true);
      setError(null);
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
        setError('Failed to load dividend data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDividendPositions();
  }, [appliedFilters]);

  const groupedData = useMemo(() => {
    const grouped: Record<string, number> = dividendPositions.reduce((acc: Record<string, number>, curr: DividendPosition) => {
      const amount = parseFloat(curr.profit_loss);
      acc[curr.underlying_symbol] = (acc[curr.underlying_symbol] || 0) + amount;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));
  }, [dividendPositions]);

  const monthlyData = useMemo(() => {
    const grouped: Record<string, { total: number; symbolBreakdown: Record<string, number> }> = dividendPositions.reduce((acc, curr) => {
      const date = new Date(curr.close_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const amount = parseFloat(curr.profit_loss);
      
      if (!acc[monthKey]) {
        acc[monthKey] = { total: 0, symbolBreakdown: {} };
      }
      
      acc[monthKey].total += amount;
      acc[monthKey].symbolBreakdown[curr.underlying_symbol] = (acc[monthKey].symbolBreakdown[curr.underlying_symbol] || 0) + amount;
      
      return acc;
    }, {} as Record<string, { total: number; symbolBreakdown: Record<string, number> }>);

    return Object.entries(grouped)
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-');
        return {
          monthYear: `${getMonthAbbreviation(month)} ${year}`,
          total: Number(data.total.toFixed(2)),
          symbolBreakdown: Object.fromEntries(
            Object.entries(data.symbolBreakdown).map(([symbol, value]) => [symbol, Number(value.toFixed(2))])
          )
        };
      })
      .sort((a, b) => a.monthYear.localeCompare(b.monthYear));
  }, [dividendPositions]);

  useEffect(() => {
    setGroupedDividends(groupedData);
    setMonthlyDividends(monthlyData);
  }, [groupedData, monthlyData]);

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

  const pieChartColors = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40",
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"
  ];

  const handleExport = () => {
    // Implement CSV export logic here
    console.log('Exporting data...');
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  if (isLoading) {
    return <div>Loading dividend positions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (dividendPositions.length === 0) {
    return <div>No dividend positions found for the selected filters.</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dividend Positions</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent>
            <PieChart
              data={groupedDividends}
              colors={pieChartColors}
              title="Dividends by Symbol"
              description="Total dividends received per symbol"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Dividend Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={monthlyDividends}
              xDataKey="monthYear"
              yDataKey="total"
              color="#8884d8"
              xAxisLabel="Month"
              yAxisLabel="Dividend Amount"
              formatYAxis={formatCurrency}
              formatTooltip={(value: number, name: string | number, props: any) => {
                const formattedValue = formatCurrency(value);
                const symbolBreakdown = props.payload.symbolBreakdown;
                const breakdownString = Object.entries(symbolBreakdown)
                  .map(([symbol, amount]) => `${symbol}: ${formatCurrency(amount as number)}`)
                  .join('\n');
                return [`${props.payload.monthYear}: ${formattedValue}\n\nBreakdown:\n${breakdownString}`, name.toString()];
              }}
            />
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Dividend Details</h3>
          <Button onClick={handleExport}>Export CSV</Button>
        </div>
        <DataTable 
          columns={columns} 
          data={dividendPositions}
        />
      </div>
    </div>
  );
};

export default Dividends;