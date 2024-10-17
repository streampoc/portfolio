import { NextResponse } from 'next/server'
import { getOpenPositions } from '../../../services/tradeQueries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  try {
    console.log('Fetching open positions');
    const openPositions = await getOpenPositions(Object.fromEntries(searchParams))
    //console.log(`Open positions fetched: ${JSON.stringify(openPositions)}`);
    return NextResponse.json(openPositions)
  } catch (error: unknown) {
    console.error('Error in getOpenPositions route:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch open positions', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 })
    }
  }
}