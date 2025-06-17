'use client';

import React, { memo } from 'react';
import DataCard from '../Common/DataCard';
import { Card } from '../ui/card';

type MoneyMovement = {
  date: string;
  symbol: string;
  type: string;
  amount: number;
  description: string;
  account: string;
};

interface MoneyMovementsSummaryProps {
  movements: MoneyMovement[];
}

const MoneyMovementsSummary = memo(({ movements }: MoneyMovementsSummaryProps) => {
  if (!movements || movements.length === 0) {
    return null;
  }

  // Calculate total for specific movement types
  const calculateTotalByType = (type: string): number => {
    if (type === 'FUNDS') {
      return movements
        .filter(m => m.type === 'FUNDS' || m.description.toUpperCase().includes('ACH'))
        .reduce((sum, m) => sum + m.amount, 0);
    }
    if (type === 'DIVIDEND') {
      // Match either type being DIVIDEND or symbol being DIVIDEND
      return movements
        .filter(m => m.type === 'DIVIDEND' || m.symbol === 'DIVIDEND')
        .reduce((sum, m) => sum + m.amount, 0);
    }
    return movements
      .filter(m => m.type === type)
      .reduce((sum, m) => sum + m.amount, 0);
  };

  // Calculate transaction count for specific movement types
  const getTransactionCountByType = (type: string): number => {
    if (type === 'FUNDS') {
      return movements.filter(m => 
        m.type === 'FUNDS' || m.description.toUpperCase().includes('ACH')
      ).length;
    }
    if (type === 'DIVIDEND') {
      // Match either type being DIVIDEND or symbol being DIVIDEND
      return movements.filter(m => 
        m.type === 'DIVIDEND' || m.symbol === 'DIVIDEND'
      ).length;
    }
    return movements.filter(m => m.type === type).length;
  };

  // Calculate totals
  const totalFunds = calculateTotalByType('FUNDS');
  const totalDividends = calculateTotalByType('DIVIDEND');
  const totalInterest = calculateTotalByType('INTEREST');
  const totalMargin = calculateTotalByType('MARGIN');

  // Get counts
  const fundsCount = getTransactionCountByType('FUNDS');
  const dividendsCount = getTransactionCountByType('DIVIDEND');
  const interestCount = getTransactionCountByType('INTEREST');
  const marginCount = getTransactionCountByType('MARGIN');

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Money Movements Summary</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <DataCard
          title={`Funds (${fundsCount})`}
          value={totalFunds.toFixed(2)}
          amount={totalFunds}
          className="bg-gray-50 dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-200 w-full"
          aria-label={`Total funds movements: ${totalFunds}`}
        />
        <DataCard
          title={`Dividends (${dividendsCount})`}
          value={totalDividends.toFixed(2)}
          amount={totalDividends}
          className="bg-gray-50 dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-200 w-full"
          aria-label={`Total dividends: ${totalDividends}`}
        />
        <DataCard
          title={`Interest (${interestCount})`}
          value={totalInterest.toFixed(2)}
          amount={totalInterest}
          className="bg-gray-50 dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-200 w-full"
          aria-label={`Total interest: ${totalInterest}`}
        />
        <DataCard
          title={`Margin (${marginCount})`}
          value={totalMargin.toFixed(2)}
          amount={totalMargin}
          className="bg-gray-50 dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-200 w-full"
          aria-label={`Total margin: ${totalMargin}`}
        />
      </div>
    </div>
  );
});

MoneyMovementsSummary.displayName = 'MoneyMovementsSummary';

export default MoneyMovementsSummary;