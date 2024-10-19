'use client'

import { useState,useEffect } from 'react';
import { FilterProvider } from '@/contexts/FilterContext'
import { ThemeToggle } from "@/components/Common/ThemeToggle"
import { BarChart2, Home, BookOpen, Book, BoxesIcon, DollarSign, FileText, Filter } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from '@/components/Sidebar';
import DashboardContent from '@/components/DashboardContent';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';




const tabs = [
  { id: 'filter', label: 'Filters', icon: Filter },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'open-positions', label: 'Open Positions', icon: BookOpen },
  { id: 'closed-positions', label: 'Closed Positions', icon: Book },
  { id: 'stocks', label: 'Stocks', icon: BoxesIcon },
  { id: 'dividends', label: 'Dividends', icon: DollarSign },
  { id: 'details', label: 'Details', icon: FileText },
];

export default function TradingDashboardPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const router = useRouter();

  const pathname = usePathname();

  useEffect(() => {
    const currentTab = pathname.split('/').pop() || 'home';
    setActiveTab(currentTab);
  }, [pathname]);

  const handleThemeChange = () => {
    // Any additional logic for theme change if needed
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === 'filter') {
      setIsFilterOpen(true);
    } else {
      setActiveTab(tabId);
      // Log the URL
      console.log(`Navigating to: ${window.location.origin}/dashboard/${tabId}`);
      
      // Use router.push to navigate
      router.push(`/dashboard/${tabId}`);
    }
  };

  const handleCloseFilter = () => {
    setIsFilterOpen(false);
  };

  return (
    <FilterProvider>
      <div className="bg-background min-h-screen flex">
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
        <div className="flex flex-col flex-grow">
          <header className="flex justify-between items-center p-4">
            <div className="flex items-center">
              <BarChart2 className="h-8 w-8 text-primary mr-4" />
              <h1 className="text-2xl font-bold text-foreground">Trading Dashboard</h1>
            </div>
            <ThemeToggle onThemeChange={handleThemeChange} />
          </header>
          <main className="flex-grow overflow-auto p-4">
            <DashboardContent activeTab={activeTab} />
          </main>
        </div>
      </div>
    </FilterProvider>
  )
}
