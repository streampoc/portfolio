import { NextResponse } from 'next/server'
import { getStockPositions } from '../../../services/tradeQueries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  try {
    console.log('Fetching stock positions');
    const stockPositions = await getStockPositions(Object.fromEntries(searchParams))
    console.log(`Stock positions fetched: ${JSON.stringify(stockPositions)}`);
    return NextResponse.json(stockPositions)
  } catch (error: unknown) {
    console.error('Error in getStockPositions route:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch stock positions', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 })
    }
  }
}