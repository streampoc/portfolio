import { NextRequest, NextResponse } from 'next/server';
import { getMoneySummary } from '@/services/tradeQueries';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filters = {
    account: searchParams.get('account'),
    ticker: searchParams.get('ticker'),
    year: searchParams.get('year'),
    month: searchParams.get('month'),
    week: searchParams.get('week'),
    day: searchParams.get('day')
  };

  try {
    const moneySummaryData = await getMoneySummary(filters);
    return NextResponse.json(moneySummaryData);
  } catch (error) {
    console.error('Error fetching money summary data:', error);
    return NextResponse.json({ error: 'Failed to fetch money summary data' }, { status: 500 });
  }
}
