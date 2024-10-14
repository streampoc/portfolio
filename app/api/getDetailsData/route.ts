import { NextResponse } from 'next/server';
import { getDetailsData } from '../../../services/tradeQueries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = Object.fromEntries(searchParams.entries());

  try {
    console.log('Fetching details data');
    const data = await getDetailsData(filters);
    console.log(`Details data fetched: ${JSON.stringify(data)}`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error in getDetailsData route:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch details data', details: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
}
