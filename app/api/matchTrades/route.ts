import { NextRequest, NextResponse } from 'next/server';
import { matchTrades } from '@/services/upload';
import { validateOrThrow } from '@/lib/auth/middleware';
import { validateBrokerAccount } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  try {
    // Validate user session
    const user = await validateOrThrow(req);
    
    const { trades, previousOpenTrades = [], brokerId } = await req.json();
    
    // Validate broker ID
    if (!brokerId) {
      return NextResponse.json({ error: 'Broker account selection is required.' }, { status: 400 });
    }

    // Validate broker account ownership
    await validateBrokerAccount(user, parseInt(brokerId));

    // Attach broker ID to trades
    const tradesWithBroker = trades.map((trade: any) => ({
      ...trade,
      broker_id: parseInt(brokerId)
    }));

    const { matched, remainingOpenTrades, moneyMovements } = await matchTrades(tradesWithBroker, undefined, previousOpenTrades);
    return NextResponse.json({ matched, remainingOpenTrades, moneyMovements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to match trades.' }, { status: 500 });
  }
}
