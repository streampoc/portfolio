'use client';

import React, { useState, lazy, Suspense } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { Tabs, TabsContent } from "@/components/ui/tabs"
import ErrorBoundary from '../Common/ErrorBoundary';
import LoadingSpinner from '../Common/LoadingSpinner';
import dynamic from 'next/dynamic';

const ResponsiveTabNavigation = dynamic(() => import('../Common/ResponsiveTabNavigation'), { ssr: false });

const SummaryCards = lazy(() => import('./SummaryCards'));
const MonthlyProfitLossChart = lazy(() => import('./MonthlyProfitLossChart'));
const Calendar = lazy(() => import('./Calendar'));
const OpenPositions = lazy(() => import('../Positions/OpenPositions'));
const ClosedPositions = lazy(() => import('../Positions/ClosedPositions'));
const Stocks = lazy(() => import('../Stocks/Stocks'));
const Dividends = lazy(() => import('../Dividends/Dividends'));
const Details = lazy(() => import('../Details/Details'));

const tabs = [
  { id: 'home', label: 'Home' },
  { id: 'open-positions', label: 'Open Positions' },
  { id: 'closed-positions', label: 'Closed Positions' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'dividends', label: 'Dividends' },
  { id: 'details', label: 'Details' },
];

const HomeTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { filters } = useFilters();
  const [isLoading, setIsLoading] = useState(true);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());

  const handleTabChange = (tabId: string) => {
    setIsLoading(true);
    setActiveTab(tabId);
    
    setTimeout(() => {
      if (loadedTabs.has(tabId)) {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleContentLoaded = (tabId: string) => {
    setLoadedTabs(prev => new Set(prev).add(tabId));
    if (tabId === activeTab) {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-grow">
        <ResponsiveTabNavigation tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex-grow overflow-auto mt-4 relative">
          <ErrorBoundary>
            {isLoading && <LoadingSpinner />}
            <Suspense fallback={<LoadingSpinner />}>
              <div style={{ visibility: isLoading ? 'hidden' : 'visible' }}>
                <TabsContent value="home">
                  <SummaryCards onContentLoaded={() => handleContentLoaded('home')} />
                  <div className="mt-6">
                    <MonthlyProfitLossChart onContentLoaded={() => handleContentLoaded('home')} />
                  </div>
                  <div className="mt-6">
                    <Calendar onContentLoaded={() => handleContentLoaded('home')} />
                  </div>
                </TabsContent>
                <TabsContent value="open-positions">
                  <OpenPositions onContentLoaded={() => handleContentLoaded('open-positions')} />
                </TabsContent>
                <TabsContent value="closed-positions">
                  <ClosedPositions onContentLoaded={() => handleContentLoaded('closed-positions')} />
                </TabsContent>
                <TabsContent value="stocks">
                  <Stocks onContentLoaded={() => handleContentLoaded('stocks')} />
                </TabsContent>
                <TabsContent value="dividends">
                  <Dividends onContentLoaded={() => handleContentLoaded('dividends')} />
                </TabsContent>
                <TabsContent value="details">
                  <Details onContentLoaded={() => handleContentLoaded('details')} />
                </TabsContent>
              </div>
            </Suspense>
          </ErrorBoundary>
        </div>
      </Tabs>
    </div>
  );
};

export default React.memo(HomeTab);
