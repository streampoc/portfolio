import { sql } from "@vercel/postgres";

export async function getTradesByFilters(filters: any) {
  const { account, ticker, year, month, week, day } = filters;
  
  let queryText = 'SELECT * FROM trades WHERE 1=1';
  const queryParams: any[] = [];

  if (account && account !== 'ALL') {
    queryText += ' AND account = $1';
    queryParams.push(account);
  }

  if (ticker && ticker !== 'ALL') {
    queryText += ` AND ticker = $${queryParams.length + 1}`;
    queryParams.push(ticker);
  }

  // Add more conditions for year, month, week, day as needed

  queryText += ' ORDER BY date DESC';

  try {
    const result = await sql.query(queryText, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error fetching trades:', error);
    throw error;
  }
}

// This function should only be called from the server (e.g., in API routes)
export async function getWeeksByYearAndMonth(year: string, month: string) {
  const queryText = 'SELECT DISTINCT close_week FROM trades WHERE close_year = $1 AND close_month = $2 ORDER BY close_week';
  const queryParams = [year, month];

  try {
    console.log(`Executing query getWeeksByYearAndMonth: ${queryText} with params: ${JSON.stringify(queryParams)}`);
    const result = await sql.query(queryText, queryParams);
    //console.log(`Query result: ${JSON.stringify(result.rows)}`);
    const weeks = result.rows.map(row => row.close_week);
    return weeks.length > 0 ? weeks : ['ALL'];
  } catch (error) {
    console.error('Error in getWeeksByYearAndMonth:', error);
    throw error;
  }
}

// Add this function to the existing file
export async function getDistinctTickers(account: string | null) {
  let queryText = 'SELECT DISTINCT underlying_symbol FROM trades';
  const queryParams: any[] = [];

  /*if (account && account !== 'ALL') {
    queryText += ' WHERE account = $1';
    queryParams.push(account);
  }*/

  queryText += ' ORDER BY underlying_symbol';

  try {
    console.log(`Executing query getDistinctTickers: ${queryText} with params: ${JSON.stringify(queryParams)}`);
    const result = await sql.query(queryText, queryParams);
    //console.log(`Query result: ${JSON.stringify(result.rows)}`);
    return result.rows.map(row => row.underlying_symbol);
  } catch (error) {
    console.error('Error in getDistinctTickers:', error);
    throw error;
  }
}

// Add this function to the existing file
export async function getSummaryData(filters: {
  year?: string | null,
  month?: string | null,
  week?: string | null,
  day?: string | null,
  account?: string | null,
  ticker?: string | null
}) {
  let queryText = `
    SELECT 
      close_year,
      SUM(profit_loss) as total_profit_loss, 
      SUM(commissions) as total_commissions, 
      SUM(fees) as total_fees 
    FROM trades 
    WHERE is_closed = true and transaction_type = 'Trade'
  `;
  const queryParams: any[] = [];

  if (filters.year && filters.year !== 'All Years') {
    queryText += ' AND close_year = $' + (queryParams.length + 1);
    queryParams.push(filters.year);
  }

  if (filters.ticker && filters.ticker !== 'ALL') {
    queryText += ' AND underlying_symbol = $' + (queryParams.length + 1);
    queryParams.push(filters.ticker);
  }

  queryText += ' GROUP BY close_year ORDER BY close_year DESC';

  try {
    console.log(`Executing query getSummaryData: ${queryText} with params: ${JSON.stringify(queryParams)}`);
    const result = await sql.query(queryText, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error in getSummaryData:', error);
    throw error;
  }
}

// Add this function to your existing tradeQueries.ts file
export async function getOpenPositions(filters: any) {
  let queryText = `SELECT * FROM trades WHERE is_closed = false 
  and symbol != underlying_symbol
  and transaction_type = 'Trade'`;
  const queryParams: any[] = [];

  // Add your filter logic here, similar to the getSummaryData function
  if (filters.year && filters.year !== 'All Years') {
    queryText += ' AND open_year = $' + (queryParams.length + 1);
    queryParams.push(filters.year);
  }

  if (filters.month && filters.month !== 'ALL') {
    queryText += ' AND open_month = $' + (queryParams.length + 1);
    queryParams.push(filters.month);
  }

  if (filters.week && filters.week !== 'ALL') {
    queryText += ' AND open_week = $' + (queryParams.length + 1);
    queryParams.push(filters.week);
  }

  if (filters.day && filters.day !== 'All Days') {
    queryText += ' AND DATE(open_date) = DATE($' + (queryParams.length + 1) + ')';
    queryParams.push(filters.day);
  }

  if (filters.ticker && filters.ticker !== 'ALL') {
    queryText += ' AND underlying_symbol = $' + (queryParams.length + 1);
    queryParams.push(filters.ticker);
  }

  queryText += ' ORDER BY open_date DESC';

  try {
    console.log(`Executing query getOpenPositions: ${queryText} with params: ${JSON.stringify(queryParams)}`);
    const result = await sql.query(queryText, queryParams);
    //console.log(`Query result: ${JSON.stringify(result.rows)}`);
    return result.rows;
  } catch (error) {
    console.error('Error in getOpenPositions:', error);
    throw error;
  }
}

// Add this function to your existing tradeQueries.ts file
export async function getClosedPositions(filters: any) {
  let queryText = `SELECT * FROM trades WHERE is_closed = true
  and transaction_type='Trade'`;
  const queryParams: any[] = [];

  if (filters.year && filters.year !== 'All Years') {
    queryText += ' AND close_year = $' + (queryParams.length + 1);
    queryParams.push(filters.year);
  }

  if (filters.month && filters.month !== 'ALL') {
    queryText += ' AND close_month = $' + (queryParams.length + 1);
    queryParams.push(filters.month);
  }

  if (filters.week && filters.week !== 'ALL') {
    queryText += ' AND close_week = $' + (queryParams.length + 1);
    queryParams.push(filters.week);
  }

  if (filters.day && filters.day !== 'All Days') {
    queryText += ' AND DATE(close_date) = DATE($' + (queryParams.length + 1) + ')';
    queryParams.push(filters.day);
  }

  if (filters.ticker && filters.ticker !== 'ALL') {
    queryText += ' AND underlying_symbol = $' + (queryParams.length + 1);
    queryParams.push(filters.ticker);
  }

  queryText += ' ORDER BY close_date DESC';

  try {
    console.log(`Executing query getClosedPositions: ${queryText} with params: ${JSON.stringify(queryParams)}`);
    const result = await sql.query(queryText, queryParams);
    //console.log(`Query result: ${JSON.stringify(result.rows)}`);
    return result.rows;
  } catch (error) {
    console.error('Error in getClosedPositions:', error);
    throw error;
  }
}

// Add this function to your existing tradeQueries.ts file
export async function getStockPositions(filters: any) {
  let queryText = `
    SELECT *
    FROM trades 
    WHERE symbol = underlying_symbol AND is_closed = false
  `;
  const queryParams: any[] = [];

  if (filters.year && filters.year !== 'All Years') {
    queryText += ' AND open_year = $' + (queryParams.length + 1);
    queryParams.push(filters.year);
  }

  if (filters.month && filters.month !== 'ALL') {
    queryText += ' AND open_month = $' + (queryParams.length + 1);
    queryParams.push(filters.month);
  }

  if (filters.week && filters.week !== 'ALL') {
    queryText += ' AND open_week = $' + (queryParams.length + 1);
    queryParams.push(filters.week);
  }

  if (filters.day && filters.day !== 'All Days') {
    queryText += ' AND DATE(open_date) = DATE($' + (queryParams.length + 1) + ')';
    queryParams.push(filters.day);
  }

  if (filters.ticker && filters.ticker !== 'ALL') {
    queryText += ' AND underlying_symbol = $' + (queryParams.length + 1);
    queryParams.push(filters.ticker);
  }

  queryText += ' ORDER BY open_date DESC';

  try {
    console.log(`Executing query getStockPositions: ${queryText} with params: ${JSON.stringify(queryParams)}`);
    const result = await sql.query(queryText, queryParams);
    //console.log(`Query result: ${JSON.stringify(result.rows)}`);
    return result.rows;
  } catch (error) {
    console.error('Error in getStockPositions:', error);
    throw error;
  }
}

// Add this function to your existing tradeQueries.ts file
export async function getDividendPositions(filters: any) {
  let queryText = `
    SELECT *
    FROM trades 
    WHERE transaction_type = 'Money'
    AND symbol = 'DIVIDEND'
  `;
  const queryParams: any[] = [];

  if (filters.year && filters.year !== 'All Years') {
    queryText += ' AND close_year = $' + (queryParams.length + 1);
    queryParams.push(filters.year);
  }

  if (filters.month && filters.month !== 'ALL') {
    queryText += ' AND close_month = $' + (queryParams.length + 1);
    queryParams.push(filters.month);
  }

  if (filters.week && filters.week !== 'ALL') {
    queryText += ' AND close_week = $' + (queryParams.length + 1);
    queryParams.push(filters.week);
  }

  if (filters.day && filters.day !== 'All Days') {
    queryText += ' AND DATE(close_date) = DATE($' + (queryParams.length + 1) + ')';
    queryParams.push(filters.day);
  }

  if (filters.ticker && filters.ticker !== 'ALL') {
    queryText += ' AND underlying_symbol = $' + (queryParams.length + 1);
    queryParams.push(filters.ticker);
  }

  queryText += ' ORDER BY close_date DESC';

  try {
    console.log(`Executing query getDividendPositions: ${queryText} with params: ${JSON.stringify(queryParams)}`);
    const result = await sql.query(queryText, queryParams);
    //console.log(`Query result: ${JSON.stringify(result.rows)}`);
    return result.rows;
  } catch (error) {
    console.error('Error in getDividendPositions:', error);
    throw error;
  }
}

export async function getMonthlyProfitLoss(filters: {
  year?: string | null,
  ticker?: string | null
}) {
  let queryText = `
    SELECT 
      close_month, 
      SUM(profit_loss) as total_profit_loss,
      SUM(commissions) as total_commissions,
      SUM(fees) as total_fees
    FROM trades 
    WHERE is_closed = true
    and transaction_type = 'Trade'
  `;
  const queryParams: any[] = [];

  if (filters.year && filters.year !== 'All Years') {
    queryText += ' AND close_year = $' + (queryParams.length + 1);
    queryParams.push(filters.year);
  }

  if (filters.ticker && filters.ticker !== 'ALL') {
    queryText += ' AND underlying_symbol = $' + (queryParams.length + 1);
    queryParams.push(filters.ticker);
  }

  queryText += ' GROUP BY close_month ORDER BY close_month';

  try {
    console.log(`Executing query getMonthlyProfitLoss: ${queryText} with params: ${JSON.stringify(queryParams)}`);
    const result = await sql.query(queryText, queryParams);
    //console.log(`Query result: ${JSON.stringify(result.rows)}`);
    return result.rows;
  } catch (error) {
    console.error('Error in getMonthlyProfitLoss:', error);
    throw error;
  }
}

// Add this function to your existing tradeQueries.ts file
export async function getClosedPositionsBySymbol(filters: any) {
  let queryText = `
    SELECT 
      underlying_symbol,
      SUM(profit_loss) as total_profit_loss,
      SUM(commissions) as total_commissions,
      SUM(fees) as total_fees
    FROM trades 
    WHERE is_closed = true AND transaction_type = 'Trade'
  `;
  const queryParams: any[] = [];

  if (filters.year && filters.year !== 'All Years') {
    queryText += ' AND close_year = $' + (queryParams.length + 1);
    queryParams.push(filters.year);
  }

  if (filters.month && filters.month !== 'ALL') {
    queryText += ' AND close_month = $' + (queryParams.length + 1);
    queryParams.push(filters.month);
  }

  if (filters.week && filters.week !== 'ALL') {
    queryText += ' AND close_week = $' + (queryParams.length + 1);
    queryParams.push(filters.week);
  }

  if (filters.day && filters.day !== 'All Days') {
    queryText += ' AND DATE(close_date) = DATE($' + (queryParams.length + 1) + ')';
    queryParams.push(filters.day);
  }

  if (filters.ticker && filters.ticker !== 'ALL') {
    queryText += ' AND underlying_symbol = $' + (queryParams.length + 1);
    queryParams.push(filters.ticker);
  }

  queryText += ' GROUP BY underlying_symbol ORDER BY total_profit_loss DESC';

  try {
    console.log(`Executing query getClosedPositionsBySymbol: ${queryText} with params: ${JSON.stringify(queryParams)}`);
    const result = await sql.query(queryText, queryParams);
    //console.log(`Query result: ${JSON.stringify(result.rows)}`);
    return result.rows;
  } catch (error) {
    console.error('Error in getClosedPositionsBySymbol:', error);
    throw error;
  }
}

export async function getClosedPositionsByMonth(filters: any) {
  let queryText = `
    SELECT 
      close_month,
      SUM(profit_loss) as total_profit_loss,
      SUM(commissions) as total_commissions,
      SUM(fees) as total_fees
    FROM trades 
    WHERE is_closed = true AND transaction_type = 'Trade'
  `;
  const queryParams: any[] = [];

  if (filters.year && filters.year !== 'All Years') {
    queryText += ' AND close_year = $' + (queryParams.length + 1);
    queryParams.push(filters.year);
  }

  if (filters.ticker && filters.ticker !== 'ALL') {
    queryText += ' AND underlying_symbol = $' + (queryParams.length + 1);
    queryParams.push(filters.ticker);
  }

  queryText += ' GROUP BY close_month ORDER BY close_month';

  try {
    console.log(`Executing query getClosedPositionsByMonth: ${queryText} with params: ${JSON.stringify(queryParams)}`);
    const result = await sql.query(queryText, queryParams);
    //console.log(`Query result: ${JSON.stringify(result.rows)}`);
    return result.rows;
  } catch (error) {
    console.error('Error in getClosedPositionsByMonth:', error);
    throw error;
  }
}

// Add this function to your existing tradeQueries.ts file

export async function getDetailsData(filters: any) {
  let queryText = `
    WITH closed_positions AS (
      SELECT 
        underlying_symbol,
        close_year as year,
        SUM(profit_loss) as realized,
        SUM(commissions) as closed_commissions,
        SUM(fees) as closed_fees
      FROM trades
      WHERE is_closed = true AND transaction_type = 'Trade'
      GROUP BY underlying_symbol, close_year
    ),
    open_positions AS (
      SELECT
        underlying_symbol,
        open_year as year,
        SUM((quantity::numeric * open_price::numeric)) as unrealized,
        SUM(commissions) as open_commissions,
        SUM(fees) as open_fees
      FROM trades
      WHERE is_closed = false AND transaction_type = 'Trade'
      GROUP BY underlying_symbol, open_year
    )
    SELECT 
      COALESCE(c.underlying_symbol, o.underlying_symbol) as underlying_symbol,
      COALESCE(c.year, o.year) as year,
      COALESCE(c.realized, 0) as realized,
      COALESCE(o.unrealized, 0) as unrealized,
      COALESCE(c.closed_commissions, 0) + COALESCE(o.open_commissions, 0) as commissions,
      COALESCE(c.closed_fees, 0) + COALESCE(o.open_fees, 0) as fees,
      COALESCE(c.realized, 0)  + 
      (COALESCE(c.closed_commissions, 0) + COALESCE(o.open_commissions, 0)) + 
      (COALESCE(c.closed_fees, 0) + COALESCE(o.open_fees, 0)) as net
    FROM closed_positions c
    FULL OUTER JOIN open_positions o 
    ON c.underlying_symbol = o.underlying_symbol AND c.year = o.year
  `;

  const queryParams: any[] = [];
  let paramIndex = 1;

  if (filters.year && filters.year !== 'All Years') {
    queryText += ` WHERE (c.year = $${paramIndex} OR o.year = $${paramIndex})`;
    queryParams.push(filters.year);
    paramIndex++;
  }
  

  if (filters.ticker && filters.ticker !== 'ALL') {
    queryText += paramIndex === 1 ? ' WHERE' : ' AND';
    queryText += ` (c.underlying_symbol = $${paramIndex} OR o.underlying_symbol = $${paramIndex})`;
    queryParams.push(filters.ticker);
  }

  queryText += ' ORDER BY underlying_symbol, year DESC';

  try {
    console.log(`Executing query getDetailsData: ${queryText} with params: ${JSON.stringify(queryParams)}`);
    const result = await sql.query(queryText, queryParams);
    //console.log(`Query result: ${JSON.stringify(result.rows)}`);
    return result.rows;
  } catch (error) {
    console.error('Error in getDetailsData:', error);
    throw error;
  }
}

export async function getCalendarData(filters: {
  account?: string | null,
  ticker?: string | null,
  year?: string | null,
  month?: string | null,
  week?: string | null,
  day?: string | null
}) {
  let queryText = `
    SELECT 
      DATE(close_date) as date,
      SUM(profit_loss) as total_profit_loss,
      SUM(commissions) as total_commissions,
      SUM(fees) as total_fees
    FROM trades 
    WHERE is_closed = true
    AND transaction_type = 'Trade'
  `;
  const queryParams: any[] = [];
  /*
  if (filters.account && filters.account !== 'ALL') {
    queryText += ` AND account = $${queryParams.length + 1}`;
    queryParams.push(filters.account);
  }
  */

  if (filters.ticker && filters.ticker !== 'ALL') {
    queryText += ` AND underlying_symbol = $${queryParams.length + 1}`;
    queryParams.push(filters.ticker);
  }

  if (filters.year && filters.year !== 'All Years') {
    queryText += ` AND close_year = $${queryParams.length + 1}`;
    queryParams.push(filters.year);
  }

  if (filters.month && filters.month !== 'ALL') {
    queryText += ` AND close_month = $${queryParams.length + 1}`;
    queryParams.push(filters.month);
  }
  /*
  if (filters.week && filters.week !== 'ALL') {
    queryText += ` AND close_week = $${queryParams.length + 1}`;
    queryParams.push(filters.week);
  }

  if (filters.day && filters.day !== 'All Days') {
    queryText += ` AND DATE(close_date) = DATE($${queryParams.length + 1})`;
    queryParams.push(filters.day);
  }
  */

  queryText += ` GROUP BY DATE(close_date) ORDER BY DATE(close_date)`;

  try {
    console.log(`Executing query getCalendarData: ${queryText} with params: ${JSON.stringify(queryParams)}`);
    const result = await sql.query(queryText, queryParams);
    //console.log(`Query result: ${JSON.stringify(result.rows)}`);
    return result.rows;
  } catch (error) {
    console.error('Error in getCalendarData:', error);
    throw error;
  }
}

// Add this function to your existing tradeQueries.ts file
export async function getMoneySummary(filters: {
  year?: string | null,
  month?: string | null,
  week?: string | null,
  day?: string | null,
  account?: string | null,
  ticker?: string | null
}) {
  let queryText = `
    SELECT 
      close_year, symbol, SUM(profit_loss) as total_amount
    FROM trades 
    WHERE is_closed = true AND transaction_type = 'Money'
    AND symbol = underlying_symbol
  `;
  const queryParams: any[] = [];

  if (filters.year && filters.year !== 'All Years') {
    queryText += ' AND close_year = $' + (queryParams.length + 1);
    queryParams.push(filters.year);
  }

  /* if (filters.ticker && filters.ticker !== 'ALL') {
    queryText += ' AND symbol = $' + (queryParams.length + 1);
    queryParams.push(filters.ticker);
  } */

  queryText += ' GROUP BY close_year, symbol ORDER BY close_year DESC, symbol';

  try {
    console.log(`Executing query getMoneySummary: ${queryText} with params: ${JSON.stringify(queryParams)}`);
    const result = await sql.query(queryText, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error in getMoneySummary:', error);
    throw error;
  }
}
