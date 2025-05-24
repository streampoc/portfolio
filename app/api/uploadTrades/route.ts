import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { insertTrades } from '@/services/tradeQueries';
import { getUser } from '@/lib/db/queries';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const csvText = Buffer.from(arrayBuffer).toString('utf-8');
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    // Get user from session
    const user = await getUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
    }
    // Insert trades into DB with user_id
    const result = await insertTrades(records, user.id);
    return NextResponse.json({ success: true, inserted: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process file.' }, { status: 500 });
  }
}
