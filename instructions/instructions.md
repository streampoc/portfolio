# Trading Dashboard Project Overview

## Project Description
The project involves building a trading dashboard to visualize and analyze trades conducted across various trading platforms. The core goal is to provide clear insights into overall portfolio performance, filter trades based on user-selected criteria, and allow users to view specific details like open and closed positions, stock performance, and dividends. The data is already consolidated in a PostgreSQL table called trades.

## Suggested File Structure

```
Portfolio
├── README.md
├── app
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── fonts
│       └── [font files, if needed]
├── components
│   ├── Sidebar.tsx                  // Sidebar with filters
│   ├── Home
│   │   ├── SummaryCards.tsx          // Cards for yearly P/L, investment, margin, monthly summaries
│   │   ├── BarChart.tsx              // Reusable bar chart component for profit/loss
│   │   ├── Calendar.tsx              // Monthly calendar with profit/loss display
│   │   └── HomeTab.tsx               // Main Home tab page with all cards + charts
│   ├── Positions
│   │   ├── OpenPositions.tsx         // Open positions page with chart and table
│   │   ├── ClosedPositions.tsx       // Closed positions page with chart and table
│   └── Common
│       ├── DataTable.tsx             // Reusable table component for data display (e.g. Open, Closed, Stocks)
│       ├── BarChart.tsx              // (Reused) Chart component for stocks, positions, details
│       └── TabNavigation.tsx         // Navigation bar between Home, Positions, Stocks, etc.
├── pages
│   ├── api
│   │   └── trades.ts                 // API routes for querying trades data from Postgres
│   └── index.tsx                     // Main entry point for the app, rendering layout + sidebar + home page
├── services
│   └── db.ts                         // Database interaction with Postgres
├── utils
│   ├── filters.ts                    // Filter logic for sidebar (Account, Ticker, Date)
│   ├── chartHelpers.ts               // Utility functions for chart data manipulation
│   └── format.ts                     // Formatting functions (e.g. currency, date)
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Core Functionalities Breakdown

### 1. Home Page with Overview Visualizations

**Goal:** Display a summary of the entire portfolio using visualizations and cards to represent critical metrics like profit/loss, investment, margin paid, and monthly breakdown.

**Components:**

- `SummaryCards.tsx`: Contains the top-level overview cards:
  - Yearly profit/loss
  - Investment (deposits/withdrawals)
  - Margin paid
  - Monthly summary (shows all months for the selected year; ignore month filter)
- `BarChart.tsx`: A reusable bar chart component for displaying the profit/loss for all trades in the selected month. It will pull data based on the filters selected from the sidebar.
- `Calendar.tsx`: Displays the monthly calendar with profit/loss for each day. The calendar will also include a total for each week (instead of Sunday) and a grand total for the selected month.
- `HomeTab.tsx`: The main component of the "Home" tab that renders SummaryCards.tsx, BarChart.tsx, and Calendar.tsx to form the complete home page.

**File Structure:**

```
components/Home/
├── SummaryCards.tsx
├── BarChart.tsx
├── Calendar.tsx
└── HomeTab.tsx
```

### 2. Sidebar with Filters

**Goal:** Implement a sidebar that allows filtering of the displayed data on the dashboard by account, ticker symbol, year, month, week, and day. When a filter is changed, the visualizations on the right side should update accordingly.

**Component:**
- `Sidebar.tsx`: A component to display and handle filter changes. This will trigger data updates for the visualizations on the home page.
- Filters Logic: The logic for handling filters (e.g., accounts, tickers, dates) should be abstracted into a utility file filters.ts for easy management and reusability.

**File Structure:**
```
components/
├── Sidebar.tsx
utils/
└── filters.ts
```

### 3. Tab Navigation

**Goal:** Create a tab navigation on the home page to switch between different views (Home, Open Positions, Closed Positions, Stocks, Dividends, Details).

**Component:**
- `TabNavigation.tsx`: A reusable tab navigation component that will allow users to switch between different sections. It should use state management to dynamically load the selected tab's content.

**File Structure:**
```
components/Common/
└── TabNavigation.tsx
```

### 4. Open Positions Tab

**Goal:** Display all open positions with a bar chart showing amounts and a table with details for each position.

**Components:**
- `BarChart.tsx`: Reused from the Common folder to display the open position amounts.
- `DataTable.tsx`: A reusable table component to display detailed information on the open positions.
- `OpenPositions.tsx`: The main component for this tab, integrating both the chart and table.

**File Structure:**
```
components/Positions/
├── OpenPositions.tsx
└── ClosedPositions.tsx
components/Common/
├── BarChart.tsx
└── DataTable.tsx
```

### 5. Closed Positions Tab

**Goal:** Display all closed positions with a bar chart and a table of detailed data (similar to Open Positions).

**Components:**
- `BarChart.tsx`: Reused from the Common folder.
- `DataTable.tsx`: Reused from the Common folder.
- `ClosedPositions.tsx`: The main component for this tab.

**File Structure:**
```
components/Positions/
└── ClosedPositions.tsx
```

### 6. Stocks Tab

**Goal:** Display stock positions with both a bar chart showing stock amounts and a table with relevant details.

**Components:**
- `BarChart.tsx` and `DataTable.tsx` will be reused here.
- A `Stocks.tsx` component will be created for managing and displaying stock data.

**File Structure:**
```
components/Stocks/
└── Stocks.tsx
```

### 7. Dividends Tab

**Goal:** Display dividend payouts along with a bar chart and detailed table.

**Component:**
- Similar to other tabs, you will use the same `BarChart.tsx` and `DataTable.tsx` components. A `Dividends.tsx` component will manage the display of dividend data.

**File Structure:**
```
components/Dividends/
└── Dividends.tsx
```

### 8. Details Tab

**Goal:** Provide detailed analysis of all trades with charts and tables to give the user more in-depth insights.

**Components:**
- Use `BarChart.tsx` and `DataTable.tsx` from the Common folder, and create a `Details.tsx` to manage the content.

**File Structure:**
```
components/Details/
└── Details.tsx
```

## Data and API Interaction

**Goal:** Interact with the PostgreSQL database to fetch data for visualizations and tables. The database connection and queries should be managed through a `db.ts` service file, which abstracts the database interaction.

**API Routes:**
- `trades.ts`: Create API routes that interact with the Postgres database to retrieve filtered trades data based on user selections.

**File Structure:**
```
services/
└── db.ts
pages/api/
└── trades.ts
```

## Utilities and Helper Functions

- `filters.ts`: Handle logic for applying filters across different components (Account, Ticker, Year, Month, Week, Day).
- `chartHelpers.ts`: Provide helper functions for formatting and preparing data for bar charts (e.g., grouping trades by month or week).
- `format.ts`: Include formatting functions for currency, dates, etc.

**File Structure:**
```
utils/
├── filters.ts
├── chartHelpers.ts
└── format.ts
```
## sample code for using Sheet component
```
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
 
