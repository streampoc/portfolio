'use client';

import React from 'react';
import { useMediaQuery } from 'react-responsive';
import TabNavigation from '../Common/TabNavigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResponsiveTabNavigationProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const ResponsiveTabNavigation: React.FC<ResponsiveTabNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
  const isLargeScreen = useMediaQuery({ minWidth: 1024 });

  if (isLargeScreen) {
    return <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />;
  } else {
    return (
      <Select value={activeTab} onValueChange={onTabChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select tab" />
        </SelectTrigger>
        <SelectContent>
          {tabs.map((tab) => (
            <SelectItem key={tab.id} value={tab.id}>
              {tab.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
};

export default ResponsiveTabNavigation;
