'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';
import DataTable from '../Common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer } from '../ui/chart';

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

const ClosedPositions: React.FC = () => {
  const { appliedFilters } = useFilters();
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  const [chartData, setChartData] = useState<ClosedPositionBySymbol[] | ClosedPositionByMonth[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      }
    };

    fetchData();
  }, [appliedFilters]);

  if (isLoading) {
    return <div>Loading closed positions...</div>;
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const chartConfig = {
    total_profit_loss: {
      label: 'Net Profit/Loss',
      color: 'hsl(152, 57.5%, 37.6%)',
    },
    total_commissions: {
      label: 'Commissions',
      color: 'hsl(4, 90%, 58%)',
    },
    total_fees: {
      label: 'Fees',
      color: 'hsl(45, 93%, 47.5%)',
    },
  };

  const isGroupedByMonth = appliedFilters.ticker !== 'ALL' && appliedFilters.month === 'ALL';

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>
            {isGroupedByMonth ? 'Profit/Loss by Month' : 'Profit/Loss by Symbol'} {appliedFilters.ticker !== 'ALL' ? `for ${appliedFilters.ticker}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            className="h-[400px]"
            config={chartConfig}
          >
            <BarChart data={chartData}>
              <XAxis
                dataKey={isGroupedByMonth ? "close_month" : "underlying_symbol"}
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={isGroupedByMonth ? getMonthAbbreviation : undefined}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                labelFormatter={(label) => isGroupedByMonth ? `Month: ${getMonthAbbreviation(label)}` : `Symbol: ${label}`}
              />
              <Legend />
              <Bar dataKey="total_profit_loss" name="Net Profit/Loss">
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.total_profit_loss >= 0 ? chartConfig.total_profit_loss.color : chartConfig.total_commissions.color}
                  />
                ))}
              </Bar>
              <Bar dataKey="total_commissions" fill={chartConfig.total_commissions.color} />
              <Bar dataKey="total_fees" fill={chartConfig.total_fees.color} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <div className="mt-8">
        <DataTable data={closedPositions} />
      </div>
    </div>
  );
};

export default ClosedPositions;
