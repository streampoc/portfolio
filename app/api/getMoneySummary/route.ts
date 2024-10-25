import { NextRequest, NextResponse } from 'next/server';
import { getMoneySummary } from '@/services/tradeQueries';

import { User } from '@/lib/db/schema'
import { getUser } from '@/lib/db/queries'

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

  const user = await getUser();

  if(!user){
    return NextResponse.json({ error: 'Unable to retrieve user from session' }, { status: 500 })
  }

  try {
    const moneySummaryData = await getMoneySummary(filters,user);
    return NextResponse.json(moneySummaryData);
  } catch (error) {
    console.error('Error fetching money summary data:', error);
    return NextResponse.json({ error: 'Failed to fetch money summary data' }, { status: 500 });
  }
}
