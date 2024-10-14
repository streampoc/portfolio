'use client'

import { useEffect, useState } from 'react'
import { useFilters } from '../../contexts/FilterContext'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import BarChart from '../Common/BarChart'

interface MonthlyData {
  close_month: string
  total_profit_loss: number
  total_commissions: number
  total_fees: number
  net_profit: number
}

const monthAbbreviations = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const getMonthAbbreviation = (monthNumber: string): string => {
  const index = parseInt(monthNumber, 10) - 1;
  return monthAbbreviations[index] || monthNumber;
};

export function MonthlyProfitLossChart() {
  const [data, setData] = useState<MonthlyData[]>([])
  const { appliedFilters } = useFilters()
  const [isLargeScreen, setIsLargeScreen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const filterParams = Object.entries(appliedFilters).reduce((acc, [key, value]) => {
        acc[key] = value.toString();
        return acc;
      }, {} as Record<string, string>);
      const queryParams = new URLSearchParams(filterParams);
      try {
        console.log('Fetching monthly profit/loss data...', queryParams.toString());
        const response = await fetch(`/api/getMonthlyProfitLoss?${queryParams}`)
        if (!response.ok) {
          throw new Error('Failed to fetch monthly profit/loss data');
        }
        const result = await response.json()
        console.log('Received data:', result);
        const formattedData = result.map((item: MonthlyData) => ({
          ...item,
          close_month: getMonthAbbreviation(item.close_month),
          net_profit: item.total_profit_loss - item.total_commissions - item.total_fees
        }));
        console.log('Formatted data:', formattedData);
        setData(formattedData)
      } catch (error) {
        console.error('Error fetching monthly profit/loss data:', error)
      }
    }

    fetchData()
  }, [appliedFilters])

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  console.log('Rendering chart with data:', data);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Profit/Loss</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No data available for the selected filters.</p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    net_profit: {
      label: 'Net Profit',
      color: 'hsl(152, 57.5%, 37.6%)',
      negativeColor: 'hsl(4, 90%, 58%)',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Profit/Loss</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          data={data}
          xDataKey="close_month"
          yDataKey="net_profit"
          layout={isLargeScreen ? "horizontal" : "vertical"}
          isLargeScreen={isLargeScreen}
          formatXAxis={getMonthAbbreviation}
          formatYAxis={formatCurrency}
          formatTooltip={(value: number, name: string, props: any) => {
            const formattedValue = formatCurrency(value);
            const axisLabel = isLargeScreen
              ? props.payload.close_month
              : formattedValue;
            const valueLabel = isLargeScreen 
              ? formattedValue 
              : props.payload.close_month;
            return [`${valueLabel} (${axisLabel})`, name];
          }}
          labelFormatter={(label) => `Month: ${label}`}
          barSize={isLargeScreen ? 20 : 15}
          colors={{
            positive: chartConfig.net_profit.color,
            negative: chartConfig.net_profit.negativeColor,
          }}
        />
      </CardContent>
    </Card>
  )
}
