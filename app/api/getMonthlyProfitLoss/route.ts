import { NextResponse } from 'next/server'
import { getMonthlyProfitLoss } from '../../../services/tradeQueries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filters = {
    year: searchParams.get('year'),
    ticker: searchParams.get('ticker')
  }
  
  try {
    console.log('Fetching monthly profit/loss data');
    const data = await getMonthlyProfitLoss(filters)
    console.log(`Monthly profit/loss data fetched: ${JSON.stringify(data)}`);
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