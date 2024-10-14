import { Metadata } from "next"
import { Sidebar } from "@/components/Sidebar"
import HomeTab from "@/components/Home/HomeTab"
import { FilterProvider } from '@/contexts/FilterContext'
import {
  Card,
  CardContent,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Trading Dashboard",
  description: "A comprehensive trading dashboard for analyzing and visualizing trade data.",
}

export default function TradingDashboardPage() {
  return (
    <FilterProvider>
      <div className="bg-background min-h-screen flex flex-col">
        <header className="p-4 bg-primary text-primary-foreground">
          <h1 className="text-2xl font-bold">Trading Dashboard</h1>
        </header>
        <div className="flex flex-col lg:flex-row flex-grow">
          <div className="w-full lg:w-1/5 p-4">
            <Card className="h-full">
              <CardContent className="p-4">
                <Sidebar />
              </CardContent>
            </Card>
          </div>
          <div className="w-full lg:w-4/5 p-4">
            <HomeTab />
          </div>
        </div>
      </div>
    </FilterProvider>
  )
}
