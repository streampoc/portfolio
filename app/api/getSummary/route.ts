import { NextResponse } from 'next/server'
import { getSummaryData } from '../../../services/tradeQueries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  const week = searchParams.get('week')
  const day = searchParams.get('day')
  const account = searchParams.get('account')
  const ticker = searchParams.get('ticker')

  try {
    console.log(`Fetching summary data for filters:`, { year, month, week, day, account, ticker });
    const summaryData = await getSummaryData({ year, month, week, day, account, ticker })
    console.log(`Summary data fetched:`, summaryData);
    return NextResponse.json(summaryData)
  } catch (error: unknown) {
    console.error('Error in getSummary route:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch summary data', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 })
    }
  }
}