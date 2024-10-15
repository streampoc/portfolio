'use client'

import { Metadata } from "next"
import { Sidebar } from "@/components/Sidebar"
import HomeTab from "@/components/Home/HomeTab"
import { FilterProvider } from '@/contexts/FilterContext'
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from "@/components/ui/sheet"
import { Menu } from 'lucide-react'
import { useState } from 'react'

export default function TradingDashboardPage() {
  const [open, setOpen] = useState(false);

  const handleClose = () => setOpen(false);

  return (
    <FilterProvider>
      <div className="bg-background min-h-screen flex flex-col">
        <header className="p-4 bg-primary text-primary-foreground flex justify-between items-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="secondary" size="icon" className="z-50">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Use Filters</SheetTitle>
              <SheetDescription>
                Choose Any Filter. Click Apply Filter button when you're done.
              </SheetDescription>
            </SheetHeader>
              <div className="grid grid-cols-1 items-center gap-4 text-white">
                  <Sidebar onClose={handleClose} />
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-2xl font-bold">Trading Dashboard</h1>
          <div className="w-10"></div> {/* This empty div balances the layout */}
        </header>
        <div className="flex-grow p-4">
          <HomeTab />
        </div>
      </div>
    </FilterProvider>
  )
}
