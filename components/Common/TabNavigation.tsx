'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Tab = {
  id: string;
  label: string;
};

type TabNavigationProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default TabNavigation;
