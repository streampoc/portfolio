'use client';

import React, { useState } from 'react';
import TabNavigation from '../Common/TabNavigation';
import SummaryCards from './SummaryCards';
import BarChart from './BarChart';
import Calendar from './Calendar';
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
        return <div>Open Positions Content</div>;
      case 'closed-positions':
        return <div>Closed Positions Content</div>;
      case 'stocks':
        return <div>Stocks Content</div>;
      case 'dividends':
        return <div>Dividends Content</div>;
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