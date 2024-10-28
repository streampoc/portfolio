'use client'

import React, { useEffect, useState } from 'react'
import { useFilters } from '../../contexts/FilterContext'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import BarChart from '../Common/BarChart'
import LoadingSpinner from '../Common/LoadingSpinner'

interface MonthlyData {
  close_month: string
  total_profit_loss: number
  total_commissions: number
  total_fees: number
  net_profit: number
}

interface MonthlyProfitLossChartProps {
  onContentLoaded: () => void;
}

const monthAbbreviations = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const getMonthAbbreviation = (monthNumber: string): string => {
  const index = parseInt(monthNumber, 10) - 1;
  return monthAbbreviations[index] || monthNumber;
};

const MonthlyProfitLossChart: React.FC<MonthlyProfitLossChartProps> = ({ onContentLoaded }) => {
  const [data, setData] = useState<MonthlyData[]>([])
  const { appliedFilters } = useFilters()
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)


  const formatNumber = (value: number | null): string => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return value.toFixed(2);
  };

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
      setIsLoading(true)
      const filterParams = { ...appliedFilters };
      
      // Default to current year if 'All Years' is selected
      if (filterParams.year === 'All Years') {
        filterParams.year = new Date().getFullYear().toString();
      }

      const queryParams = new URLSearchParams(
        Object.entries(filterParams).reduce((acc, [key, value]) => {
          acc[key] = value.toString();
          return acc;
        }, {} as Record<string, string>)
      );

      try {
        console.log('Fetching monthly profit/loss data...', queryParams.toString());
        const response = await fetch(`/api/getMonthlyProfitLoss?${queryParams}`)
        if (!response.ok) {
          throw new Error('Failed to fetch monthly profit/loss data');
        }
        const result = await response.json()
        const formattedData = result.map((item: MonthlyData) => ({
          ...item,
          close_month: getMonthAbbreviation(item.close_month),
          net_profit: Number(item.total_profit_loss) + Number(item.total_commissions) + Number(item.total_fees)
        }));
        setData(formattedData)
      } catch (error) {
        console.error('Error fetching monthly profit/loss data:', error)
      } finally {
        setIsLoading(false)
        onContentLoaded()
      }
    }

    fetchData()
  }, [appliedFilters])

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Net For - {appliedFilters.year === 'All Years' ? new Date().getFullYear().toString() : appliedFilters.year}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No data available.</p>
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
        <CardTitle>Monthly Net For - {appliedFilters.year === 'All Years' ? new Date().getFullYear().toString() : appliedFilters.year}</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          data={data}
          xDataKey="close_month"
          yDataKey="total_profit_loss" //to show net, change this to net_profit
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

export default MonthlyProfitLossChart;
