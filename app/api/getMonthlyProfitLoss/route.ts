import { NextResponse } from 'next/server'
import { getMonthlyProfitLoss } from '../../../services/tradeQueries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filters = {
    account: searchParams.get('account'),
    ticker: searchParams.get('ticker'),
    year: searchParams.get('year'),
    month: searchParams.get('month'),
    week: searchParams.get('week'),
    day: searchParams.get('day')
  }
  
  try {
    console.log('Fetching monthly profit/loss data');
    const data = await getMonthlyProfitLoss(filters)
    //console.log(`Monthly profit/loss data fetched: ${JSON.stringify(data)}`);
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Error in getMonthlyProfitLoss route:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch monthly profit/loss data', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 })
    }
  }
}