export function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value="Pedro Duarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" value="@peduarte" className="col-span-3" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
```


## sample code for using Pie component
```
"use client"
import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
export const description = "An interactive pie chart"
const desktopData = [
  { month: "january", desktop: 186, fill: "var(--color-january)" },
  { month: "february", desktop: 305, fill: "var(--color-february)" },
  { month: "march", desktop: 237, fill: "var(--color-march)" },
  { month: "april", desktop: 173, fill: "var(--color-april)" },
  { month: "may", desktop: 209, fill: "var(--color-may)" },
]
const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
  },
  mobile: {
    label: "Mobile",
  },
  january: {
    label: "January",
    color: "hsl(var(--chart-1))",
  },
  february: {
    label: "February",
    color: "hsl(var(--chart-2))",
  },
  march: {
    label: "March",
    color: "hsl(var(--chart-3))",
  },
  april: {
    label: "April",
    color: "hsl(var(--chart-4))",
  },
  may: {
    label: "May",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig
export function Component() {
  const id = "pie-interactive"
  const [activeMonth, setActiveMonth] = React.useState(desktopData[0].month)
  const activeIndex = React.useMemo(
    () => desktopData.findIndex((item) => item.month === activeMonth),
    [activeMonth]
  )
  const months = React.useMemo(() => desktopData.map((item) => item.month), [])
  return (
    <Card data-chart={id} className="flex flex-col">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Pie Chart - Interactive</CardTitle>
          <CardDescription>January - June 2024</CardDescription>
        </div>
        <Select value={activeMonth} onValueChange={setActiveMonth}>
          <SelectTrigger
            className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {months.map((key) => {
              const config = chartConfig[key as keyof typeof chartConfig]
              if (!config) {
                return null
              }
              return (
                <SelectItem
                  key={key}
                  value={key}
                  className="rounded-lg [&_span]:flex"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-sm"
                      style={{
                        backgroundColor: `var(--color-${key})`,
                      }}
                    />
                    {config?.label}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          id={id}
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={desktopData}
              dataKey="desktop"
              nameKey="month"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 10} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 25}
                    innerRadius={outerRadius + 12}
                  />
                </g>
              )}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {desktopData[activeIndex].desktop.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Visitors
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
```

## sample code for using Pie component
```
"use client"
import { TrendingUp } from "lucide-react"
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
export const description = "A line chart with a label"
const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig
export function Component() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Chart - Label</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="desktop"
              type="natural"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-desktop)",
              }}
              activeDot={{
                r: 6,
              }}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
```

## Technology Stack

- **Next.js**: For building the UI and handling routing and API calls.
- **Tailwind CSS**: For styling the components, keeping the UI consistent and responsive.
- **PostgreSQL**: For managing the consolidated trade data.

## Developer Guidance

1. Keep components reusable and modular. For instance, the `BarChart.tsx` and `DataTable.tsx` should be designed flexibly so they can be used across multiple sections.
2. Follow the suggested file structure to maintain a clean codebase. This will allow easy scaling and facilitate understanding across different parts of the application.
3. Use the utils folder for shared logic (filters, formatting, etc.), ensuring that components focus on rendering data rather than managing business logic.

## Next Steps

1. Set up the base layout and navigation (sidebar + tabs).
2. Implement filtering logic and ensure data is fetched and updated based on filter changes.
3. Build each tab incrementally, starting with the Home tab, ensuring that components (like charts and tables) are reusable.
4. Test the API to ensure accurate data retrieval from the Postgres database.

This should provide clear alignment for developers, ensuring everyone understands the scope, structure, and responsibilities for each part of the project.