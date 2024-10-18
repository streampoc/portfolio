'use client';

import React, { useState, lazy, Suspense } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import ErrorBoundary from '../Common/ErrorBoundary';
import LoadingSpinner from '../Common/LoadingSpinner';
import { Home, BookOpen, Book, BoxesIcon, DollarSign, FileText, Filter } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import Sidebar from '../Sidebar';

const SummaryCards = lazy(() => import('./SummaryCards'));
const MonthlyProfitLossChart = lazy(() => import('./MonthlyProfitLossChart'));
const Calendar = lazy(() => import('./Calendar'));
const OpenPositions = lazy(() => import('../Positions/OpenPositions'));
const ClosedPositions = lazy(() => import('../Positions/ClosedPositions'));
const Stocks = lazy(() => import('../Stocks/Stocks'));
const Dividends = lazy(() => import('../Dividends/Dividends'));
const Details = lazy(() => import('../Details/Details'));

const tabs = [
  { id: 'filter', label: 'Filters', icon: Filter },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'open-positions', label: 'Open Positions', icon: BookOpen },
  { id: 'closed-positions', label: 'Closed Positions', icon: Book },
  { id: 'stocks', label: 'Stocks', icon: BoxesIcon },
  { id: 'dividends', label: 'Dividends', icon: DollarSign },
  { id: 'details', label: 'Details', icon: FileText },
];

const HomeTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { filters } = useFilters();
  const [isLoading, setIsLoading] = useState(true);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleTabChange = (tabId: string) => {
    if (tabId === 'filter') {
      setIsFilterOpen(true);
    } else {
      setIsLoading(true);
      setActiveTab(tabId);
      
      setTimeout(() => {
        if (loadedTabs.has(tabId)) {
          setIsLoading(false);
        }
      }, 300);
    }
  };

  const handleContentLoaded = (tabId: string) => {
    setLoadedTabs(prev => new Set(prev).add(tabId));
    if (tabId === activeTab) {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  const handleCloseFilter = () => {
    setIsFilterOpen(false);
  };

  return (
    <>
      <div className="w-16 bg-background border-r border-border flex flex-col items-center py-4">
        {tabs.map((tab, index) => (
          tab.id === 'filter' ? (
            <Sheet key={tab.id} open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <button
                  className={`p-2 rounded-full ${
                    isFilterOpen
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  } mb-6`}
                  title={tab.label}
                >
                  <tab.icon size={24} />
                </button>
              </SheetTrigger>
              <SheetContent side="left">
                <Sidebar onClose={handleCloseFilter} />
              </SheetContent>
            </Sheet>
          ) : (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`p-2 rounded-full ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              } ${index === 1 ? 'mb-6' : 'mb-4'}`}
              title={tab.label}
            >
              <tab.icon size={24} />
            </button>
          )
        ))}
      </div>
      <div className="flex-grow overflow-auto p-4">
        <ErrorBoundary>
          {isLoading && <LoadingSpinner />}
          <Suspense fallback={<LoadingSpinner />}>
            <div style={{ visibility: isLoading ? 'hidden' : 'visible' }}>
              {activeTab === 'home' && (
                <>
                  <SummaryCards onContentLoaded={() => handleContentLoaded('home')} />
                  <div className="mt-6">
                    <MonthlyProfitLossChart onContentLoaded={() => handleContentLoaded('home')} />
                  </div>
                  <div className="mt-6">
                    <Calendar onContentLoaded={() => handleContentLoaded('home')} />
                  </div>
                </>
              )}
              {activeTab === 'open-positions' && <OpenPositions onContentLoaded={() => handleContentLoaded('open-positions')} />}
              {activeTab === 'closed-positions' && <ClosedPositions onContentLoaded={() => handleContentLoaded('closed-positions')} />}
              {activeTab === 'stocks' && <Stocks onContentLoaded={() => handleContentLoaded('stocks')} />}
              {activeTab === 'dividends' && <Dividends onContentLoaded={() => handleContentLoaded('dividends')} />}
              {activeTab === 'details' && <Details onContentLoaded={() => handleContentLoaded('details')} />}
            </div>
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
};

export default React.memo(HomeTab);
