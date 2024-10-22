'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import DataCard from '../Common/DataCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SummaryData {
  close_year: string;
  total_profit_loss: string;
  total_commissions: string;
  total_fees: string;
}

interface MoneySummaryData {
  close_year: string;
  symbol: string;
  total_amount: string;
}

interface LifeSummaryData {
  life_profit_loss?: number;
  life_interest?: number;
  life_cash?: number;
}

interface SummaryCardsProps {
  onContentLoaded: () => void;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ onContentLoaded }) => {
  const { appliedFilters } = useFilters();
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  const [moneySummaryData, setMoneySummaryData] = useState<MoneySummaryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const filterParams = Object.entries(appliedFilters).reduce((acc, [key, value]) => {
          acc[key] = value.toString();
          return acc;
        }, {} as Record<string, string>);

        const queryParams = new URLSearchParams(filterParams);
        
        // Fetch summary data
        const summaryResponse = await fetch(`/api/getSummary?${queryParams}`);
        if (!summaryResponse.ok) {
          throw new Error('Failed to fetch summary data');
        }
        const summaryResult = await summaryResponse.json();
        setSummaryData(summaryResult);

        // Fetch money summary data
        const moneySummaryResponse = await fetch(`/api/getMoneySummary?${queryParams}`);
        if (!moneySummaryResponse.ok) {
          throw new Error('Failed to fetch money summary data');
        }
        const moneySummaryResult = await moneySummaryResponse.json();
        setMoneySummaryData(moneySummaryResult);

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
        onContentLoaded();
      }
    };

    fetchData();
  }, [appliedFilters]);

  const formatCurrency = (value: number | null): string => {
    if (value === null || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const sortedSummaryData = useMemo(() => {
    return [...summaryData].sort((a, b) => parseInt(b.close_year) - parseInt(a.close_year));
  }, [summaryData]);

  //build lifetime profit/loss, cash and interest if 'All Years' selected.
  let lifeSummaryData:LifeSummaryData = {}

  if(appliedFilters.year=='All Years'){
      let life_interest = 0;
      let life_cash = 0;
      let life_profit = 0;
      moneySummaryData.map((moneyData) => {
        if(moneyData.symbol == 'INTEREST')
          life_interest += parseFloat(moneyData.total_amount);
        else if (moneyData.symbol == 'CASH')
          life_cash += parseFloat(moneyData.total_amount);
      });
      //now lets also get total p/l
      summaryData.map((yearData) => {
        const netProfitLoss = parseFloat(yearData.total_profit_loss) + 
                              parseFloat(yearData.total_commissions) + 
                              parseFloat(yearData.total_fees);
          life_profit += netProfitLoss
      });
      lifeSummaryData = {
        'life_profit_loss':life_profit,
        'life_interest':life_interest,
        'life_cash':life_cash
      }
  }

  const TouchFriendlyTooltip: React.FC<{ children: React.ReactNode; content: React.ReactNode }> = ({ children, content }) => {
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  
    return (
      <Tooltip open={isTooltipOpen}>
        <TooltipTrigger asChild>
          <div
            className="cursor-pointer"
            onMouseEnter={() => setIsTooltipOpen(true)}
            onMouseLeave={() => setIsTooltipOpen(false)}
            onTouchStart={() => setIsTooltipOpen(true)}
            onTouchEnd={() => setIsTooltipOpen(false)}
          >
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (summaryData.length === 0 && moneySummaryData.length === 0) {
    return <div>No summary data available.</div>;
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {lifeSummaryData.life_profit_loss && (
          <>
              <TouchFriendlyTooltip
                key={`${lifeSummaryData.life_profit_loss}`}
                content={
                  <p>Lifetime profit/loss {lifeSummaryData.life_profit_loss.toFixed(2)}</p>
                }
              >
                <DataCard 
                  title={`Lifetime P/L`}
                  value={`${lifeSummaryData.life_profit_loss?.toFixed(2)}`}
                  amount={lifeSummaryData.life_profit_loss}
                  className="bg-white dark:bg-gray-800 w-full"
                  aria-label={`Lifetime P/L is ${lifeSummaryData.life_profit_loss}`}
                />
              </TouchFriendlyTooltip>
              <TouchFriendlyTooltip
                key={`${lifeSummaryData.life_cash}`}
                content={
                  <p>Lifetime cash {lifeSummaryData.life_cash}</p>
                }
              >
                <DataCard 
                  title={`Lifetime Cash`}
                  value={`${lifeSummaryData.life_cash}`}
                  amount={lifeSummaryData.life_cash}
                  className="bg-white dark:bg-gray-800 w-full"
                  aria-label={`Lifetime Cash is ${lifeSummaryData.life_cash}`}
                />
            </TouchFriendlyTooltip>
            <TouchFriendlyTooltip
              key={`${lifeSummaryData.life_interest}`}
              content={
                <p>Lifetime interest {lifeSummaryData.life_interest?.toFixed(2)}</p>
              }
            >
              <DataCard 
                title={`Lifetime Interest`}
                value={`${lifeSummaryData.life_interest?.toFixed(2)}`}
                amount={lifeSummaryData.life_interest}
                className="bg-white dark:bg-gray-800 w-full"
                aria-label={`Lifetime Interest is ${lifeSummaryData.life_interest}`}
              />
            </TouchFriendlyTooltip>
          </>
        )}
        {sortedSummaryData.map((yearData) => {
          const netProfitLoss = parseFloat(yearData.total_profit_loss) + 
                                parseFloat(yearData.total_commissions) + 
                                parseFloat(yearData.total_fees);
          return (
            <TouchFriendlyTooltip
              key={yearData.close_year}
              content={
                <>
                  <p>Net profit or loss after commissions and fees for {yearData.close_year}</p>
                  <p>Profit/Loss: {formatCurrency(parseFloat(yearData.total_profit_loss))}</p>
                  <p>Commissions: {formatCurrency(parseFloat(yearData.total_commissions))}</p>
                  <p>Fees: {formatCurrency(parseFloat(yearData.total_fees))}</p>
                </>
              }
            >
              <DataCard 
                title={`${yearData.close_year}`}
                value={formatCurrency(netProfitLoss)}
                amount={netProfitLoss}
                className="bg-white dark:bg-gray-800 w-full"
                aria-label={`Net Profit/Loss for ${yearData.close_year}`}
              />
            </TouchFriendlyTooltip>
          );
        })}
        {moneySummaryData.map((moneyData) => (
          <TouchFriendlyTooltip
            key={`${moneyData.close_year}-${moneyData.symbol}`}
            content={
              <p>Total amount for {moneyData.symbol} in {moneyData.close_year}</p>
            }
          >
            <DataCard 
              title={`${moneyData.close_year} - ${moneyData.symbol}`}
              value={formatCurrency(parseFloat(moneyData.total_amount))}
              amount={parseFloat(moneyData.total_amount)}
              className="bg-white dark:bg-gray-800 w-full"
              aria-label={`Money Summary for ${moneyData.close_year} - ${moneyData.symbol}`}
            />
          </TouchFriendlyTooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default React.memo(SummaryCards);
