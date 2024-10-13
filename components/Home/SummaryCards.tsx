'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import DataCard from '../Common/DataCard';

interface SummaryData {
  total_profit_loss: number | null;
  total_commissions: number | null;
  total_fees: number | null;
}

const SummaryCards: React.FC = () => {
  const { appliedFilters } = useFilters();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  useEffect(() => {
    const fetchSummaryData = async () => {
      const filterParams = Object.entries(appliedFilters).reduce((acc, [key, value]) => {
        acc[key] = value.toString();
        return acc;
      }, {} as Record<string, string>);

      const queryParams = new URLSearchParams(filterParams);
      try {
        const response = await fetch(`/api/getSummary?${queryParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch summary data');
        }
        const data = await response.json();
        setSummaryData({
          total_profit_loss: Number(data.total_profit_loss) || 0,
          total_commissions: Number(data.total_commissions) || 0,
          total_fees: Number(data.total_fees) || 0,
        });
      } catch (error) {
        console.error('Error fetching summary data:', error);
        setSummaryData(null);
      }
    };

    fetchSummaryData();
  }, [appliedFilters]);

  if (!summaryData) {
    return <div>Loading summary data...</div>;
  }

  const formatCurrency = (value: number | null): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  };

  const netProfitLoss = (summaryData.total_profit_loss || 0) - (summaryData.total_commissions || 0) - (summaryData.total_fees || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <DataCard 
        title="Yearly Profit/Loss" 
        value={formatCurrency(summaryData.total_profit_loss)}
        amount={summaryData.total_profit_loss || 0}
        className="bg-white"
      />
      <DataCard 
        title="Total Commissions" 
        value={formatCurrency(summaryData.total_commissions)}
        amount={(summaryData.total_commissions || 0)}
        className="bg-white"
      />
      <DataCard 
        title="Total Fees" 
        value={formatCurrency(summaryData.total_fees)}
        amount={(summaryData.total_fees || 0)}
        className="bg-white"
      />
      <DataCard 
        title="Net Profit/Loss" 
        value={formatCurrency(netProfitLoss)}
        amount={netProfitLoss}
        className="bg-white"
      />
    </div>
  );
};

export default SummaryCards;
