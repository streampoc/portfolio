import { NextResponse } from 'next/server'
import { getDistinctTickers } from '../../../services/tradeQueries'
import { User } from '@/lib/db/schema'
import { getUser } from '@/lib/db/queries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const account = searchParams.get('account')
  const user = await getUser();

  if(!user){
    return NextResponse.json({ error: 'Unable to retrieve user from session' }, { status: 500 })
  }

  try {
    console.log(`Fetching distinct tickers for account: ${account}`);
    const tickers = await getDistinctTickers(account,user)
    //console.log(`Tickers fetched: ${JSON.stringify(tickers)}`);
    return NextResponse.json(tickers)
  } catch (error: unknown) {
    console.error('Error in getTickers route:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch tickers', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 })
    }
  }
}