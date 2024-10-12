'use client'

import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { useFilters } from '../../contexts/FilterContext'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface MonthlyData {
  close_month: string
  total_profit_loss: number
  total_commissions: number
  total_fees: number
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Profit/Loss</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis
                dataKey="close_month"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
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
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Bar dataKey="net_profit" name="Net Profit" fill="#8884d8" />
              <Bar dataKey="total_commissions" name="Commissions" fill="#82ca9d" />
              <Bar dataKey="total_fees" name="Fees" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
