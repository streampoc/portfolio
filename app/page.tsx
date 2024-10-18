'use client'

import { Metadata } from "next"
import HomeTab from "@/components/Home/HomeTab"
import { FilterProvider } from '@/contexts/FilterContext'
import { ThemeToggle } from "@/components/Common/ThemeToggle"
import { BarChart2 } from 'lucide-react' // Temporary logo icon

export default function TradingDashboardPage() {
  const handleThemeChange = () => {
    // Any additional logic for theme change if needed
  };

  return (
    <FilterProvider>
      <div className="bg-background min-h-screen flex">
        <div className="flex flex-col flex-grow">
          <header className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-background w-16 h-16 flex items-center justify-center border-r border-border">
                <BarChart2 className="h-8 w-8 text-primary" /> {/* Temporary logo */}
              </div>
              <h1 className="text-2xl font-bold text-foreground ml-4">Trading Dashboard</h1>
            </div>
            <div className="p-4">
              <ThemeToggle onThemeChange={handleThemeChange} />
            </div>
          </header>
          <div className="flex flex-grow">
            <HomeTab />
          </div>
        </div>
      </div>
    </FilterProvider>
  )
}
