'use client';

import React, { lazy, Suspense } from 'react';
import LoadingSpinner from './Common/LoadingSpinner';
import ErrorBoundary from './Common/ErrorBoundary';

const SummaryCards = lazy(() => import('./Home/SummaryCards'));
const MonthlyProfitLossChart = lazy(() => import('./Home/MonthlyProfitLossChart'));
const Calendar = lazy(() => import('./Home/Calendar'));
const OpenPositions = lazy(() => import('./Positions/OpenPositions'));
const ClosedPositions = lazy(() => import('./Positions/ClosedPositions'));
const Stocks = lazy(() => import('./Stocks/Stocks'));
const Dividends = lazy(() => import('./Dividends/Dividends'));
const Details = lazy(() => import('./Details/Details'));

interface DashboardContentProps {
  activeTab: string;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ activeTab }) => {
  const handleContentLoaded = () => {
    // You can implement any logic needed when content is loaded
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        {activeTab === 'home' && (
          <>
            <SummaryCards onContentLoaded={handleContentLoaded} />
            <div className="mt-6">
              <MonthlyProfitLossChart onContentLoaded={handleContentLoaded} />
            </div>
            <div className="mt-6">
              <Calendar onContentLoaded={handleContentLoaded} />
            </div>
          </>
        )}
        {activeTab === 'open-positions' && <OpenPositions onContentLoaded={handleContentLoaded} />}
        {activeTab === 'closed-positions' && <ClosedPositions onContentLoaded={handleContentLoaded} />}
        {activeTab === 'stocks' && <Stocks onContentLoaded={handleContentLoaded} />}
        {activeTab === 'dividends' && <Dividends onContentLoaded={handleContentLoaded} />}
        {activeTab === 'details' && <Details onContentLoaded={handleContentLoaded} />}
      </Suspense>
    </ErrorBoundary>
  );
};

export default DashboardContent;
