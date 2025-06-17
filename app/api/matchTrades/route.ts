import { NextRequest, NextResponse } from 'next/server';
import { matchTrades } from '@/services/upload';

export async function POST(req: NextRequest) {
  try {
    const { trades, previousOpenTrades = [] } = await req.json();
    const { matched, remainingOpenTrades, moneyMovements } = await matchTrades(trades, undefined, previousOpenTrades);
    return NextResponse.json({ matched, remainingOpenTrades, moneyMovements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to match trades.' }, { status: 500 });
  }
}
