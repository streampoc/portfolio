import { NextResponse } from 'next/server'
import { getClosedPositionsByMonth } from '../../../services/tradeQueries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filters = Object.fromEntries(searchParams)
  
  try {
    console.log('Fetching closed positions by month');
    const data = await getClosedPositionsByMonth(filters)
    console.log(`Closed positions by month fetched: ${JSON.stringify(data)}`);
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Error in getClosedPositionsByMonth route:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch closed positions by month', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 })
    }
  }
}