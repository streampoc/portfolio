import { NextResponse } from 'next/server'
import { getWeeksByYearAndMonth } from '../../../services/tradeQueries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  if (!year || !month) {
    return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 })
  }

  try {
    console.log(`Fetching weeks for year: ${year}, month: ${month}`);
    const weeks = await getWeeksByYearAndMonth(year, month)
    //console.log(`Weeks fetched: ${JSON.stringify(weeks)}`);
    return NextResponse.json(weeks)
  } catch (error: unknown) {
    console.error('Error in getWeeks route:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch weeks', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 })
    }
  }
}