import { NextResponse } from 'next/server'
import { getUserAccounts } from '@/lib/db/queries'; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email') || 'admin@tdashboard.com'

  try {
    console.log(`Fetching account details for user email: ${email}`);
    let accountsData = await getUserAccounts(email)
    if(accountsData == null)
        accountsData = []
    console.log(`Accounts fetched: ${JSON.stringify(accountsData)}`);
    return NextResponse.json(accountsData)
  } catch (error: unknown) {
    console.error('Error in getAccountsData route:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch user accounts', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 })
    }
  }
}