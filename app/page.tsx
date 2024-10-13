import { Metadata } from "next"
import Image from "next/image"

import { Sidebar } from "@/components/Sidebar"
import HomeTab from "@/components/Home/HomeTab"
import { FilterProvider } from '@/contexts/FilterContext'

export const metadata: Metadata = {
  title: "Trading Dashboard",
  description: "A comprehensive trading dashboard for analyzing and visualizing trade data.",
}

export default function TradingDashboardPage() {
  return (
    <FilterProvider>
      <div className="bg-background">
        <div className="grid lg:grid-cols-5">
          <Sidebar className="hidden lg:block" />
          <div className="col-span-3 lg:col-span-4 lg:border-l">
            <div className="h-full px-4 py-6 lg:px-8">
              <HomeTab />
            </div>
          </div>
        </div>
      </div>
    </FilterProvider>
  )
}
