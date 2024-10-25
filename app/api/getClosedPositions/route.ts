import { NextResponse } from 'next/server'
import { getClosedPositions } from '../../../services/tradeQueries'

import { getUser } from '@/lib/db/queries';
import { User } from '@/lib/db/schema';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const user = await getUser();

  if(!user){
    return NextResponse.json({ error: 'Unable to retrieve user from session' }, { status: 500 })
  }

  try {
    console.log('Fetching closed positions');
    const closedPositions = await getClosedPositions(Object.fromEntries(searchParams),user)
    //console.log(`Closed positions fetched: ${JSON.stringify(closedPositions)}`);
    return NextResponse.json(closedPositions)
  } catch (error: unknown) {
    console.error('Error in getClosedPositions route:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch closed positions', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 })
    }
  }
}