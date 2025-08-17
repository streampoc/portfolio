import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { validateOrThrow } from '@/lib/auth/middleware';
import { validateBrokerAccount } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const filesEntries = formData.getAll('files');
    const brokerId = formData.get('brokerId');
    
    if (!filesEntries.length) {
      return NextResponse.json({ error: 'No files uploaded.' }, { status: 400 });
    }

    if (!brokerId) {
      return NextResponse.json({ error: 'Broker account selection is required.' }, { status: 400 });
    }

    // Validate user session
    const user = await validateOrThrow(req);

    // Validate broker account ownership
    await validateBrokerAccount(user, parseInt(brokerId.toString()));
    
    // Process all files
    const results = [];
    
    for (const fileEntry of filesEntries) {
      if (typeof fileEntry === 'string') {
        continue; // Skip if it's not a file
      }
      
      const file = fileEntry as File;
      const arrayBuffer = await file.arrayBuffer();
      const csvText = Buffer.from(arrayBuffer).toString('utf-8');
      
      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      
      // Insert trades into DB with user_id for each file
      // You can add your database insertion logic here
      
      results.push({
        filename: file.name,
        recordCount: records.length
      });
    }

    return NextResponse.json({ 
      success: true, 
      processed: results 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process files.' }, { status: 500 });
  }
}
