import { NextResponse } from 'next/server'
import { getClosedPositionsBySymbol } from '../../../services/tradeQueries'

import { getUser } from '@/lib/db/queries';
import { User } from '@/lib/db/schema';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filters = Object.fromEntries(searchParams)
  
  const user = await getUser();

  if(!user){
    return NextResponse.json({ error: 'Unable to retrieve user from session' }, { status: 500 })
  }

  try {
    console.log('Fetching closed positions by symbol');
    const data = await getClosedPositionsBySymbol(filters,user)
    //console.log(`Closed positions by symbol fetched: ${JSON.stringify(data)}`);
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Error in getClosedPositionsBySymbol route:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch closed positions by symbol', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 })
    }
  }
}
