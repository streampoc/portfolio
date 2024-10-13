# Trading Dashboard

## Project Overview

This Trading Dashboard is a Next.js application designed to visualize and analyze trades conducted across various trading platforms. It provides clear insights into overall portfolio performance, allows filtering of trades based on user-selected criteria, and displays specific details like open and closed positions, stock performance, and dividends.

## Key Features

1. **Home Page with Overview Visualizations**
   - Summary cards showing yearly profit/loss, commissions, fees, and net profit/loss
   - Monthly profit/loss chart with breakdown of net profit, commissions, and fees
   - Monthly calendar with daily profit/loss (to be implemented)

2. **Sidebar with Filters**
   - Filter by account, ticker symbol, year, month, week, and day
   - Dynamic updating of visualizations based on selected filters

3. **Tab Navigation**
   - Home
   - Open Positions
   - Closed Positions
   - Stocks
   - Dividends
   - Details (to be implemented)

4. **Open Positions Tab**
   - Bar chart showing amounts for open positions
   - Detailed table of open positions with sorting and filtering capabilities

5. **Closed Positions Tab**
   - Bar chart showing profit/loss by symbol or by month
   - Detailed table of closed positions with sorting and filtering capabilities

6. **Stocks Tab**
   - Display of stock positions with bar chart and detailed table

7. **Dividends Tab**
   - Table view of dividend payouts with filtering capabilities

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **API**: Next.js API Routes
- **Data Fetching**: Server-side with `@vercel/postgres`
- **UI Components**: shadcn/ui
- **Charts**: Recharts

## Project Structure

Trading-Dashboard/
├── app/
│ ├── api/
│ │ ├── getClosedPositions/
│ │ ├── getClosedPositionsByMonth/
│ │ ├── getClosedPositionsBySymbol/
│ │ ├── getDividendPositions/
│ │ ├── getMonthlyProfitLoss/
│ │ ├── getOpenPositions/
│ │ ├── getStockPositions/
│ │ ├── getSummary/
│ │ ├── getTickers/
│ │ ├── getWeeks/
│ │ └── testDb/
│ ├── fonts/
│ ├── globals.css
│ ├── layout.tsx
│ └── page.tsx
├── components/
│ ├── Common/
│ │ ├── BarChart.tsx
│ │ ├── DataTable.tsx
│ │ └── TabNavigation.tsx
│ ├── Dividends/
│ │ └── Dividends.tsx
│ ├── Home/
│ │ ├── Calendar.tsx
│ │ ├── HomeTab.tsx
│ │ ├── MonthlyProfitLossChart.tsx
│ │ └── SummaryCards.tsx
│ ├── Positions/
│ │ ├── ClosedPositions.tsx
│ │ └── OpenPositions.tsx
│ ├── Stocks/
│ │ └── Stocks.tsx
│ └── Sidebar.tsx
├── contexts/
│ └── FilterContext.tsx
├── services/
│ ├── db.ts
│ └── tradeQueries.ts
├── .env.local
├── components.json
├── next.config.mjs
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
└── tsconfig.json

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/trading-dashboard.git
   cd trading-dashboard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your PostgreSQL database and add the connection string to `.env.local`:
   ```
   POSTGRES_URL="your-postgres-connection-string"
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Schema

Ensure your PostgreSQL database has a `trades` table with the following columns:
- id
- transaction_type
- open_date
- close_date
- symbol
- underlying_symbol
- quantity
- open_price
- close_price
- profit_loss
- commissions
- fees
- is_closed
- open_year
- close_year
- open_month
- close_month
- open_week
- close_week

## API Routes

- `/api/getClosedPositions`: Fetch closed positions
- `/api/getClosedPositionsByMonth`: Fetch closed positions grouped by month
- `/api/getClosedPositionsBySymbol`: Fetch closed positions grouped by symbol
- `/api/getDividendPositions`: Fetch dividend positions
- `/api/getMonthlyProfitLoss`: Fetch monthly profit/loss data
- `/api/getOpenPositions`: Fetch open positions
- `/api/getStockPositions`: Fetch stock positions
- `/api/getSummary`: Fetch summary data
- `/api/getTickers`: Fetch distinct tickers
- `/api/getWeeks`: Fetch weeks for a given year and month
- `/api/testDb`: Test database connection

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Free