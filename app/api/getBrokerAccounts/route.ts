import { NextResponse } from 'next/server';
import { getUserBrokerAccounts } from '@/services/brokerQueries';
import { getUser } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brokerAccounts = await getUserBrokerAccounts(user);
    return NextResponse.json(brokerAccounts);
  } catch (error) {
    console.error('Error in getBrokerAccounts API:', error);
    return NextResponse.json({ error: 'Failed to fetch broker accounts' }, { status: 500 });
  }
}
