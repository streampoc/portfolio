'use client';

import React, { useState } from 'react';
import TabNavigation from '../Common/TabNavigation';
import SummaryCards from './SummaryCards';
import BarChart from './BarChart';
import Calendar from './Calendar';
import OpenPositions from '../Positions/OpenPositions';
import ClosedPositions from '../Positions/ClosedPositions';
import Stocks from '../Stocks/Stocks';
import Dividends from '../Dividends/Dividends';
import { useFilters } from '../../contexts/FilterContext';

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <SummaryCards />
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Profit/Loss Chart</h2>
              <BarChart />
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Monthly Calendar</h2>
              <Calendar />
            </div>
          </>
        );
      case 'open-positions':
        return <OpenPositions />;
      case 'closed-positions':
        return <ClosedPositions />;
      case 'stocks':
        return <Stocks />;
      case 'dividends':
        return <Dividends />;
      case 'details':
        return <div>Details Content</div>;
      default:
        return null;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Trading Dashboard</h1>
      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      {renderTabContent()}
    </div>
  );
};

export default HomeTab;