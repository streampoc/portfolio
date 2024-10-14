'use client';

import React, { useState } from 'react';
import TabNavigation from '../Common/TabNavigation';
import SummaryCards from './SummaryCards';
import Calendar from './Calendar';
import OpenPositions from '../Positions/OpenPositions';
import ClosedPositions from '../Positions/ClosedPositions';
import Stocks from '../Stocks/Stocks';
import Dividends from '../Dividends/Dividends';
import { useFilters } from '../../contexts/FilterContext';
import { MonthlyProfitLossChart } from './MonthlyProfitLossChart';
import { Tabs, TabsContent } from "@/components/ui/tabs"

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

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow">
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-grow overflow-auto mt-4">
          <TabsContent value="home">
            <SummaryCards />
            <div className="mt-6">
              <MonthlyProfitLossChart />
            </div>
            <div className="mt-6">
              <h2 className="text-2xl font-bold mb-4">Monthly Calendar</h2>
              <Calendar />
            </div>
          </TabsContent>
          <TabsContent value="open-positions">
            <OpenPositions />
          </TabsContent>
          <TabsContent value="closed-positions">
            <ClosedPositions />
          </TabsContent>
          <TabsContent value="stocks">
            <Stocks />
          </TabsContent>
          <TabsContent value="dividends">
            <Dividends />
          </TabsContent>
          <TabsContent value="details">
            <div>Details Content</div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default HomeTab;
