import { NextRequest, NextResponse } from 'next/server';
import { matchTrades } from '@/services/upload';

export async function POST(req: NextRequest) {
  try {
    const trades = await req.json();
    const matched = await matchTrades(trades);
    return NextResponse.json({ matched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to match trades.' }, { status: 500 });
  }
}
