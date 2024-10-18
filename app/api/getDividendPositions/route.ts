import { NextResponse } from 'next/server'
import { getDividendPositions } from '../../../services/tradeQueries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  try {
    console.log('Fetching dividend positions');
    const dividendPositions = await getDividendPositions(Object.fromEntries(searchParams))
    //console.log(`Dividend positions fetched: ${JSON.stringify(dividendPositions)}`);
    return NextResponse.json(dividendPositions)
  } catch (error: unknown) {
    console.error('Error in getDividendPositions route:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch dividend positions', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 })
    }
  }
}