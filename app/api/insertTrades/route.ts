import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { trades } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    if (!Array.isArray(data.trades)) {
      return NextResponse.json({ error: 'Invalid data format. Expected array of trades.' }, { status: 400 });
    }

    // Validate required fields for each trade
    for (let i = 0; i < data.trades.length; i++) {
      const trade = data.trades[i];
      /* console.log(`Validating trade ${i}:`, {
        transaction_type: trade.transaction_type,
        symbol: trade.symbol,
        underlying_symbol: trade.underlying_symbol,
        hasTransactionType: !!trade.transaction_type,
        hasSymbol: !!trade.symbol,
        hasUnderlyingSymbol: !!trade.underlying_symbol
      }); */

      if (!trade.transaction_type || !trade.symbol || !trade.underlying_symbol) {
        console.error(`Trade ${i} missing required fields:`, {
          transaction_type: trade.transaction_type,
          symbol: trade.symbol,
          underlying_symbol: trade.underlying_symbol
        });
        return NextResponse.json(
          {
            error: 'Invalid trade data. Missing required fields.',
            details: `Trade ${i} missing: transaction_type=${!!trade.transaction_type}, symbol=${!!trade.symbol}, underlying_symbol=${!!trade.underlying_symbol}`
          },
          { status: 400 }
        );
      }
    }

    // Handle deletion of old open positions
    if (data.idsToDelete && Array.isArray(data.idsToDelete) && data.idsToDelete.length > 0) {
      console.log(`Deleting ${data.idsToDelete.length} old open positions for user ${user.id}`);
      await db.delete(trades)
        .where(
          sql`${trades.id} IN ${data.idsToDelete} AND ${trades.user_id} = ${user.id}`
        );
    }

    // Convert trade data to match database schema
    const tradesToInsert = data.trades.map((trade: any) => {
      // Determine if the trade is closed based on the presence of closing data
      const hasClosePrice = trade.close_price !== null && trade.close_price !== undefined;
      const hasProfitLoss = trade.profit_loss !== null && trade.profit_loss !== undefined;
      const hasCloseDate = Boolean(trade.close_date);
      const isClosed = hasCloseDate && hasClosePrice && hasProfitLoss;

      return {
        transaction_type: trade.transaction_type,
        open_date: new Date(trade.open_date),
        close_date: trade.close_date ? new Date(trade.close_date) : null,
        symbol: trade.symbol,
        underlying_symbol: trade.underlying_symbol,
        quantity: Number(trade.quantity),
        open_price: Number(trade.open_price),
        close_price: hasClosePrice ? Number(trade.close_price) : null,
        buy_value: Number(trade.buy_value),
        sell_value: trade.sell_value !== null && trade.sell_value !== undefined ? Number(trade.sell_value) : null,
        profit_loss: hasProfitLoss ? Number(trade.profit_loss) : null,
        is_closed: trade.transaction_type === 'Money' ? true : isClosed, // Money movements are always closed
        commissions: Number(trade.commissions ?? 0),
        fees: Number(trade.fees ?? 0),
        open_year: Number(trade.open_year),
        close_year: trade.close_year !== null && trade.close_year !== undefined ? Number(trade.close_year) : null,
        open_month: Number(trade.open_month),
        close_month: trade.close_month !== null && trade.close_month !== undefined ? Number(trade.close_month) : null,
        open_week: trade.open_week,
        close_week: trade.close_week ?? null,
        account: trade.account,
        user_id: user.id,
        creation_date: new Date(),
        updated_date: new Date()
      };
    });    // Insert trades in chunks of 100 to avoid timeout
    const chunkSize = 100;
    const results = [];

    for (let i = 0; i < tradesToInsert.length; i += chunkSize) {
      const chunk = tradesToInsert.slice(i, i + chunkSize);
      const result = await db.insert(trades).values(chunk).returning();
      results.push(...result);
    }

    return NextResponse.json({
      message: `Successfully inserted ${results.length} trades`,
      insertedTrades: results.length
    });

  } catch (error) {
    console.error('Error in insertTrades API:', error);
    return NextResponse.json({
      error: 'Failed to insert trades',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
