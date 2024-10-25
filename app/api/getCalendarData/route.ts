import { NextRequest, NextResponse } from 'next/server';
import { getCalendarData } from '@/services/tradeQueries';

import { getUser } from '@/lib/db/queries';
import { User } from '@/lib/db/schema';

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
    const calendarData = await getCalendarData(filters,user);
    return NextResponse.json(calendarData);
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
  }
}
