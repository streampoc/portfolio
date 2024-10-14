'use client';

import React, { useRef, useEffect } from 'react';
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
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tabsElement = tabsRef.current;
    if (tabsElement) {
      const activeTabElement = tabsElement.querySelector(`[data-state="active"]`);
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeTab]);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="relative">
        <div 
          ref={tabsRef}
          className="overflow-x-auto scrollbar-hide"
          style={{
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <TabsList className="inline-flex w-max bg-background p-1 rounded-lg">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md
                           hover:bg-gray-100 dark:hover:bg-gray-800
                           data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                           data-[state=active]:shadow-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </Tabs>
  );
};

export default TabNavigation;
