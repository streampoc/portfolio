'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';

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
    return (value || 0).toFixed(2);
  };

  const netProfitLoss = (summaryData.total_profit_loss || 0) + (summaryData.total_commissions || 0) + (summaryData.total_fees || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold">Yearly Profit/Loss</h3>
        <p className={`text-2xl font-bold ${summaryData.total_profit_loss && summaryData.total_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${formatCurrency(summaryData.total_profit_loss)}
        </p>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold">Total Commissions</h3>
        <p className="text-2xl font-bold text-red-600">
          ${formatCurrency(summaryData.total_commissions)}
        </p>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold">Total Fees</h3>
        <p className="text-2xl font-bold text-red-600">
          ${formatCurrency(summaryData.total_fees)}
        </p>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold">Net Profit/Loss</h3>
        <p className={`text-2xl font-bold ${netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${formatCurrency(netProfitLoss)}
        </p>
      </div>
    </div>
  );
};

export default SummaryCards;